import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB, TranscribeService } from 'aws-sdk';

import { AUDIO_PROCESS_STATUS } from '../types';
import { commonCORSHeader } from '../constants';

export const handler: APIGatewayProxyHandler = async event => {
    console.log(event);
    const { DB_TABLE_NAME } = process.env;

    const recordId = event.queryStringParameters
        ? event.queryStringParameters.recordId
        : '*';

    // Querying records in DynamoDB table
    const dynamoDb = new DynamoDB.DocumentClient();
    let results;
    if (recordId === '*') {
        results = await dynamoDb
            .scan({
                TableName: DB_TABLE_NAME,
            })
            .promise();
    } else {
        results = await dynamoDb
            .query({
                ExpressionAttributeValues: {
                    ':id': recordId,
                },
                KeyConditionExpression: 'id = :id',
                TableName: DB_TABLE_NAME,
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
                        const isSuccess =
                            job.TranscriptionJob.TranscriptionJobStatus ===
                            'COMPLETED';
                        let updateExpression;
                        let expressionAttributeValues;
                        let expressionAttributeNames;
                        if (isSuccess) {
                            expressionAttributeNames = {
                                '#s': 'status',
                            };
                            updateExpression = 'set #s = :s, textUrl = :t';
                            expressionAttributeValues = {
                                ':s': AUDIO_PROCESS_STATUS.TRANSCRIBED,
                                ':t':
                                    job.TranscriptionJob.Transcript
                                        .TranscriptFileUri,
                            };
                        } else {
                            expressionAttributeNames = {
                                '#s': 'status',
                                '#e': 'error',
                            };
                            updateExpression = 'set #s = :s, #e = :e';
                            expressionAttributeValues = {
                                ':s': AUDIO_PROCESS_STATUS.TRANSCRIBE_FAILED,
                                ':e': job.TranscriptionJob.FailureReason,
                            };
                        }
                        const updatedAudio = await dynamoDb
                            .update({
                                Key: {
                                    id: item.id,
                                },
                                UpdateExpression: updateExpression,
                                ExpressionAttributeNames: expressionAttributeNames,
                                ExpressionAttributeValues: expressionAttributeValues,
                                TableName: DB_TABLE_NAME,
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
        headers: commonCORSHeader,
        statusCode: 200,
    };
};
