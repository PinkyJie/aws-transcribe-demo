import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import s3Deployment = require('@aws-cdk/aws-s3-deployment');

import { WEBSITE_DIST_FOLDER } from '../constants';

export class S3Buckets extends cdk.Construct {
    public readonly staticWebsiteBucket: s3.Bucket;
    public readonly audioFileBucket: s3.Bucket;
    public readonly transcribedTextFileBucket: s3.Bucket;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        this.staticWebsiteBucket = new s3.Bucket(scope, 'StaticWebsiteBucket', {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
        });

        this.audioFileBucket = new s3.Bucket(scope, 'AudioFileBucket');

        this.transcribedTextFileBucket = new s3.Bucket(
            scope,
            'TranscribedTextFileBucket'
        );

        // deploy frontend
        // tslint:disable-next-line: no-unused-expression
        new s3Deployment.BucketDeployment(scope, 'DeployWebsite', {
            source: s3Deployment.Source.asset(WEBSITE_DIST_FOLDER),
            destinationBucket: this.staticWebsiteBucket,
        });
    }
}
