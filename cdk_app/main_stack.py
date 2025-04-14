from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_dynamodb as ddb,
    aws_s3 as s3,
)
from constructs import Construct
from cdk_app.constants import EVENTS_TABLE_NAME, BUCKET_NAME

class MainStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        bucket = s3.Bucket(self, "ImageBucket",
            bucket_name=BUCKET_NAME.lower(),
            removal_policy=s3.RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        table = ddb.Table(
            self, "EventsTable",
            table_name=EVENTS_TABLE_NAME,
            partition_key={"name": "id", "type": ddb.AttributeType.STRING},
            removal_policy=ddb.RemovalPolicy.DESTROY
        )

        lambda_fn = _lambda.Function(
            self, "CreateEventFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("cdk_app/lambda"),
            environment={
                "EVENTS_TABLE": table.table_name
            }
        )

        table.grant_read_write_data(lambda_fn)

        api = apigw.RestApi(self, "TimelineApi",
            rest_api_name="Timeline Service"
        )

        events = api.root.add_resource("events")
        events.add_method("POST", apigw.LambdaIntegration(lambda_fn))
