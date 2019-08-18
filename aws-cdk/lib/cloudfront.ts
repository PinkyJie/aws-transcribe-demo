import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import lambda = require('@aws-cdk/aws-lambda');
import apiGateway = require('@aws-cdk/aws-apigateway');
import cloudfront = require('@aws-cdk/aws-cloudfront');
import iam = require('@aws-cdk/aws-iam');

import {
    API_PATH_PREFIX,
    AUDIO_FILE_URL_PREFIX,
    TRANSCRIBED_TEXT_FILE_URL_PREFIX,
} from '../constants';

export interface CloudFrontProps {
    staticWebsiteBucket: s3.Bucket;
    audioFileBucket: s3.Bucket;
    transcribedTextFileBucket: s3.Bucket;
    backendAPIGateway: apiGateway.RestApi;
    lambdaEdgeArn: string;
    lambdaEdgeVersion: string;
}

export class CloudFronts extends cdk.Construct {
    public readonly cloudfront: cloudfront.CloudFrontWebDistribution;

    constructor(scope: cdk.Construct, id: string, props: CloudFrontProps) {
        super(scope, id);

        const originAccessIdentity = new cloudfront.CfnCloudFrontOriginAccessIdentity(
            scope,
            'OriginAccessIdentityForAWSTranscribeCloudFront',
            {
                cloudFrontOriginAccessIdentityConfig: {
                    comment: 'OAI for AWSTranscribeDemo',
                },
            }
        );

        const modifyS3PathLambdaAssociation: cloudfront.LambdaFunctionAssociation = {
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            lambdaFunction: lambda.Version.fromVersionAttributes(
                scope,
                'ModifyS3PathLambdaEdgeVersion',
                {
                    version: props.lambdaEdgeVersion,
                    lambda: lambda.Function.fromFunctionArn(
                        scope,
                        'ModifyS3PathLambdaEdgeFunc',
                        props.lambdaEdgeArn
                    ),
                }
            ),
        };

        const apiGatewayURL = props.backendAPIGateway.url;
        this.cloudfront = new cloudfront.CloudFrontWebDistribution(
            scope,
            'AWSTranscribeCloudFront',
            {
                originConfigs: [
                    {
                        s3OriginSource: {
                            s3BucketSource: props.staticWebsiteBucket,
                            originAccessIdentityId: originAccessIdentity.ref,
                        },
                        behaviors: [
                            {
                                isDefaultBehavior: true,
                                forwardedValues: { queryString: true },
                            },
                            {
                                pathPattern: '/index.html',
                                forwardedValues: {
                                    queryString: true,
                                },
                                defaultTtl: cdk.Duration.seconds(0),
                                minTtl: cdk.Duration.seconds(0),
                                maxTtl: cdk.Duration.seconds(0),
                            },
                        ],
                    },
                    {
                        s3OriginSource: {
                            s3BucketSource: props.audioFileBucket,
                            originAccessIdentityId: originAccessIdentity.ref,
                        },
                        behaviors: [
                            {
                                pathPattern: `/${AUDIO_FILE_URL_PREFIX}/*`,
                                lambdaFunctionAssociations: [
                                    modifyS3PathLambdaAssociation,
                                ],
                            },
                        ],
                    },
                    {
                        s3OriginSource: {
                            s3BucketSource: props.transcribedTextFileBucket,
                            originAccessIdentityId: originAccessIdentity.ref,
                        },
                        behaviors: [
                            {
                                pathPattern: `/${TRANSCRIBED_TEXT_FILE_URL_PREFIX}/*`,
                                lambdaFunctionAssociations: [
                                    modifyS3PathLambdaAssociation,
                                ],
                            },
                        ],
                    },
                    {
                        customOriginSource: {
                            /**
                             * domainName can not have:
                             *  * "https://"
                             *  * stage name
                             */
                            domainName: apiGatewayURL.substring(
                                'https://'.length,
                                apiGatewayURL.indexOf('/', 'https://'.length)
                            ),
                            originProtocolPolicy:
                                cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                        },
                        behaviors: [
                            {
                                pathPattern: `/${API_PATH_PREFIX}/*`,
                                allowedMethods:
                                    cloudfront.CloudFrontAllowedMethods.ALL,
                                forwardedValues: {
                                    queryString: true,
                                },
                                defaultTtl: cdk.Duration.seconds(0),
                                minTtl: cdk.Duration.seconds(0),
                                maxTtl: cdk.Duration.seconds(0),
                            },
                        ],
                    },
                ],
            }
        );

        const allBuckets: s3.Bucket[] = [
            props.staticWebsiteBucket,
            props.audioFileBucket,
            props.transcribedTextFileBucket,
        ];
        // make sure cloudfront can access all 3 buckets
        allBuckets.forEach(sourceBucket => {
            const policyStatement = new iam.PolicyStatement();
            policyStatement.addActions('s3:GetObject');
            policyStatement.addResources(`${sourceBucket.bucketArn}/*`);
            policyStatement.addCanonicalUserPrincipal(
                originAccessIdentity.attrS3CanonicalUserId
            );
            sourceBucket.addToResourcePolicy(policyStatement);
        });
        // make sure cloudfront can upload file to "audioFileBucket"
        props.audioFileBucket.addCorsRule({
            allowedMethods: [s3.HttpMethods.POST, s3.HttpMethods.PUT],
            /**
             * Use "https://*" to make sure response header will be
             * the requested URL.
             */
            allowedOrigins: ['https://*'],
            allowedHeaders: ['*'],
        });
    }
}
