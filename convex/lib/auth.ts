import { MutationCtx, QueryCtx } from "../_generated/server";

export async function getCurrentUser( context: QueryCtx | MutationCtx ) {
    const identity= await context.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated user!");

    const user= await context.db
        .query("users")
        .withIndex("by_clerk_id", (q)=> q.eq("clerkId", identity.subject)) //Find the user that has that clerk id
        .unique();
    
    if (!user) throw new Error("User not found in convex db!");

    return user;
};

export async function requireAdmin( context: QueryCtx | MutationCtx ){
    const user= await getCurrentUser(context);

    if (user.role !== "admin") throw new Error("Unauthorized: admin access required!");

    return user;
};