import useNotificationContext from "@/app/context/useNotificationContext";
import { incomingRequest, incomingRequestTool } from "@/app/types";
import { loanStatusTypeColors } from "@/app/utils/conditioncolors";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowRightOutlined, CalendarOutlined, CheckOutlined, CloseOutlined, EnterOutlined, EyeOutlined, SafetyOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Table } from "antd";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import Image from "next/image";
import { SetStateAction, useMemo, useState } from "react";
import ViewLoanModal from "./ViewLoanModal";
import useRoleContext from "@/app/context/Role";
import UserRender from "./UserRender";
import { dateFmt } from "@/app/utils/dateFormat";



export default function RequestsTable ({ requests }: { requests?: incomingRequest[] }) {

    const roleCTX= useRoleContext();

    const dataSource = useMemo(()=> requests?.map(req => ({
        ...req,
        key: req._id,
    })), [requests]);

    const updateLoanStatus= useMutation(api.loans.updateLoanStatus);
    const returnLoan= useMutation(api.loans.markAsReturned);

    const notifApi= useNotificationContext();

    const [viewedLoan, setViewLoan]= useState<incomingRequest|null>(null);
    const [viewModalOpen, setViewModalOpen]= useState<boolean>(false);
    const [modalIsSubmitting, setModalIsSubmitting]= useState<boolean>(false);

    const rejectApproveLoan= (status: "declined"|"approved", loanId: Id<"loans">)=> {
        setModalIsSubmitting(true);
        try{
            updateLoanStatus({loanId: loanId, newStatus: status})
            .then(()=> {
                notifApi.notificationAPI['success']({
                    title: status=== "approved"? "Request approved": "Request declined",
                    description: status=== "approved"? "The borrower will come pick it up at the designed date." : "You will never see it again until the borrower edits it.",
                    type: "success"
                });
                setModalIsSubmitting(false);
                setViewModalOpen(false);
            })
            .catch((error)=> {
                if (error instanceof ConvexError) {
                    const data = error.data;
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
                setModalIsSubmitting(false);
                setViewModalOpen(false);
            });
        } catch (error) {
            if (error instanceof ConvexError) {
                const data = error.data;
                notifApi.notificationAPI["error"]({
                    title: "Error!",
                    description: data as string
                });
            } else {
                notifApi.notificationAPI["error"]({
                    title: "Error!",
                    description: (error as any).message as string
                });
            }
            setModalIsSubmitting(false);
            setViewModalOpen(false);
        }
    };
    const markLoanReturned= (loanId: Id<"loans">)=> {
        setModalIsSubmitting(true);
        try{
            returnLoan({loanId: loanId})
            .then(()=> {
                notifApi.notificationAPI['success']({
                    title: "Request marked as returned",
                    description: "Thank you for loaning. Doing this often will make you a trusted member.",
                    type: "success"
                });
                setModalIsSubmitting(false);
                setViewModalOpen(false);
            })
            .catch((error)=> {
                if (error instanceof ConvexError) {
                    const data = error.data;
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
                setModalIsSubmitting(false);
                setViewModalOpen(false);
            });
        } catch (error) {
            if (error instanceof ConvexError) {
                const data = error.data;
                notifApi.notificationAPI["error"]({
                    title: "Error!",
                    description: data as string
                });
            } else {
                notifApi.notificationAPI["error"]({
                    title: "Error!",
                    description: (error as any).message as string
                });
            }
            setModalIsSubmitting(false);
            setViewModalOpen(false);
        }
    };

    return (<>
        <ViewLoanModal
            isOpen={viewModalOpen}
            viewedLoan={viewedLoan}
            onClose={()=> setViewModalOpen(false)}
            rejectApproveLoan={rejectApproveLoan}
            markLoanReturned={markLoanReturned}
            submitting={modalIsSubmitting}
        />
        <Table<incomingRequest & { key: Id<"loans"> }>
            loading={requests === undefined}
            // rowSelection={{
            //     type: "checkbox",
            //     columnWidth: 48, // <-- fixes the huge checkbox column
            // }}
            columns={[
                {
                    title: "Borrower",
                    dataIndex: "borrower",
                    width: 240,
                    render: (_: unknown, req: incomingRequest) =>
                    <UserRender
                        name={req.borrower?.name}
                        username={req.borrower?.username}
                        imageUrl={req.borrower?.imageUrl}
                        isTrusted={req.borrower?.isTrusted}
                    />,
                },
                //Display the owner when in admin mode
                ...(roleCTX.role==="admin"? [{
                    title: "Owner",
                    dataIndex: "owner",
                    width: 240,
                    render: (_: unknown, req: incomingRequest) =>
                    <UserRender
                        name={req.owner?.name}
                        username={req.owner?.username}
                        imageUrl={req.owner?.imageUrl}
                        isTrusted={req.owner?.isTrusted}
                    />,
                }]: []),
                {
                    title: "Tool",
                    dataIndex: "tool_name",
                    width: 260,
                    render: (_: unknown, req: incomingRequest) => (
                        <ToolRender tool={req.tool} category={req.category?.name} />
                    ),
                },
                {
                    title: "Status",
                    dataIndex: "status",
                    width: 140,
                    render: (_: unknown, req: incomingRequest) => <StatusRender request={req} />,
                },
                {
                    title: "Requested period",
                    dataIndex: "period",
                    width: 220,
                    render: (_: unknown, req: incomingRequest) => (
                        <PeriodRender startDate={req.startDate} endDate={req.endDate} />
                    ),
                },
                {
                    title: "Actions",
                    dataIndex: "actions",
                    width: 160,
                    render: (_: unknown, req: incomingRequest) =>(
                        <ActionsRender
                            returnLoan={markLoanReturned}
                            rejectOrApproveLoan={rejectApproveLoan}
                            request={req}
                            setViewModalOpen={setViewModalOpen}
                            setViewedLoan={setViewLoan}
                        />
                    ),
                },
            ]}
            dataSource={dataSource}
            virtual
            pagination={false}
            scroll={{ x: 1020, y: 600 }} // x≈ sum of widths (48 + 240 + 260 + 140 + 220 + 160 = 1068)
        />
    </>);
};

const ToolRender= ({tool, category="No category"}: {tool: incomingRequestTool, category?: string})=> {

    const [imgSrc, setImgSrc]= useState<string>(tool.image as string);

    return <div className="flex gap-[.5rem] p-[.5rem] items-start rounded-md">
        <div className="w-[4rem] h-[4rem] rounded-md shrink-0 overflow-hidden">
            <Image
                src={imgSrc || "/placeholder.svg"}
                alt={"User image"}
                width={128}
                height={128}
                className="object-cover h-full"
                onError={()=> {setImgSrc("/placeholder.svg")}}
            />
        </div>
        <div className="flex flex-col gap-0">
            <div className="flex gap-[.5rem]">
                <div className="font-sans font-semibold text-[.875rem] text-foreground-1 capitalize">{tool.name}</div>
            </div>
            <div className="bg-light-blue p-[.125rem] px-[.5rem] rounded-full text-foreground-1 text-[.75rem] font-semibold capitalize w-max">{category}</div>
        </div>
    </div>;
};

const StatusRender= ({request}: {request: incomingRequest}) => {
    return <div className="rounded-full bg-red-500/20 flex gap-[.25rem] items-center px-[1rem] py-[.125rem] text-red-500 font-semibold text-[.75rem] w-max tracking-[0.038rem]" style={{ background: loanStatusTypeColors[request.status], color: request.status === "declined" ? "#fb2c36" : "#131b2e" }}>
        {request.status}
    </div>
};

const PeriodRender= ({ startDate, endDate }: { startDate: number, endDate: number }) => {
    //Compute difference in days between the dates
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffInDays = Math.floor(Math.abs(endDate - startDate) / msPerDay);

    return <div className="flex gap-0 flex-col">
        <div className="flex gap-[.5rem] items-center rounded-md grow font-bold text-primary text-[1.2rem]">
            <CalendarOutlined className="text-[1rem]" />
            {diffInDays} days
        </div>
        <div className="flex gap-[.5rem] items-center rounded-md grow">
            <div className="font-sans font-semibold !text-foreground !font-light text-[.75rem]">{dateFmt.format(startDate)}</div>
            <ArrowRightOutlined />
            <div className="font-sans font-semibold !text-foreground !font-light text-[.75rem]">{dateFmt.format(endDate)}</div>
        </div>
    </div>
};

const ActionsRender= ({request, rejectOrApproveLoan, returnLoan, setViewModalOpen, setViewedLoan}: {
    request: incomingRequest,
    returnLoan: (loanId: Id<"loans">)=> void
    rejectOrApproveLoan: (status: "approved" | "declined", loanId: Id<"loans">)=> void,
    setViewModalOpen: React.Dispatch<SetStateAction<boolean>>,
    setViewedLoan: React.Dispatch<SetStateAction<incomingRequest|null>>,
})=> {
    const returnMe= ()=> {
        returnLoan(request._id);
    };
    const declineMe= ()=> {
        rejectOrApproveLoan("declined", request._id);
    };
    const approveMe= ()=> {
        rejectOrApproveLoan("approved", request._id);
    };
    const viewMe= ()=> {
        setViewedLoan(request);
        setViewModalOpen(true);
    };
    return <div className="flex flex-col gap-[.5rem]">
        <Button icon={<EyeOutlined />} onClick={viewMe} >View Loan</Button>
        {
            request.status === "pending" &&
            <>
                <Popconfirm
                    title="Confirm your action"
                    description={<p className="max-w-[15rem]">Do you want to approve this loan? This action cannot be reverted.</p>}
                    okType="primary"
                    okText="Approve"
                    align={{points: ["br", "tr"]}}
                    onConfirm={approveMe}
                >
                    <Button icon={<CheckOutlined />} >Approve</Button>
                </Popconfirm>
                <Popconfirm
                    title="Confirm your action"
                    description={<p className="max-w-[15rem]">The borrower will be able to update his request to see if it's available at another time period. Until then, you will not be able to see this request anymore.</p>}
                    okType="danger"
                    okText="Decline"
                    align={{points: ["br", "tr"]}}
                    onConfirm={declineMe}
                >
                    <Button icon={<CloseOutlined />} danger >Decline</Button>
                </Popconfirm>
            </>
        }
        {
            request.status === "approved" &&
            <>
                <Popconfirm
                    title="Confirm your action"
                    description={<p className="max-w-[15rem]">Do you want to mark this loan as returned? This action cannot be reverted.</p>}
                    okType="primary"
                    okText="Proceed"
                    align={{points: ["br", "tr"]}}
                    onConfirm={returnMe}
                >
                    <Button icon={<EnterOutlined />} type="primary" >Mark returned</Button>
                </Popconfirm>
            </>
        }
    </div>;
};