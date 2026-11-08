import { api } from "@/convex/_generated/api";
import { SendOutlined, ThunderboltOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Modal } from "antd";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Dayjs } from 'dayjs';
import Image from "next/image";
import { MouseEvent, SubmitEventHandler, useState } from "react";
import useBorrowedToolContext from "../context/BorrowedToolContext";
import useNotificationContext from "../context/useNotificationContext";
import { conditionTypeColors } from "../utils/conditioncolors";


type RangeValue = [Dayjs | null, Dayjs | null] | null;


export default function BorrowModal ({isOpen, onClose}: {
    isOpen: boolean,
    onClose: ()=> void,
}) {
    const {borrowedTool}= useBorrowedToolContext();
    const [hasError, setHasError]= useState<boolean>(false);

    const [dates, setDates] = useState<RangeValue>([
        null,
        null
    ]);
    const handleRangeChange = (
        values: RangeValue, 
        dateStrings: [string, string]
    ) => {
        setHasError(false);
        setDates(values);
    };
    const closeSelf= ()=> {
        setDates([null, null]);
        onClose();
    };

    const requestLoan= useMutation(api.loans.createLoanRequest);
    const notifApi= useNotificationContext();
    const [submitting, setSubmitting]= useState<boolean>(false);

    const submit: SubmitEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        setSubmitting(true);
        console.log(dates?.map(d=> d?.valueOf()));
        if (dates=== null || dates[0]=== null || dates[1]=== null){
            setHasError(true);
            setSubmitting(false);
            return;
        }

        try {
            requestLoan({
                toolId: borrowedTool?.id!,
                endDate: dates[1].valueOf(),
                startDate: dates[0].valueOf(),
            }).then(() => {
                setSubmitting(false);
                notifApi.notificationAPI["success"]({
                    title: "Tool requested!",
                    description: "Please wait for the owner's approval."
                });
                closeSelf();
            }).catch((e) => {
                setSubmitting(false);
                console.log(e);
                if (e instanceof ConvexError){
                    const data= e.data;
                    notifApi.notificationAPI["error"]({
                        title: "Error!",
                        description: data as string
                    });
                } else {
                    notifApi.notificationAPI["error"]({
                        title: "Error!",
                        description: e.message as string
                    });
                }
            });
        } catch (error) {
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

    return <Modal
        title={"Borrow this item"}
        open={isOpen}
        onCancel={closeSelf}
        footer={
            <div className="flex gap-[.5rem] items-center justify-end">
                <Button onClick={closeSelf}>Cancel</Button>
                <Button
                    onClick={submit as unknown as (event: MouseEvent<HTMLElement>)=> void}
                    type="primary"
                    loading={submitting}
                >
                    <div className="flex items-center gap-[.25rem]">
                        <SendOutlined />
                        Submit request
                    </div>
                </Button>
            </div>
        }
    >
        <div className="flex flex-col gap-[1rem] py-[1.5rem]">
            <div className="flex flex-row gap-[1rem] rounded-md bg-light-blue p-[1rem] overflow-hidden">
                <div className="w-[4rem] h-[4rem] rounded-md overflow-hidden shrink-0">
                    <Image src={borrowedTool?.image ?? "/placeholder.svg"} alt={borrowedTool?.name||"Image_" + " image"} width={200} height={150} className="h-full rounded-md object-cover" />
                </div>
                <div className="flex flex-col gap-[.25rem] grow-0 min-w-0">
                    <div className="rounded-full flex gap-[.25rem] items-center px-[1rem] py-[.25rem] text-primary font-semibold leading-[200%] text-[.75rem] w-max tracking-[0.038rem] capitalize" style={{background: conditionTypeColors[borrowedTool?.condition||"good"]}}>
                        {borrowedTool?.condition||"Good"}
                    </div>
                    <div className="text-[1.25rem] text-foreground-1 font-semibold font-jakarta">{borrowedTool?.name || ""}</div>
                    <div className="w-full overflow-hidden">
                        {borrowedTool?.desc && <p className="text-[.875rem] text-foreground font-sans truncate w-full font-light">{borrowedTool.desc}</p>}
                    </div>
                    <div className="flex gap-[0.45rem] items-center text-primary text-[.75rem] font-semibold">
                        <UserOutlined />
                        owner: {borrowedTool?.owner?.name || borrowedTool?.owner?.username || "Unknown user"}
                    </div>
                </div>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-[.25rem]">
                <label htmlFor="daterange" className="text-[.75rem] text-foreground-1 font-semibold">Requested Loan Period</label>
                <DatePicker.RangePicker
                    name="daterange"
                    id="daterange"
                    value={dates}
                    onChange={handleRangeChange}
                    status={hasError? "error" : undefined}
                ></DatePicker.RangePicker>
            </form>
            <Alert
                type="warning"
                showIcon
                title={<div className="text-[#653E00] text-[.75rem]">AUTOMATED N8N NEIGHBORHOOD WEBHOOK</div>}
                description={<p className="text-[#653E00]">Powered by n8n automated notifications: Lender will receive instant push notification and automated SMS/email reminders will coordinate the return.</p>}
                icon={<ThunderboltOutlined />}
            />
        </div>
    </Modal>;
};