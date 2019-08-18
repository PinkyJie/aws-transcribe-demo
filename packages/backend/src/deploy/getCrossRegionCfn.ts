import { CloudFormation } from 'aws-sdk';
import { CloudFormationCustomResourceHandler } from 'aws-lambda';
import * as response from 'cfn-response';

export const handler: CloudFormationCustomResourceHandler = (
    event,
    context
) => {
    console.log(event);
    const {
        RequestType,
        /**
         * When CustomResource pass parameter to Lambda, it will use
         * upper case as property name.
         */
        ResourceProperties: {
            LambdaEdgeStackName,
            LambdaEdgeArnOutputName,
            LambdaEdgeVersionOutputName,
        },
    } = event;

    if (RequestType === 'Delete') {
        return response.send(event, context, response.SUCCESS);
    }

    const cfn = new CloudFormation({ region: 'us-east-1' });
    cfn.describeStacks(
        { StackName: LambdaEdgeStackName },
        (err, { Stacks }) => {
            if (err) {
                console.log('Error during stack describe:\n', err);
                return response.send(event, context, response.FAILED, err);
            }

            console.log(Stacks[0].Outputs);
            const arnOutput = Stacks[0].Outputs.find(
                out => out.ExportName === LambdaEdgeArnOutputName
            );
            if (!arnOutput) {
                console.log(
                    `Can not find the ExportName: ${LambdaEdgeArnOutputName}`
                );
                return response.send(event, context, response.FAILED);
            }
            const versionOutput = Stacks[0].Outputs.find(
                out => out.ExportName === LambdaEdgeVersionOutputName
            );
            if (!versionOutput) {
                console.log(
                    `Can not find the ExportName: ${LambdaEdgeVersionOutputName}`
                );
                return response.send(event, context, response.FAILED);
            }

            response.send(event, context, response.SUCCESS, {
                arn: arnOutput.OutputValue,
                version: versionOutput.OutputValue,
            });
        }
    );
};
