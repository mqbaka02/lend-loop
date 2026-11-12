import { Triggers } from "convex-helpers/server/triggers";
import { DataModel } from "./_generated/dataModel";
import { returnedByBorrower, returnedByOwner } from "./aggregates";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";

import {
    mutation as rawMutation,
    internalMutation as rawInternalMutation,
} from "./_generated/server";

const triggers= new Triggers<DataModel>();

triggers.register("loans", returnedByBorrower.idempotentTrigger());
triggers.register("loans", returnedByOwner.idempotentTrigger());

export const mutation= customMutation(
    rawMutation,
    customCtx(triggers.wrapDB),
);

export const internalMutation= customMutation(
    rawInternalMutation,
    customCtx(triggers.wrapDB),
);

