import cdk = require('@aws-cdk/core');

import { S3Buckets } from '../lib/s3';
import { DBTables } from '../lib/dynamodb';
import { SNSTopics } from '../lib/sns';
import { LambdaFunctions } from '../lib/lambda';
import { APIGateways } from '../lib/apigateway';
import { CloudFronts } from '../lib/cloudfront';
import { CrossRegionCfnCustomResource } from '../lib/custom-resource';
import {
    LAMBDA_EDGE_STACK_NAME,
    LAMBDA_EDGE_ARN_OUTPUT_NAME,
    LAMBDA_EDGE_VERSION_OUTPUT_NAME,
} from '../constants';

export interface MainStackProps extends cdk.StackProps {}

export class MainStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: MainStackProps) {
        super(scope, id, props);

        const s3Buckets = new S3Buckets(this, 'AllS3Buckets');
        const dynamoDBs = new DBTables(this, 'AllDBTables');
        const snsTopics = new SNSTopics(this, 'AllSNSTopics');

        const lambdaFunctions = new LambdaFunctions(
            this,
            'AllLambdaFunctions',
            {
                audioFileBucket: s3Buckets.audioFileBucket,
                transcribedTextFileBucket: s3Buckets.transcribedTextFileBucket,
                newAudioTopic: snsTopics.newAudioTopic,
                audiosTable: dynamoDBs.audiosTable,
            }
        );
        lambdaFunctions.grantPermissions(
            dynamoDBs.audiosTable,
            snsTopics.newAudioTopic
        );

        const apiGateways = new APIGateways(this, 'AllAPIGateways', {
            getUploadTokenFunc: lambdaFunctions.getUploadTokenFunc,
            getAudiosFunc: lambdaFunctions.getAudiosFunc,
        });

        const customResource = new CrossRegionCfnCustomResource(
            this,
            'AllCustomResource',
            {
                lambdaEdgeStackName: LAMBDA_EDGE_STACK_NAME,
                lambdaEdgeArnOutputName: LAMBDA_EDGE_ARN_OUTPUT_NAME,
                lambdaEdgeVersionOutputName: LAMBDA_EDGE_VERSION_OUTPUT_NAME,
            }
        );

        const cloudfronts = new CloudFronts(this, 'AllCloudFronts', {
            staticWebsiteBucket: s3Buckets.staticWebsiteBucket,
            audioFileBucket: s3Buckets.audioFileBucket,
            transcribedTextFileBucket: s3Buckets.transcribedTextFileBucket,
            backendAPIGateway: apiGateways.api,
            lambdaEdgeArn: customResource.lambdaEdgeOutput.arn,
            lambdaEdgeVersion: customResource.lambdaEdgeOutput.version,
        });

        // tslint:disable-next-line: no-unused-expression
        new cdk.CfnOutput(this, 'CloudFrontURL', {
            value: cloudfronts.cloudfront.domainName,
        });
    }
}
