"use client";

import { useState } from "react";
import Container from "./layout/Container";
import AuthCheckedToolsList, { CategorySelector } from "./ToolsGrid";
import useDebounce from "../hooks/useDebounce";
import { DebouncedQueryStringContext } from "../context/QueryString";

export default function ToolsList () {

    const [activeCategory, setActiveCategory]= useState<string>("");
    const queryString= useDebounce("");

    const clickHandler_= (id: string)=> {
        setActiveCategory(id);
        console.log("Clicked: " + id + ", active: " + activeCategory);
    };

    return <div className="flex flex-col gap-0 bg-light-blue py-[2.5rem]">
        <Container>
            <div className="flex flex-col gap-[1.5rem]" id="catalog">
                <DebouncedQueryStringContext.Provider value={{value: queryString.debouncedValue, setValue: queryString.setRealTimeValue}}>
                    <CategorySelector
                        activeCategory={activeCategory}
                        selectCategory={clickHandler_}
                        setQueryString={queryString.setRealTimeValue}
                    />
                    <AuthCheckedToolsList activeCategory={activeCategory} />
                </DebouncedQueryStringContext.Provider>
            </div>
        </Container>
    </div>;
};
