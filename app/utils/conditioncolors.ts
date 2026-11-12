import { conditionType, loanStatus } from "../types";

export const conditionTypeColors: Record<conditionType, string>= {
    new: "#92F5A4",
    good: "#aaeeff",
    fair: "#E2E7FF",
    poor: "#FFDDB8",
};
export const loanStatusTypeColors: Record<loanStatus, string>= {
    approved: "#92F5A4",
    withdrawn: "#dedede",
    pending: "#aaeeff",
    returned: "#E2E7FF",
    declined: "#FFDDB8",
};


export const requestTextExplanation: Record<loanStatus, {title: string, p: string}>= {
    pending: {
        title: "Waiting for approval",
        p: "The request is still pending. You can edit the requested dates or withdraw the request as long as the owner doesn't approve it.",
    },
    withdrawn: {
        title: "Request has been withdrawn",
        p: "You withdrew this request. You can edit it and request again if you need to do so.",
    },
    approved: {
        title: "Request has been approved",
        p: "The owner has agreed to lend you the tool, don't forget to return it before the due date. Once you return it the owner or an admin will mark the loan as returned.",
    },
    declined: {
        title: "Request has been declined",
        p: "The owner didn't approve of your request. You can edit the requested dates to see if it's available at some other time.",
    },
    returned: {
        title: "Tool returned",
        p: "You have returned this tool. By returning the tools you borrow on time you become a trusted member on this platform.",
    },
};