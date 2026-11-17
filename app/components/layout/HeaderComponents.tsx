import { CloseCircleOutlined, LoginOutlined, LogoutOutlined } from "@ant-design/icons";
import { Show, SignInButton, SignOutButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "antd";
import Image from "next/image";
import Link from "next/link";
import { SetStateAction } from "react";
import AdminSwitcher from "../AdminSwitcher";
import Container from "./Container";
import Logo from "./Logo";

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
                        <div className="flex flex-col items-center">
                            <div className="text-white text-[1.2rem]">
                                {
                                    user?.firstName && user.lastName ? <>{user.firstName} {user.lastName}</> : <>{user?.username}</>
                                }
                            </div>
                            <div className="text-white/50">@{user?.username}</div>
                        </div>
                        <AdminSwitcher mobile />
                        <Show when={"signed-in"}>
                            <SignOutButton>
                                <Button
                                    danger
                                    size="large"
                                    icon={<LogoutOutlined />}
                                >
                                    Sign Out
                                </Button>
                            </SignOutButton>
                        </Show>
                        <Show when={"signed-out"}>
                            <SignInButton>
                                <Button
                                    size="large"
                                    icon={<LoginOutlined />}
                                >
                                    Sign In
                                </Button>
                            </SignInButton>
                        </Show>
                    </div>
                </div>
            </Container>
        </div>
    </div>;
};

export { MobileMenu, MobileNavLink, NavLink, UserWidget };
