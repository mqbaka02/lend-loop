import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { v } from "convex/values";
import { parse } from "convex-helpers/validators";
import { internal } from "./_generated/api";

const http= httpRouter();

http.route({
    path: "/n8n/notification-log",
    method: "POST",

    handler: httpAction(async (context, request)=> {
        const secret= process.env.N8N_CALLBACK_SECRET;

        if (!secret) return new Response(
            "Server configuration error: Environment variable missing!",
            {status: 500},
        );

        if (request.headers.get("authorization")!== `Bearer ${secret}`)
            return new Response("Unauthorized", {status: 401});

        let body;

        try {
            body= await request.json();
        } catch {
            return new Response("Invalid JSON!", {status: 400});
        }

        let parsed;

        try{
            parsed= parse(v.object({
                logId: v.id("logs"),
                status: v.union(
                    v.literal("pending"),
                    v.literal("sent"),
                    v.literal("failed"),
                ),
                lastError: v.optional(v.string()),
            }), body);
        } catch {
            return new Response("Invalid payload!", {status: 400});
        }

        try{
            const {logId, status, lastError}= parsed;

            if (status=== "pending")
                await context.runMutation(internal.logs.markNotificationAttempt, {logId});

            else
                await context.runMutation(internal.logs.finishNotificationAttempt, {logId, status, lastError});

            return Response.json({success: true});
        } catch {
            return new Response("Failed to update notification log!", {status: 500});
        }
    }),
});

http.route({
    path: "/n8n/overdue-loans",
    method: "POST",

    handler: httpAction(async (context, request)=> {
        
        const secret= process.env.N8N_CALLBACK_SECRET;

        if (!secret) return new Response(
            "Server configuration error: Environment variable missing!",
            { status: 500 },
        );

        if (request.headers.get("authorization") !== `Bearer ${secret}`)
            return new Response("Unauthorized", { status: 401 });

        try {
            const overdueLoans = await context.runQuery(internal.reminders.getOverdueLoans, {});
            const now = Date.now();
            const dateParts = new Intl.DateTimeFormat("en-CA", {
                timeZone: "Indian/Antananarivo",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).formatToParts(now);

            const date= Object.fromEntries(
                dateParts.map(({type, value})=> [type, value])
            );
            const reminderDate= `${date.year}-${date.month}-${date.day}`;// I'm pretty sure there is a JS API for this
            const channels= ["email", "discord", "mock"] as const;

            const results= [];

            for (const loan of overdueLoans){
                const channelLogs= await Promise.all(
                    channels.map(async (channel)=> {
                        const result= await context.runMutation(
                            internal.logs.createReminderLog,
                            {
                                loanId: loan.loanId,
                                channel,
                                reminderDate
                            },
                        );

                        return {
                            channel,
                            logId: result.logId,
                            idempotencyKey: `reminder:${loan.loanId}:${reminderDate}:${channel}`,
                            shouldSend: result.shouldSend
                        };
                    })
                );

                //Only send those who should be sent
                const channelsToSend= channelLogs.filter(log=> log.shouldSend);
                if (channelsToSend.length> 0){
                    results.push({
                        ...loan,
                        eventType: "overdue_loans",
                        channels: channelsToSend,
                    });
                }
            }

            return Response.json(results);
        } catch {
            return new Response("Failed to fetch overdue loans!", {status: 500});
        }
    }),
});

export default http;