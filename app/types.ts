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
    image: string|null;
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

type incomingRequestTool= {
    _id: Id<"tools">,
    _creationTime: number,
    description?: string | undefined,
    imageId?: Id<"_storage"> | undefined,
    name: string,
    ownerId: Id<"users">,
    category: Id<"categories">,
    isAvailable: boolean,
    condition: "new" | "good" | "fair" | "poor",
};

type incomingRequest = {
    _id: Id<"loans">,
    _creationTime: number,
    ownerId: Id<"users">,
    toolId: Id<"tools">,
    borrowerId: Id<"users">,
    startDate: number,
    endDate: number,
    status: "pending" | "withdrawn" | "approved" | "declined" | "returned",
    tool: incomingRequestTool,
    borrower: {
        clerkUpdatedAt?: number,
        username?: string,
        name?: string,
        imageUrl?: string,
        isTrusted: boolean,
    } | null,
    owner: {
        name?: string
        username?: string
        imageUrl?: string
        isTrusted?: boolean
    },
    category: {
        _id: Id<"categories">,
        _creationTime: number,
        name: string,
    } | null,
};

type RangeValue = [Dayjs | null, Dayjs | null] | null;

export type {
    Tool,
    conditionType,
    BorrowRequest,
    loanStatus,
    RangeValue,
    incomingRequest,
    incomingRequestTool,
};