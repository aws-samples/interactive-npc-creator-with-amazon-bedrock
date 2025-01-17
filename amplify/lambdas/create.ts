import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const db = DynamoDBDocument.from(new DynamoDB());
const headers= {
    "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
    "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
};

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
    DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

export const handler = async (event: any = {}): Promise<any> => {

    if (!event.body) {
        return {
            headers, statusCode: 400, body: 'invalid request, you are missing the parameter body'
        };
    }
    const item = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
    item[PRIMARY_KEY] = uuidv4();
    const params = {
        TableName: TABLE_NAME,
        Item: item
    };

    try {
        await db.put(params);
        return {
            headers, statusCode: 201, body: '{}'
        };
    } catch (dbError: any) {
        const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
            RESERVED_RESPONSE : DYNAMODB_EXECUTION_ERROR;
        return {
            headers, statusCode: 500, body: errorResponse
        };
    }
};