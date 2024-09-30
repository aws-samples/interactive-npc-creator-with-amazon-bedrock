import { env } from '$amplify/env/portrait_handler';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const headers = {
    "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
    "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
};

export const handler = async (event: any) => {

    console.log("event", event);
    const obj = event && event.body ? JSON.parse(event.body) : "";

    // var region = process.env.region;
    var region = env.BEDROCK_REGION;

    // Build the request payload for the Stable Diffusion model
    const parmas_list = {
        "stability.stable-diffusion-xl-v1": {
            contentType: 'application/json',
            accept: '*/*',
            modelId: 'stability.stable-diffusion-xl-v1',
            body: `{
            "text_prompts":[
                {
                    "text":"${obj.prompt}"
                }],
            "height": 1024,
            "width": 1024,
            "cfg_scale":10,
            "seed":${obj.seed},
            "steps":50}`,
        },
        "stability.stable-image-ultra-v1:0": {
            contentType: 'application/json',
            accept: 'application/json',
            modelId: 'stability.stable-image-ultra-v1:0',
            body: `{"prompt":"${obj.prompt}","seed":${obj.seed}}`,
        }
    };

    const params = obj.modelId === 'stability.stable-image-ultra-v1:0' ? parmas_list['stability.stable-image-ultra-v1:0'] : parmas_list['stability.stable-diffusion-xl-v1'];
    console.log({ params });

    try {
        const client = new BedrockRuntimeClient({ region: region });
        const command = new InvokeModelCommand(params);
        const bedrock_response = await client.send(command);

        console.log("bedrock_response", bedrock_response);

        const s3Client = new S3Client();

        const bedrock_body = JSON.parse(Buffer.from(bedrock_response.body).toString('utf8'));
        const base64Data = obj.modelId === 'stability.stable-image-ultra-v1:0' ? bedrock_body.images[0] : bedrock_body.artifacts[0].base64;
        const binaryData = Buffer.from(base64Data, 'base64');
        const s3_command = new PutObjectCommand({
            Bucket: env.NPC_PORTRAIT_BUCKET_NAME,
            Key: `images/${obj.characterId}_${obj.seed}_${obj.imageId}_${obj.emotion}.png`,
            ContentType: 'image/png',
            Body: binaryData
        });

        const s3_response = await s3Client.send(s3_command);
        console.log("s3_response", s3_response);
        const generated_seed = obj.modelId === 'stability.stable-image-ultra-v1:0' ? bedrock_body.seeds[0] : bedrock_body.artifacts[0].seed
        return {
            statusCode: 200, headers,
            body: JSON.stringify({ seed: generated_seed, image: `images/${obj.characterId}_${obj.seed}_${obj.imageId}_${obj.emotion}.png` }),
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