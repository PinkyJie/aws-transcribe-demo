import * as uuid from 'uuid';
import {
    APIGatewayEventRequestContext,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from 'aws-lambda';
import { STS } from 'aws-sdk';

export const handler = async (
    event: APIGatewayProxyEvent,
    context: APIGatewayEventRequestContext
): Promise<APIGatewayProxyResult> => {
    console.log(event);

    const sts = new STS();
    const role = await sts
        .assumeRole({
            RoleArn: process.env.ROLE_ARN,
            RoleSessionName: uuid.v1(),
            DurationSeconds: 1800,
        })
        .promise();

    console.log('role:', role);

    return {
        body: JSON.stringify(role.Credentials),
        headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
        statusCode: 200,
    };
};
