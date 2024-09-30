import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';


const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

const db = DynamoDBDocument.from(new DynamoDB());
const headers= {
  "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
  "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
};

export const handler = async (event: any = {}): Promise<any> => {

  if (!event.body) {
    return { headers, statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }

  const editedItemId = event.pathParameters.id;
  if (!editedItemId) {
    return { headers, statusCode: 400, body: 'invalid request, you are missing the path parameter id' };
  }

  const editedItem: any = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  const editedItemProperties = Object.keys(editedItem);
  if (!editedItem || editedItemProperties.length < 1) {
    return { headers, statusCode: 400, body: 'invalid request, no arguments provided' };
  }

  const firstProperty = editedItemProperties.splice(0, 1);
  const params: any = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: editedItemId
    },
    UpdateExpression: `set ${firstProperty} = :${firstProperty}`,
    ExpressionAttributeValues: {},
    ReturnValues: 'UPDATED_NEW'
  }
  params.ExpressionAttributeValues[`:${firstProperty}`] = editedItem[`${firstProperty}`];

  editedItemProperties.forEach(property => {
    params.UpdateExpression += `, ${property} = :${property}`;
    params.ExpressionAttributeValues[`:${property}`] = editedItem[property];
  });
  console.log('params',params)
  console.log('params.ExpressionAttributeValues', params.ExpressionAttributeValues)
  console.log('editedItem',editedItem)
  try {
    await db.update(params);
    return { headers, statusCode: 204, body: '' };
  } catch (dbError : any) {
    const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
      RESERVED_RESPONSE : DYNAMODB_EXECUTION_ERROR;
      console.error('dbError',dbError);
    return { headers, statusCode: 500, body: errorResponse };
  }
};
