import { Configuration, OpenAIApi } from "openai-edge";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Message } from "ai";

export const runtime = "edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }
    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];

    const context = await getContext(lastMessage.content, fileKey);
    
    console.log('Context:', context, 'context');
    const prompt = {
      role: "system",
      content: `AI assistant is brand new powerful human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, articulateness, and mentoring.
      AI is always well-behaved, well-mannered, and well-meaning.
      AI is always kind and friendly and utilizes the Socratic method to help guide the learning and understanding of others.
      AI is a teacher and has the sum of all knowledge in their brain and is able to accurately answer questions with answers that guide others to discover solutions.
      START OF CONTEXT BLOCK.
      ${context} 
      END OF CONTEXT BLOCK.
      AI teacher will take into account any CONTEXT BLOCK provided.
      AI will use the context to answer any questions referencing the context directly and will do so utilizing a Socratic style of teaching.
      If the context does not provide an answer to the question, the AI teacher will ask the relevance of the question and will help guide the student towards discovering the answer.
      AI will not invent anything that is not drawn directly from context`,
    };

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        prompt,
        ...messages.filter((message: Message) => message.role === "user"),
      ],
      stream: true,
    });
    console.log('context is', context)
    console.log('prompt is', prompt)
    console.log('Message is', messages)
    console.log('Generating AI response using OpenAIs createChatCompletion method, chat/route.ts.')


    const stream = OpenAIStream(response, {
        onStart: async () => {
          console.log('save user message to database, chat/rout.ts') 
          await db.insert(_messages).values({
            chatId,
            messageContent: lastMessage.content,
            role: 'user'
          });
          console.log('inserting user message to database, chat/rout.ts')
        },
        onCompletion: async (completion) => {
          console.log('save ai message to database, chat/rout.ts')
          await db.insert(_messages).values({
            chatId,
            messageContent: completion,
            role: 'system'
          });
          console.log('inserting ai message to database, chat/rout.ts')
        }
      });
    console.log('Returning a StreamingTextResponse with the generated response stream')
    return new StreamingTextResponse(stream);
  } catch (error){
    console.log('error in chat process', error)
  }
}
