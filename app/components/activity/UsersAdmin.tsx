import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { InfoCircleOutlined, SafetyOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Table, Tooltip } from "antd";
import Search from "antd/es/input/Search";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { TabChildrenContainer } from "./AbstractVirtualizedList";
import UserRender from "./UserRender";
import useNotificationContext from "@/app/context/useNotificationContext";
import { ConvexError } from "convex/values";


type userType = {
    borrowedOnTime: number;
    lendAndReturned: number;
    _id: Id<"users">;
    _creationTime: number;
    clerkUpdatedAt?: number | undefined;
    username?: string | undefined;
    name?: string | undefined;
    imageUrl?: string | undefined;
    clerkId: string;
    isTrusted: boolean;
    role: "user" | "admin";
}

export default function UsersAdmin() {

    const allUsers= useQuery(api.users.getUsersAdmin);

    const [searchValue, setSearchValue] = useState<string>("");
    const filteredUsers = useMemo(() => {
        if (!allUsers) return undefined;
        if (!searchValue) return allUsers;
        return allUsers
            ?.filter((user) => (
                user.name?.toLowerCase().search(searchValue.toLowerCase()) !== -1
                || user.username?.toLowerCase().search(searchValue.toLowerCase())!== -1
            ));
    }, [searchValue, allUsers]);
    const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.currentTarget.value);
    };

    const notifApi= useNotificationContext();

    const toggleTrustship= useMutation(api.users.toggleUserTrustedAdmin);
    const toggleTrusted= (userId: Id<"users">)=> {
        try{
            toggleTrustship({userId: userId})
            .then(()=> {
                notifApi.notificationAPI['success']({
                    title: "Success",
                    description: "Operation has succeded",
                    type: "success"
                });
            }).catch((error)=> {
                if (error instanceof ConvexError) {
                    const data = error.data;
                    notifApi.notificationAPI["error"]({
                        title: "Error!",
                        description: data as string
                    });
                } else {
                    notifApi.notificationAPI["error"]({
                        title: "Error!",
                        description: error.message as string
                    });
                }
            });
        } catch(error) {
            if (error instanceof ConvexError) {
                const data = error.data;
                notifApi.notificationAPI["error"]({
                    title: "Error!",
                    description: data as string
                });
            } else {
                notifApi.notificationAPI["error"]({
                    title: "Error!",
                    description: (error as any).message as string
                });
            }
        }
    };

    return <TabChildrenContainer>
        <div className="flex">
            <div className="flex flex-col gap-[.25rem] grow">
                <h3 className="font-jakarta text-foreground-1 text-[1.25rem] font-semibold grow ">
                    Incoming requests for my tools
                </h3>
            </div>
            <div className="flex items-start">
                <Search
                    placeholder="Filter the requests"
                    size="large"
                    value={searchValue}
                    onChange={onSearchChange}
                />
            </div>
        </div>
        <div className="flex flex-col gap-[1rem] w-full">
            {/* <RequestsTable requests={filteredRequests} /> */}
            <UsersTable users={filteredUsers} toggleTrusted={toggleTrusted} />
        </div>
    </TabChildrenContainer>;
};

const UsersTable = ({users, toggleTrusted}: {
    users: userType[]|undefined,
    toggleTrusted: (id: Id<"users">)=> void
}) => {
    const dataSource = useMemo(()=> users?.map(req => ({
            ...req,
            key: req._id,
        })), [users]);
    return <Table<userType>
        loading={users=== undefined}
        // rowSelection={{
        //     type: "checkbox",
        //     columnWidth: 48, // <-- fixes the huge checkbox column
        // }}
        columns={[
            {
                title: "User",
                dataIndex: "user",
                width: "auto",
                render: (_: unknown, req: userType|undefined) =>
                    <UserRender
                        name={req?.name}
                        username={req?.username}
                        imageUrl={req?.imageUrl}
                        isTrusted={req?.isTrusted}
                        size="large"
                        lastClerkUpdate={req?.clerkUpdatedAt}
                    />,
            },
            {
                title: <div className="flex gap-[.5rem]">
                    Successful loans
                    <Tooltip title="The total number of loans that this user has approved and marked as returned." >
                        <InfoCircleOutlined className="cursor-pointer" />
                    </Tooltip>
                </div>,
                dataIndex: "loans",
                width: 240,
                render: (_: unknown, req: userType|undefined) =>
                    <div className="w-full text-[1.5rem] font-bold text-green-500">{req?.lendAndReturned}</div>,
            },
            {
                title: <div className="flex gap-[.5rem]">
                    Returned loans
                    <Tooltip title="The total number of items that this user has returned on time." >
                        <InfoCircleOutlined className="cursor-pointer" />
                    </Tooltip>
                </div>,
                dataIndex: "borrows",
                width: 240,
                render: (_: unknown, req: userType|undefined) =>
                    <div className="w-full text-[1.5rem] font-bold text-blue-500">{req?.borrowedOnTime}</div>,
            },
            {
                title: "Actions",
                dataIndex: "actions",
                align: "right",
                render: (_: unknown, req: userType|undefined) =>(
                    <ActionsRender
                        user={req}
                        toggleTrusted={toggleTrusted}
                    />
                ),
            },
        ]}
        dataSource={dataSource}
        virtual
        pagination={false}
        scroll={{ x: 1020, y: 600 }}
    />
};


const ActionsRender= ({user, toggleTrusted}: {
    user: userType|undefined,
    toggleTrusted: (id: Id<"users">)=> void
})=> {

    const toggleMe= ()=> {
        if (!user) return;
        toggleTrusted(user?._id);
    };
    
    return <div className="flex w-full justify-end gap-[.5rem]">
        <Popconfirm
            onConfirm={toggleMe}
            title={user?.isTrusted ? "Do you want to mark this user as untrusted?" : "Do you want to mark this user as trusted?"}
            description={user?.isTrusted
                ? <p className="max-w-[15rem]">This will remove the trusted badge on the user's profile.</p>
                : <p className="max-w-[15rem]">Trusted users are those who returned borrowed items on time and mark loans as returned correctely when the borrower returns them.</p>
            }
            okText={"Proceed"}
            okType={user?.isTrusted ? "danger": "primary"}
        >
            <Button icon={<SafetyOutlined />} danger={user?.isTrusted}>{user?.isTrusted? "Unmark": "Mark"} Trusted</Button>
        </Popconfirm>
    </div>;
};