import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const db = DynamoDBDocument.from(new DynamoDB());
const headers= {
  "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
  "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
};

export const handler = async (event: any = {}): Promise<any> => {

  const requestedItemId = event.pathParameters.id;
  if (!requestedItemId) {
    return { headers, statusCode: 400, body: `Error: You are missing the path parameter id` };
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: requestedItemId
    }
  };

  try {
    const response = await db.get(params);
    if (response.Item) {
      return { headers, statusCode: 200, body: JSON.stringify(response.Item) };
    } else {
      return { headers, statusCode: 404 };
    }
  } catch (dbError) {
    return { headers, statusCode: 500, body: JSON.stringify(dbError) };
  }
};
