import { useBreakpoint } from "@/app/hooks/useBreakpoint";
import { Empty, Listy } from "antd";
import Search from "antd/es/input/Search";
import { Fragment } from "react/jsx-runtime";
import TitleAndSearch from "./ActivityTabTitleAndSearch";

export default function AbstractVirtualizedList<T> ({texts, onSearchChange, listKey, theList, renderItem, extraElements, EmptyRender, skeletons}: {
    texts: {title: string, searchPlaceholder: string},
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    theList: T[]|undefined,
    listKey: keyof T,
    renderItem: (item: T)=> React.ReactNode,
    skeletons: React.ReactNode,
    extraElements?: React.ReactNode[],
    EmptyRender?: React.ReactNode,
}) {
    const below1024= useBreakpoint(1024);
    return <TabChildrenContainer>
        <TitleAndSearch
            title={texts.title}
            placeholder={texts.searchPlaceholder}
            onSearchChange={onSearchChange}
        />
        {
            extraElements&& extraElements.map((El, index)=> <Fragment key={index}>{El}</Fragment>)
        }
        <div className="flex flex-col gap-[1rem] w-full">
            {
                theList ?
                    <Listy<T>
                        items={theList}
                        rowKey={listKey}
                        itemRender={renderItem}
                        styles={below1024==="sm"? {
                            item: {padding:  0}
                        }: {}}
                    />
                    :
                    <>{skeletons}</>
            }
            {
                theList && theList.length === 0 && <div className="w-full flex flex-col items-center justify-center gap-[1.5rem]">
                    <Empty />
                    {EmptyRender&& EmptyRender}
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