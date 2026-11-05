import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

export const getPublicTools= query({
    args: {},

    handler: async (context)=> {
        const tools= await context.db.query("tools").collect();

        const now= Date.now();

        const availableTools= await Promise.all(
            tools.map(async (tool)=> {
                const loans= await context.db
                    .query("loans")
                    .withIndex("by_tool", (q)=> q.eq("toolId", tool._id))
                    .collect();

                //Check if the tool is still being borrowed by someone wich means the status of one of the loans is "approved" and the current date (`now`) is between the start and the end date
                const isBorrowed= loans.some(loan=> 
                    loan.status === "approved" &&
                    loan.endDate >= now &&
                    loan.startDate <= now
                );

                if (isBorrowed) return null;

                const category= await context.db.get("categories", tool.category);
                return {
                    name: tool.name,
                    category: category?.name ?? "No category",
                };
            })
        );

        //Only return the tools that are not currently borrowed
        return availableTools.filter((tool)=> tool!== null);
    },
});

export const createTool= mutation({
    args: {
        name: v.string(),
        category: v.id("categories"),
        description: v.optional(v.string()),
    },

    handler: async (context, args)=> {
        const user= await getCurrentUser(context); //We need this to extract the (real) user's id

        const name= args.name.trim();
        if (!name) throw new Error("Tool name cannot be empty!");

        const category= await context.db.get("categories", args.category);
        if (!category) throw new Error("Category not found!");

        return await context.db.insert("tools", {
            ownerId: user._id, //We can trust this is the real id because it comes from Convex
            name,
            category: args.category,
            description: args.description,
        });
    },
});