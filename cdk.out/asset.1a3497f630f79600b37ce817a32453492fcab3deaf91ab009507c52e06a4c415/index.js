const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.EVENTS_TABLE;

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.path;
  const id = event.pathParameters ? event.pathParameters.id : null;

  if (method === 'GET' && path === '/events') {
    return await listEvents();
  } else if (method === 'GET' && id) {
    return await getEvent(id);
  } else if (method === 'POST') {
    const body = JSON.parse(event.body);
    return await createEvent(body);
  } else if (method === 'PUT' && id) {
    const body = JSON.parse(event.body);
    return await updateEvent(id, body);
  } else if (method === 'DELETE' && id) {
    return await deleteEvent(id);
  }

  return { statusCode: 400, body: 'Unsupported route' };
};

const createEvent = async (data) => {
  const id = uuidv4();
  const item = {
    id,
    title: data.title || '',
    description: data.description || '',
    image_url: data.image_url || '',
    timestamp: new Date().toISOString(),
  };

  await dynamodb.put({ TableName: TABLE_NAME, Item: item }).promise();
  return { statusCode: 200, body: JSON.stringify({ message: 'Event created', id }) };
};

const getEvent = async (id) => {
  const result = await dynamodb.get({ TableName: TABLE_NAME, Key: { id } }).promise();
  if (!result.Item) {
    return { statusCode: 404, body: 'Event not found' };
  }
  return { statusCode: 200, body: JSON.stringify(result.Item) };
};

const listEvents = async () => {
  const result = await dynamodb.scan({ TableName: TABLE_NAME }).promise();
  return { statusCode: 200, body: JSON.stringify(result.Items) };
};

const updateEvent = async (id, data) => {
  await dynamodb.update({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'SET title = :title, description = :desc, image_url = :img',
    ExpressionAttributeValues: {
      ':title': data.title || '',
      ':desc': data.description || '',
      ':img': data.image_url || '',
    }
  }).promise();
  return { statusCode: 200, body: JSON.stringify({ message: 'Event updated' }) };
};

const deleteEvent = async (id) => {
  await dynamodb.delete({ TableName: TABLE_NAME, Key: { id } }).promise();
  return { statusCode: 200, body: JSON.stringify({ message: 'Event deleted' }) };
};
