'Use client'
import { DrizzleChat } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { MessageCircle, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
    chats: DrizzleChat[],
    chatId: number,
}


const ChatSideBar = ({chats, chatId}: Props) => {
  return (
    <div className='w-full h-screen p-4 text-grey-200 bg-grey-900'>
        <Link href='/'>
            <button className='w-full border-dashed border-white border'> 
            <PlusCircle className='mr-2 w-4 h-4' />
            Create New Lesson 
            </button>
        </Link>

        <div className="flex flexcol gap-2 mt-4">
            {chats.map(chat => (
                <link key={chat.id} href={`/chat/${chat.id}`}>
                    <div className={
                        cn('rounded-lg p-3 text-clate-300 flex items-center', {
                            'bg-blue-300 text-white': chat.id === chatId,
                            'hover:text-white': chat.id !== chatId,
                        })
                    }>
                        <MessageCircle className='mr-2'/>
                        <p className='w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis'>{chat.contentName}</p>
                    </div>
                </link>
            ))}
        </div>

                    <div className='absolute bottom-4 left-4'>
                        <div className='flex items-center gap-2 text-sm text-slate-500 flex-wrap'>
                            <link href='/'> Home </link>
                            <link href='/'> Source </link>
                            {/* Stripe Button */}
                        </div>
                    </div>
    </div>
  )
}

export default ChatSideBar