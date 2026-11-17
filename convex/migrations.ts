import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

import {
    returnedByBorrower,
    returnedByOwner,
} from "./aggregates";

export const migrations = new Migrations<DataModel>(
    components.migrations,
);

export const backfillLoanAggregates = migrations.define({
    table: "loans",

    migrateOne: async (ctx, loan) => {
        await returnedByBorrower.insertIfDoesNotExist(ctx, loan);
        await returnedByOwner.insertIfDoesNotExist(ctx, loan);
    },
});

// export const runLoanAggregateBackfill = migrations.runner(
//   internal.migrations.backfillLoanAggregates,
// );
