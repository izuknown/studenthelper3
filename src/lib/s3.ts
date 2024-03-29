import { S3 } from '@aws-sdk/client-s3';

export async function UploadToS3(file: File) {
    try {
        const s3 = new S3({
            region: 'eu-west-2',
            credentials: {
                accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
            },
        });

        const file_key = 'uploads/' + Date.now().toString() + (file.name ?? '').replace(' ', '-');


        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: file_key,
            Body: file,
        };

        await s3.putObject(params);
        console.log('Successfully uploaded to S3!', file_key);

        return {
            file_key,
            file_name: file.name
        };

    } catch (error) {
        console.error('Error uploading to S3:', error);
        return Promise.reject(error);
    }
}

export function getS3Url(file_key: string) {
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.eu-west-1.amazonaws.com/${file_key}`;
    return url;
}
