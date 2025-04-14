import * as cdk from 'aws-cdk-lib';
import {
  Stack, StackProps,
  aws_dynamodb as ddb,
  aws_lambda_nodejs as lambdaNode,
  aws_apigateway as apigw,
  aws_s3 as s3
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new ddb.Table(this, 'EventsTable', {
      tableName: 'TimelineEvents',
      partitionKey: { name: 'id', type: ddb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const bucket = new s3.Bucket(this, 'ImageBucket', {
      bucketName: 'timeline-image-storage',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const handler = new lambdaNode.NodejsFunction(this, 'EventHandler', {
      entry: 'lambda/index.mjs',
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      environment: {
        EVENTS_TABLE: table.tableName
      },
      bundling: {
        format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
        target: 'es2020',
        externalModules: ['@aws-sdk/*']
      }
    });

    table.grantReadWriteData(handler);

    const api = new apigw.RestApi(this, 'TimelineApi', {
      restApiName: 'Timeline Service'
    });

    const events = api.root.addResource('events');
    events.addMethod('GET', new apigw.LambdaIntegration(handler));
    events.addMethod('POST', new apigw.LambdaIntegration(handler));

    const eventId = events.addResource('{id}');
    eventId.addMethod('GET', new apigw.LambdaIntegration(handler));
    eventId.addMethod('PUT', new apigw.LambdaIntegration(handler));
    eventId.addMethod('DELETE', new apigw.LambdaIntegration(handler));
  }
}
