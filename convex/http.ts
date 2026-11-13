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

export default http;