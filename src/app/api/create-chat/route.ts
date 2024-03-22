// /api/create-chat/route.ts

import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
    try {
        const body = await req.json();
        const { file_key, file_name } = body;

        // Validate request body
        if (!file_key || !file_name) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        console.log(`Received file_key: ${file_key}, file_name: ${file_name}`);
        
        // Load S3 file into Pinecone
        const pages = await loadS3IntoPinecone(file_key);
        
        return NextResponse.json({ pages });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
