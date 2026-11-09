import { BorrowRequest, loanStatus, Tool } from "@/app/types";
import { api } from "@/convex/_generated/api";
import Search from "antd/es/input/Search";
import { useMutation, useQuery } from "convex/react";
import { ListingSkeletons, TabChildrenContainer } from "./Listings";
import { Button, Empty, Popconfirm } from "antd";
import { CalendarOutlined, CloseCircleOutlined, SafetyOutlined, SearchOutlined } from "@ant-design/icons";
import Image from "next/image";
import { loanStatusTypeColors, requestTextExplanation } from "@/app/utils/conditioncolors";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import useNotificationContext from "@/app/context/useNotificationContext";
import { ConvexError } from "convex/values";
import EditLoanModal from "../EditLoanModal";


export default function MyBorrowRequests() {

    const borrowRequests = useQuery(api.loans.getMyRequests, {});

    const notifApi= useNotificationContext();

    const withdrawLoan= useMutation(api.loans.withdrawLoan);
    const onWithdrawLoan= (loanId: Id<"loans">)=> {
        try{
            withdrawLoan({loanId}).then(()=> {
                notifApi.notificationAPI['success']({
                    title: "Request canceled",
                    description: "You successfully withdrawed the loan request.",
                    type: "success"
                });
            }).catch((error) => {
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
        }
    };

    const [loanEditModalOpen, setLoanEditModalOpen]= useState<boolean>(false);
    const [edidtedloan, setEdidtedLoan]= useState<BorrowRequest|null>(null);
    const editThisLoan= (loan: BorrowRequest)=> {
        setEdidtedLoan(loan);
        setLoanEditModalOpen(true);
    };

    return <TabChildrenContainer>
        <div className="flex">
            <div className="flex flex-col gap-[.25rem] grow">
                <h3 className="font-jakarta text-foreground-1 text-[1.25rem] font-semibold grow ">
                    My borrow requests
                </h3>
            </div>
            <div className="flex items-start">
                <Search
                    placeholder="Filter my requests"
                    size="large"
                />
            </div>
        </div>
        <EditLoanModal
            open={loanEditModalOpen}
            close={()=> setLoanEditModalOpen(false)}
            loan={edidtedloan}
            key={`${edidtedloan?._id || 'new'}`}
        />
        <div className="flex flex-col gap-[1rem] w-full">
            {
                borrowRequests ?
                    <>
                        {borrowRequests.map(
                            loan => <SingleBorrowRequest
                                borrowRequest={loan}
                                key={loan._id}
                                withdrawLoan={onWithdrawLoan}
                                editThisLoan={editThisLoan}
                            />)
                        }
                    </>
                    :
                    <ListingSkeletons />
            }
            {
                borrowRequests && borrowRequests.length === 0 && <div className="w-full flex flex-col items-center justify-center gap-[1.5rem]">
                    <Empty />
                    <Button type="primary" size="large" href="/">
                        <div className="flex gap-[.5rem]">
                            <SearchOutlined />
                            View Tool Catalog
                        </div>
                    </Button>
                </div>
            }
        </div>
    </TabChildrenContainer>;
};

const SingleBorrowRequest= ({borrowRequest, withdrawLoan, editThisLoan}: {
    borrowRequest: BorrowRequest,
    withdrawLoan: (loanId: Id<"loans">)=> void,
    editThisLoan: (loan: BorrowRequest)=> void,
})=> {
    const [imgSrc, setImgSrc]= useState(borrowRequest.owner?.imageUrl);
    return <div className="flex gap-[1.5rem] p-[1.5rem] bg-white rounded-xl w-full">
        <div className="w-[16rem] h-[16rem] rounded-md overflow-hidden shrink-0 relative">
            <Image src={borrowRequest.tool.image || "/placeholder.svg"} alt={borrowRequest.tool.name + " image"} width={256} height={256} className="object-cover h-full" />
            <div className="absolute top-[1rem] left-[1rem]">
                {
                    <div className="rounded-full bg-red-500/20 flex gap-[.25rem] items-center px-[1rem] py-[.125rem] text-red-500 font-semibold text-[.75rem] w-max tracking-[0.038rem]" style={{background: loanStatusTypeColors[borrowRequest.status], color: borrowRequest.status=== "declined"? "#fb2c36": "#131b2e"}}>
                        {borrowRequest.status}
                    </div>
                }
            </div>
        </div>
        <div className="flex flex-col gap-[.5rem] w-full grow">
            <div className="bg-light-blue p-[.125rem] px-[.5rem] rounded-full text-foreground-1 text-[.75rem] font-semibold capitalize w-max">{borrowRequest.tool.category}</div>
            <h6 className="font-jakarta text-[1.25rem] text-foreground font-semibold">{borrowRequest.tool.name}</h6>
            <div className="flex gap-[.5rem] p-[.5rem] items-center rounded-md bg-light-blue">
                <div className="w-[2.25rem] h-[2.25rem] rounded-full shrink-0 overflow-hidden">
                    <Image
                        src={imgSrc || "/placeholder.svg"}
                        alt={borrowRequest.tool.name + " image"}
                        width={256}
                        height={256}
                        className="object-cover h-full"
                        onError={()=> {setImgSrc("/hero_.jpg")}}//In the case the URL is in an invalid format.
                    />
                </div>
                <div className="flex flex-col gap-0">
                    <div className="flex gap-[.5rem]">
                        <div className="font-sans font-semibold text-[.75rem] text-foreground-1">{borrowRequest.owner?.name || borrowRequest.tool.owner?.name || "Unknown user"}</div>
                        {
                            borrowRequest.owner?.isTrusted &&
                            <div className="rounded-full bg-secondary flex gap-[.25rem] items-center px-[1rem] py-[.125rem] text-primary font-semibold text-[.75rem] w-max tracking-[0.038rem]">
                                <SafetyOutlined />
                                Trusted
                            </div>
                        }
                    </div>
                    <div className="font-sans font-semibold text-[.75rem] text-primary">@{borrowRequest.owner?.username || borrowRequest.tool.owner?.username || "user"}</div>
                </div>
            </div>
            <div className="flex gap-[1rem] w-full">
                <div className="flex gap-[.5rem] p-[.5rem] items-center bg-light-blue rounded-md grow">
                    <CalendarOutlined className="text-[1.3rem]" />
                    <div className="flex gap-0 flex-col">
                        <div className="font-sans text-foreground text-[.75rem]">Requested start date</div>
                        <div className="font-sans font-semibold text-foreground-1 text-[.75rem]">{(new Date(borrowRequest.startDate)).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                    </div>
                </div>
                <div className="flex gap-[.5rem] p-[.5rem] items-center bg-secondary rounded-md grow">
                    <CalendarOutlined className="text-[1.3rem]" />
                    <div className="flex gap-0 flex-col">
                        <div className="font-sans text-foreground text-[.75rem]">Requested start date</div>
                        <div className="font-sans font-semibold text-foreground-1 text-[.75rem]">{(new Date(borrowRequest.endDate)).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                    </div>
                </div>
            </div>
        </div>
        <div className="p-[1rem] bg-light-blue rounded-md flex flex-col gap-[.5rem] w-[16rem] shrink-0">
            <div className="text-[.75rem] font-semibold font-sans text-foreground-1">{requestTextExplanation[borrowRequest.status].title}</div>
            <div className="text-[.875rem] text-foreground font-light">{requestTextExplanation[borrowRequest.status].p}</div>
            <Button
                icon={<CalendarOutlined />}
                className="mt-auto"
                onClick={()=> editThisLoan(borrowRequest)}
                disabled={borrowRequest.status=== "returned"|| borrowRequest.status=== "approved"}
            >Modify dates</Button>
            <Popconfirm
                title="Are you sure you want to withdraw this request?"
                description="This item will still be available in your request list and can be relaunched at any time."
                okType="danger"
                align={{points: ["br", "tr"]}}
                onConfirm={()=> withdrawLoan(borrowRequest._id)}
            >
                <Button icon={<CloseCircleOutlined />} danger disabled={borrowRequest.status!=="pending"} >Withdraw</Button>
            </Popconfirm>
        </div>
    </div>;
};