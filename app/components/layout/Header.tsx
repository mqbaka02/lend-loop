"use client";

import { ArrowRightOutlined, MenuOutlined, UnlockFilled } from "@ant-design/icons";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "antd";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Container from "./Container";
import { MobileMenu, NavLink, UserWidget } from "./HeaderComponents";
import Logo from "./Logo";

export default function Header () {
    const pathName= usePathname();
    const [mobileMenushown, setMobileMenuShown]= useState<boolean>(false);

    const showMobileMenu= ()=> {
        setMobileMenuShown(true);
    };

    return <div className="flex flex-col gap-0 w-full shadow-md sticky top-0 z-[999]">
        <div className="h-[5rem] w-full bg-background py-[1.25rem] flex items-center">
            <Container>
                <div className="w-[43rem] h-full flex items-center gap-[1.5rem] w-full">
                    <Logo />
                    <div className="min-[49rem]:flex hidden gap-[1.5rem] w-full grow">
                        <div className="w-full grow flex gap-[.25rem]">
                            <NavLink active={pathName=== "/"} href={"/"}>Browse tools</NavLink>
                            <Show when={"signed-in"}>
                                <NavLink active={pathName=== "/myactivity"} href="/myactivity">My activity</NavLink>
                            </Show>
                        </div>
                        <UserWidget />
                    </div>
                    <div className="ml-auto min-[49rem]:hidden block">
                        <Button
                            size="large"
                            type="text"
                            icon={<MenuOutlined className="text-[1.5rem]" />}
                            onClick={showMobileMenu}
                        >
                        </Button>
                    </div>
                </div>
            </Container>
        </div>
        <Show when="signed-out">
            <div className="h-[2.375rem] bg-pale-blue w-full flex">
                <Container>
                    <div className="h-full flex items-center justify-between">
                        <div className="flex gap-[.25rem] items-center">
                            <UnlockFilled className="!text-primary" />
                            <div className="font-inter text-[.75rem] leading-[1rem]">Public Directory View</div>
                        </div>

                        <SignInButton mode="modal">
                            <Button type="primary" shape="round" size="small" className="">
                                <div className="flex gap-[.25rem] text-[.75rem] px-[.6rem]">
                                    Sign in to lend or borrow
                                    <ArrowRightOutlined />
                                </div>
                            </Button>
                        </SignInButton>
                    </div>
                </Container>
            </div>
        </Show>
        <MobileMenu setShown={setMobileMenuShown} shown={mobileMenushown} pathName={pathName} />
        <div className="absolute top-[6rem] min-[49rem]:hidden block right-[2rem] rounded-full overflow-hidden shadow-2xl w-max flex items-center justify-center">
            <UserButton
                appearance={{
                    elements: {
                        avatarBox: {width: "3rem", height: "3rem"},
                    },
                }} />
        </div>
    </div>;
};
