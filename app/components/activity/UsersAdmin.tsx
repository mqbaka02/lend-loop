import { api } from "@/convex/_generated/api";
import Search from "antd/es/input/Search";
import { useQuery } from "convex/react";
import RequestsTable from "./RequestTable";
import { useMemo, useState } from "react";
import { TabChildrenContainer } from "./AbstractVirtualizedList";
import UserRender from "./UserRender";
import { Id } from "@/convex/_generated/dataModel";
import { Table } from "antd";


type userType = {
    _id: Id<"users">;
    _creationTime: number;
    clerkUpdatedAt?: number | undefined;
    username?: string | undefined;
    name?: string | undefined;
    imageUrl?: string | undefined;
    clerkId: string;
    isTrusted: boolean;
    role: "user" | "admin";
};

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
            <UsersTable users={filteredUsers} />
        </div>
    </TabChildrenContainer>;
};

const UsersTable = ({users}: {
    users: userType[]|undefined,
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
                width: 240,
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
        ]}
        dataSource={dataSource}
        virtual
        pagination={false}
        scroll={{ x: 1020, y: 600 }} // x≈ sum of widths (48 + 240 + 260 + 140 + 220 + 160 = 1068)
    />
};