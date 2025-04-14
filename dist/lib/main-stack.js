"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
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
