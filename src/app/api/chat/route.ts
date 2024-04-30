import { Configuration, OpenAIApi } from 'openai-edge';
import {OpenAIStream, StreamingTextResponse} from 'ai'
import { getContext } from '@/lib/context';
import { db } from '@/lib/db';
import { chats, messages as _messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { Message } from 'ai/react';

export const runtime = 'edge'

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(config)

export async function POST(req: Request) {
    try {
        const {messages, chatId} = await req.json();
        const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
        if (_chats.length != 1 ) {
            return NextResponse.json({'error': 'chat not found'}, {status:404}) 
        }
        const fileKey = _chats[0].fileKey
        const lastMessage = messages[messages.length -1];
        const context = await getContext(lastMessage.content, fileKey)

        const prompt = {
            role: "system",
            system: `AI assistant is brand new pwoerful human like atrificail intelligence.
                    The traits of AI include expert knowledge, helpfulness, articulatness and mentoring.
                    AI is always well-behaved, well-mannered and well-meaning.
                    AI is always kind and friendly and utilised the socratic method to help guide the learning and understanding of others.
                    AI is teacher and has the sum of all knowledge in their brain and is able to accurately answer questions with answers that guide others to discover solutions.
                    START OF CONTEXT BLOCk.
                    ${context} 
                    END OF CONTEXT BLOCK.
                    AI teacher will take into account and CONTENT BLOCK block provided.
                    AI will use the context to answer any questions refferencing the context directly and will do so utilising a socratic style of teaching
                    If the context does not provide an answer to the question the AI teacher will ask the relevance of the question and will help guide the student towards discovering the answer
                    AI will not invent anything that is not drawn directly from context`,
        };

        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                prompt, ...messages.filter((message: Message) => message.role === 'user'),
            ],
            stream: true
        })
        const stream = OpenAIStream(response, {
            onStart: async () => {
                // save user message into db 
                await db.insert(_messages).values({
                    chatId,
                    content: lastMessage.content,
                    role: 'user'
                })
            },
            onCompletion: async (completion) => {
                //save ai message to db
                await db.insert(_messages).values({
                    chatId,
                    content: completion,
                    role: 'system'
                })
            }
        });
        return new StreamingTextResponse(stream);
        
    } catch (error) {
        return new NextResponse('Error', { status: 500 });
    }
}