import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    //This moddel is just a test as a Hello world for Convex
    //It's unrelated to the project and is safe to delete
    messages: defineTable({
        text: v.string(),
        userId: v.string(),
    }),

    //Project related models starts here
    users: defineTable({
        clerkId: v.string(),
        clerkUpdatedAt: v.optional(v.number()),
        isTrusted: v.boolean(),
        username: v.optional(v.string()),
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        role: v.union(
            v.literal("user"),
            v.literal("admin")
        ),
    })
    .index("by_clerk_id", ["clerkId"]),

    categories: defineTable({
        name: v.string()
    })
    .index("by_name", ["name"]),

    tools: defineTable({
        ownerId: v.id("users"),
        name: v.string(),
        category: v.id("categories"),
        description: v.optional(v.string()),
        imageId: v.optional(v.id("_storage")),
        isAvailable: v.boolean(),
        condition: (v.union(
            v.literal("new"),
            v.literal("good"),
            v.literal("fair"),
            v.literal("poor")
        )),
    })
    .index("by_owner", ["ownerId"])
    .index("by_category", ["category"])
    .index("by_available", ["isAvailable"])
    .index("by_category_and_available", ["category", "isAvailable"])
    .index("by_category_and_owner", ["category", "ownerId"])
    .searchIndex("search_by_name", {
        searchField: "name",
        filterFields: ["isAvailable", "category"],
    }),

    loans: defineTable({
        toolId: v.id("tools"),
        ownerId: v.id("users"),
        borrowerId: v.id("users"),
        startDate: v.number(), //UNIX time
        endDate: v.number(),
        returnedAt: v.optional(v.number()),
        status: v.union(
            v.literal("pending"), //Request sent (created) and waiting for owner's approval
            v.literal("withdrawn"), //Request sent (created) but the sender gave up
            v.literal("approved"), //Approved and already borrowed or waiting for start date
            v.literal("declined"), //Declined
            v.literal("returned"), //Returned
        ),
    })
    .index("by_tool", ["toolId"])
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_status", ["ownerId", "status"])
    .index("by_borrower", ["borrowerId"])
    .index("by_status_end_date", ["status", "endDate"]),

    logs: defineTable({ //Mostly for n8n activities
        loanId: v.id("loans"),
        type: v.union(
            v.literal("notification"),
            v.literal("reminder"),
        ),
        status: v.union(
            v.literal("pending"),
            v.literal("sent"),
            v.literal("failed"),
        ),
        createdAt: v.number(), //Date in UNIX time for the date where it's first attempted
        lastAttemptAt: v.optional(v.number()), //Date in UNIX time for the last attempt
        failedAt: v.optional(v.number()), //Date in UNIX time in the case it fails
        sentAt: v.optional(v.number()), //Date in UNIX time in the case it succeeds
        attemptCount: v.number(),
        lastError: v.optional(v.string()),
        idempotencyKey: v.string(), //Unique operation identifier to identify one logical notification (for example: if a notification is attempted to be sent multiple times, we use this key to see which notification it is so that we can write it on the corresponding log instead of creating another log for each attempt)
    })
    .index("by_loan", ["loanId"])
    .index("by_idempotency_key", ["idempotencyKey"])
    .index("by_status", ["status"])
});