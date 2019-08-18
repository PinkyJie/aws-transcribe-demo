import * as uuid from 'uuid';
import { DynamoDB, SNS } from 'aws-sdk';
import { S3Handler } from 'aws-lambda';

import { AUDIO_PROCESS_STATUS } from '../types';

export const SPEAKER_COUNT_REGEX = /^(.*)_SPEAKER(\d+)\.(mp3|MP3|wav|WAV)$/;

export const handler: S3Handler = async event => {
    console.log(event.Records[0].s3);
    const { DB_TABLE_NAME, SNS_TOPIC } = process.env;

    const region = event.Records[0].awsRegion;
    const bucketName = event.Records[0].s3.bucket.name;
    const fileName = event.Records[0].s3.object.key;

    const recordId = uuid.v1();
    const timestamp = new Date().getTime();

    // Creating new record in DynamoDB table
    const dynamoDb = new DynamoDB.DocumentClient();
    await dynamoDb
        .put({
            TableName: DB_TABLE_NAME,
            Item: {
                id: recordId,
                status: AUDIO_PROCESS_STATUS.UPLOADED,
                speakers: Number(fileName.match(SPEAKER_COUNT_REGEX)[2]),
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
            TopicArn: SNS_TOPIC,
        })
        .promise();
};
