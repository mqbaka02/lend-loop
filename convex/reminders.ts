import { internalQuery } from "./_generated/server";

export const getOverdueLoans = internalQuery({
    args: {},

    handler: async (context, args) => {
        const now = Date.now();

        const overdueLoans = await context.db
            .query("loans")
            .withIndex("by_status_end_date", (q) => q.eq("status", "approved").lt("endDate", now))
            .collect();

        const results = [];

        for (const loan of overdueLoans) {
            const borrower = await context.db.get("users", loan.borrowerId);
            const tool = await context.db.get("tools", loan.toolId);

            if (!borrower || !tool) continue;

            results.push({
                loanId: loan._id,
                toolName: tool.name,
                borrowerName: borrower.name || borrower.username || "there",
                borrowerEmail: borrower.email,
                startDate: loan.startDate,
                endDate: loan.endDate,
            });
        }

        return results;
    },
});