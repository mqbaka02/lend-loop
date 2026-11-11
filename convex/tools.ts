import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin } from "./lib/auth";

import { internalMutation } from "./_generated/server";
import { faker } from "@faker-js/faker";
import { paginationOptsValidator } from "convex/server";

export const getPublicTools= query({
    args: {
        category: v.optional(v.id("categories")),
        textQuery: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },

    handler: async (context, args)=> {
        const category= args.category;
        const textQuery= args.textQuery;

        // Availability is part of the index range, so unavailable tools are never read
        // If the textQuery is not empty or undefined, use it in the search
        const toolsQuery= (!textQuery || !textQuery.trim())
            ? category !== undefined
                ? context.db
                    .query("tools")
                    .withIndex("by_category_and_available", (q)=>
                        q.eq("category", category).eq("isAvailable", true)
                    )
                : context.db
                    .query("tools")
                    .withIndex("by_available", (q)=> q.eq("isAvailable", true))
            : context.db
                .query("tools")
                .withSearchIndex("search_by_name", (q)=> {
                    let matches= q.search("name", textQuery);
                    if (category) {
                        matches= matches.eq("category", category);
                    }
                    matches= matches.eq("isAvailable", true);
                    return matches;
                })

        const result= await toolsQuery
            .paginate(args.paginationOpts);

        const page= await Promise.all(
            result.page.map(async (tool)=> {
                const category= await context.db.get("categories", tool.category);
                return {
                    name: tool.name,
                    category: category?.name ?? "No category",
                    id: tool._id,
                    image: tool.imageId,
                };
            })
        );

        return { ...result, page };
    },
});

export const getTools= query({
    args: {
        category: v.optional(v.id("categories")),
        textQuery: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);

        const category= args.category;
        const textQuery= args.textQuery;

        const toolsQuery= (!textQuery || !textQuery.trim())
            ? category !== undefined
                ? context.db
                    .query("tools")
                    .withIndex("by_category", (q)=> q.eq("category", category))
                : context.db
                    .query("tools")
            : context.db
                .query("tools")
                .withSearchIndex("search_by_name", (q)=> {
                    let matches= q.search("name", textQuery);
                    if (category) {
                        matches= matches.eq("category", category);
                    }
                    return matches;
                })

        const result= await toolsQuery
            .paginate(args.paginationOpts);

        //Enrich the results for data used by the frontend
        const page= await Promise.all(
            result.page.map(async (tool)=> {
                const category= await context.db.get("categories", tool.category);
                const owner= await context.db.get("users", tool.ownerId);
                return {
                    name: tool.name,
                    category: category?.name ?? "No category",
                    categoryId: tool.category,
                    owner: owner ? {
                        isTrusted: owner.isTrusted,
                        name: owner.name,
                        imageUrl: owner.imageUrl,
                        username: owner.username
                    } : null,
                    condition: tool.condition,
                    desc: tool.description,
                    image: tool.imageId,
                    date: tool._creationTime,
                    isAvailable: tool.isAvailable,
                    id: tool._id,
                };
            })
        );

        return { ...result, page };
    },
});

export const deleteTool= mutation({
    args: {
        toolId: v.id("tools"),
    },

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);

        const theTool= await context.db.get("tools", args.toolId);
        if(!theTool) throw new ConvexError("The tool doesn't exist!");

        //Must be an admin or the owner of the tool
        if (user.role!== "admin" && user._id!== theTool?.ownerId) throw new ConvexError("This tool doesn't belong toy you!");

        //Cascade delete: all the requests for that tool will be deleted as well
        //There is no reason to store a loan request that references a non-existent tool
        const allRelatedrequests= await context.db.query("loans").withIndex("by_tool", (q)=> q.eq("toolId", theTool._id)).collect();

        await Promise.all(
            allRelatedrequests.map(req =>
                context.db.delete("loans", req._id)
            )
        ).catch((error)=>{
            throw new ConvexError(error);
        });

        const toolDeletionResult= await context.db.delete("tools", theTool._id);
        return toolDeletionResult;
    },
});

export const getToolsAdmin= query({
    args: {},

    handler: async (context, args)=> {
        const user= requireAdmin(context);

        const allTools= await context.db.query("tools").withIndex("by_creation_time").order("desc").collect();

        return await Promise.all(allTools.map((async tool=> {
            const category= await context.db.get("categories", tool.category);
            const owner= await context.db.get("users", tool.ownerId);
            return {
                name: tool.name,
                category: category?.name ?? "No category",
                categoryId: tool.category,
                owner: owner ? {
                    isTrusted: owner.isTrusted,
                    // clerkId: owner.clerkId,
                    name: owner.name,
                    imageUrl: owner.imageUrl,
                    username: owner.username
                } : null,
                condition: tool.condition,
                desc: tool.description,
                image: tool.imageId,
                date: tool._creationTime,
                isAvailable: tool.isAvailable,
                id: tool._id,
            };
        })));
    },
});

export const getMyTools= query({
    args: {
        category: v.optional(v.id("categories")),
    },

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);

        const category= args.category;
        //Filter by catogory or not filter at all depending on the argument
        const toolsQuery= category !== undefined
            ? context.db
                .query("tools")
                .withIndex("by_category_and_owner", (q)=> q.eq("category", category).eq("ownerId", user._id))
            : context.db.query("tools")
                .withIndex("by_owner", (q)=> q.eq("ownerId", user._id));

        const result= await toolsQuery
            .order("desc")
            .collect();
        
        const tools= await Promise.all(result.map((async tool=> {
            const category= await context.db.get("categories", tool.category);
            const owner= await context.db.get("users", tool.ownerId);
            return {
                name: tool.name,
                category: category?.name ?? "No category",
                categoryId: tool.category,
                owner: owner ? {
                    isTrusted: owner.isTrusted,
                    // clerkId: owner.clerkId,
                    name: owner.name,
                    imageUrl: owner.imageUrl,
                    username: owner.username
                } : null,
                condition: tool.condition,
                desc: tool.description,
                image: tool.imageId,
                date: tool._creationTime,
                isAvailable: tool.isAvailable,
                id: tool._id,
            };
        })));

        return tools;
    },
});

export const createTool= mutation({
    args: {
        name: v.string(),
        category: v.id("categories"),
        desc: v.optional(v.string()),
        condition: v.union(
            v.literal("new"),
            v.literal("good"),
            v.literal("fair"),
            v.literal("poor")
        )
    },

    handler: async (context, args)=> {
        const user= await getCurrentUser(context); //We need this to extract the (real) user's id and of course also to ensure that the user is authed

        const name= args.name.trim();
        if (!name) throw new ConvexError("Tool name cannot be empty!");

        const category= await context.db.get("categories", args.category);
        if (!category) throw new ConvexError("Category not found!");

        return await context.db.insert("tools", {
            ownerId: user._id, //We can trust this is the real id because it comes from Convex
            name,
            category: args.category,
            description: args.desc,
            condition: args.condition,
            isAvailable: true,
        });
    },
});

export const editTool= mutation({
    args: {
        id: v.id("tools"),
        name: v.string(),
        category: v.id("categories"),
        desc: v.optional(v.string()),
        condition: v.union(
            v.literal("new"),
            v.literal("good"),
            v.literal("fair"),
            v.literal("poor")
        )
    },

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);

        const name= args.name.trim();
        if (!name) throw new ConvexError("Tool name cannot be empty!");

        const category= await context.db.get("categories", args.category);
        if (!category) throw new ConvexError("Category not found!");

        const theTool= await context.db.get("tools", args.id);
        if(!theTool) throw new ConvexError("Tool not found!");

        return await context.db.patch("tools", theTool._id, {
            name,
            category: args.category,
            description: args.desc,
            condition: args.condition,
        });
    },
});

export const seedTools= internalMutation({
  args: {},
  handler: async (ctx)=> {

    //Ditch this code if you don't care about repetitive tool names
    // const existingTools= await ctx.db.query("tools").take(1);

    // if (existingTools.length > 0) {
    //   throw new ConvexError("Tools table is not empty. Aborting seed.");
    // }

    const users= await ctx.db.query("users").collect();
    const categories= await ctx.db.query("categories").collect();

    if (users.length=== 0) {
      throw new ConvexError("No users found. Sign in first.");
    }

    if (categories.length=== 0) {
      throw new ConvexError("No categories found. Seed categories first.");
    }


    const conditions= ["new", "good", "fair", "poor"] as const;

    for (let i= 0; i< 50; i++) {
      const owner= faker.helpers.arrayElement(users);
      const category= faker.helpers.arrayElement(categories);

      await ctx.db.insert("tools", {
        ownerId: owner._id,
        name: faker.commerce.product(),
        category: category._id,
        condition: faker.helpers.arrayElement(conditions),
        description: faker.lorem.sentences({ min: 1, max: 2 }),
        isAvailable: true,
      });
    }

    return {
      inserted: 50,
      owners: users.length,
      categories: categories.length,
    };
  },
});


/**
 * This is a migration function that I need to update all the existing data in the tools table because
 * I added isAvailable key and need to make it non-optional
 */
export const migrateFromNoIsAvailableToIsAvailable= internalMutation({
    args: {},

    handler: async (context, args)=> {
        const allTools= await context.db.query("tools").collect();

        await Promise.all(
            allTools.map(tool =>
                context.db.patch(tool._id, {
                    isAvailable: true,
                })
            )
        );
    },
});

/**
 * This function is for refreshing the availability of each tool,
 * This is meant to be called from a scheduler mostly
 */
export const refreshAvailability= internalMutation({
    args: { toolId: v.id("tools") },
    handler: async (context, { toolId })=> {

        const now= Date.now();

        const loans= await context.db
            .query("loans")
            .withIndex("by_tool", (q)=> q.eq("toolId", toolId))
            .collect();

        const isBorrowed= loans.some(
            (loan)=>
                loan.status=== "approved" &&
                loan.endDate >= now &&
                loan.startDate <= now
        );

        const tool = await context.db.get("tools", toolId);
        if (!tool) return;

        await context.db.patch(toolId, { isAvailable: !isBorrowed });
    },
});

/**
 * VERY IMPORTANT FOR LATER
 * Add those code in any function that can approve/cancel/return a loan
 * Basically any function that should logically change the availabiility of a tool

await context.scheduler.runAfter(0, internal.tools.refreshAvailability, { toolId });
await context.scheduler.runAt(loan.startDate, internal.tools.refreshAvailability, { toolId });
await context.scheduler.runAt(loan.endDate + 1, internal.tools.refreshAvailability, { toolId });
*/