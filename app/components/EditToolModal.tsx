"use client";

import { Button, Input, Modal, Select, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { Tool } from "../types";
import { FormatPainterFilled, PlusOutlined, SaveOutlined, ToolFilled } from "@ant-design/icons";
import { ChangeEventHandler, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TextArea from "antd/es/input/TextArea";
import { Id } from "@/convex/_generated/dataModel";
import useNotificationContext from "../context/useNotificationContext";
import { ConvexError } from "convex/values";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type toolValuesType = {
    name: string,
    desc?: string,
    category: string,
    condition: "new" | "good" | "fair" | "poor",
};

export default function CreateEditToolModal({ type, tool, open, close }: {
    open: boolean,
    close: () => void,
    type: "edit" | "create",
    tool: Tool | null,
}) {
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errors, setErrors] = useState<Partial<Record<keyof toolValuesType, boolean>>>({});

    const [values, setValues] = useState<toolValuesType>(() => {
        if (type === "edit" && tool) {
            return {
                category: tool.categoryId ?? "",
                condition: tool.condition ?? "good",
                name: tool.name ?? "",
                desc: tool.desc ?? "",
            };
        }
        return { name: "", desc: "", condition: "good", category: "" };
    });

    // In edit mode, the current image is shown as an already-"done" file
    const [fileList, setFileList] = useState<UploadFile[]>(() =>
        type === "edit" && tool?.image
            ? [{ uid: "existing", name: "Current photo", status: "done", url: tool.image }]
            : []
    );

    const createTool = useMutation(api.tools.createTool);
    const editTool = useMutation(api.tools.editTool);
    const generateUploadUrl = useMutation(api.tools.generateUploadUrl);
    const categories = useQuery(api.categories.getCategories);

    const notifApi = useNotificationContext();

    const closeSelf = () => {
        setValues({ name: "", desc: "", condition: "good", category: "" });
        setFileList([]);
        close();
    };

    const showError = (error: unknown) => {
        const description =
            error instanceof ConvexError ? String(error.data)
            : error instanceof Error ? error.message
            : "Something went wrong.";
        notifApi.notificationAPI["error"]({ title: "Error!", description });
    };

    const uploadImage = async (file: File): Promise<Id<"_storage">> => {
        const postUrl = await generateUploadUrl();
        const response = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
        });
        if (!response.ok) throw new Error("Image upload failed. Please try again.");
        const { storageId } = await response.json();
        return storageId as Id<"_storage">;
    };

    // Validate on selection; returning false stops antd from auto-uploading.
    // The actual upload happens on submit, so cancelling never leaves orphan files.
    const beforeUpload: UploadProps["beforeUpload"] = (file) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            notifApi.notificationAPI["error"]({
                title: "Invalid file",
                description: "Only JPG, PNG or WebP images are allowed.",
            });
            return Upload.LIST_IGNORE;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            notifApi.notificationAPI["error"]({
                title: "File too large",
                description: "The image must be 5 MB or smaller.",
            });
            return Upload.LIST_IGNORE;
        }
        return false;
    };

    const submit = async (event?: { preventDefault: () => void }) => {
        event?.preventDefault();
        if (submitting) return;

        const hasError = {} as typeof errors;
        if (!values.category?.trim()) hasError.category = true;
        if (!values.name?.trim()) hasError.name = true;
        if (!values.condition?.trim()) hasError.condition = true;
        if (Object.keys(hasError).length !== 0) {
            setErrors(hasError);
            return;
        }

        setSubmitting(true);
        try {
            const category = values.category as Id<"categories">;
            // Only a newly picked file has originFileObj; the existing image doesn't
            const newFile = fileList[0]?.originFileObj;

            if (type === "edit") {
                // undefined = unchanged, null = removed, id = replaced
                let imageId: Id<"_storage"> | null | undefined;
                if (newFile) imageId = await uploadImage(newFile);
                else if (fileList.length === 0 && tool?.image) imageId = null;

                await editTool({ ...values, category, id: tool!.id, imageId });
            } else {
                const imageId = newFile ? await uploadImage(newFile) : undefined;
                await createTool({ ...values, category, imageId });
            }

            notifApi.notificationAPI["success"]({
                title: type === "edit" ? "Tool updated!" : "Tool created!",
                description: type === "edit" ? "Your changes have been saved." : "It has been published automatically.",
            });
            closeSelf();
        } catch (error) {
            showError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => {
        const targetId = event.target.id;
        const newErrs = { ...errors };
        if (targetId.endsWith("desc")) {
            setValues({ ...values, desc: event.target.value });
            delete newErrs.desc;
        } else {
            setValues({ ...values, name: event.target.value });
            delete newErrs.name;
        }
        setErrors(newErrs);
    };

    return <Modal
        destroyOnHidden
        open={open}
        onCancel={close}
        title={
            <div className="flex gap-[1rem]">
                <ToolsIcon />
                <div className="flex flex-col gap-[.25rem]">
                    <div className="text-foreground-1 font-jakarta text-[1.5rem] font-bold leading-[100%]">{type === "create" ? "List a New Tool" : tool?.name || "Tool"}</div>
                    {
                        type === "create" ?
                            <p className="text-[.875rem] text-foreground font-sans font-light">Share unused equipment with trusted neighbors.</p>
                            :
                            <p className="text-[.875rem] text-foreground font-sans font-light">Editing the tool.</p>
                    }
                </div>
            </div>
        }
        footer={
            <div className="flex gap-[.5rem] items-center justify-end">
                <Button onClick={close} disabled={submitting}>Cancel</Button>
                <Button onClick={submit} type="primary" loading={submitting}>
                    {
                        type === "create" ?
                            <div className="flex items-center gap-[.25rem]">
                                <PlusOutlined />
                                Publish Tool
                            </div>
                            :
                            <div className="flex items-center gap-[.25rem]">
                                <SaveOutlined />
                                Save Edits
                            </div>
                    }
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
                    status={errors.name !== undefined ? "error" : undefined}
                />
            </div>
            <div className="flex flex-col gap-[.5rem]">
                <label htmlFor="toolcategory" className="font-sans font-semibold text-[.875rem] text-foreground-1">Category*</label>
                <Select
                    loading={categories === undefined}
                    id="toolcategory"
                    options={categories ? categories.map(categ => ({ value: categ.id, label: categ.name })) : []}
                    value={values.category}
                    onChange={(value) => {
                        setValues({ ...values, category: value });
                        const newErrs = { ...errors };
                        delete newErrs.category;
                        setErrors(newErrs);
                    }}
                    status={errors.category !== undefined ? "error" : undefined}
                    allowClear
                    onClear={() => setValues({ ...values, category: "" })}
                />
            </div>
            <div className="flex flex-col gap-[.5rem]">
                <label htmlFor="toolcondition" className="font-sans font-semibold text-[.875rem] text-foreground-1">Condition*</label>
                <Select
                    id="toolcondition"
                    options={[
                        { value: "new", label: "new" },
                        { value: "good", label: "good" },
                        { value: "fair", label: "fair" },
                        { value: "poor", label: "poor" },
                    ]}
                    value={values.condition}
                    onChange={(value) => {
                        setValues({ ...values, condition: value });
                        const newErrs = { ...errors };
                        delete newErrs.condition;
                        setErrors(newErrs);
                    }}
                    status={errors.condition !== undefined ? "error" : undefined}
                    allowClear
                    onClear={() => setValues({ ...values, condition: "good" })}
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
            <div className="flex flex-col gap-[.5rem]">
                <span className="font-sans font-semibold text-[.875rem] text-foreground-1">Photo</span>
                <Upload
                    listType="picture-card"
                    accept=".jpg,.jpeg,.png,.webp"
                    maxCount={1}
                    fileList={fileList}
                    beforeUpload={beforeUpload}
                    onChange={({ fileList }) => setFileList(fileList)}
                    showUploadList={{ showPreviewIcon: false }}
                >
                    {fileList.length === 0 && (
                        <div>
                            <PlusOutlined />
                            <div className="mt-[.5rem]">Upload</div>
                        </div>
                    )}
                </Upload>
                <p className="text-[.75rem] text-foreground font-sans font-light">JPG, PNG or WebP, up to 5 MB.</p>
            </div>
        </form>
    </Modal>;
};

/**
 * I don't want to use other icons than the default ant design icons so...
 */
const ToolsIcon = () => {
    return <div className="flex gap-0 items-center justify-center w-[3rem] h-[3rem] bg-secondary rounded-md shrink-0">
        <ToolFilled className="transform rotate-315 text-[1.2rem] !text-primary/80" />
        <FormatPainterFilled className="text-[1.2rem] !text-primary/80 relative left-[-.3rem]" />
    </div>;
};