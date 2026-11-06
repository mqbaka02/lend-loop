import { EyeInvisibleOutlined, LoadingOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { SignInButton } from "@clerk/nextjs";
import { Button, Empty, Result, Skeleton, Spin } from "antd";
import Image from "next/image";
import { Tool } from "../types";
import { PaginationStatus, useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Fragment, useState } from 'react';
import { Id } from "@/convex/_generated/dataModel";
import Search from "antd/es/input/Search";
import BorrowModal from "./BorrowModal";
import useBorrowedToolContext, { BorrowedToolContext } from "../context/BorrowedToolContext";

type PaginatedToolsGridProps<T>= {
    results: T[],
    status: PaginationStatus,
    loadMore: (numItems: number)=> void,
    getKey: (item: T)=> string,
    renderItem: (item: T)=> React.ReactNode,
    pageSize?: number,
};

const PAGE_SIZE= 10; //Lets make it a constant for now...


export default function AuthCheckedToolsList ({activeCategory}: {activeCategory: string}) {
    const {isLoading, isAuthenticated}= useConvexAuth();

    if (isLoading) {
        return <div className="w-full">
            <Result
                status={"info"}
                title="Convex is syncing..."
                icon={<Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />}
            />
        </div>;
    }

    return isAuthenticated ?
        <ToolslistPrivate activeCategory={activeCategory} />
        :
        <ToolsListPublic activeCategory={activeCategory} />;
};

function PaginatedToolGrid<T>({results, status, loadMore, getKey, renderItem, pageSize= PAGE_SIZE}: PaginatedToolsGridProps<T>){
    return <div className="flex flex-col gap-[1rem]">
            <div className="flex flex-wrap gap-[1.5rem]">
            {
                status=== "LoadingFirstPage" ?
                <ToolCardSkeletons />
                :
                results.map(tool=> <Fragment key={getKey(tool)} >{renderItem(tool)}</Fragment>)
            }
            {
                results.length=== 0 && <Empty description="No tools are registered yet" />
            }
            {
                status=== "LoadingMore" && <ToolCardSkeletons />
            }
            {/*
                status=== "Exhausted" && <p className="text-foreground">No more tools</p>
            */}
        </div>
            {
                status=== "CanLoadMore"? <Button loading={false} onClick={()=> loadMore(pageSize)} style={{width: "max-content"}} type="primary">Load more</Button> :
                status=== "LoadingMore" && <Button loading={true} disabled style={{width: "max-content"}} >Loading more</Button>
            }
    </div>;
};

const ToolslistPrivate= ({activeCategory}: {activeCategory: string})=> {
    const {results, status, loadMore}= usePaginatedQuery(
        api.tools.getTools,
        {
            category: activeCategory!=="" ? activeCategory as Id<"categories"> : undefined,
        },
        {
            initialNumItems: PAGE_SIZE
        },
    );

    const [borrowModalOpen, setBorrowModalOpen]= useState<boolean>(false);
    const [borrowedTool, setBorrowedTool]= useState<Tool|null>(null);

    return <BorrowedToolContext.Provider
        value={{
            borrowedTool: borrowedTool, setBorrowedTool: setBorrowedTool,
            modalOpen: borrowModalOpen, setModalOpen: setBorrowModalOpen
        }}
    >
        <BorrowModal
            isOpen={borrowModalOpen}
            onClose={()=> {setBorrowModalOpen(false)}}
        />
        <PaginatedToolGrid
            results={results}
            getKey={item=> item.id}
            status={status}
            loadMore={loadMore}
            renderItem={item=> <ToolCard tool={item}/>}
        />
    </BorrowedToolContext.Provider>;
};

function ToolsListPublic ({activeCategory}: {activeCategory: string}) {
    const {results, status, loadMore}= usePaginatedQuery(
        api.tools.getPublicTools,
        {
            category: activeCategory!=="" ? activeCategory as Id<"categories"> : undefined,
        },
        {
            initialNumItems: PAGE_SIZE,
        }
    );

    return <PaginatedToolGrid
        results={results}
        getKey={item=> item.id}
        status={status}
        loadMore={loadMore}
        renderItem={item=> <ToolCardPublic tool={item}/>}
    />;
};

export const CategorySelector= ({selectCategory, activeCategory}: {selectCategory: (id: string)=> void, activeCategory: string})=> {

    const categories= useQuery(api.categories.getCategories);

    return <div className="flex flex-col gap-[.25rem]">
        <h3 className="text-foreground-1 text-[2.25rem] font-bold font-jakarta">Community Tool Inventory</h3>
        <p className="text-foreground">Browse tools currently registered across nearby local clusters.</p>
        <Search size="large" placeholder="Search by equipment name (e.g., drill, tiller, tent, mixer)..." />
        <div className="flex flex-wrap gap-[.25rem]">
            <CategoryBullet name="All categories" clickHandler={() => { selectCategory("") }} active={activeCategory === ""} />
            {
                categories=== undefined ?
                <>
                <Skeleton.Button active size="middle" shape="round" />
                <Skeleton.Button active size="middle" shape="round" />
                <Skeleton.Button active size="middle" shape="round" />
                <Skeleton.Button active size="middle" shape="round" />
                </>
                :
                categories?.map(category => <CategoryBullet name={category.name} clickHandler={() => { selectCategory(category.id) }} key={category.id} active={activeCategory === category.id} />)
            }
        </div>
    </div>;
};

const CategoryBullet= ({name, active= false, clickHandler}: {name: string, active?: boolean, clickHandler: ()=> void})=> {
    return <div className={`${active? 'bg-primary text-white' : 'bg-pale-blue text-foreground-1'} cursor-pointer text-[.75rem] font-semibold py-[.375rem] px-[1.25rem] rounded-full transition duration-300`} onClick={clickHandler}>{name}</div>;
};

const ToolCard = ({ tool }: { tool: Tool }) => {
    const {setBorrowedTool, setModalOpen}= useBorrowedToolContext();

    const openModal= ()=> {
        setBorrowedTool(tool);
        setModalOpen(true);
    };

    return <div className="bg-white rounded-md p-[1rem] flex flex-col gap-[.5rem] min-w-[20rem] max-w-[25rem] grow w-full">
        <div className="w-full relative">
            <Image src={tool.image ?? "/placeholder.svg"} alt={tool.name + " image"} width={200} height={150} className="w-full rounded-md" />
            <div className="absolute top-[1rem] left-[1rem] bg-white text-primary font-semibold tracking-[.019rem] rounded-full p-[.5rem] py-[.125rem]">{tool.category}</div>
        </div>
        {
            tool.isAvailable ? <div className="rounded-full bg-secondary flex gap-[.25rem] items-center px-[1rem] py-[.25rem] text-primary font-semibold leading-[.875rem] text-[.75rem] w-max tracking-[0.038rem]">
                <div className="w-[.5rem] h-[.5rem] rounded-full bg-primary"></div>
                Available
            </div>
            :

            <div className="rounded-full bg-red-500/20 flex gap-[.25rem] items-center px-[1rem] py-[.25rem] text-primary font-semibold leading-[.875rem] text-[.75rem] w-max tracking-[0.038rem]">
                <div className="w-[.5rem] h-[.5rem] rounded-full bg-red-500"></div>
                Unavailable
            </div>
        }
        <h6 className="text-[1.25rem] font-semibold leading-[140%]">{tool.name}</h6>
        <div className="flex gap-[.25rem] items-center justify-start w-full truncate p-[.5rem] rounded-md bg-pale-blue text-foreground text-[.75rem]">
            <UserOutlined />
            Owner: {tool.owner?.name || tool.owner?.username || "Unnamed user"}
        </div>
        <Button type="primary" className="w-full" onClick={openModal}>Borrow</Button>
    </div>;
};

const ToolCardSkeletons= ()=> {
    return <>
        <ToolCardSkeleton />
        <ToolCardSkeleton />
        <ToolCardSkeleton />
    </>;
}

const ToolCardSkeleton = () => {
    return <div className="bg-white rounded-md p-[1rem] flex flex-col gap-[.5rem] min-w-[20rem] max-w-[25rem] grow w-full">
        <Skeleton.Image active style={{width: "100%", height: 200}} />
        <Skeleton active />
    </div>;
};

const ToolCardPublic = ({ tool }: { tool: {name: string, category: string, id: string, image?: string} }) => {
    return <div className="bg-white rounded-md p-[1rem] flex flex-col gap-[.5rem] min-w-[20rem] max-w-[25rem] grow w-full">
        <div className="w-full relative">
            <Image src={tool.image ?? "/placeholder.svg"} alt={tool.name + " image"} width={200} height={150} className="w-full rounded-md" />
            <div className="absolute top-[1rem] left-[1rem] bg-white text-primary font-semibold tracking-[.019rem] rounded-full p-[.5rem] py-[.125rem]">{tool.category}</div>
        </div>
        <h6 className="text-[1.25rem] font-semibold leading-[140%]">{tool.name}</h6>
        <div className="flex gap-[.25rem] items-center justify-start w-full truncate p-[.5rem] rounded-md bg-pale-blue text-foreground text-[.75rem]">
            <EyeInvisibleOutlined />
            Owner: (Private)
        </div>
        <SignInButton mode="modal">
            <Button type="primary" className="w-full">
                <div className="flex gap-[.25rem] items-center">
                    <LockOutlined />
                    Sign in to borrow
                </div>
            </Button>
        </SignInButton>
    </div>;
};