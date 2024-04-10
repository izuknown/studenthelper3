import ChatComponent from '@/components/ChatComponent';
import ChatSideBar from '@/components/ChatSideBar';
import LessonContent from '@/components/LessonContent';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import React from 'react'

type Props = {
    params: {
        chatId : string,
    };
};

const ChatPage  = async ({ params: {chatId} }: Props) => {
    const {userId} = await auth()
    if (!userId) {return redirect ('/sign-in')}

    const _chats = await db.select().from(chats).where(eq(chats.userId, userId))
    console.log('ChatId - userId', chatId, )
    if (!_chats || _chats.length === 0) {
        console.log('There are no chats');
        return redirect('/');
    }

    const validChatIds = _chats.map(chat => chat.id);
    
    if (!validChatIds.includes(parseInt(chatId))) {
        console.log('There is no valid chatId in chats database');
        return redirect('/');
    }

    if (!_chats){
        console.log('There are no chats view src/app/chat/[chatIdd]/page.tsx')
        return redirect('/')
    }

    if (!_chats.find(chat=>chat.id === parseInt(chatId))){
        console.log('There is no valid chatId in chats database')
        return redirect('/')
    }

    const currentchat = _chats.find(chat => chat.id === parseInt(chatId))

    return (
        <div className='flex max-h-screen overflow-scroll' >
            <div className='flex w-full max-h-screen overflow-screen'>
                {/* ChatSiderBar */}
                <div className='flex-[1] max-w-xs'> <ChatSideBar chats={_chats} chatId={parseInt(chatId)}/>  </div>

                {/* Lesson Content */}
                <div className='max-h-screen p-4 overflow-scroll flex-[5]'>  <LessonContent contentURL={currentchat?.contentURL || ''} /> </div>

                {/* Chat Component */}
                <div className='flex-[3] border-l-4 border-l-4 border-l-slate-200'> <ChatComponent chatId={parseInt(chatId)}/>  </div>

            </div>
            
        </div>
      ) 
      
    }
    
    export default ChatPage 