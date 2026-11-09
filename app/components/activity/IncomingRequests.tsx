import { api } from "@/convex/_generated/api";
import Search from "antd/es/input/Search";
import { useQuery } from "convex/react";
import { TabChildrenContainer } from "./Listings";
import RequestsTable from "./RequestTable";
import { useMemo, useState } from "react";


export default function IncomingRequests() {

    const allRequests= useQuery(api.loans.getIncomingRequests);

    const [searchValue, setSearchValue] = useState<string>("");
    const filteredRequests = useMemo(() => {
        if (!allRequests) return undefined;
        if (!searchValue) return allRequests;
        return allRequests
            ?.filter((request) => (
                request.tool.name.toLowerCase().search(searchValue.toLowerCase()) !== -1
                || (request.borrower && request.borrower.name && request.borrower.name.toLowerCase().search(searchValue.toLowerCase()) !== -1)
                || (request.borrower && request.borrower.username && request.borrower.username.toLowerCase().search(searchValue.toLowerCase()) !== -1)
            ));
    }, [searchValue, allRequests]);
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
            <RequestsTable requests={filteredRequests} />
        </div>
    </TabChildrenContainer>;
};