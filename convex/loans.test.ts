import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

describe("Loan functions", () => {
    it("starts with an empty loans table", async () => {
        const t = convexTest(schema, modules);

        const loans = await t.run(async (ctx) => {
            return await ctx.db.query("loans").collect();
        });

        expect(loans).toHaveLength(0);
    });
});

async function createFixture(t: ReturnType<typeof convexTest>) {
    return await t.run(async (ctx) => {
        const ownerId = await ctx.db.insert("users", {
            clerkId: "owner-clerk-id",
            role: "user",
            isTrusted: false,
            name: "Tool Owner",
        });

        const borrowerId = await ctx.db.insert("users", {
            clerkId: "borrower-clerk-id",
            role: "user",
            isTrusted: false,
            name: "Borrower",
        });

        const categoryId = await ctx.db.insert("categories", {
            name: "Garden tools",
        });

        const toolId = await ctx.db.insert("tools", {
            ownerId,
            name: "Electric drill",
            category: categoryId,
            condition: "good",
            isAvailable: true,
        });

        return { ownerId, borrowerId, toolId };
    });
}

describe("createLoanRequest", () => {
    it("allows a user to request another user's tool", async () => {
        const t = convexTest(schema, modules);
        const { toolId } = await createFixture(t);

        const startDate = Date.now() + 86_400_000;
        const endDate = startDate + 86_400_000;

        const loanId = await t
            .withIdentity({ subject: "borrower-clerk-id" })
            .mutation(api.loans.createLoanRequest, {
                toolId,
                startDate,
                endDate,
            });

        const loan = await t.run(async (ctx) => ctx.db.get("loans", loanId));

        expect(loan).not.toBeNull();
        expect(loan?.status).toBe("pending");
        expect(loan?.startDate).toBe(startDate);
        expect(loan?.endDate).toBe(endDate);
    });

    it("rejects requests for the user's own tool", async () => {
        const t = convexTest(schema, modules);
        const { toolId } = await createFixture(t);

        const startDate = Date.now() + 86_400_000;

        await expect(
            t.withIdentity({ subject: "owner-clerk-id" }).mutation(
                api.loans.createLoanRequest,
                {
                    toolId,
                    startDate,
                    endDate: startDate + 86_400_000,
                },
            ),
        ).rejects.toThrow("You can't borrow your own tool!");
    });

    it("rejects invalid date ranges", async () => {
        const t = convexTest(schema, modules);
        const { toolId } = await createFixture(t);

        const startDate = Date.now() + 86_400_000;

        await expect(
            t.withIdentity({ subject: "borrower-clerk-id" }).mutation(
                api.loans.createLoanRequest,
                {
                    toolId,
                    startDate,
                    endDate: startDate,
                },
            ),
        ).rejects.toThrow("The date range is invalid");
    });

    it("rejects requests that overlap an approved loan", async () => {
        const t = convexTest(schema, modules);
        const { ownerId, borrowerId, toolId } = await createFixture(t);

        const startDate = Date.now() + 86_400_000;
        const endDate = startDate + 3 * 86_400_000;

        await t.run(async (ctx) => {
            await ctx.db.insert("loans", {
                toolId,
                ownerId,
                borrowerId,
                startDate,
                endDate,
                status: "approved",
            });
        });

        await expect(
            t.withIdentity({ subject: "borrower-clerk-id" }).mutation(
                api.loans.createLoanRequest,
                {
                    toolId,
                    startDate: startDate + 86_400_000,
                    endDate: endDate + 86_400_000,
                },
            ),
        ).rejects.toThrow("This tool is not available in this date range!");
    });

    it("allows overlapping pending requests", async () => {
        const t = convexTest(schema, modules);
        const { ownerId, borrowerId, toolId } = await createFixture(t);

        const startDate = Date.now() + 86_400_000;
        const endDate = startDate + 3 * 86_400_000;

        await t.run(async (ctx) => {
            await ctx.db.insert("loans", {
                toolId,
                ownerId,
                borrowerId,
                startDate,
                endDate,
                status: "pending",
            });
        });

        const loanId = await t
            .withIdentity({ subject: "borrower-clerk-id" })
            .mutation(api.loans.createLoanRequest, {
                toolId,
                startDate: startDate + 86_400_000,
                endDate: endDate + 86_400_000,
            });

        const loan = await t.run(async (ctx) => ctx.db.get("loans", loanId));

        expect(loan?.status).toBe("pending");
    });
});

describe("updateLoanStatus", () => {
    async function createPendingLoan(t: ReturnType<typeof convexTest>) {
        const { ownerId, borrowerId, toolId } = await createFixture(t);

        const startDate = Date.now() + 86_400_000;
        const endDate = startDate + 3 * 86_400_000;

        const loanId = await t.run(async (ctx) => {
            return await ctx.db.insert("loans", {
                toolId,
                ownerId,
                borrowerId,
                startDate,
                endDate,
                status: "pending",
            });
        });

        return { loanId, ownerId, borrowerId, toolId, startDate, endDate };
    }

    it("allows the owner to approve a pending request", async () => {
        const t = convexTest(schema, modules);
        const { loanId } = await createPendingLoan(t);

        await t.withIdentity({ subject: "owner-clerk-id" }).mutation(
            api.loans.updateLoanStatus,
            { loanId, newStatus: "approved" },
        );

        const loan = await t.run(async (ctx) => ctx.db.get("loans", loanId));

        expect(loan?.status).toBe("approved");
    });

    it("allows the owner to decline a pending request", async () => {
        const t = convexTest(schema, modules);
        const { loanId } = await createPendingLoan(t);

        await t.withIdentity({ subject: "owner-clerk-id" }).mutation(
            api.loans.updateLoanStatus,
            { loanId, newStatus: "declined" },
        );

        const loan = await t.run(async (ctx) => ctx.db.get("loans", loanId));

        expect(loan?.status).toBe("declined");
    });

    it("rejects an unrelated user", async () => {
        const t = convexTest(schema, modules);
        const { loanId } = await createPendingLoan(t);

        await t.run(async (ctx) => {
            await ctx.db.insert("users", {
                clerkId: "stranger-clerk-id",
                role: "user",
                isTrusted: false,
            });
        });

        await expect(
            t.withIdentity({ subject: "stranger-clerk-id" }).mutation(
                api.loans.updateLoanStatus,
                { loanId, newStatus: "approved" },
            ),
        ).rejects.toThrow("This tool doesn't belong to you!");
    });

    it("does not allow the borrower to approve their own request", async () => {
        const t = convexTest(schema, modules);
        const { loanId } = await createPendingLoan(t);

        await expect(
            t.withIdentity({ subject: "borrower-clerk-id" }).mutation(
                api.loans.updateLoanStatus,
                { loanId, newStatus: "approved" },
            ),
        ).rejects.toThrow("This tool doesn't belong to you!");
    });

    it("declines a request if another approved loan overlaps it", async () => {
        const t = convexTest(schema, modules);
        const { loanId, ownerId, borrowerId, toolId, startDate, endDate } =
            await createPendingLoan(t);

        await t.run(async (ctx) => {
            await ctx.db.insert("loans", {
                toolId,
                ownerId,
                borrowerId,
                startDate: startDate + 86_400_000,
                endDate: endDate + 86_400_000,
                status: "approved",
            });
        });

        await t.withIdentity({ subject: "owner-clerk-id" }).mutation(
            api.loans.updateLoanStatus,
            { loanId, newStatus: "approved" },
        );

        const loan = await t.run(async (ctx) => ctx.db.get("loans", loanId));

        expect(loan?.status).toBe("declined");
    });

    it("rejects updates to a loan that is no longer pending", async () => {
        const t = convexTest(schema, modules);
        const { loanId } = await createPendingLoan(t);

        await t.run(async (ctx) => {
            await ctx.db.patch("loans", loanId, { status: "approved" });
        });

        await expect(
            t.withIdentity({ subject: "owner-clerk-id" }).mutation(
                api.loans.updateLoanStatus,
                { loanId, newStatus: "declined" },
            ),
        ).rejects.toThrow("Loan is not pending!");
    });
});

describe("markAsReturned", () => {
    async function createApprovedLoan(t: ReturnType<typeof convexTest>) {
        const { ownerId, borrowerId, toolId } = await createFixture(t);

        const loanId = await t.run(async (ctx) => {
            return await ctx.db.insert("loans", {
                toolId,
                ownerId,
                borrowerId,
                startDate: Date.now() + 86_400_000,
                endDate: Date.now() + 2 * 86_400_000,
                status: "approved",
            });
        });

        return { loanId, ownerId, borrowerId, toolId };
    }

    it("allows the owner to mark an approved loan as returned", async () => {
        const t = convexTest(schema, modules);
        const { loanId } = await createApprovedLoan(t);

        await t.withIdentity({ subject: "owner-clerk-id" }).mutation(
            api.loans.markAsReturned,
            { loanId },
        );

        const loan = await t.run(async (ctx) => ctx.db.get("loans", loanId));

        expect(loan?.status).toBe("returned");
    });

    it("allows an admin to mark an approved loan as returned", async () => {
        const t = convexTest(schema, modules);
        const { loanId } = await createApprovedLoan(t);

        await t.run(async (ctx) => {
            await ctx.db.insert("users", {
                clerkId: "admin-clerk-id",
                role: "admin",
                isTrusted: false,
            });
        });

        await t.withIdentity({ subject: "admin-clerk-id" }).mutation(
            api.loans.markAsReturned,
            { loanId },
        );

        const loan = await t.run(async (ctx) => ctx.db.get("loans", loanId));

        expect(loan?.status).toBe("returned");
    });

    it("does not allow the borrower to mark a loan as returned", async () => {
        const t = convexTest(schema, modules);
        const { loanId } = await createApprovedLoan(t);

        await expect(
            t.withIdentity({ subject: "borrower-clerk-id" }).mutation(
                api.loans.markAsReturned,
                { loanId },
            ),
        ).rejects.toThrow("This tool doesn't belong to you!");
    });

    it("does not allow an unrelated user to mark a loan as returned", async () => {
        const t = convexTest(schema, modules);
        const { loanId } = await createApprovedLoan(t);

        await t.run(async (ctx) => {
            await ctx.db.insert("users", {
                clerkId: "stranger-clerk-id",
                role: "user",
                isTrusted: false,
            });
        });

        await expect(
            t.withIdentity({ subject: "stranger-clerk-id" }).mutation(
                api.loans.markAsReturned,
                { loanId },
            ),
        ).rejects.toThrow("This tool doesn't belong to you!");
    });

    it("rejects returning a pending loan", async () => {
        const t = convexTest(schema, modules);
        const { ownerId, borrowerId, toolId } = await createFixture(t);

        const loanId = await t.run(async (ctx) => {
            return await ctx.db.insert("loans", {
                toolId,
                ownerId,
                borrowerId,
                startDate: Date.now() + 86_400_000,
                endDate: Date.now() + 2 * 86_400_000,
                status: "pending",
            });
        });

        await expect(
            t.withIdentity({ subject: "owner-clerk-id" }).mutation(
                api.loans.markAsReturned,
                { loanId },
            ),
        ).rejects.toThrow("Only approved loans can be marked as returned!");
    });
});