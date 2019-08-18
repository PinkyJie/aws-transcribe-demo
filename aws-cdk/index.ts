#!/usr/bin/env node
import cdk = require('@aws-cdk/core');

import { MainStack } from './stack/main-stack';
import { LambdaEdgeStack } from './stack/lambda-edge-stack';
import {
    MAIN_STACK_NAME,
    LAMBDA_EDGE_STACK_NAME,
    LAMBDA_EDGE_REGION,
    TAGS,
} from './constants';

const app = new cdk.App();
/**
 * Lambda@Edge can be created only in us-east-1 region, that's why
 * we need to create a separate stack to handle this.
 */
const lambdaEdgeStack = new LambdaEdgeStack(app, LAMBDA_EDGE_STACK_NAME, {
    env: {
        region: LAMBDA_EDGE_REGION,
    },
    tags: TAGS,
});

// tslint:disable-next-line: no-unused-expression
new MainStack(app, MAIN_STACK_NAME, {
    tags: TAGS,
}).addDependency(lambdaEdgeStack, 'lambda edge');
