"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { EyeInvisibleOutlined, LoadingOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { SignInButton } from "@clerk/nextjs";
import { Button, Result, Skeleton, Spin } from "antd";
import Search from "antd/es/input/Search";
import { useConvexAuth, useQuery } from "convex/react";
import Image from "next/image";
import { useState } from "react";
import { Tool } from "../types";
import Container from "./layout/Container";

export default function ToolsList () {

    const [activeCategory, setActiveCategory]= useState<string>("");

    const clickHandler_= (id: string)=> {
        setActiveCategory(id);
        console.log("Clicked: " + id + ", active: " + activeCategory);
    };

    return <div className="flex flex-col gap-0 bg-light-blue py-[2.5rem]">
        <Container>
            <div className="flex flex-col gap-[1.5rem]">
                <CategorySelector activeCategory={activeCategory} selectCategory={clickHandler_} />
                <AuthCheckedToolsList activeCategory={activeCategory} />
            </div>
        </Container>
    </div>;
};

const AuthCheckedToolsList= ({activeCategory}: {activeCategory: string})=> {
    const {isLoading, isAuthenticated}= useConvexAuth();

    if (isLoading) {
        return <div className="w-full">
            <Result
                status={"info"}
                title="Waiting for Convex authentication"
                icon={<Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />}
            />
        </div>;
    }

    return isAuthenticated ? <ToolslistPrivate activeCategory={activeCategory} /> : <ToolsListPublic activeCategory={activeCategory} />;
};

const ToolslistPrivate= ({activeCategory}: {activeCategory: string})=> {
    const allTools= useQuery(api.tools.getTools, {category: activeCategory!=="" ? activeCategory as Id<"categories"> : undefined});

    return <div className="flex flex-wrap gap-[1.5rem]">
        {
            allTools=== undefined ?
            <>
                <ToolCardSkeleton />
                <ToolCardSkeleton />
                <ToolCardSkeleton />
                <ToolCardSkeleton />
            </>
            :
            allTools?.map(tool=> <ToolCard key={tool.id} tool={tool} />)
        }
    </div>;
};

function ToolsListPublic ({activeCategory}: {activeCategory: string}) {
    const allTools= useQuery(api.tools.getPublicTools, {category: activeCategory!=="" ? activeCategory as Id<"categories"> : undefined});

    return <div className="flex flex-wrap gap-[1.5rem]">
        {
            allTools=== undefined ?
            <>
                <ToolCardSkeleton />
                <ToolCardSkeleton />
                <ToolCardSkeleton />
                <ToolCardSkeleton />
            </>
            :
            allTools?.map(tool=> <ToolCardPublic key={tool.id} tool={tool} />)
        }
    </div>;
};

const CategorySelector= ({selectCategory, activeCategory}: {selectCategory: (id: string)=> void, activeCategory: string})=> {

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
            Owner: {tool.owner?.clerkId}
        </div>
        <Button type="primary" className="w-full">Borrow</Button>
    </div>;
};

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