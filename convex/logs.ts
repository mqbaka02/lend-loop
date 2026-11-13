import { ConvexError, v } from "convex/values";
import { internalMutation } from "./_generated/server";

const channelValidator= v.union(
    v.literal("email"),
    v.literal("discord"),
    v.literal("mock"),
);

export const createNotificationLog= internalMutation({
    args: {
        loanId: v.id("loans"),
        channel: channelValidator,
        idempotencyKey: v.string(),
    },

    handler: async (context, args) => {
        const existing = await context.db.query("logs").withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey)).unique();

        if (existing) {
            //If the status is pending or sent, don't resend it
            if (existing.status!== "failed") {
                return {logId: existing._id, shouldSend: false};
            }

            //First maark the log as pending again
            await context.db.patch("logs", existing._id, {
                status: "pending",
                // lastError: undefined,
            });

            return {
                logId: existing._id,
                shouldSend: true,
            }
        }

        //Write a new log if it doesn't exist yet
        const logId= await context.db.insert("logs", {
            loanId: args.loanId,
            channel: args.channel,
            type: "notification",
            status: "pending",
            createdAt: Date.now(),
            attemptCount: 0,
            idempotencyKey: args.idempotencyKey,
        });

        return {logId, shouldSend: true};
    },
});

export const markNotificationAttempt= internalMutation({
    args: {
        logId: v.id("logs"),
    },

    handler: async (context, args) => {
        const theLog = await context.db.get("logs", args.logId);
        if (!theLog) throw new ConvexError("The notification log is not found!");

        //Don't resend the notification if it's already marked as sent!
        if (theLog.status=== "sent") return;

        await context.db.patch(args.logId, {
            status: "pending",

            //Last attempt is now
            lastAttemptAt: Date.now(),

            //Increment the attempt number
            attemptCount: theLog.attemptCount + 1,

            lastError: undefined,
        });
    },
});

export const finishNotificationAttempt= internalMutation({
    args: {
        logId: v.id("logs"),
        status: v.union(
            v.literal("failed"),
            v.literal("sent"),
        ),
        lastError: v.optional(v.string()),
    },

    handler: async (context, args) => {
        const theLog = await context.db.get("logs", args.logId);
        if (!theLog) throw new ConvexError("The notification log is not found!");

        const now = Date.now();

        await context.db.patch("logs", args.logId, {
            status: args.status,
            ...(args.status === "sent"
                ? { sentAt: now, failedAt: undefined, lastError: undefined }
                : { failedAt: now, lastError: args.lastError ?? "Unknown error" }),
        });
    },
});