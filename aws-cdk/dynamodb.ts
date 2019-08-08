import cdk = require('@aws-cdk/core');
import dynamodb = require('@aws-cdk/aws-dynamodb');

export class DBTables extends cdk.Construct {
    public readonly audiosTable: dynamodb.Table;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        this.audiosTable = new dynamodb.Table(scope, 'AudiosTable', {
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });
    }
}
