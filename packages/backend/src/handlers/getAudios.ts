import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB, TranscribeService } from 'aws-sdk';
import { AUDIO_PROCESS_STATUS } from './types';

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log(event);

    const recordId = event.queryStringParameters
        ? event.queryStringParameters.recordId
        : '*';

    const tableName = process.env.DB_TABLE_NAME;

    // Querying records in DynamoDB table
    const dynamoDb = new DynamoDB.DocumentClient();
    let results;
    if (recordId === '*') {
        results = await dynamoDb
            .scan({
                TableName: tableName,
            })
            .promise();
    } else {
        results = await dynamoDb
            .query({
                ExpressionAttributeValues: {
                    ':id': recordId,
                },
                KeyConditionExpression: 'id = :id',
                TableName: tableName,
            })
            .promise();
    }
    console.log('results:', results);

    // check the status for each items
    const transcribe = new TranscribeService();
    const newResults = await Promise.all(
        results.Items.map(
            async (item: DynamoDB.DocumentClient.AttributeMap) => {
                console.log('item:', item);
                if (item.status === AUDIO_PROCESS_STATUS.PROCESSING) {
                    const job = await transcribe
                        .getTranscriptionJob({
                            TranscriptionJobName: item.id,
                        })
                        .promise();
                    console.log('job:', job);
                    if (
                        job.TranscriptionJob.TranscriptionJobStatus !==
                        'IN_PROGRESS'
                    ) {
                        const updatedAudio = await dynamoDb
                            .update({
                                Key: {
                                    id: item.id,
                                },
                                UpdateExpression: 'set #s = :s, textUrl = :t',
                                ExpressionAttributeNames: {
                                    '#s': 'status',
                                },
                                ExpressionAttributeValues: {
                                    ':s':
                                        job.TranscriptionJob
                                            .TranscriptionJobStatus ===
                                        'COMPLETED'
                                            ? AUDIO_PROCESS_STATUS.TRANSCRIBED
                                            : AUDIO_PROCESS_STATUS.TRANSCRIBE_FAILED,
                                    ':t':
                                        job.TranscriptionJob.Transcript
                                            .TranscriptFileUri,
                                },
                                TableName: tableName,
                                ReturnValues: 'ALL_NEW',
                            })
                            .promise();
                        console.log('updateAudio:', updatedAudio);
                        return updatedAudio.Attributes;
                    }
                }
                return Promise.resolve(item);
            }
        )
    );

    return {
        body: JSON.stringify(newResults),
        headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
        statusCode: 200,
    };
};
