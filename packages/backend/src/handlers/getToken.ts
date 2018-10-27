import * as uuid from 'uuid';
import {
    APIGatewayEventRequestContext,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from 'aws-lambda';
import { S3 } from 'aws-sdk';

export const handler = async (
    event: APIGatewayProxyEvent,
    context: APIGatewayEventRequestContext
): Promise<APIGatewayProxyResult> => {
    console.log(event);

    const s3 = new S3();
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
        headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
        statusCode: 200,
    };
};
