"use client";

import { ArrowRightOutlined, BellOutlined, DownOutlined, UnlockFilled } from "@ant-design/icons";
import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Badge, Button } from "antd";
import Container from "./Container";

export default function Header () {
    return <div className="flex flex-col gap-0 w-full shadow-md">
        <div className="h-[5rem] w-full bg-background p-[1.25rem] px-[3rem] flex items-center">
            <Container>
                <div className="w-[43rem] h-full flex gap-[1.5rem] w-full">
                    <div className="font-bold text-[1.25rem] text-primary w-[15rem] font-jakarta">LendLoop</div>
                    <div className="w-full grow flex gap-[.25rem]">
                        <NavLink active href="#">Browse tools</NavLink>
                        <Show when={"signed-in"}>
                            <NavLink href="#">My activity</NavLink>
                        </Show>
                    </div>
                    <UserWidget />
                </div>
            </Container>
        </div>
        <Show when="signed-out">
            <div className="h-[2.375rem] bg-pale-blue w-full flex px-[3rem]">
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
    </div>;
};

function NavLink({ href, children, active= false }: { href: string; children: React.ReactNode, active?: boolean }) {
    return (<>
        {
            active ?
            <div className="bg-pale-blue text-primary font-semibold text-[1rem] px-[1rem] py-[.5rem] leading-[1.5rem] rounded-md font-inter">
                {children}
            </div>
            :
            <a href={href} className={`bg-transparent text-foreground-1 font-semibold text-[.875rem] px-[1rem] py-[.5rem] leading-[1.5rem] font-inter`}>
                {children}
            </a>
        }
    </>);
};

function UserWidget () {
    const {user}= useUser();

    return <div className="ml-auto flex gap-[.20rem] h-full">
        <Show when={"signed-in"}>
            <div className="flex items-center h-full gap-[1rem]">
                <Badge dot>
                    <BellOutlined className="w-[1.2rem]" style={{ fontSize: 24 }} />
                </Badge>
                <div className="bg-white px-[.25rem] pr-[1.076rem] h-full rounded-full flex items-center gap-[.5rem]">
                    <UserButton />
                    <div className="flex flex-col gap-0">
                        <div className="leading-[1rem] text-[.75rem] font-semibold text-foreground-1 first-letter:uppercase">
                            {user?.firstName || user?.username}
                        </div>
                        <div className="leading-[1rem] text-[.75rem] text-primary">
                            @{user?.username}
                        </div>
                    </div>
                    <div className="ml-[.8rem] w-[.5rem] h-[.5rem] border-[2px] border-t-0 border-l-0 border-foreground transform rotate-45"></div>
                </div>
            </div>
        </Show>
        <Show when={"signed-out"}>
            <SignInButton mode="modal">
                <Button>Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
                <Button type="primary">Sign up</Button>
            </SignUpButton>
        </Show>
    </div>;
};