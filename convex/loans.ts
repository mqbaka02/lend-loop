import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { internal } from "./_generated/api";
import { faker } from "@faker-js/faker";

/**
 * Checks if two date ranges in Unix time intersects with each other
 * @param start1 
 * @param end1 
 * @param start2 
 * @param end2 
 * @returns {boolean}
 */
function doRangesIntersect(start1: number, end1: number, start2: number, end2: number) {
    return start1 <= end2 && start2 <= end1;
}

export const createLoanRequest= mutation({
    args: {
        startDate: v.number(),
        endDate: v.number(),
        toolId: v.id("tools"),
    },

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);

        const theTool= await context.db.get("tools", args.toolId);

        const now= Date.now();

        if (!theTool) throw new ConvexError("This tool doesn't exist!");

        const theOwner= theTool.ownerId;
        if (theOwner=== user._id) throw new ConvexError("You can't borrow your own tool!");

        if ((args.startDate>= args.endDate) || (args.startDate< now)) throw new ConvexError("The date range is invalid");

        const allRelatedLoans= await context.db.query("loans").withIndex("by_tool", (q)=> q.eq("toolId", args.toolId)).collect();

        if (allRelatedLoans.some(
            loan => (
                loan.status === "approved" &&
                doRangesIntersect(loan.startDate, loan.endDate, args.startDate, args.endDate)
            )
        )){
            throw new ConvexError("This tool is not available in this date range!")
        }

        return await context.db.insert("loans", {
            borrowerId: user._id,
            endDate: args.endDate,
            startDate: args.startDate,
            ownerId: theOwner,
            status: "pending",
            toolId: args.toolId,
        });
    },
});

/**
 * List all the requests made by the current user
 */
export const getMyRequests= query({
    args: {},

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);

        const loans= await context.db.query("loans").withIndex("by_borrower", (q)=> q.eq("borrowerId", user._id)).collect();
        const enrichedLoans = await Promise.all(
            loans.map(async loan => {
                //find the tool
                const theTool = await context.db.get("tools", loan.toolId);
                if (!theTool) return null; // just checking to avoid Ts errors, those should always exist

                //find the borrower name
                const theOwner = await context.db.get("users", loan.ownerId);
                if (!theOwner) return null; // just checking to avoid Ts errors, those should always exist

                //find the category??
                const theCateg = await context.db.get("categories", theTool?.category);
                return {
                    ...loan,
                    tool: theTool,
                    owner: theOwner? {
                        name: theOwner.name,
                        username: theOwner.username,
                        imageUrl: theOwner.imageUrl,
                        isTrusted: theOwner.isTrusted,
                    }: null,
                    category: theCateg
                };
            })
        );

        return enrichedLoans.filter(e=> e!==null);
    },
});

/**
 * Lists all the requests that concerns the current user's tools
 */
export const getIncomingRequests= query({
    args: {},

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);

        const loans= await context.db.query("loans").withIndex("by_owner", (q)=> q.eq("ownerId", user._id)).collect();
        const enrichedLoans = await Promise.all(
            loans.map(async loan => {
                //find the tool
                const theTool = await context.db.get("tools", loan.toolId);
                if (!theTool) return null; // just checking to avoid Ts errors, those should always exist

                //find the borrower name
                const theBorrower = await context.db.get("users", loan.borrowerId);
                if (!theBorrower) return null; // just checking to avoid Ts errors, those should always exist

                //find the category??
                const theCateg = await context.db.get("categories", theTool?.category);
                return {
                    ...loan,
                    tool: theTool,
                    borrower: theBorrower? {
                        clerkUpdatedAt: theBorrower.clerkUpdatedAt,
                        username: theBorrower.username,
                        name: theBorrower.name,
                        imageUrl: theBorrower.imageUrl,
                        isTrusted: theBorrower.isTrusted,
                    }: null,
                    category: theCateg
                };
            })
        );

        return enrichedLoans.filter(e=> e!==null);
    },
});

export const updateLoanStatus= mutation({
    args: {
        loanId: v.id("loans"),
        newStatus: v.union(
            v.literal("approved"),
            // v.literal("pending"), // No need
            v.literal("declined"),
            // v.literal("returned"), // Handled by markAsReturned
        ),
    },

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);

        const theLoan= await context.db.get("loans", args.loanId);
        if (!theLoan) throw new ConvexError("The loan is not found!");

        if (theLoan.status!== "pending") throw new ConvexError("Loan is not pending!");

        const theTool= await context.db.get("tools", theLoan.toolId);

        if (!theTool) throw new ConvexError("This tool doesn't exist!");

        if (theTool.ownerId!== user._id && user.role!== "admin") throw new ConvexError("This tool doesn't belong to you!"); //Only owner and admin can mark as returned for now.

        let newStatus= args.newStatus;

        const allRelatedLoans= await context.db.query("loans").withIndex("by_tool", (q)=> q.eq("toolId", theTool._id)).collect();

        if (allRelatedLoans.some(
            loan => (
                loan.status === "approved" &&
                doRangesIntersect(loan.startDate, loan.endDate, theLoan.startDate, theLoan.endDate)
            )
        )){
            newStatus= "declined"; //Fail silently
            // throw new ConvexError("The tool is not available in this range anymore!"); // Or throw an error
        }

        const result= await context.db.patch("loans", args.loanId, {
            status: newStatus,
        });

        //Refresh tool availability
        await context.scheduler.runAfter(0, internal.tools.refreshAvailability, { toolId: theTool._id });
        if (newStatus=== "approved"){
            await context.scheduler.runAt(theLoan.startDate, internal.tools.refreshAvailability, { toolId: theTool._id });
            await context.scheduler.runAt(theLoan.endDate + 1, internal.tools.refreshAvailability, { toolId: theTool._id });
        }

        return result;
    },
});

export const markAsReturned= mutation({
    args: {
        loanId: v.id("loans"),
    },

    handler: async (context, args)=> {
        const user= await getCurrentUser(context);

        const theLoan= await context.db.get("loans", args.loanId);
        if (!theLoan) throw new ConvexError("The loan is not found!");

        const theTool= await context.db.get("tools", theLoan.toolId);

        if (!theTool) throw new ConvexError("This tool doesn't exist!");

        if ((theTool.ownerId!== user._id && user.role!== "admin")) throw new ConvexError("This tool doesn't belong to you!"); //Only owner and admin can mark as returned for now.

        if (theLoan.status !== "approved") throw new ConvexError("Only approved loans can be marked as returned!"); //Why would you return something that hasn't been borrowed?

        const result= await context.db.patch("loans", args.loanId, {
            status: "returned"
        });

        //Refresh tool availability
        await context.scheduler.runAfter(0, internal.tools.refreshAvailability, { toolId: theTool._id });
        // await context.scheduler.runAt(theLoan.startDate, internal.tools.refreshAvailability, { toolId: theTool._id });
        // await context.scheduler.runAt(theLoan.endDate + 1, internal.tools.refreshAvailability, { toolId: theTool._id });

        return result;
    },
});


export const seedLoans = internalMutation({
    args: {},

    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const tools = await ctx.db.query("tools").collect();
        const existingLoans = await ctx.db.query("loans").collect();

        if (users.length < 2) {
            throw new Error("At least two users are required to seed loans.");
        }

        if (tools.length === 0) {
            throw new Error("No tools found. Seed tools first.");
        }

        const DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Always select a borrower who isn't the owner.
        const pickBorrower = (ownerId: typeof users[number]["_id"]) => {
            const eligibleUsers = users.filter(user => user._id !== ownerId);
            return faker.helpers.arrayElement(eligibleUsers);
        };

        // Generate a future date range.
        const futureRange = () => {
            const startDate = now + faker.number.int({ min: 1, max: 60 }) * DAY;
            const endDate = startDate + faker.number.int({ min: 1, max: 14 }) * DAY;
            return { startDate, endDate };
        };

        // Generate a past date range.
        const pastRange = () => {
            const endDate = now - faker.number.int({ min: 1, max: 60 }) * DAY;
            const startDate = endDate - faker.number.int({ min: 1, max: 14 }) * DAY;
            return { startDate, endDate };
        };

        // Generate pending and declined loans.
        const seedRandomLoans = async (
            status: "pending" | "declined",
            count: number
        ) => {
            for (let i = 0; i < count; i++) {
                const tool = faker.helpers.arrayElement(tools);
                const borrower = pickBorrower(tool.ownerId);
                const { startDate, endDate } = futureRange();

                await ctx.db.insert("loans", {
                    toolId: tool._id,
                    ownerId: tool.ownerId,
                    borrowerId: borrower._id,
                    startDate,
                    endDate,
                    status,
                });
            }
        };

        await seedRandomLoans("pending", 10);
        await seedRandomLoans("declined", 10);

        // Seed one approved loan per tool, unless one already exists.
        const approvedToolIds = new Set(
            existingLoans
                .filter(loan => loan.status === "approved")
                .map(loan => loan.toolId)
        );

        let approvedInserted = 0;
        let approvedSkipped = 0;

        for (let i = 0; i < tools.length; i++) {
            const tool = tools[i];

            if (approvedToolIds.has(tool._id)) {
                approvedSkipped++;
                continue;
            }

            const borrower = pickBorrower(tool.ownerId);

            let startDate: number;
            let endDate: number;

            // Alternate between active and upcoming loans.
            if (i % 2 === 0) {
                startDate = now - faker.number.int({ min: 1, max: 5 }) * DAY;
                endDate = now + faker.number.int({ min: 1, max: 10 }) * DAY;
            } else {
                startDate = now + faker.number.int({ min: 2, max: 30 }) * DAY;
                endDate = startDate + faker.number.int({ min: 1, max: 14 }) * DAY;
            }

            await ctx.db.insert("loans", {
                toolId: tool._id,
                ownerId: tool.ownerId,
                borrowerId: borrower._id,
                startDate,
                endDate,
                status: "approved",
            });

            approvedInserted++;
        }

        // Seed 10 returned loans, all with dates in the past.
        for (let i = 0; i < 10; i++) {
            const tool = faker.helpers.arrayElement(tools);
            const borrower = pickBorrower(tool.ownerId);
            const { startDate, endDate } = pastRange();

            await ctx.db.insert("loans", {
                toolId: tool._id,
                ownerId: tool.ownerId,
                borrowerId: borrower._id,
                startDate,
                endDate,
                status: "returned",
            });
        }

        // Recalculate availability based on the actual loan records.
        for (const tool of tools) {
            const relatedLoans = await ctx.db
                .query("loans")
                .withIndex("by_tool", q => q.eq("toolId", tool._id))
                .collect();

            const isBorrowed = relatedLoans.some(
                loan =>
                    loan.status === "approved" &&
                    loan.startDate <= now &&
                    loan.endDate >= now
            );

            await ctx.db.patch(tool._id, {
                isAvailable: !isBorrowed,
            });
        }

        return {
            pending: 10,
            declined: 10,
            approvedInserted,
            approvedSkipped,
            returned: 10,
            tools: tools.length,
        };
    },
});
