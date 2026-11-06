"use client";

import { useUser } from "@clerk/nextjs";
import Container from "../components/layout/Container";
import { Button } from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";

export default function Page () {
    const {user}= useUser();
    return <div className="w-full py-[2.5rem]">
        <Container>
            <div className="flex flex-col gap-[2.5rem]">
                <div className="w-full flex items-stretch">
                    <div className="flex flex-col gap-[.25rem] flex-[70]">
                        <div className="font-sans text-[.75rem] tracking-[.038rem] leading-[133%] uppercase">{user?.fullName||user?.username}</div>
                        <h1 className="font-jakarta font-bold text-[2.25rem] text-foreground-1 leading-[122%]">My Activity & Tool Management</h1>
                        <p className="font-sans text-[1rem] balance text-balance leading-[162%]">Manage your shared equipment, track active borrow commitments, and review incoming requests from local neighbors with automated n8n notifications.</p>
                    </div>
                    <div className="w-full h-full flex flex-col self-end justify-end items-end flex-[30]">
                        <Button type="primary" size="large">
                            <div className="flex gap-[.5rem]">
                                <PlusCircleOutlined />
                                List a new tool
                            </div>
                        </Button>
                    </div>
                </div>
            </div>
        </Container>
    </div>;
};