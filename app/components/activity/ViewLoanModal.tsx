import { incomingRequest } from "@/app/types";
import { conditionTypeColors } from "@/app/utils/conditioncolors";
import { Id } from "@/convex/_generated/dataModel";
import { CalendarOutlined, CheckOutlined, CloseOutlined, EnterOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import Image from "next/image";


export default function ViewLoanModal ({isOpen, onClose, viewedLoan, rejectApproveLoan, markLoanReturned, submitting}: {
    isOpen: boolean,
    onClose: ()=> void,
    viewedLoan: incomingRequest|null,
    rejectApproveLoan: (status: "declined"|"approved", loanId: Id<"loans">)=> void,
    markLoanReturned: (loanId: Id<"loans">)=> void,
    submitting: boolean,
}) {

    if (!viewedLoan) return null;

    const decline= ()=> {
        rejectApproveLoan("declined", viewedLoan._id);
    };
    const approve= ()=> {
        rejectApproveLoan("approved", viewedLoan._id);
    };
    const markReturned= ()=> {
        markLoanReturned(viewedLoan._id);
    };

    return <Modal
        title={"Loan details"}
        open={isOpen}
        onCancel={onClose}
        footer={
            <div className="flex gap-[.5rem] items-center justify-end">
                <Button onClick={onClose}>Close</Button>

                {
                    viewedLoan.status === "approved" &&
                    <Button
                        onClick={markReturned}
                        type="primary"
                        loading={submitting}
                    >
                        <div className="flex items-center gap-[.25rem]">
                            <EnterOutlined />
                            Mark returned
                        </div>
                    </Button>
                }

                {
                    viewedLoan.status === "pending" &&
                    <>
                        <Button
                            onClick={decline}
                            danger
                            loading={submitting}
                        >
                            <div className="flex items-center gap-[.25rem]">
                                <CloseOutlined />
                                Decline
                            </div>
                        </Button>
                        <Button
                            onClick={approve}
                            type="primary"
                            loading={submitting}
                        >
                            <div className="flex items-center gap-[.25rem]">
                                <CheckOutlined />
                                Approve
                            </div>
                        </Button>
                    </>
                }
            </div>
        }
    >
        <div className="flex flex-col gap-[1rem] py-[1.5rem]">
            <div className="flex flex-row gap-[1rem] rounded-md bg-light-blue p-[1rem] overflow-hidden">
                <div className="w-[4rem] h-[4rem] rounded-md overflow-hidden shrink-0">
                    <Image src={viewedLoan.tool?.imageId ?? "/placeholder.svg"} alt={viewedLoan.tool?.name||"Image_" + " image"} width={200} height={150} className="h-full rounded-md object-cover" />
                </div>
                <div className="flex flex-col gap-[.25rem] grow-0 min-w-0">
                    <div className="rounded-full flex gap-[.25rem] items-center px-[1rem] py-[.25rem] text-primary font-semibold leading-[200%] text-[.75rem] w-max tracking-[0.038rem] capitalize" style={{background: conditionTypeColors[viewedLoan.tool?.condition||"good"]}}>
                        {viewedLoan.tool?.condition||"Good"}
                    </div>
                    <div className="text-[1.25rem] text-foreground-1 font-semibold font-jakarta">{viewedLoan.tool?.name || ""}</div>
                    <div className="w-full overflow-hidden">
                        {viewedLoan.tool?.description && <p className="text-[.875rem] text-foreground font-sans truncate w-full font-light">{viewedLoan.tool.description}</p>}
                    </div>
                    <div className="flex gap-[0.45rem] items-center text-primary text-[.75rem] font-semibold">
                        <UserOutlined />
                        borrower: {viewedLoan.borrower?.name || viewedLoan.borrower?.username || "Unknown user"}
                    </div>
                </div>
            </div>

            <div className="flex gap-[1rem] w-full">
                <div className="flex gap-[.5rem] p-[.5rem] items-center bg-light-blue rounded-md grow">
                    <CalendarOutlined className="text-[1.3rem]" />
                    <div className="flex gap-0 flex-col">
                        <div className="font-sans text-foreground text-[.75rem]">Start date</div>
                        <div className="font-sans font-semibold text-foreground-1 text-[.75rem]">{(new Date(viewedLoan.startDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                </div>
                <div className="flex gap-[.5rem] p-[.5rem] items-center bg-secondary rounded-md grow">
                    <CalendarOutlined className="text-[1.3rem]" />
                    <div className="flex gap-0 flex-col">
                        <div className="font-sans text-foreground text-[.75rem]">End date</div>
                        <div className="font-sans font-semibold text-foreground-1 text-[.75rem]">{(new Date(viewedLoan.endDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>
        </div>
    </Modal>;
};