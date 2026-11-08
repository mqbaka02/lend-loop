import { Id } from "@/convex/_generated/dataModel";
import { Dayjs } from "dayjs";

type conditionType= "new" | "good" | "fair" | "poor";
type loanStatus= "pending" | "withdrawn" | "approved"| "declined"| "returned";

type Tool = {
    name: string;
    category: string;
    categoryId: string;
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

type BorrowRequest = {
    tool: Tool;
    owner: {
        name: string | undefined;
        username: string | undefined;
        imageUrl: string | undefined;
        isTrusted: boolean;
    } | null;
    category: {
        _id: Id<"categories">;
        _creationTime: number;
        name: string;
    } | null;
    _id: Id<"loans">;
    _creationTime: number;
    ownerId: Id<"users">;
    toolId: Id<"tools">;
    borrowerId: Id<"users">;
    startDate: number;
    endDate: number;
    status: loanStatus;
}

type RangeValue = [Dayjs | null, Dayjs | null] | null;

export type {Tool, conditionType, BorrowRequest, loanStatus, RangeValue};