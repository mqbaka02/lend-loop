"use client";

import Container from "./Container";
import Logo from "./Logo";

export default function Footer () {
    return <>
        <div className="bg-light-blue w-full mt-auto self-end">
            <Container>
                <div className="flex flex-col min-[50rem]:flex-row gap-[2rem] min-[50rem]:gap-0 justify-between w-full py-[2.5rem]">
                    <div className="flex h-full w-full flex-col gap-[.5rem]">
                        <Logo/>
                        <div className="text-foreground-1">
                            Borrow what you need. Lend what you don't.
                        </div>
                        <p className="text-foreground text-[.875rem]">Cultivating resilient, high-trust neighborhoods one borrowed tool at a time.</p>
                    </div>
                    <div className="h-full w-full flex flex-col items-end justify-end self-end">
                        <p className="text-[.75rem]">© {(new Date()).getFullYear()} LendLoop Mutual Aid Commons</p>
                    </div>
                </div>
            </Container>
        </div>
    </>
};