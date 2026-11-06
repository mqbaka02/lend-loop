/**
 * This is a quick text to understand and test the functionalties of Convex,
 * This has nothing to do with the actual LendLoop project
 */

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list= query({
    handler: async (context)=> {
        return await context.db.query("messages").collect();
    },
});

export const send= mutation({
    args: {
        text: v.string(),
    },

    handler: async (context,  args)=> {
        const userIdentity= await context.auth.getUserIdentity();

        if (!userIdentity) {
            throw new ConvexError("User is not authenticated");
        }

        await context.db.insert("messages", {
            text: args.text,
            userId: userIdentity.subject,
        });
    },
});