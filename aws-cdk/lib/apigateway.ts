import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import apiGateway = require('@aws-cdk/aws-apigateway');

import { API_PATH_PREFIX } from '../constants';

export interface APIGatewayProps {
    getUploadTokenFunc: lambda.Function;
    getAudiosFunc: lambda.Function;
}

export class APIGateways extends cdk.Construct {
    public readonly api: apiGateway.RestApi;

    constructor(scope: cdk.Construct, id: string, props: APIGatewayProps) {
        super(scope, id);

        this.api = new apiGateway.RestApi(scope, 'AWSTranscribeAPI', {
            deployOptions: {
                /**
                 * Use "api" as stage name so it's easier for cloudfront mapping
                 */
                stageName: API_PATH_PREFIX,
            },
        });

        this.api.root
            .addResource('token')
            .addMethod(
                'GET',
                new apiGateway.LambdaIntegration(props.getUploadTokenFunc)
            );

        this.api.root
            .addResource('audios')
            .addMethod(
                'GET',
                new apiGateway.LambdaIntegration(props.getAudiosFunc)
            );
    }
}
