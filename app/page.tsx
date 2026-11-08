"use client";

import { ArrowDownOutlined, CiOutlined, SwapOutlined, UserOutlined } from "@ant-design/icons";
import { Show, SignInButton } from "@clerk/nextjs";
import { Button } from "antd";
import Image from "next/image";
import Container from "./components/layout/Container";
import ToolsList from "./components/ToolsList";

export default function Home() {

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 w-full flex-col gap-0">
        <Hero/>
        <ToolsList />
      </main>
    </div>
  );
};

function Hero () {
  return <div className="w-full min-h-[35rem] flex items-center justify-center bg-[#faf8ff]">
    <Container>
      <div className="w-full mx-auto my-auto flex gap-[2rem] min-[64rem]:flex-row flex-col h-full">
        <div className="flex-[61.8] w-full flex flex-col gap-[1rem]">
          <div className="rounded-full bg-secondary flex gap-[.25rem] items-center px-[1rem] py-[.25rem] text-primary font-semibold leading-[.875rem] text-[.75rem] w-max tracking-[0.038rem]">
            <div className="w-[.5rem] h-[.5rem] rounded-full bg-primary"></div>
            CIVIC SHARING COMMONS
          </div>
          <div className="flex flex-col gap-[.25rem] w-full">
            <div className="text-[.875rem] text-primary font-semibold leading-[1.25rem] tracking-[0.04rem]">LENDLOOP NEIGHBORHOOD NETWORK</div>
            <div className="flex flex-col gap-[1rem]">
              <h1 className="text-[3rem] text-foreground-1 font-bold leading-[125%] font-jakarta">Borrow what you need.<br/><span className="italic text-primary">Lend what you don't.</span></h1>
              <p className="tracking-0 leading-[155.5%] text-[1.125rem] text-foreground text-balance font-light font-inter">Why buy a miter saw or pressure washer for a single weekend? LendLoop connects neighbors to share everyday gear, cut household consumption, and build trust street by street.</p>
              <div className="flex flex-col min-[40rem]:flex-row gap-[1rem]">
                <Show when={"signed-in"}>
                  <Button type="primary" size="large">
                    <div className="flex gap-[.5rem] text-[.875rem] font-semibold px-[.8rem] py-[.75rem] leading-[1.25rem]">
                      <SwapOutlined />
                      Lend or Borrow
                    </div>
                  </Button>
                </Show>
                <Show when={"signed-out"}>
                  <SignInButton mode="modal">
                    <Button type="primary" size="large">
                      <div className="flex gap-[.5rem] text-[.875rem] font-semibold px-[.8rem] py-[.75rem] leading-[1.25rem]">
                        <UserOutlined />
                        Sign in with Clerk to Lend or Borrow
                      </div>
                    </Button>
                  </SignInButton>
                </Show>
                <Button color="default" size="large">
                  <div className="flex gap-[.5rem] text-[.875rem] font-semibold px-[.8rem] py-[.75rem] leading-[1.25rem]">
                    Explore catalog
                    <ArrowDownOutlined />
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-[38.2] w-full flex flex-col gap-[1rem]">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full relative rounded-xl overflow-hidden">
              <Image src={"/hero_.jpg"} alt="Tools" width={480} height={360} className="w-full" />
              {/* <div className="absolute top-0 bottom-0 right-0 left-0 z-[10] bg-gradient-to-b from-transparent to-black/80 flex items-end justify-center gap-[1.5rem] pb-[1.25rem]">
                <SmallBadgeWithIcon icon={<CiOutlined />} text={"Zero fees"} />
                <SmallBadgeWithIcon icon={<CiOutlined />} text={"Zero fees"} />
                <SmallBadgeWithIcon icon={<CiOutlined />} text={"Zero fees"} />
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </Container>
  </div>
};

const SmallBadgeWithIcon= ({icon, text}: {icon: React.ReactNode, text: React.ReactNode})=> {
  return <>
    <div className="flex gap-[.25rem] items-center justify-center bg-background p-[.40rem] px-[1.2rem] rounded-sm">
      <div className="text-primary w-[1rem]">
        {icon}
      </div>
      <div className="text-[.875rem] text-foreground leading-[1.25rem]">
        {text}
      </div>
    </div>
  </>;
};