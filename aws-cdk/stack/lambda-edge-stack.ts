import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');

import {
    LAMBDA_FUNCTIONS_DIST_FOLDER,
    LAMBDA_EDGE_ARN_OUTPUT_NAME,
    LAMBDA_EDGE_VERSION_OUTPUT_NAME,
    LAMBDA_EDGE_FUNC_PATH,
} from '../constants';
import { getFileHash } from '../utils';

export class LambdaEdgeStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const modifyS3PathFunc = new lambda.Function(this, 'ModifyS3Path', {
            description:
                'Lambda@Edge function to modify cloudfront path mapping.',
            runtime: lambda.Runtime.NODEJS_10_X,
            handler: 'modifyS3Path.handler',
            code: lambda.Code.asset(
                `${LAMBDA_FUNCTIONS_DIST_FOLDER}/modifyS3Path`
            ),
            role: new iam.Role(this, 'AllowLambdaServiceToAssumeRole', {
                assumedBy: new iam.CompositePrincipal(
                    new iam.ServicePrincipal('lambda.amazonaws.com'),
                    new iam.ServicePrincipal('edgelambda.amazonaws.com')
                ),
                // this is required for Lambda@Edge
                managedPolicies: [
                    {
                        managedPolicyArn:
                            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                    },
                ],
            }),
        });

        // this way it updates version only in case lambda code changes
        const modifyS3PathFuncContentHash = getFileHash(LAMBDA_EDGE_FUNC_PATH);
        const modifyS3PathFuncContentVersion = modifyS3PathFunc.addVersion(
            `:sha256:${modifyS3PathFuncContentHash}`
        );

        // tslint:disable-next-line: no-unused-expression
        new cdk.CfnOutput(this, 'ModifyS3PathFuncArn', {
            value: modifyS3PathFunc.functionArn,
            exportName: LAMBDA_EDGE_ARN_OUTPUT_NAME,
        });
        // tslint:disable-next-line: no-unused-expression
        new cdk.CfnOutput(this, 'ModifyS3PathFuncVersion', {
            value: modifyS3PathFuncContentVersion.version,
            exportName: LAMBDA_EDGE_VERSION_OUTPUT_NAME,
        });
    }
}
