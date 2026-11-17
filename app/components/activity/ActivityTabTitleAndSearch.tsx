import Search from "antd/es/input/Search";
import { ChangeEventHandler } from "react";

export default function TitleAndSearch({onSearchChange, title, placeholder}: {
    onSearchChange: ChangeEventHandler<HTMLInputElement>,
    title: string,
    placeholder: string,
}) {
    return <div className="flex min-[40rem]:flex-row min-[40rem]:gap-0 gap-[1rem] flex-col">
        <div className="flex flex-col gap-[.25rem] grow">
            <h3 className="font-jakarta text-foreground-1 text-[1.25rem] font-semibold grow ">
                {title}
            </h3>
        </div>
        <div className="flex items-start">
            <Search
                placeholder={placeholder}
                size="large"
                onChange={onSearchChange}
            />
        </div>
    </div>;
};