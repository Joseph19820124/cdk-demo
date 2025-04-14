"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
class MainStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const table = new aws_cdk_lib_1.aws_dynamodb.Table(this, 'EventsTable', {
            tableName: 'TimelineEvents',
            partitionKey: { name: 'id', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        const bucket = new aws_cdk_lib_1.aws_s3.Bucket(this, 'ImageBucket', {
            bucketName: 'timeline-image-storage',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        });
        const handler = new aws_cdk_lib_1.aws_lambda.Function(this, 'EventHandler', {
            runtime: aws_cdk_lib_1.aws_lambda.Runtime.NODEJS_18_X,
            code: aws_cdk_lib_1.aws_lambda.Code.fromAsset('lambda'),
            handler: 'index.handler',
            environment: {
                EVENTS_TABLE: table.tableName
            }
        });
        table.grantReadWriteData(handler);
        const api = new aws_cdk_lib_1.aws_apigateway.RestApi(this, 'TimelineApi', {
            restApiName: 'Timeline Service'
        });
        const events = api.root.addResource('events');
        events.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(handler));
        events.addMethod('POST', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(handler));
        const eventId = events.addResource('{id}');
        eventId.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(handler));
        eventId.addMethod('PUT', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(handler));
        eventId.addMethod('DELETE', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(handler));
    }
}
exports.MainStack = MainStack;
