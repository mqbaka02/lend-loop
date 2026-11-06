import { createContext, SetStateAction, useContext } from "react";
import { Tool } from "../types";

export type BContextType= {
    borrowedTool: Tool|null,
    setBorrowedTool: React.Dispatch<SetStateAction<Tool|null>>,
    modalOpen: boolean,
    setModalOpen: React.Dispatch<SetStateAction<boolean>>,
};

export const BorrowedToolContext= createContext<BContextType|null>(null);

export default function useBorrowedToolContext(){
    const context= useContext(BorrowedToolContext);

    if (!context) throw new Error("Context is missing!");

    return context;
};