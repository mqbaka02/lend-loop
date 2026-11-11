import useEditedToolContext from "@/app/context/EditToolContext";
import useRoleContext from "@/app/context/Role";
import useNotificationContext from "@/app/context/useNotificationContext";
import { Tool } from "@/app/types";
import { conditionTypeColors } from "@/app/utils/conditioncolors";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined, SafetyOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Empty, Listy, Popconfirm, Skeleton } from "antd";
import Search from "antd/es/input/Search";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import Image from "next/image";

type listingType = {
    name: string;
    category: string;
    categoryId: Id<"categories">;
    owner: {
        isTrusted: boolean;
        name: string | undefined;
        imageUrl: string | undefined;
        username: string | undefined;
    } | null;
    condition: "new" | "good" | "fair" | "poor";
    desc: string | undefined;
    image: Id<"_storage"> | undefined;
    date: number;
    isAvailable: boolean;
    id: Id<"tools">;
};

export default function ListingsGeneric({listings, onSearchChange, texts}: {
    listings: listingType[] |undefined,
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    texts: {
        title: string,
        searchPlaceholder: string,
    }
}) {

    const {setModalOpen, setEditedTool, setCurrentType}= useEditedToolContext();

    const editToolDetails= (tool: Tool)=> {
        setEditedTool(tool);
        setModalOpen(true);
        setCurrentType("edit");
    };
    
    const deleteTool= useMutation(api.tools.deleteTool);

    const notifApi= useNotificationContext();

    const deleteSingleTool = (toolId: Id<"tools">) => {
        try {
            deleteTool({ toolId: toolId })
                .then(() => {
                    notifApi.notificationAPI['success']({
                        title: "Tool deleted",
                        description: "The tool has been wiped out in the database. All loans related to it will be deleted as well.",
                        type: "success"
                    });
                })
                .catch((error) => {
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
        } catch (error) {
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
                    {texts.title}
                </h3>
            </div>
            <div className="flex items-start">
                <Search
                    placeholder={texts.searchPlaceholder}
                    size="large"
                    onChange={onSearchChange}
                />
            </div>
        </div>
        <div className="flex flex-col gap-[1rem] w-full">
            {
                listings ?
                    <>
                        {/* {listings.map(tool => <SingleListing tool={tool} key={tool.id} editTool={editToolDetails} deleteTool={deleteSingleTool} />)} */}
                        <Listy<listingType>
                            items={listings}
                            rowKey={"id"}
                            itemRender={(item)=> <SingleListing tool={item} editTool={editToolDetails} deleteTool={deleteSingleTool} />}
                        />
                    </>
                    :
                    <ListingSkeletons />
            }
            {
                listings && listings.length === 0 && <div className="w-full flex flex-col items-center justify-center gap-[1.5rem]">
                    <Empty />
                    <Button type="primary" size="large" onClick={() => { setModalOpen(true); setCurrentType("create"); }}>
                        <div className="flex gap-[.5rem]">
                            <PlusCircleOutlined />
                            List a new tool
                        </div>
                    </Button>
                </div>
            }
        </div>
    </TabChildrenContainer>;
};


export const TabChildrenContainer= ({children}: {children: React.ReactNode})=> {
    return <div className="flex flex-col gap-0 py-[1.5rem] w-full">
        <div className="flex flex-col gap-[1.5rem]">
            {children}
        </div>
    </div>;
};

const SingleListing= ({tool, editTool, deleteTool}: {
    tool: Tool,
    editTool: (tool: Tool)=> void,
    deleteTool: (toolId: Id<"tools">)=> void
})=> {
    const roleCTX= useRoleContext();

    return <div className="flex gap-[1rem] p-[1.5rem] bg-white rounded-xl w-full">
        <div className="w-[6rem] h-[6rem] rounded-md overflow-hidden">
            <Image src={tool.image || "/placeholder.svg"} alt={tool.name + " image"} width={200} height={200} className="object-cover h-full" />
        </div>
        <div className="flex flex-col gap-[.25rem] overflow-hidden grow">
            <div className="flex gap-[.25rem]">
                <div className="bg-light-blue p-[.125rem] px-[.5rem] rounded-full text-foreground-1 text-[.75rem] font-semibold capitalize">{tool.category}</div>

                <div className="rounded-full flex gap-[.25rem] items-center px-[1rem] py-[.125rem] text-primary font-semibold text-[.75rem] w-max tracking-[0.038rem] capitalize" style={{ background: conditionTypeColors[tool?.condition || "good"] }}>
                    {tool?.condition || "Good"}
                </div>
                {
                    tool.isAvailable ? <div className="rounded-full bg-secondary flex gap-[.25rem] items-center px-[1rem] py-[.125rem] text-primary font-semibold text-[.75rem] w-max tracking-[0.038rem]">
                        <div className="w-[.5rem] h-[.5rem] rounded-full bg-primary"></div>
                        Available
                    </div>
                    :

                    <div className="rounded-full bg-red-500/20 flex gap-[.25rem] items-center px-[1rem] py-[.125rem] text-red-500 font-semibold text-[.75rem] w-max tracking-[0.038rem]">
                        <div className="w-[.5rem] h-[.5rem] rounded-full bg-red-500"></div>
                        Unavailable
                    </div>
                }
            </div>
            <h6 className="font-jakarta text-[1.25rem] text-foreground font-semibold">{tool.name}</h6>
            <p className="font-sans w-full truncate text-foreground text-[.875rem]">{tool.desc}</p>
            {
                roleCTX.role === "admin" &&

                <div className="flex gap-[.5rem] items-center font-sans font-semibold text-[.75rem] text-primary">
                    <div className="flex gap-[.25rem] items-center">
                        <UserOutlined />
                        <span>Owner:</span>
                    </div>
                    <div className="">{tool.owner?.name || "Unknown user"}</div>
                    {
                        tool.owner?.isTrusted &&
                        <div className="rounded-full bg-secondary flex gap-[.25rem] items-center px-[1rem] py-[.125rem] text-primary font-semibold text-[.75rem] w-max tracking-[0.038rem]">
                            <SafetyOutlined />
                            Trusted
                        </div>
                    }
                </div>
            }
        </div>
        <div className="w-max flex gap-[.5rem] h-full">
            <Button icon={<EditOutlined />} onClick={()=> editTool(tool)} >Edit</Button>
            <Popconfirm
                title={"Delete " + tool.name + "?"}
                description={<p className="max-w-[15rem]">This action cannot be reverted. once you delete a tool, it's final.</p>}
                okType="danger"
                okText="Delete"
                align={{points: ["br", "tr"]}}
                onConfirm={()=> deleteTool(tool.id)}
            >
                <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
        </div>
    </div>;
};

export const ListingSkeletons= ()=> {
    return <>
        <SingleListingSkeleton />
        <SingleListingSkeleton />
        <SingleListingSkeleton />
    </>;
};

const SingleListingSkeleton= ()=> {
    return  <div className="flex gap-[1rem] p-[1.5rem] bg-white rounded-xl w-full">
        <Skeleton.Image active style={{width: 100, height: 100}} />
        <Skeleton active />
    </div>;
}
