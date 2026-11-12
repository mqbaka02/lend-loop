import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import useRoleContext from "../context/Role";
import { Segmented } from "antd";
import useNotificationContext from "../context/useNotificationContext";

//This only appears when the user is an admin so there is no need to check for adminship during the switch
export default function AdminSwitcher () {
    const isAdmin = useQuery(api.users.isAdmin);
    const roleCtx = useRoleContext();

    const notifApi= useNotificationContext();
    
    const setRole= (value: "admin"|"user")=> {
        roleCtx.setRole(value);
        if (value==="admin") {
            notifApi.notificationAPI["success"]({
                title: "You are in Admin mode",
                description: "You can now perform admin tasks.",
                duration: 10
            });
        } else {
            notifApi.notificationAPI["success"]({
                title: "You left Admin mode",
                description: "You are now acting as a regular user.",
                duration: 10
            });
        }
    };

    return <>{
        isAdmin && isAdmin.value &&
        <Segmented
            size="small"
            options={[
                { label: "User", value: "user" },
                { label: "Admin", value: "admin" },
            ]}
            onChange={setRole}
        />
    }</>;
};