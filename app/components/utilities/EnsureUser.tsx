"use client";

import useNotificationContext from "@/app/context/useNotificationContext";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";

export default function UserSync () {

    const notification= useNotificationContext();

    const { isLoaded, isSignedIn }= useUser();

    const ensureUser= useMutation(api.users.ensureUser);

    useEffect(()=> {
        if (isLoaded && isSignedIn) ensureUser()
            .then(()=> {
                notification.notificationAPI["success"]({
                    type: "success",
                    title: "You are logged in!",
                    description: "Clerk sign in has succeded."
                });
            })
            .catch(error=> {
                console.error(error);
                notification.notificationAPI["error"]({
                    title: "Error",
                    description: error,
                    type: "error"
                });
            });
    }, [isLoaded, isSignedIn, ensureUser]);

    return null;
};