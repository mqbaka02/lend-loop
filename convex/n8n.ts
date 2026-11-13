import { ConvexError, v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

export const sendLoanEvent= internalAction({
    args: {
        eventId: v.string(),
        eventType: v.string(),
        loanId: v.id("loans"),
        recipientId: v.id("users"),
    },

    handler: async (context, args)=> {
        const secret= process.env.N8N_HMAC_SECRET;
        const webhookUrl= process.env.N8N_WEBHOOK_URL;

        if (!secret || !webhookUrl) throw new Error("Missing n8n environment configuration!");

        const details= await context.runQuery(
            internal.n8n.getLoanEventDetails,
            {
                eventType: args.eventType,
                loanId: args.loanId,
                recipientId: args.recipientId,
            }
        );

        const channels= ["email", "discord", "mock"] as const;

        const channelLogs= await Promise.all(
            channels.map(async channel=> {
                //This key is unique per channel and event id
                const idempotencyKey= `${args.eventId}:${channel}`;

                const result= await context.runMutation(
                    internal.logs.createNotificationLog,
                    {
                        loanId: args.loanId,
                        channel: channel,
                        idempotencyKey: idempotencyKey,
                    }
                );

                return {
                    channel,
                    ...result, // {logId, shouldSend}
                    idempotencyKey
                };
            })
        );

        //Filter out the logs that shouldn't be sent
        const channelsToSend= channelLogs.filter(log=> log.shouldSend);

        //No need to do anything if the channelsToSend is empty
        if (channelsToSend.length=== 0) return;

        const payload= JSON.stringify({
            eventId: args.eventId,
            ...details,
            channels: channelsToSend.map(log=> ({logId: log.logId, channel: log.channel, idempotencyKey: log.idempotencyKey})),
        });

        const encoder= new TextEncoder();

        const key= await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            {name: "HMAC", hash: "SHA-256"},
            false,
            ["sign"],
        );

        const signature= await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(payload),
        );

        const hexSignature= Array.from(new Uint8Array(signature))
            .map((byte)=> byte.toString(16).padStart(2, "0"))
            .join("");

        const response= await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-lendloop-signature": hexSignature,
            },
            body: payload,
        });

        if (!response.ok) throw new Error(`n8n webhook failed with status ${response.status}`);
    },
});

export const getLoanEventDetails= internalQuery({
    args: {
        loanId: v.id("loans"),
        recipientId: v.id("users"),
        eventType: v.string(),
    },

    handler: async (context, args) => {
        const theLoan = await context.db.get("loans", args.loanId);
        if (!theLoan) throw new ConvexError("The loan is not found!");

        //Check if the recipiend id corresponds to the borrower or the owner
        if (theLoan.ownerId !== args.recipientId && theLoan.borrowerId !== args.recipientId)
            throw new ConvexError("Invalid recipient");

        const recipient = await context.db.get("users", args.recipientId);
        if (!recipient) throw new ConvexError("Recipient not found!");


        const tool = await context.db.get("tools", theLoan.toolId);
        if (!tool) throw new ConvexError("Tool not found!");

        return {
            eventType: args.eventType,
            loanId: theLoan._id,
            recipientEmail: recipient.email,
            recipientName: recipient.username || recipient.name || "LendLoop user",
            toolName: tool.name,
            startDate: theLoan.startDate,
            endDate: theLoan.endDate,
        };
    },
});