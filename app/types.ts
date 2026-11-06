import { Id } from "@/convex/_generated/dataModel";

type Tool = {
    name: string;
    category: string;
    owner: {
        clerkId: string;
        isTrusted: boolean;
        name?: string;
        imageUrl?: string;
        username?: string;
    } | null;
    condition: "new" | "good" | "fair" | "poor";
    desc: string | undefined;
    image: Id<"_storage"> | undefined;
    date: number;
    isAvailable: boolean;
    id: Id<"tools">
};

export type {Tool};