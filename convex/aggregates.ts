import { TableAggregate } from "@convex-dev/aggregate";
import { DataModel, Id } from "./_generated/dataModel";
import { components } from "./_generated/api";

//Count all loans requested and returned by the user
export const returnedByBorrower= new TableAggregate<{
    Key: [string, Id<"users">];
    DataModel: DataModel;
    TableName: "loans";
}>(components.returnedByBorrower, {
    sortKey: (loan)=>
        [
            loan.status=== "returned"
            && loan.returnedAt!== undefined
            && loan.returnedAt<= loan.endDate
                ? "returned-on-time"
                : "other",
            loan.borrowerId
        ],
});

//Counts all loans approved by and marked as returned by an user
export const returnedByOwner= new TableAggregate<{
    Key: [string, Id<"users">];
    DataModel: DataModel;
    TableName: "loans";
}>(components.returnedByOwner, {
    sortKey: (loan)=>
        [
            loan.status=== "returned"
            ? "returned"
            : "other",
            loan.ownerId
        ],
});