import { createContext, SetStateAction, useContext } from "react";

type debouncedQueryStringContextType= {
    value: string,
    setValue: React.Dispatch<SetStateAction<string>>,
};

export const DebouncedQueryStringContext= createContext<debouncedQueryStringContextType|null>(null);

export default function useDebouncedQueryStringContext() {
    const context= useContext(DebouncedQueryStringContext);

    if (!context) throw new Error("Context is missing!");

    return context;
};