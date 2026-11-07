"use client";

import { Button, Input, Modal, Select } from "antd";
import { Tool } from "../types";
import { FormatPainterFilled, PlusOutlined, ToolFilled } from "@ant-design/icons";
import { ChangeEventHandler, SubmitEventHandler, useState, MouseEvent, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TextArea from "antd/es/input/TextArea";
import { Id } from "@/convex/_generated/dataModel";
import useNotificationContext from "../context/useNotificationContext";
import { ConvexError } from "convex/values";

type toolValuesType= {
    name: string,
    desc?: string,
    category: string,
    condition: "new"| "good"| "fair"| "poor",
};

export default function CreateEditToolModal({type, tool, open, close}: {
    open: boolean,
    close: ()=> void,
    type: "edit"|"create",
    tool: Tool | null,
}) {

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errors, setErrors]= useState<Partial<Record<keyof toolValuesType, boolean>>>({});

    const createTool= useMutation(api.tools.createTool);
    const editTool= useMutation(api.tools.editTool);

    const notifApi= useNotificationContext();

    const closeSelf= ()=> {
        setValues({
            name: "", desc: "", condition: "good", category: ""
        });
        close();
    };

    const submit: SubmitEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        setSubmitting(true);
        const {category, name, condition}= values;
        const hasError= {} as typeof errors;
        // console.log(errors);
        if (!(category&& category?.trim())){
            hasError.category= true;
        }
        if (!(name&& name?.trim())){
            hasError.name= true;
        }
        if (!(condition&& condition?.trim())){
            hasError.condition= true;
        }
        if (Object.keys(hasError).length!==0){
            setSubmitting(false);
            setErrors(hasError);
            return;
        }
        // console.log(values);
        // return;
        
        try {
            //This is a quick way to swap between edit and create
            //May rewrite this later
            let promise;
            if (type=== "edit"){
                promise= editTool({...values, category: values.category as Id<"categories">, id: tool?.id!});
            } else {
                promise= createTool({...values, category: values.category as Id<"categories">});
            }
            promise
            .then(()=> {
                setSubmitting(false);
                setSubmitting(false);
                notifApi.notificationAPI["success"]({
                    title: "Tool created!",
                    description: "It has been published automatically."
                });
                closeSelf();
            })
            .catch((error)=> {
                setSubmitting(false);
                setSubmitting(false);
                // console.log(error);
                if (error instanceof ConvexError){
                    const data= error.data;
                    notifApi.notificationAPI["error"]({
                        title: "Error!",
                        description: data as string
                    });
                } else {
                    notifApi.notificationAPI["error"]({
                        title: "Error!",
                        description: error.message as string
                    });
                }
            });
        } catch (error) {
            setSubmitting(false);
            setSubmitting(false);
            // console.error(error);
            if (error instanceof ConvexError) {
                const data = error.data;
                notifApi.notificationAPI["error"]({
                    title: "Error!",
                    description: data as string
                });
            } else {
                notifApi.notificationAPI["error"]({
                    title: "Error!",
                    description: error as string
                });
            }
        }
    }

    const [values, setValues] = useState<toolValuesType>(() => {
        if (type === "edit" && tool) {
            return {
                category: tool.categoryId ?? "",
                condition: tool.condition ?? "good",
                name: tool.name ?? "",
                desc: tool.desc ?? "",
            };
        }
        return {
            name: "",
            desc: "",
            condition: "good",
            category: ""
        };
    });

    // useEffect(()=> {
    //     console.log("TOOL: ", tool);
    //     console.log("VALUES: ", values);
    //     console.log("TYPE: ", type);
    // }, [open, values, tool]);

    const handleChange: ChangeEventHandler<HTMLInputElement|HTMLTextAreaElement>= (event)=> {
        const targetId= event.target.id;
        // console.log(targetId, event.target.value);
        if (targetId.endsWith("desc")) {
            setValues({...values, desc: event.target.value});
            const newErrs= {...errors};
            delete newErrs.desc;
            setErrors(newErrs);
        }
        else {
            setValues({...values, name: event.target.value});
            const newErrs= {...errors};
            delete newErrs.name;
            setErrors(newErrs);
        }
    };

    const categories= useQuery(api.categories.getCategories);

    return <Modal
        destroyOnHidden
        open={open}
        onCancel={close}
        title={
            <div className="flex gap-[1rem]">
                <ToolsIcon />
                <div className="flex flex-col gap-[.25rem]">
                    <div className="text-foreground-1 font-jakarta text-[1.5rem] font-bold leading-[100%]">{type=== "edit"? "List a New Tool": tool?.name||"Tool"}</div>
                    <p className="text-[.875rem] text-foreground font-sans font-light">Share unused equipment with trusted neighbors.</p>
                </div>
            </div>
        }
        footer={
            <div className="flex gap-[.5rem] items-center justify-end">
                <Button onClick={close}>Cancel</Button>
                <Button
                    onClick={submit as unknown as (event: MouseEvent<HTMLElement>)=> void}
                    type="primary"
                    loading={submitting}
                >
                    <div className="flex items-center gap-[.25rem]">
                        <PlusOutlined />
                        Publish Tool
                    </div>
                </Button>
            </div>
        }
    >
        <form onSubmit={submit} className="block flex flex-col gap-[1rem] w-full py-[1.25rem]">
            <div className="flex flex-col gap-[.5rem]">
                <label htmlFor="toolname" className="font-sans font-semibold text-[.875rem] text-foreground-1">Tool Name*</label>
                <Input
                    id="toolname"
                    value={values.name}
                    onChange={handleChange}
                    status={errors.name!==undefined? "error": undefined}
                />
            </div>
            <div className="flex flex-col gap-[.5rem]">
                <label htmlFor="toolcategory" className="font-sans font-semibold text-[.875rem] text-foreground-1">Category*</label>
                <Select
                    loading={categories===undefined}
                    id="toolcategory"
                    options={
                        categories ? categories.map(categ=> ({value: categ.id, label: categ.name})) : []
                    }
                    value={values.category}
                    onChange={(value)=> {
                        setValues({...values, category: value})
                        const newErrs= {...errors};
                        delete newErrs.category;
                        setErrors(newErrs);
                    }}
                    status={errors.category!==undefined? "error": undefined}
                    allowClear
                    onClear={()=> setValues({...values, category: ""})}
                />
            </div>
            <div className="flex flex-col gap-[.5rem]">
                <label htmlFor="toolcondition" className="font-sans font-semibold text-[.875rem] text-foreground-1">Condition*</label>
                <Select
                    id="toolcondition"
                    options={[
                        {value: "new", label: "new"},
                        {value: "good", label: "good"},
                        {value: "fair", label: "fair"},
                        {value: "poor", label: "poor"},
                    ]}
                    value={values.condition}
                    onChange={(value)=> {
                        setValues({...values, condition: value})
                        const newErrs= {...errors};
                        delete newErrs.condition;
                        setErrors(newErrs);
                    }}
                    status={errors.condition!==undefined? "error": undefined}
                    allowClear
                    onClear={()=> setValues({...values, condition: "good"})}
                />
            </div>
            <div className="flex flex-col gap-[.5rem]">
                <label htmlFor="tooldesc" className="font-sans font-semibold text-[.875rem] text-foreground-1">Description</label>
                <TextArea
                    id="tooldesc"
                    value={values.desc}
                    onChange={handleChange}
                />
            </div>
        </form>
    </Modal>;
};

/**
 * I don't want to use other icons that the defaul ant design icons so...
 */
const ToolsIcon= ()=> {
    return <div className="flex gap-0 items-center justify-center w-[3rem] h-[3rem] bg-secondary rounded-md shrink-0">
        <ToolFilled className="transform rotate-315 text-[1.2rem] !text-primary/80" />
        <FormatPainterFilled className="text-[1.2rem] !text-primary/80 relative left-[-.3rem]" />
    </div>;
};