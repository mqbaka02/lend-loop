import { Id } from "@/convex/_generated/dataModel";

type conditionType= "new" | "good" | "fair" | "poor";

type Tool = {
    name: string;
    category: string;
    owner: {
        isTrusted: boolean;
        name?: string;
        imageUrl?: string;
        username?: string;
    } | null;
    condition: conditionType;
    desc: string | undefined;
    image: Id<"_storage"> | undefined;
    date: number;
    isAvailable: boolean;
    id: Id<"tools">
};

export type {Tool, conditionType};