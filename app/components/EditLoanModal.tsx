import { Id } from "@/convex/_generated/dataModel";
import { Tool } from "../types";
import { Button, Modal } from "antd";
import { MouseEvent, SubmitEventHandler, useState } from "react";
import { SaveOutlined } from "@ant-design/icons";
import useNotificationContext from "../context/useNotificationContext";

export default function EditLoanModal ({open, tool, loanId, close}: {
    open: boolean,
    tool: Tool,
    loanId: Id<"loans">,
    close: ()=> void
}) {
    const closeSelf= ()=> {
        close();
    };
    const submit: SubmitEventHandler<HTMLFormElement> = (event) => {};
    const notifApi= useNotificationContext();
    const [submitting, setSubmitting]= useState<boolean>(false);


    return <Modal
        title={"Borrow this item"}
        open={open}
        onCancel={close}
        footer={
            <div className="flex gap-[.5rem] items-center justify-end">
                <Button onClick={close}>Cancel</Button>
                <Button
                    onClick={submit as unknown as (event: MouseEvent<HTMLElement>)=> void}
                    type="primary"
                    loading={submitting}
                >
                    <div className="flex items-center gap-[.25rem]">
                        <SaveOutlined />
                        Submit request
                    </div>
                </Button>
            </div>
        }
    ></Modal>;
};