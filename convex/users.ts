import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin } from "./lib/auth";
import { returnedByBorrower, returnedByOwner } from "./aggregates";

/**
 * This will loook up for an signed in user's presence in the database and create it if he is not there yet
 */
export const ensureUser= mutation({
    args: {},

    handler: async (context)=> {
        const identity= await context.auth.getUserIdentity();

        if (!identity) throw new ConvexError("Unauthenticated user!");

        //Look up for the user in the DB
        const existingUser= await context.db
            .query("users")
            .withIndex("by_clerk_id", (q)=> q.eq("clerkId", identity.subject))
            .unique();
        
        if (existingUser) return existingUser._id; //The user already exists, no insertions

        //The user is new, create it
        return await context.db.insert("users", {
            clerkId: identity.subject,
            isTrusted: false, // default
            role: "user" // default
        });
    },
});

/**
 * Function called by CLerk every time an user is created/edited
 * Synchronizes Clerk's data with Convex data
 */
export const syncFromClerk = internalMutation({
    args: {
        clerkId: v.string(),
        name: v.optional(v.string()),
        username: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        clerkUpdatedAt: v.number(),
    },

    handler: async (context, args) => {
        const existingUser = await context.db
            .query("users")
            .withIndex("by_clerk_id", q =>
                q.eq("clerkId", args.clerkId)
            )
            .unique();

        if (existingUser) {
            // Ignore an outdated event.
            if (
                existingUser.clerkUpdatedAt !== undefined &&
                args.clerkUpdatedAt < existingUser.clerkUpdatedAt
            ) {
                return existingUser._id;
            }

            await context.db.patch(existingUser._id, {
                name: args.name,
                username: args.username,
                imageUrl: args.imageUrl,
                clerkUpdatedAt: args.clerkUpdatedAt,
            });

            return existingUser._id;
        }

        return await context.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            username: args.username,
            imageUrl: args.imageUrl,
            clerkUpdatedAt: args.clerkUpdatedAt,
            role: "user",
            isTrusted: false,
        });
    },
});

export const isAdmin= query({
    args: {},

    handler:  async (context, args)=> {
        try{
            const user= await getCurrentUser(context);
            return {value: user.role=== "admin"};
        } catch (error) {
            if (error instanceof Error && error.message=== "Unauthenticated user!") {
                return {value: false};
            } else if (error instanceof Error) {
                throw new Error(error.message); //Rethrow the error
            } else {
                throw new Error("Unknown error"); //Is this even necessary?
            }
        }
    },
});

export const getUsersAdmin= query({
    args: {},

    handler: async (context, args)=> {
        //This is for admins only
        const user= await requireAdmin(context);

        const allUsers= await context.db.query("users").order("desc").collect();

        return await Promise.all(
            allUsers.map(async (user)=> {
                const [borrowedOnTime, lendAndReturned]= await Promise.all([
                    returnedByBorrower.count(context, {
                        bounds: {
                            prefix: ["returned-on-time", user._id]
                        },
                    }),
                    returnedByOwner.count(context, {
                        bounds: {
                            prefix: ["returned", user._id]
                        },
                    }),
                ]);

                return {
                    ...user,
                    borrowedOnTime,
                    lendAndReturned,
                };
            }),
        );
    },
});

export const toggleUserTrustedAdmin= mutation({
    args: {
        userId: v.id("users"),
    },

    handler: async (context, args)=> {
        const user= requireAdmin(context);
        
        const theUser= await context.db.get("users", args.userId);
        if (!theUser) throw new ConvexError("This user doesn't exist!");

        return await context.db.patch("users", theUser._id, {
            //toggle value
            isTrusted: !theUser.isTrusted,
        });

    },
});