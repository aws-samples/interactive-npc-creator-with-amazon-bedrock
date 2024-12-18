import { defineFunction } from "@aws-amplify/backend";

export const converse_handler = defineFunction({
  name: "converse_handler",
  timeoutSeconds: 300,
  environment: {
    BEDROCK_REGION: "us-east-1"
  }
});
