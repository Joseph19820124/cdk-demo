import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class CdkDemoNodeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'ImageBucket', {
      removalPolicy: s3.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const table = new dynamodb.Table(this, 'EventsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: dynamodb.RemovalPolicy.DESTROY,
    });

    const fn = new lambda.Function(this, 'CreateEventFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(\`
        exports.handler = async function(event) {
          console.log("request:", JSON.stringify(event, undefined, 2));
          return {
            statusCode: 200,
            headers: { "Content-Type": "text/plain" },
            body: "Hello from Lambda!"
          };
        };
      \`),
      environment: {
        EVENTS_TABLE: table.tableName,
      },
    });

    table.grantReadWriteData(fn);

    const api = new apigateway.RestApi(this, 'TimelineApi', {
      restApiName: 'Timeline Service',
    });

    const events = api.root.addResource('events');
    events.addMethod('POST', new apigateway.LambdaIntegration(fn));
  }
}
