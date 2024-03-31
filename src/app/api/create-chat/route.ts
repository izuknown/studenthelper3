// /api/create-chat/route.ts

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
    const { userId } = await auth()
    if (!userId){
        return NextResponse.json({error: "unauthorised", status: 401})
    }
    try {
        const body = await req.json();
        const { file_key, file_name } = body;
        // Validate request body
        if (!file_key || !file_name) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }
        console.log(`Received file_key: ${file_key}, file_name: ${file_name}`);
        // Load S3 file into Pinecone
        await loadS3IntoPinecone(file_key);
        const chat_id = await db.insert(chats).values({
            fileKey: file_key,
            contentName: file_name,
            contentURL: getS3Url(file_key),
            userId,
        }).returning(
            {
                insertedId: chats.id,
            }
        );

        return NextResponse.json({
            chat_id: chat_id[0].insertedId,
        },
        {status: 200})
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
