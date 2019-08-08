#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { AwsTranscribeDemoStack } from './stack';

const app = new cdk.App();
// tslint:disable-next-line: no-unused-expression
new AwsTranscribeDemoStack(app, 'AwsTranscribeDemoStack');
