import { Id } from "@/convex/_generated/dataModel";

type Tool = {
    name: string;
    category: string;
    owner: {
        _id: Id<"users">;
        _creationTime: number;
        clerkId: string;
        isTrusted: boolean;
        role: "user" | "admin";
    } | null;
    condition: "new" | "good" | "fair" | "poor";
    desc: string | undefined;
    image: Id<"_storage"> | undefined;
    date: number;
    isAvailable: boolean;
    id: Id<"tools">
};

export type {Tool};