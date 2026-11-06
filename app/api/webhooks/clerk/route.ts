import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "@/convex/_generated/api";
import { NextRequest } from "next/server";
import { FunctionReference } from "convex/server";

export async function POST(req: NextRequest) {
    // 1. Verify Clerk's signature
    let evt;

    try {
        evt = await verifyWebhook(req);
    } catch (error) {
        console.error("Webhook verification failed:", error);
        return new Response("Invalid signature", { status: 400 });
    }

    // 2. Ignore events we don't handle
    if (
        evt.type !== "user.created" &&
        evt.type !== "user.updated"
    ) {
        return new Response("Event ignored", { status: 200 });
    }

    // 3. Extract profile information
    const user = evt.data;

    const name = [
        user.first_name,
        user.last_name,
    ].filter(Boolean).join(" ") || undefined;

    // 4. Connect to Convex
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const deployKey = process.env.CONVEX_WEBHOOK_DEPLOY_KEY;

    if (!convexUrl || !deployKey) {
        console.error("Missing Convex webhook environment variables");
        return new Response("Server configuration error", { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    (convex as any).setAdminAuth(deployKey);

    // 5. Synchronize the user
    try {
        // await convex.mutation(internal.users.syncFromClerk, {
        //     clerkId: user.id,
        //     name,
        //     username: user.username ?? undefined,
        //     imageUrl: user.image_url ?? undefined,
        //     clerkUpdatedAt: user.updated_at,
        // });
        await convex.mutation(
            internal.users.syncFromClerk as unknown as FunctionReference<"mutation">,
                {
                    clerkId: user.id,
                    name,
                    username: user.username ?? undefined,
                    imageUrl: user.image_url ?? undefined,
                    clerkUpdatedAt: user.updated_at,
                }
        );

        return Response.json({ success: true });
    } catch (error) {
        console.error("Convex synchronization failed:", error);

        // Return 500 so Clerk retries the webhook.
        return new Response("Synchronization failed", { status: 500 });
    }
}