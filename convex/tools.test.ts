
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

async function createToolFixture(t: ReturnType<typeof convexTest>) {
    return await t.run(async (ctx) => {
        const ownerId = await ctx.db.insert("users", {
            clerkId: "owner-clerk-id",
            role: "user",
            isTrusted: false,
            name: "Tool Owner",
        });

        const otherUserId = await ctx.db.insert("users", {
            clerkId: "other-clerk-id",
            role: "user",
            isTrusted: false,
            name: "Other User",
        });

        const gardenId = await ctx.db.insert("categories", {
            name: "Garden tools",
        });

        const electronicsId = await ctx.db.insert("categories", {
            name: "Electronics",
        });

        const availableToolId = await ctx.db.insert("tools", {
            ownerId,
            name: "Electric drill",
            category: gardenId,
            condition: "good",
            isAvailable: true,
        });

        const unavailableToolId = await ctx.db.insert("tools", {
            ownerId,
            name: "Lawn mower",
            category: gardenId,
            condition: "fair",
            isAvailable: false,
        });

        await ctx.db.insert("tools", {
            ownerId: otherUserId,
            name: "Camera",
            category: electronicsId,
            condition: "new",
            isAvailable: true,
        });

        return {
            ownerId,
            otherUserId,
            gardenId,
            electronicsId,
            availableToolId,
            unavailableToolId,
        };
    });
}

describe("createTool", () => {
    it("creates a tool owned by the authenticated user", async () => {
        const t = convexTest(schema, modules);
        const { gardenId, ownerId } = await createToolFixture(t);

        const toolId = await t
            .withIdentity({ subject: "owner-clerk-id" })
            .mutation(api.tools.createTool, {
                name: "  New drill  ",
                category: gardenId,
                condition: "good",
            });

        const tool = await t.run((ctx) => ctx.db.get("tools", toolId));

        expect(tool).not.toBeNull();
        expect(tool?.name).toBe("New drill");
        expect(tool?.ownerId).toBe(ownerId);
        expect(tool?.isAvailable).toBe(true);
    });

    it("rejects an empty or whitespace-only name", async () => {
        const t = convexTest(schema, modules);
        const { gardenId } = await createToolFixture(t);

        await expect(
            t.withIdentity({ subject: "owner-clerk-id" })
                .mutation(api.tools.createTool, {
                    name: "   ",
                    category: gardenId,
                    condition: "good",
                })
        ).rejects.toThrow();
    });

    it("rejects a nonexistent category", async () => {
        const t = convexTest(schema, modules);
        const { gardenId } = await createToolFixture(t);

        await t.run((ctx) => ctx.db.delete(gardenId));

        await expect(
            t.withIdentity({ subject: "owner-clerk-id" })
                .mutation(api.tools.createTool, {
                    name: "New drill",
                    category: gardenId,
                    condition: "good",
                })
        ).rejects.toThrow();
    });

    it("rejects unauthenticated users", async () => {
        const t = convexTest(schema, modules);
        const { gardenId } = await createToolFixture(t);

        await expect(
            t.mutation(api.tools.createTool, {
                name: "New drill",
                category: gardenId,
                condition: "good",
            })
        ).rejects.toThrow();
    });
});

describe("getTools", () => {
    it("rejects unauthenticated users", async () => {
        const t = convexTest(schema, modules);
        await createToolFixture(t);

        await expect(
            t.query(api.tools.getTools, {
                paginationOpts: { numItems: 10, cursor: null },
            })
        ).rejects.toThrow();
    });

    it("filters tools by category", async () => {
        const t = convexTest(schema, modules);
        const { gardenId } = await createToolFixture(t);

        const result = await t
            .withIdentity({ subject: "owner-clerk-id" })
            .query(api.tools.getTools, {
                category: gardenId,
                paginationOpts: { numItems: 10, cursor: null },
            });

        expect(result.page).toHaveLength(2);
        expect(result.page.every((tool) => tool.category === "Garden tools")).toBe(true);
    });
});

describe("getPublicTools", () => {
    it("returns only available tools without owner information", async () => {
        const t = convexTest(schema, modules);
        await createToolFixture(t);

        // No identity: this query should be publicly accessible.
        const result = await t.query(api.tools.getPublicTools, {
            paginationOpts: { numItems: 10, cursor: null },
        });

        expect(result.page).toHaveLength(2);
        expect(result.page.map((tool) => tool.name)).toContain("Electric drill");
        expect(result.page.map((tool) => tool.name)).not.toContain("Lawn mower");

        for (const tool of result.page) {
            expect(tool).not.toHaveProperty("owner");
            expect(tool).not.toHaveProperty("ownerId");
            expect(tool).not.toHaveProperty("clerkId");
        }
    });

    it("filters available tools by category", async () => {
        const t = convexTest(schema, modules);
        const { gardenId } = await createToolFixture(t);

        const result = await t.query(api.tools.getPublicTools, {
            category: gardenId,
            paginationOpts: { numItems: 10, cursor: null },
        });

        expect(result.page).toHaveLength(1);
        expect(result.page[0].name).toBe("Electric drill");
        expect(result.page[0].category).toBe("Garden tools");
    });
});
