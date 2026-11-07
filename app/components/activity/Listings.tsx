import useEditedToolContext from "@/app/context/EditToolContext";
import { Tool } from "@/app/types";
import { conditionTypeColors } from "@/app/utils/conditioncolors";
import { api } from "@/convex/_generated/api";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Empty } from "antd";
import Search from "antd/es/input/Search";
import { useQuery } from "convex/react";
import Image from "next/image";

export const TabChildrenContainer= ({children}: {children: React.ReactNode})=> {
    return <div className="flex flex-col gap-0 py-[1.5rem] w-full">
        <div className="flex flex-col gap-[1.5rem]">
            {children}
        </div>
    </div>;
};

export default function MyListings() {

    const listings= useQuery(api.tools.getMyTools, {});

    const {setModalOpen}= useEditedToolContext();

    return <TabChildrenContainer>
        <Search
            placeholder="Filter my listings"
        />
        <div className="flex flex-col gap-[1rem] w-full">
            {
                listings?
                <>
                {listings.map(tool=> <SingleListing tool={tool} key={tool.id}/>)}
                </>
                :
                <></>
            }
            {
                listings && listings.length===0 && <div className="w-full flex flex-col items-center justify-center gap-[1.5rem]">
                    <Empty />
                    <Button type="primary" size="large" onClick={()=> setModalOpen(true)}>
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

const SingleListing= ({tool}: {tool: Tool})=> {
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
        </div>
        <div className="w-max flex gap-[.5rem] h-full">
            <Button icon={<EditOutlined />} >Edit</Button>
            <Button icon={<DeleteOutlined />} danger />
        </div>
    </div>;
};
