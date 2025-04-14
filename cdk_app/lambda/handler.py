import json
import os
import boto3
from datetime import datetime
from uuid import uuid4

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['EVENTS_TABLE'])

def lambda_handler(event, context):
    body = json.loads(event['body'])
    event_id = str(uuid4())
    item = {
        'id': event_id,
        'title': body.get('title', ''),
        'description': body.get('description', ''),
        'image_url': body.get('image_url', ''),
        'timestamp': datetime.utcnow().isoformat()
    }
    table.put_item(Item=item)
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Event created', 'id': event_id})
    }
