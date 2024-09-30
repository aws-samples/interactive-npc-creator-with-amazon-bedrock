import { defineFunction } from "@aws-amplify/backend";

export const portrait_handler = defineFunction({
  name: "portrait_handler",
  timeoutSeconds: 300,
  environment: {
    BEDROCK_REGION: "us-west-2"
  }
});