import { api } from "@/convex/_generated/api";
import Search from "antd/es/input/Search";
import { useQuery } from "convex/react";
import { TabChildrenContainer } from "./Listings";
import RequestsTable from "./RequestTable";


export default function IncomingRequests() {

    const allRequests= useQuery(api.loans.getIncomingRequests);

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
                />
            </div>
        </div>
        <div className="flex flex-col gap-[1rem] w-full">
            <RequestsTable requests={allRequests} />
        </div>
    </TabChildrenContainer>;
};