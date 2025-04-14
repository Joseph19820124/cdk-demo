// AWS SDK v3 modular import
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.EVENTS_TABLE;

export const handler = async (event) => {
  const method = event.httpMethod;
  const path = event.path;
  const id = event.pathParameters ? event.pathParameters.id : null;

  if (method === "GET" && path === "/events") {
    return await listEvents();
  } else if (method === "GET" && id) {
    return await getEvent(id);
  } else if (method === "POST") {
    const body = JSON.parse(event.body);
    return await createEvent(body);
  } else if (method === "PUT" && id) {
    const body = JSON.parse(event.body);
    return await updateEvent(id, body);
  } else if (method === "DELETE" && id) {
    return await deleteEvent(id);
  }

  return { statusCode: 400, body: "Unsupported route" };
};

const createEvent = async (data) => {
  const id = uuidv4();
  const item = {
    id,
    title: data.title || "",
    description: data.description || "",
    image_url: data.image_url || "",
    timestamp: new Date().toISOString(),
  };

  await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Event created", id }),
  };
};

const getEvent = async (id) => {
  const result = await ddbDocClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
  if (!result.Item) {
    return { statusCode: 404, body: "Event not found" };
  }
  return { statusCode: 200, body: JSON.stringify(result.Item) };
};

const listEvents = async () => {
  const result = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  return { statusCode: 200, body: JSON.stringify(result.Items) };
};

const updateEvent = async (id, data) => {
  await ddbDocClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: "SET title = :title, description = :desc, image_url = :img",
    ExpressionAttributeValues: {
      ":title": data.title || "",
      ":desc": data.description || "",
      ":img": data.image_url || "",
    }
  }));
  return { statusCode: 200, body: JSON.stringify({ message: "Event updated" }) };
};

const deleteEvent = async (id) => {
  await ddbDocClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
  return { statusCode: 200, body: JSON.stringify({ message: "Event deleted" }) };
};
