"use client";

import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "../components/ConvexClientProvider";
import { Suspense, useState } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { NotificationContext, useNewNotif } from "../context/useNotificationContext";
import UserSync from "../components/utilities/EnsureUser";
import { RoleTypeContext } from "../context/Role";

export default function Providers ({children}: {children: React.ReactNode}) {
    const globalNotificationPusher= useNewNotif();
    const [role, setRole]= useState<"admin"|"user">("user");
    return <ClerkProvider>
        <ConvexClientProvider>
            <Suspense fallback={null}>
                <AntdRegistry>
                    <ConfigProvider
                        theme={{
                            token: {
                            colorPrimary: "#004c22",
                            colorSuccess: "#F2F3FF",
                            },
                        }}
                    >
                        <RoleTypeContext.Provider value={{role, setRole}}>
                            <NotificationContext.Provider value={globalNotificationPusher}>
                                {globalNotificationPusher.contextHolder}
                                <UserSync />
                                {children}
                            </NotificationContext.Provider>
                        </RoleTypeContext.Provider>
                    </ConfigProvider>
                </AntdRegistry>
            </Suspense>
        </ConvexClientProvider>
    </ClerkProvider>
};