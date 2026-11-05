import { mutation } from "./_generated/server";

export const seedCategories= mutation({
    args: {},

    handler: async (context)=> {
        const categories= [
            "Bricolage",
            "Garden",
            "Kitchen",
            "Camping",
            "Sports",
            "Tech",
            "Other"
        ];

        categories.forEach(async category=> {
            //Check if the category already exists
            const existing= await context.db.query("categories").withIndex("by_name", (q)=> q.eq("name", category)).unique();

            //Create it if not
            if (!existing) await context.db.insert("categories", {
                name: category
            });
        });
    },
});