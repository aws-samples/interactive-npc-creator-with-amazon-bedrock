import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || '';

const db = DynamoDBDocument.from(new DynamoDB());
const headers= {
  "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
  "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
};

export const handler = async (): Promise<any> => {

  const params = {
    TableName: TABLE_NAME
  };

  try {
    const response = await db.scan(params);
    return { headers, statusCode: 200, body: JSON.stringify(response.Items) };
  } catch (dbError) {
    return { headers, statusCode: 500, body: JSON.stringify(dbError) };
  }
};
