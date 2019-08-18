import { SNSHandler } from 'aws-lambda';
import { DynamoDB, TranscribeService } from 'aws-sdk';

import { AUDIO_PROCESS_STATUS } from '../types';

export const handler: SNSHandler = async event => {
    console.log(event.Records[0].Sns);
    const { DB_TABLE_NAME, OUTPUT_BUCKET_NAME } = process.env;

    const recordId = event.Records[0].Sns.Message;

    // Creating new record in DynamoDB table
    const dynamoDb = new DynamoDB.DocumentClient();
    const audioItem = await dynamoDb
        .get({
            Key: {
                id: recordId,
            },
            TableName: DB_TABLE_NAME,
        })
        .promise();
    console.log('audioItem:', audioItem);

    // start transcribe
    const transcribe = new TranscribeService();
    const filePathParts = audioItem.Item.audioUrl.split('.');
    const fileExt = filePathParts[filePathParts.length - 1].toLowerCase();
    const job = await transcribe
        .startTranscriptionJob({
            TranscriptionJobName: recordId,
            LanguageCode: 'en-US',
            MediaFormat: fileExt,
            Media: {
                MediaFileUri: audioItem.Item.audioUrl,
            },
            OutputBucketName: OUTPUT_BUCKET_NAME,
            Settings: {
                ShowSpeakerLabels: true,
                MaxSpeakerLabels: audioItem.Item.speakers,
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
            TableName: DB_TABLE_NAME,
            ReturnValues: 'ALL_NEW',
        })
        .promise();
    console.log('updatedItem:', updatedItem);
};
