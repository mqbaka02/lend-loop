import { Empty, Listy } from "antd";
import Search from "antd/es/input/Search";
import { Fragment } from "react/jsx-runtime";

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