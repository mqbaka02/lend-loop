import { createContext, SetStateAction, useContext } from "react";

type roleType= "admin" | "user";
type roleCtxType= {
    role: roleType,
    setRole: React.Dispatch<SetStateAction<roleType>>
};

export const RoleTypeContext= createContext<roleCtxType|null>(null);

export default function useRoleContext() {
    const context= useContext(RoleTypeContext);
    if (!context) throw new Error("Context is missing!");

    return context;
};