import { env } from '$amplify/env/converse_handler';
import {
    BedrockRuntimeClient,
    ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const headers = {
    "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
    "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
};

export const handler = async (event: any) => {

    if (!event.body) {
        return {
            headers, statusCode: 400, body: 'invalid request, you are missing the parameter body'
        };
    }
    console.log("event", event);
    const obj = event && event.body ? JSON.parse(event.body) : "";

    if ((!obj.messages) || (!obj.system)) {
        return {
            headers, statusCode: 400, body: 'invalid request, you are missing the parameter body'
        };
    }

    var region = env.BEDROCK_REGION;
    const modelId = obj.modelId ? obj.modelId : "anthropic.claude-3-5-sonnet-20240620-v1:0";
    const system = obj.system;

    const messages = obj.messages;
    console.log('messages',messages);

    const inferenceConfig = obj.inferenceConfig ? obj.inferenceConfig : { maxTokens: 512, temperature: 0.5, topP: 0.9 };
    const toolConfig = obj.toolConfig ? obj.toolConfig : null;
    const params: any =
    {
        modelId,
        messages,
        system,
        inferenceConfig,
        toolConfig,
    };
    console.log('event.body.system',event.body.system);
    console.log('obj.system',obj.system);
    console.log('system',system);
    console.log({ params });

    try {
        const client = new BedrockRuntimeClient({ region: region });

        const command = new ConverseCommand(params);
        const bedrock_response = await client.send(command);

        // console.log("bedrock_response", bedrock_response);
        return {
            statusCode: 200, headers,
            // body: JSON.stringify({}),
            body: JSON.stringify(bedrock_response),
        };
    }
    catch (error) {
        console.log({ error });
        return {
            statusCode: 500, headers,
            body: JSON.stringify(error)
        };
    }
};