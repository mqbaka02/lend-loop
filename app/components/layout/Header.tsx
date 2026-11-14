"use client";

import { ArrowRightOutlined, CloseCircleOutlined, LogoutOutlined, MenuOutlined, UnlockFilled } from "@ant-design/icons";
import { Show, SignInButton, SignOutButton, SignUpButton, UserAvatar, UserButton, UserProfile, useUser } from "@clerk/nextjs";
import { Button } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminSwitcher from "../AdminSwitcher";
import Container from "./Container";
import Logo from "./Logo";
import { SetStateAction, useState } from "react";
import Image from "next/image";

export default function Header () {
    const pathName= usePathname();
    const [mobileMenushown, setMobileMenuShown]= useState<boolean>(false);

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
                            onClick={()=> {setMobileMenuShown(true)}}
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

function NavLink({ href, children, active= false }: { href: string; children: React.ReactNode, active?: boolean }) {
    return (<>
        {
            active ?
            <div className="bg-pale-blue text-primary font-semibold text-[1rem] px-[1rem] py-[.5rem] leading-[1.5rem] rounded-md font-inter">
                {children}
            </div>
            :
            <Link href={href} className={`bg-transparent hover:bg-pale-blue/30 transition duration-300 rounded-md text-foreground-1 font-semibold text-[.875rem] px-[1rem] py-[.5rem] leading-[1.5rem] font-inter`}>
                {children}
            </Link>
        }
    </>);
};

function MobileNavLink({ href, children, active= false }: { href: string; children: React.ReactNode, active?: boolean }) {
    return (<>
        {
            active ?
            <div className="bg-pale-blue text-primary font-semibold text-[1rem] px-[1rem] py-[.5rem] leading-[1.5rem] rounded-md font-inter">
                {children}
            </div>
            :
            <Link href={href} className={`bg-transparent hover:bg-pale-blue/30 transition duration-300 rounded-md text-white font-semibold text-[.875rem] px-[1rem] py-[.5rem] leading-[1.5rem] font-inter`}>
                {children}
            </Link>
        }
    </>);
};

function UserWidget () {
    const {user}= useUser();

    const clickButton= ()=> {
        const clerkUserButton= document.querySelector(".clerk-user-button button") as HTMLButtonElement;
        if (clerkUserButton){
            // console.log("clicked !");
            clerkUserButton.click();
        } else {
            // console.error("Error!");
        }
    };

    return <div className="ml-auto flex gap-[.20rem] h-full">
        <Show when={"signed-in"}>
            <div className="flex items-center h-full gap-[1rem]">
                <AdminSwitcher />
                <div className="bg-white px-[.25rem] pr-[1.076rem] h-full rounded-full flex items-center gap-[.5rem] cursor-pointer" onClick={clickButton}>
                    <UserButton 
                        appearance={{
                        elements: {
                            rootBox: "clerk-user-button"
                        }
                        }}
                    />
                    <div className="flex flex-col gap-0 max-w-[6rem]" title={user?.firstName && user.lastName ? user.firstName +" " + user.lastName : user?.username||undefined}>
                        <div className="leading-[1rem] text-[.75rem] font-semibold text-foreground-1 first-letter:uppercase w-full overflow-hidden truncate">
                            {
                                user?.firstName && user.lastName ? <>{user.firstName} {user.lastName}</> : <>{user?.username}</>
                            }
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

const MobileMenu= ({shown, setShown, pathName}: {
    shown: boolean,
    setShown: React.Dispatch<SetStateAction<boolean>>,
    pathName: string,
})=> {
    const { user } = useUser();
    return <div className={`absolute min-[49rem]:hidden block top-0 left-0 h-screen w-full bg-black/20 backdrop-blur-sm transition duration-300 ${shown? 'opacity-100 pointer-events-auto': 'opacity-0 pointer-events-none'}`} onClick={()=> setShown(false)}>
        <div className={`w-full max-w-[25rem] bg-primary h-full transform transition-all duration-300 ${!shown? 'translate-x-[-100%]': 'translate-x-0'}`}>
            <Container>
                <div className="flex flex-col gap-[2rem]">
                    <div className="w-[43rem] h-full flex items-center gap-[1.5rem] w-full py-[1.25rem]">
                        <Logo dark />
                        <div className="ml-auto">
                            <Button
                                size="large"
                                type="text"
                                icon={<CloseCircleOutlined className="!text-[1.5rem] !text-white" />}
                                onClick={()=> {setShown(false)}}
                            >
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-[.5rem]">
                        <MobileNavLink active={pathName=== "/"} href={"/"} >Browse Tools</MobileNavLink>
                        <Show when={"signed-in"}>
                            <MobileNavLink active={pathName === "/myactivity"} href="/myactivity">My activity</MobileNavLink>
                        </Show>
                    </div>
                    <div className="flex flex-col gap-[1rem] w-full items-center">
                        <div className="w-[10rem] h-[10rem] rounded-full overflow-hidden">
                            <Image src={user?.imageUrl || "/hero_.jpg"} alt="rer" width={300} height={300} className="object-cover h-full" />
                        </div>
                        <AdminSwitcher mobile />
                        <SignOutButton>
                            <Button
                                danger
                                size="large"
                                icon={<LogoutOutlined />}
                            >
                                Log Out
                            </Button>
                        </SignOutButton>
                    </div>
                </div>
            </Container>
        </div>
    </div>;
};
