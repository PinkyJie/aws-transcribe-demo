import cdk = require('@aws-cdk/core');

import { S3Buckets } from './s3';
import { DBTables } from './dynamodb';
import { SNSTopics } from './sns';
import { LambdaFunctions } from './lambda';
import { APIGateways } from './apigateway';
import { CloudFronts } from './cloudfront';
import { TAGS } from './constants';

export class AwsTranscribeDemoStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
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

        const cloudfronts = new CloudFronts(this, 'AllCloudFronts', {
            staticWebsiteBucket: s3Buckets.staticWebsiteBucket,
            audioFileBucket: s3Buckets.audioFileBucket,
            transcribedTextFileBucket: s3Buckets.transcribedTextFileBucket,
            backendAPIGateway: apiGateways.api,
        });

        // add Tags
        Object.keys(TAGS).forEach(key => {
            this.node.applyAspect(new cdk.Tag(key, TAGS[key]));
        });

        // tslint:disable-next-line: no-unused-expression
        new cdk.CfnOutput(this, 'CloudFrontURL', {
            value: cloudfronts.cloudfront.domainName,
        });
    }
}
