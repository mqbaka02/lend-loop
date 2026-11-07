"use client";

import { useUser } from "@clerk/nextjs";
import Container from "../components/layout/Container";
import { Button, Segmented, Tabs } from "antd";
import { BarsOutlined, ContainerOutlined, EyeOutlined, InboxOutlined, PlusCircleOutlined } from "@ant-design/icons";

import type { GetProp, SegmentedProps, TabsProps } from 'antd';
import { SetStateAction, useState } from "react";
import MyListings from "../components/activity/Listings";
import useEditedToolContext, { EditedToolContext } from "../context/EditToolContext";
import { Tool } from "../types";
import CreateEditToolModal from "../components/EditToolModal";




export default function Page() {
    const { user }= useUser();
    const [activeTabKey, setActiveTabKey]= useState<string>("1");
    const [editedTool, setEditedTool]= useState<Tool|null>(null);
    const [editModalShown, setEditModalShown]= useState<boolean>(false);

    return <div className="w-full py-[2.5rem]">
        <Container>
            <EditedToolContext.Provider value={{editedTool: editedTool, setEditedTool: setEditedTool, modalOpen: editModalShown, setModalOpen: setEditModalShown}}>
                <CreateEditToolModal type="edit" close={()=> setEditModalShown(false)} open={editModalShown} tool={null} />
                <div className="flex flex-col gap-[2.5rem]">
                    <div className="w-full flex items-stretch">
                        <div className="flex flex-col gap-[.25rem] flex-[70]">
                            <div className="font-sans text-[.75rem] tracking-[.038rem] leading-[133%] uppercase">{user?.fullName || user?.username}</div>
                            <h1 className="font-jakarta font-bold text-[2.25rem] text-foreground-1 leading-[122%]">My Activity & Tool Management</h1>
                            <p className="font-sans text-[1rem] balance text-balance leading-[162%]">Manage your shared equipment, track active borrow commitments, and review incoming requests from local neighbors with automated n8n notifications.</p>
                        </div>
                        <div className="w-full h-full flex flex-col self-end justify-end items-end flex-[30]">
                            <Button type="primary" size="large" onClick={()=> setEditModalShown(true)}>
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


const styleFn: SegmentedProps['styles']= (info): GetProp<SegmentedProps, 'styles', 'Return'>=> {
    if (true) {
        return {
            root: {
                padding: 4,
            },
            icon: {
            },
            item: {
                textAlign: 'start',
            },
        };
    }
};
function SegmentedComponent({setActiveTabKey}: {setActiveTabKey: React.Dispatch<SetStateAction<string>>}) {
    const [activeValue, setActiveValue]= useState<string | number>(1);

    const getOptionStyles= (value: number)=> {
        const isActive= activeValue=== value;
        return {
            labelClass: isActive 
                ? "text-primary font-bold text-[.875rem] inline" 
                : "text-foreground-1 font-semibold text-[.875rem] inline",
            iconClass: isActive ? 'text-primary' : 'text-foreground-1' 
        };
    };

    const options= [
        { value: 1, label: 'My Listings', Icon: BarsOutlined },
        { value: 2, label: 'My Borrow Requests', Icon: ContainerOutlined },
        { value: 3, label: 'Incoming Requests', Icon: InboxOutlined },
    ].map(opt=> {
        const styles= getOptionStyles(opt.value);
        return {
            value: opt.value,
            icon: <opt.Icon className={styles.iconClass} />,
            label: <div className={styles.labelClass}>{opt.label}</div>,
        };
    });

    const onChange= (value: string | number)=> {
        setActiveValue(value);
        setActiveTabKey(String(value));
    }

    return (
        <Segmented
            size="large"
            value={activeValue}
            onChange={onChange}
            styles={styleFn}
            // {...segmentedSharedProps}
            options={options}
        />
    );
};


function ActivityTabs({activeKey}: {activeKey: string}) {
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Tab 1',
            children: <MyListings />,
        },
        {
            key: '2',
            label: 'Tab 2',
            children: 'Content of Tab Pane 2',
        },
        {
            key: '3',
            label: 'Tab 3',
            children: 'Content of Tab Pane 3',
        },
    ];
    return <Tabs
        items={items}
        renderTabBar={()=> <></>}
        activeKey={activeKey}
    />
};