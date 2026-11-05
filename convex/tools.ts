import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

import { internalMutation } from "./_generated/server";
import { faker } from "@faker-js/faker";

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
        condition: v.union(
            v.literal("new"),
            v.literal("good"),
            v.literal("fair"),
            v.literal("poor")
        )
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
            condition: args.condition
        });
    },
});

export const getTools= query({
    args: {},

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);
        
        const tools= await context.db
            .query("tools")
            .withIndex("by_id").collect();
        
        
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

                const category= await context.db.get("categories", tool.category);
                const owner= await context.db.get("users", tool.ownerId);
                return {
                    name: tool.name,
                    category: category?.name ?? "No category",
                    owner: owner,
                    condition: tool.condition,
                    desc: tool.description,
                    image: tool.imageId,
                    date: tool._creationTime,
                    isAvailable: !isBorrowed,
                    id: tool._id,
                };
            })
        );
        
        return availableTools;
    },
});

export const seedTools = internalMutation({
  args: {},
  handler: async (ctx) => {

    //Ditch this code if you don't care about repetitive tool names
    // const existingTools = await ctx.db.query("tools").take(1);

    // if (existingTools.length > 0) {
    //   throw new Error("Tools table is not empty. Aborting seed.");
    // }

    const users = await ctx.db.query("users").collect();
    const categories = await ctx.db.query("categories").collect();

    if (users.length === 0) {
      throw new Error("No users found. Sign in first.");
    }

    if (categories.length === 0) {
      throw new Error("No categories found. Seed categories first.");
    }


    const conditions = ["new", "good", "fair", "poor"] as const;

    for (let i= 0; i< 50; i++) {
      const owner = faker.helpers.arrayElement(users);
      const category = faker.helpers.arrayElement(categories);

      await ctx.db.insert("tools", {
        ownerId: owner._id,
        name: faker.commerce.product(),
        category: category._id,
        condition: faker.helpers.arrayElement(conditions),
        description: faker.lorem.sentences({ min: 1, max: 2 }),
      });
    }

    return {
      inserted: 50,
      owners: users.length,
      categories: categories.length,
    };
  },
});