import { NotificationInstance } from "antd/es/notification/interface";
import useNotification from "antd/es/notification/useNotification";
import { createContext, useContext } from "react";

type notifType= {
    notificationAPI: NotificationInstance,
    contextHolder: React.ReactElement,
};

export const NotificationContext= createContext<notifType | null>(null);

export default function useNotificationContext () {
    const ctx= useContext(NotificationContext);
    if (!ctx) throw new Error("Context missing!");

    return ctx;
};

export const useNewNotif= ()=> {
    const [api, contextHolder]= useNotification();

    return {notificationAPI: api, contextHolder: contextHolder};
};