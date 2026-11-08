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