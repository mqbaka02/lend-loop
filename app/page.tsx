"use client";

import { api } from "@/convex/_generated/api";
import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import Container from "./components/layout/Container";

export default function Home() {

  const { user }= useUser();
  const [message, setMessage]= useState<string>("");

  const messages= useQuery(api.messages.list);
  const sendMessage= useMutation(api.messages.send);

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 w-full flex-col gap-0 items-center justify-between py-32 px-16 sm:items-start">
        <Hero/>
        {/* <Show when="signed-out">
          <h1 className="text-4xl font-bold">
            Please sign in to send messages
          </h1>
          <SignInButton mode="modal">
            <Button type="primary">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button type="primary">Sign up</Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-4">
            <h1 className="center !text-foreground-1">
              Hello, {user?.firstName || user?.username}!
            </h1>
            <UserButton />
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!message.trim()) return;

              await sendMessage({ text: message });
              setMessage("");
            }}
          >
            <TextArea onChange={(e)=> setMessage(e.target.value)} value={message} placeholder="Write a message..." />
            <Button type="primary" htmlType="submit">Send</Button>
          </form>

          <h2>Messages from Convex:</h2>

          {messages?.map((msg) => (
            <p key={msg._id}>{msg.text}</p>
          ))}
        </Show> */}
      </main>
    </div>
  );
};

function Hero () {
  return <div className="w-full min-h-[40rem] flex items-center justify-center bg-[#faf8ff]">
    <Container>
      <div className="w-full mx-auto my-auto flex gap-[2rem] min-[64rem]:flex-row flex-col h-full">
        <div className="flex-[61.8] w-full flex flex-col gap-[1rem]">
          <div className="rounded-full bg-secondary flex gap-[.25rem] items-center px-[1rem] py-[.25rem] text-primary font-semibold leading-[.875rem] text-[.75rem] w-max tracking-[0.038rem]">
            <div className="w-[.5rem] h-[.5rem] rounded-full bg-primary"></div>
            CIVIC SHARING COMMONS
          </div>
          <div className="flex flex-col gap-[.25rem] w-full">
            <div className="text-[.875rem] text-primary font-semibold leading-[1.25rem] tracking-[0.04rem]">LENDLOOP NEIGHBORHOOD NETWORK</div>
            <h1 className="text-[3rem] text-foreground-1 font-bold leading-[125%] font-jakarta">Borrow what you need.<br/><span className="italic text-primary">Lend what you don't.</span></h1>
          </div>
        </div>
        <div className="flex-[38.2] w-full flex flex-col gap-[1rem]"></div>
      </div>
    </Container>
  </div>
};
