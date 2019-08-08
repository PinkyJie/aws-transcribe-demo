import cdk = require('@aws-cdk/core');
import sns = require('@aws-cdk/aws-sns');

export class SNSTopics extends cdk.Construct {
    public readonly newAudioTopic: sns.Topic;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        this.newAudioTopic = new sns.Topic(scope, 'NewAudioTopic', {
            displayName: 'New audio upload topic',
        });
    }
}
