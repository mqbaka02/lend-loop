import { GetProp, Segmented, SegmentedProps, Tabs, TabsProps } from "antd";
import MyBorrowRequests from "./BorrowRequests";
import IncomingRequests from "./IncomingRequests";
import MyListings from "./Listings";
import { BarsOutlined, ContainerOutlined, InboxOutlined, UserOutlined } from "@ant-design/icons";
import { SetStateAction, useState } from "react";
import useRoleContext from "@/app/context/Role";
import ListingsAdmin from "./ListingsAdmin";
import BorrowRequestsAdmin from "./BorrowRequestsAdmin";
import UsersAdmin from "./UsersAdmin";

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
export function SegmentedComponent({setActiveTabKey}: {setActiveTabKey: React.Dispatch<SetStateAction<string>>}) {
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

    const roleCTX= useRoleContext();

    const segmentedHeaders= roleCTX.role==="admin"
    ? [
        { value: 1, label: 'All Listed Tools', Icon: BarsOutlined },
        { value: 2, label: 'All Borrow Requests', Icon: ContainerOutlined },
        { value: 3, label: 'Users', Icon: UserOutlined },
    ]
    : [
        { value: 1, label: 'My Listings', Icon: BarsOutlined },
        { value: 2, label: 'My Borrow Requests', Icon: ContainerOutlined },
        { value: 3, label: 'Incoming Requests', Icon: InboxOutlined },
    ]

    const options= segmentedHeaders.map(opt=> {
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


export function ActivityTabs({activeKey}: {activeKey: string}) {
    const roleCTX= useRoleContext();

    const items: TabsProps['items'] = roleCTX.role==="admin"
    ? [
        {
            key: '1',
            label: 'All Listed Tools',
            children: <ListingsAdmin />,
        },
        {
            key: '2',
            label: 'All Borrow Requests',
            children: <BorrowRequestsAdmin />,
        },
        {
            key: '3',
            label: 'All Users',
            children: <UsersAdmin />,
        },
    ]
    : [
        {
            key: '1',
            label: 'My listings',
            children: <MyListings />,
        },
        {
            key: '2',
            label: 'My borrow requests',
            children: <MyBorrowRequests />,
        },
        {
            key: '3',
            label: 'Incoming requests',
            children: <IncomingRequests />,
        },
    ];
    return <Tabs
        items={items}
        renderTabBar={()=> <></>}
        activeKey={activeKey}
    />
};