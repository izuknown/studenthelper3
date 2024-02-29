import React from 'react'
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation"

type Props = {
    params:{chatId: string;}
};

function ChatPage = aync ({params:{chatId}}: Props) {
    const  {userId} = await auth() 
    if (!userId) {
        redirect redirect('/sign-in')
    }
  return (
    <div>{chatId}</div>
  )
}

export default ChatPage