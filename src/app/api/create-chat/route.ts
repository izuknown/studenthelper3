import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone_dep";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
    const {userId}= await auth()
    if (!userId) {
        return NextResponse.json({error: "unauthorised"}, {status:401});
        }
    }
    try {
        const body = await req.json();
        const { file_key, file_name } = body;
        console.log(file_key, file_name);
        await loadS3IntoPinecone(file_key);
        await db.insert(chats).values({
            fileKey: file_key,
            contentName: file_name,
            contentURL: getS3Url(file_key),
            userId,
        })

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server error" },
            { status: 500 }
        );
    }
}
