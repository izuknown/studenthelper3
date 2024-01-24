import { S3 } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export async function downloadFromS3(file_key: string) {
    try {
        const s3 = new S3({
            region: 'eu-west-2',
            credentials: {
                accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
            },
        });

        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: file_key
        };

        const { Body } = await s3.getObject(params);

        const tmpDir = 'C:\\tmp';  // Adjust the directory as per your OS and requirements
        const fileExtension = path.extname(file_key);
        const fileName = path.join(tmpDir, `${Date.now()}${fileExtension}`); // Example, you can change the extension

        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir);
        }

        if (Body instanceof Buffer) {
            fs.writeFileSync(fileName, Body);
        } else if (Body instanceof Readable) {
            // Handle the stream
            const fileStream = fs.createWriteStream(fileName);
            for await (const chunk of Body) {
                fileStream.write(chunk);
            }
            fileStream.end();
        } else {
            console.error('Received data is not a buffer or a readable stream');
            return null;
        }

        return fileName;
    } catch (error) {
        console.error('Error downloading from S3:', error);
        return null;
    }
}
