import { createContext, SetStateAction, useContext } from "react";
import { Tool } from "../types";

export type EContextType= {
    editedTool: Tool|null,
    setEditedTool: React.Dispatch<SetStateAction<Tool|null>>,
    modalOpen: boolean,
    setModalOpen: React.Dispatch<SetStateAction<boolean>>,
};

export const EditedToolContext= createContext<EContextType|null>(null);

export default function useEditedToolContext(){
    const context= useContext(EditedToolContext);

    if (!context) throw new Error("Context is missing!");

    return context;
};