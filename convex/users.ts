import { mutation } from "./_generated/server";

/**
 * This will loook up for an signed in user's presence in the database and create it if he is not there yet
 */
export const ensureUser= mutation({
    args: {},

    handler: async (context)=> {
        const identity= await context.auth.getUserIdentity();

        if (!identity) throw new Error("Unauthenticated user!");

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