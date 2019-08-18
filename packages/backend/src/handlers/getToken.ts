import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3 } from 'aws-sdk';

import { commonCORSHeader } from '../constants';

export const handler: APIGatewayProxyHandler = async event => {
    console.log(event);

    const s3 = new S3();
    /**
     * In order to make sure the presigned data generated can be used
     * to upload file to bucket, the role for this lambda must have write
     * access to the bucket.
     */
    const presignedData = await s3.createPresignedPost({
        Bucket: process.env.BUCKET_NAME,
        Fields: {
            key: event.queryStringParameters.key,
            'Content-Type': event.queryStringParameters.type,
        },
        Expires: 900,
    });

    console.log('presign:', presignedData);

    return {
        body: JSON.stringify(presignedData),
        headers: commonCORSHeader,
        statusCode: 200,
    };
};
