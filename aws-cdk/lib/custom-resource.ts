import cdk = require('@aws-cdk/core');
import cfn = require('@aws-cdk/aws-cloudformation');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');

import {
    LAMBDA_FUNCTIONS_DIST_FOLDER,
    LAMBDA_EDGE_FUNC_PATH,
} from '../constants';
import { getFileHash } from '../utils';

export interface CrossRegionCfnCustomResourceProps {
    lambdaEdgeStackName: string;
    lambdaEdgeArnOutputName: string;
    lambdaEdgeVersionOutputName: string;
}

// reference: https://lanwen.ru/posts/aws-cdk-edge-lambda/
export class CrossRegionCfnCustomResource extends cdk.Construct {
    public readonly lambdaEdgeOutput: {
        arn: string;
        version: string;
    };

    constructor(
        scope: cdk.Construct,
        id: string,
        props: CrossRegionCfnCustomResourceProps
    ) {
        super(scope, id);

        const getCrossRegionCfnFunc = new lambda.SingletonFunction(
            this,
            'GetCrossRegionCfnFunc',
            {
                /**
                 * to avoid multiple lambda deployments in case we will use that
                 * custom resource multiple times
                 */
                uuid: '9dc5bf6a-b1a3-4c37-83c2-a2fbf2323f2a',
                description: 'Function to get lambda@edge stack output.',
                code: lambda.Code.asset(
                    `${LAMBDA_FUNCTIONS_DIST_FOLDER}/getCrossRegionCfn`
                ),
                handler: 'getCrossRegionCfn.handler',
                timeout: cdk.Duration.seconds(300),
                runtime: lambda.Runtime.NODEJS_10_X,
            }
        );

        // getCrossRegionCfnFunc needs to have permission to describe stack
        getCrossRegionCfnFunc.addToRolePolicy(
            new iam.PolicyStatement({
                resources: [
                    `arn:aws:cloudformation:*:*:stack/${props.lambdaEdgeStackName}/*`,
                ],
                actions: ['cloudformation:DescribeStacks'],
            })
        );

        const modifyS3PathFuncContentHash = getFileHash(LAMBDA_EDGE_FUNC_PATH);
        const crossRegionCfnCustomResource = new cfn.CustomResource(
            this,
            'CrossRegionCfnCustomResource',
            {
                provider: cfn.CustomResourceProvider.lambda(
                    getCrossRegionCfnFunc
                ),
                /**
                 * Though the variable name inside `props` are beginning with lower
                 * case, after CustomResource pass them to Lambda, it will begin with
                 * upper case.
                 */
                properties: {
                    ...props,
                    // Change custom resource once lambda@edge code update
                    lambdaHash: modifyS3PathFuncContentHash,
                },
            }
        );

        this.lambdaEdgeOutput = {
            arn: crossRegionCfnCustomResource.getAtt('arn').toString(),
            version: crossRegionCfnCustomResource.getAtt('version').toString(),
        };
    }
}
