import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import ListingsGeneric from "./ListingsGeneric";


export default function MyListings() {

    const listings= useQuery(api.tools.getMyTools, {});

    const [searchValue, setSearchValue]= useState<string>("");

    const onSearchChange= (event: React.ChangeEvent<HTMLInputElement>)=> {
        setSearchValue(event.currentTarget.value);
    };

    const filteredListings= useMemo(()=> {
        if (!listings) return undefined;
        if (!searchValue) return listings;
        return listings?.filter((tool)=> (
            tool.name.toLowerCase().search(searchValue.toLowerCase())!== -1
            || (tool.desc && tool.desc.toLowerCase().search(searchValue.toLowerCase())!== -1)
        ));
    }, [listings, searchValue]);

    return <ListingsGeneric
        listings={filteredListings}
        onSearchChange={onSearchChange}
        texts={{title: "My currently listed tools", searchPlaceholder: "Filter my listings"}}
    />;
};
