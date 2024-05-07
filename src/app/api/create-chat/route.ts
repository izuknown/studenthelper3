import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { createAndUploadPDF } from "@/lib/pdfUpload"; // Import the function
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { returnPDFFilePath, getStoredPDFFilePath } from "@/lib/pdfFilePath";

// /api/create-chat
export async function POST(req: Request, res: Response) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "unauthorised", status: 401 });
    }

    try {
        const body = await req.json();
        const { file_key, file_name } = body;
        await loadS3IntoPinecone(file_key); // Load S3 file into Pinecone

        // Get pdfFilePath from pdfUpload.ts
        const pdfFilePath = getStoredPDFFilePath();

        // Insert chat data into the database
        const chat_id = await db
            .insert(chats)
            .values({
                fileKey: file_key,
                contentName: file_name,
                contentURL: getS3Url(file_key),
                transcriptionurl: pdfFilePath,
                userId,
            })
            .returning({
                insertedId: chats.id,
            });

        console.log('Chat ID created');
        
        return NextResponse.json({
            chat_id: chat_id[0].insertedId
        }, {
            status: 200
        });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
