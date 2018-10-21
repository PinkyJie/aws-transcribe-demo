import {
    APIGatewayEventRequestContext,
    APIGatewayProxyResult,
    SNSEvent,
} from 'aws-lambda';
import { DynamoDB, TranscribeService } from 'aws-sdk';

import { AUDIO_PROCESS_STATUS } from './types';

export const handler = async (
    event: SNSEvent,
    context: APIGatewayEventRequestContext
): Promise<APIGatewayProxyResult> => {
    console.log(event.Records[0].Sns);

    const recordId = event.Records[0].Sns.Message;

    // Creating new record in DynamoDB table
    const dynamoDb = new DynamoDB.DocumentClient();
    const audioItem = await dynamoDb
        .get({
            Key: {
                id: recordId,
            },
            TableName: process.env.DB_TABLE_NAME,
        })
        .promise();
    console.log('audioItem:', audioItem);

    // start transcribe
    const transcribe = new TranscribeService();
    const job = await transcribe
        .startTranscriptionJob({
            TranscriptionJobName: recordId,
            LanguageCode: 'en-US',
            MediaFormat: 'mp3',
            Media: {
                MediaFileUri: audioItem.Item.audioUrl,
            },
            OutputBucketName: process.env.OUTPUT_BUCKET_NAME,
            Settings: {
                ShowSpeakerLabels: true,
                MaxSpeakerLabels: 2,
            },
        })
        .promise();
    console.log('job:', job);

    // write transcription job id back to db
    const updatedItem = await dynamoDb
        .update({
            Key: {
                id: recordId,
            },
            UpdateExpression: 'set #s = :s',
            ExpressionAttributeValues: {
                ':s': AUDIO_PROCESS_STATUS.PROCESSING,
            },
            ExpressionAttributeNames: {
                '#s': 'status',
            },
            TableName: process.env.DB_TABLE_NAME,
            ReturnValues: 'ALL_NEW',
        })
        .promise();
    console.log('updatedItem:', updatedItem);

    return {
        body: `Transcription job submitted: ${
            job.TranscriptionJob.TranscriptionJobName
        }`,
        statusCode: 200,
    };
};
