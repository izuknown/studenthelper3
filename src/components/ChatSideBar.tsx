'use client'
import { DrizzleChat } from '@/lib/db/schema'
import { PlusCircle } from 'lucide-react';
import React from 'react'

type Props = {
    chats: DrizzleChat[],
    chatId: number,
};

const ChatSidebar = ({chats, chatId}: Props) => {
  return (
   <div className='w-full h-screen p-4 text-grey-200 dg-grey-900'>
        <link href='/'>
            <button>
                <PlusCircle className='mr-2 w-4 h-4' />
                Create New Lesson
            </button>
        </link>

   </div> 
  )
}

export default ChatSidebar