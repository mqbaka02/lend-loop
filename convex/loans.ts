import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { internal } from "./_generated/api";

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

        if (!theTool) throw new Error("This tool doesn't exist!");

        const theOwner= theTool.ownerId;
        if (theOwner=== user._id) throw new Error("You can't borrow your own tool!");

        if ((args.startDate>= args.endDate) || (args.startDate< now)) throw new Error("The date range is invalid");

        const allRelatedLoans= await context.db.query("loans").withIndex("by_tool", (q)=> q.eq("toolId", args.toolId)).collect();

        if (allRelatedLoans.some(
            loan => (
                loan.status === "approved" &&
                doRangesIntersect(loan.startDate, loan.endDate, args.startDate, args.endDate)
            )
        )){
            throw new Error("This tool is not available in this date range!")
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
        const enrichedLoans= loans.map(async loan=> {
            //find the tool
            const theTool= await context.db.get("tools", loan.toolId);
            if (!theTool) return null; // just checking to avoid Ts errors, those should always exist

            //find the borrower name
            const theOwner= await context.db.get("users", loan.ownerId);
            if (!theOwner) return null; // just checking to avoid Ts errors, those should always exist

            //find the category??
            const theCateg= await context.db.get("categories", theTool?.category);
            return {
                ...loan,
                tool: theTool,
                owner: theOwner,
                category: theCateg
            };
        });

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
        const enrichedLoans= loans.map(async loan=> {
            //find the tool
            const theTool= await context.db.get("tools", loan.toolId);
            if (!theTool) return null; // just checking to avoid Ts errors, those should always exist

            //find the borrower name
            const theBorrower= await context.db.get("users", loan.borrowerId);
            if (!theBorrower) return null; // just checking to avoid Ts errors, those should always exist

            //find the category??
            const theCateg= await context.db.get("categories", theTool?.category);
            return {
                ...loan,
                tool: theTool,
                borrower: theBorrower,
                category: theCateg
            };
        });

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
        if (!theLoan) throw new Error("The loan is not found!");

        if (theLoan.status!== "pending") throw new Error("Loan is not pending!");

        const theTool= await context.db.get("tools", theLoan.toolId);

        if (!theTool) throw new Error("This tool doesn't exist!");

        if (theTool.ownerId!== user._id && user.role!== "admin") throw new Error("This tool doesn't belong to you!"); //Only owner and admin can mark as returned for now.

        let newStatus= args.newStatus;

        const allRelatedLoans= await context.db.query("loans").withIndex("by_tool", (q)=> q.eq("toolId", theTool._id)).collect();

        if (allRelatedLoans.some(
            loan => (
                loan.status === "approved" &&
                doRangesIntersect(loan.startDate, loan.endDate, theLoan.startDate, theLoan.endDate)
            )
        )){
            newStatus= "declined"; //Fail silently
            // throw new Error("The tool is not available in this range anymore!"); // Or throw an error
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
        if (!theLoan) throw new Error("The loan is not found!");

        const theTool= await context.db.get("tools", theLoan.toolId);

        if (!theTool) throw new Error("This tool doesn't exist!");

        if ((theTool.ownerId!== user._id && user.role!== "admin")) throw new Error("This tool doesn't belong to you!"); //Only owner and admin can mark as returned for now.

        if (theLoan.status !== "approved") throw new Error("Only approved loans can be marked as returned!"); //Why would you return something that hasn't been borrowed?

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