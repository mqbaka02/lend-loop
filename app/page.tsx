"use client";

import { api } from "@/convex/_generated/api";
import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

export default function Home() {

  const { user }= useUser();
  const [message, setMessage]= useState<string>("");

  const messages= useQuery(api.messages.list);
  const sendMessage= useMutation(api.messages.send);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Show when="signed-out">
          <h1 className="text-4xl font-bold text-black dark:text-white">
            Please sign in to send messages
          </h1>
          <SignInButton mode="modal">
            <button>Sign in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button>Sign up</button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-4">
            <h1 className="center">
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
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..."
            />
            <button type="submit">Send</button>
          </form>

          <h2>Messages from Convex:</h2>

          {messages?.map((msg) => (
            <p key={msg._id}>{msg.text}</p>
          ))}
        </Show>
      </main>
    </div>
  );
}
