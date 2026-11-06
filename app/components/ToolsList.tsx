"use client";

import { useState } from "react";
import Container from "./layout/Container";
import AuthCheckedToolsList, { CategorySelector } from "./ToolsGrid";

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
