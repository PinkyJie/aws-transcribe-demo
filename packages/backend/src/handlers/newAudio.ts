import * as uuid from 'uuid';
import { DynamoDB, SNS } from 'aws-sdk';
import { APIGatewayProxyResult, S3Event } from 'aws-lambda';

import { AUDIO_PROCESS_STATUS } from './types';

export const handler = async (
    event: S3Event
): Promise<APIGatewayProxyResult> => {
    console.log(event.Records[0].s3);

    const region = event.Records[0].awsRegion;
    const bucketName = event.Records[0].s3.bucket.name;
    const fileName = event.Records[0].s3.object.key;

    const recordId = uuid.v1();
    const timestamp = new Date().getTime();

    // Creating new record in DynamoDB table
    const dynamoDb = new DynamoDB.DocumentClient();
    await dynamoDb
        .put({
            TableName: process.env.DB_TABLE_NAME,
            Item: {
                id: recordId,
                status: AUDIO_PROCESS_STATUS.UPLOADED,
                audioUrl: `https://s3-${region}.amazonaws.com/${bucketName}/${fileName}`,
                createdAt: timestamp,
                updatedAt: timestamp,
            },
        })
        .promise();

    // Sending notification about new post to SNS
    const sns = new SNS();
    await sns
        .publish({
            Message: recordId,
            TopicArn: process.env.SNS_TOPIC,
        })
        .promise();

    return {
        statusCode: 200,
        body: JSON.stringify({ id: recordId }),
    };
};
