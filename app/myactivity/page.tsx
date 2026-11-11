"use client";

import { PlusCircleOutlined } from "@ant-design/icons";
import { useUser } from "@clerk/nextjs";
import { Button } from "antd";
import Container from "../components/layout/Container";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivityTabs, SegmentedComponent } from "../components/activity/ActivityTabs";
import CreateEditToolModal from "../components/EditToolModal";
import { EditedToolContext } from "../context/EditToolContext";
import useRoleContext from "../context/Role";
import { Tool } from "../types";


export default function Page() {
    const { user, isSignedIn, isLoaded }= useUser();
    const [activeTabKey, setActiveTabKey]= useState<string>("1");
    const [editedTool, setEditedTool]= useState<Tool|null>(null);
    const [editModalShown, setEditModalShown]= useState<boolean>(false);
    const [editCreateModalType, setEditCreateModalType]= useState<"edit"| "create">("edit");

    const {role}= useRoleContext();

    const router= useRouter();
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.replace("/");
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded || !isSignedIn) {
        return null;
    }

    return <div className="w-full py-[2.5rem]">
        <Container>
            <EditedToolContext.Provider
                value={{
                    editedTool: editedTool,
                    setEditedTool: setEditedTool,
                    modalOpen: editModalShown,
                    setModalOpen: setEditModalShown,
                    currentType: editCreateModalType,
                    setCurrentType: setEditCreateModalType
                }}
            >
                <CreateEditToolModal
                    type={editCreateModalType}
                    close={()=> setEditModalShown(false)}
                    open={editModalShown}
                    tool={editedTool}
                    key={`${editCreateModalType}-${editedTool?.id || 'new'}`}
                />
                <div className="flex flex-col gap-[2.5rem]">
                    <div className="w-full flex items-stretch">
                        <div className="flex flex-col gap-[.25rem] flex-[70]">
                            <div className="flex gap-[1rem] items-center">
                                <div className="font-sans text-[.75rem] tracking-[.038rem] leading-[145%] uppercase">{user?.fullName || user?.username}</div>
                                {
                                    role=== "admin" && <div className="flex gap-[.5rem] text-[.5rem] bg-primary text-white uppercase p-[.2rem] px-[.8rem] rounded-sm font-semibold">
                                        Admin Mode
                                    </div>
                                }
                            </div>
                            <h1 className="font-jakarta font-bold text-[2.25rem] text-foreground-1 leading-[122%]">My Activity & Tool Management</h1>
                            <p className="font-sans text-[1rem] balance text-balance leading-[162%]">Manage your shared equipment, track active borrow commitments, and review incoming requests from local neighbors with automated n8n notifications.</p>
                        </div>
                        <div className="w-full h-full flex flex-col self-end justify-end items-end flex-[30]">
                            <Button
                                type="primary"
                                size="large"
                                onClick={()=> {
                                    setEditModalShown(true);
                                    setEditedTool(null);
                                    setEditCreateModalType("create");
                                }}
                            >
                                <div className="flex gap-[.5rem]">
                                    <PlusCircleOutlined />
                                    List a new tool
                                </div>
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-0">
                        <SegmentedComponent setActiveTabKey={setActiveTabKey} />
                        <ActivityTabs activeKey={activeTabKey} />
                    </div>
                </div>
            </EditedToolContext.Provider>
        </Container>
    </div>;
};
