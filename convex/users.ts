import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";

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