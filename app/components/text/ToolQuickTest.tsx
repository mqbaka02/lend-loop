"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useNotificationContext from "@/app/context/useNotificationContext";
import { Select } from "antd";

export default function ToolTest() {
    const [name, setName] = useState("");
    const [categID, setCategId]= useState("");

    const createTool = useMutation(api.tools.createTool);
    const categIds= useQuery(api.categories.getCategories);

    const notifAPI= useNotificationContext();

    async function handleCreate() {
        try {
            const id = await createTool({
                name,
                category: categID as Id<"categories">,
                condition: "good"
            });

            console.log("Created tool:", id);
            notifAPI.notificationAPI["success"]({
                title: "Tool created",
                description: "Tool id: " + id,
                type: "success",
            });
            setName("");
        } catch (error) {
            console.error(error);
            notifAPI.notificationAPI["error"]({
                title: "Failed",
                description: error as string,
                type: "error",
            });
        }
    }

    return (
        <div>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tool name"
            />
            <Select
                allowClear
                value={categID}
                onChange={(e)=> {setCategId(e); /*console.log(`selected: ${e}`)*/}}
                options={categIds?.map(c=> ({label: c.name, value: c.id}))}
                popupMatchSelectWidth={false}
            ></Select>

            <button onClick={handleCreate}>
                Create tool
            </button>
        </div>
    );
};