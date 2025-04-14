import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, aws_dynamodb as ddb, aws_lambda as lambda, aws_apigateway as apigw, aws_s3 as s3 } from 'aws-cdk-lib';
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

    const handler = new lambda.Function(this, 'EventHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        EVENTS_TABLE: table.tableName
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
