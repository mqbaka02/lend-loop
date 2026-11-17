import { api } from "@/convex/_generated/api";
import Search from "antd/es/input/Search";
import { useQuery } from "convex/react";
import RequestsTable from "./RequestTable";
import { useMemo, useState } from "react";
import { TabChildrenContainer } from "./AbstractVirtualizedList";
import TitleAndSearch from "./ActivityTabTitleAndSearch";


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
        <TitleAndSearch
            title={"Incoming requests for my tools"}
            placeholder={"Filter the requests"}
            onSearchChange={onSearchChange}
        />
        <div className="flex flex-col gap-[1rem] w-full custom-table">
            <RequestsTable requests={filteredRequests} />
        </div>
    </TabChildrenContainer>;
};