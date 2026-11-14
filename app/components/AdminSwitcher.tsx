import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import useRoleContext from "../context/Role";
import { Segmented } from "antd";
import useNotificationContext from "../context/useNotificationContext";

//This only appears when the user is an admin so there is no need to check for adminship during the switch
export default function AdminSwitcher ({mobile}: {mobile?: boolean}) {
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

    
    const getOptionStyles= (value: "admin"|"user")=> {
        const isActive= roleCtx.role===value;
        return {
            labelClass: isActive 
                ? "text-primary font-bold text-[.875rem] inline" 
                : "text-foreground/60 text-[.875rem] inline",
            iconClass: isActive ? 'text-primary' : 'text-foreground-1' 
        };
    };

    const segmentedHeaders= [
        { label: "User", value: "user" },
        { label: "Admin", value: "admin" },
    ]

    const options= segmentedHeaders.map(opt=> {
        const styles= getOptionStyles(opt.value as "admin"|"user");
        return {
            value: opt.value as "admin"|"user",
            label: <div className={styles.labelClass}>{opt.label}</div>,
        };
    });

    return <>{
        isAdmin && isAdmin.value &&
        <Segmented
            size="small"
            options={options}
            onChange={setRole}
            // vertical={mobile}
            className={mobile? "w-max": ""}
        />
    }</>;
};