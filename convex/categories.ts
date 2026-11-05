import { query } from "./_generated/server"

export const getCategories= query({
    args: {},

    handler: async(context)=> {
        const categories= await context.db.query("categories").collect();

        return categories.map(c=> {
            return {
                name: c.name,
                id: c._id
            };
        });
    },
});