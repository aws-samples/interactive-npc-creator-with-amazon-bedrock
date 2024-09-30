import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';

import { Stack, RemovalPolicy } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam"
import {
  AuthorizationType,
  // CognitoUserPoolsAuthorizer,
  Cors, LambdaIntegration, RestApi, IResource, MockIntegration, PassthroughBehavior
} from "aws-cdk-lib/aws-apigateway";

import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';

import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { portrait_handler } from "./functions/portrait/resources";
import { converse_handler } from "./functions/converse/resources";
import { join } from 'path'
import path from 'path'
const __dirname = path.resolve();

const backend = defineBackend({
  auth,
  storage,
  portrait_handler,
  converse_handler
});

// create a new API stack
const npcApiStack = backend.createStack("npc-api-stack");
const tableName = `npc-${npcApiStack.stackName}`;

// create a new REST API
const npcApi = new RestApi(npcApiStack, "npcApi", {
  restApiName: "npcApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  // defaultCorsPreflightOptions: {
  //   allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
  //   allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
  //   allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  // },
});

// create a new Lambda integration
const portrait_lambdaIntegration = new LambdaIntegration(
  backend.portrait_handler.resources.lambda
);
const converse_lambdaIntegration = new LambdaIntegration(
  backend.converse_handler.resources.lambda
);

backend.portrait_handler.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    sid: "BedrockFullAccess",
    actions: ["bedrock:*"],
    resources: ["*"],
  })
);
backend.converse_handler.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    sid: "BedrockFullAccess",
    actions: ["bedrock:*"],
    resources: ["*"],
  })
);

// create a new Cognito User Pools authorizer
// const cognitoAuth = new CognitoUserPoolsAuthorizer(npcApiStack, "CognitoAuth", {
//   cognitoUserPools: [backend.auth.resources.userPool],
// });

///------------------

const dynamoTable = new Table(npcApiStack, 'npc', {
  partitionKey: {
    name: 'id',
    type: AttributeType.STRING
  },
  tableName: tableName,

  removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
});

const nodeJsFunctionProps: NodejsFunctionProps = {
  bundling: {
    externalModules: [
      'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
    ],
  },
  environment: {
    PRIMARY_KEY: 'id',
    TABLE_NAME: dynamoTable.tableName,
  },
  runtime: Runtime.NODEJS_20_X,
}

// Create a Lambda function for each of the CRUD operations
const getOneLambda = new NodejsFunction(npcApiStack, 'getOneItemFunction', {
  entry: join(__dirname, 'amplify/lambdas', 'get-one.ts'),
  ...nodeJsFunctionProps,
});
const getAllLambda = new NodejsFunction(npcApiStack, 'getAllItemsFunction', {
  entry: join(__dirname, 'amplify/lambdas', 'get-all.ts'),
  ...nodeJsFunctionProps,
});
const createOneLambda = new NodejsFunction(npcApiStack, 'createItemFunction', {
  entry: join(__dirname, 'amplify/lambdas', 'create.ts'),
  ...nodeJsFunctionProps,
});
const updateOneLambda = new NodejsFunction(npcApiStack, 'updateItemFunction', {
  entry: join(__dirname, 'amplify/lambdas', 'update-one.ts'),
  ...nodeJsFunctionProps,
});
const deleteOneLambda = new NodejsFunction(npcApiStack, 'deleteItemFunction', {
  entry: join(__dirname, 'amplify/lambdas', 'delete-one.ts'),
  ...nodeJsFunctionProps,
});

// Grant the Lambda function read access to the DynamoDB table
dynamoTable.grantReadWriteData(getAllLambda);
dynamoTable.grantReadWriteData(getOneLambda);
dynamoTable.grantReadWriteData(createOneLambda);
dynamoTable.grantReadWriteData(updateOneLambda);
dynamoTable.grantReadWriteData(deleteOneLambda);

// Integrate the Lambda functions with the API Gateway resource
const getAllIntegration = new LambdaIntegration(getAllLambda);
const createOneIntegration = new LambdaIntegration(createOneLambda);
const getOneIntegration = new LambdaIntegration(getOneLambda);
const updateOneIntegration = new LambdaIntegration(updateOneLambda);
const deleteOneIntegration = new LambdaIntegration(deleteOneLambda);


// create a new resource path with IAM authorization
const npcPath = npcApi.root.addResource("npc", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});

npcPath.addMethod('GET', getAllIntegration);
npcPath.addMethod('POST', createOneIntegration);
addCorsOptions(npcPath);

const singleItem = npcPath.addResource('{id}');
singleItem.addMethod('GET', getOneIntegration);
singleItem.addMethod('PUT', updateOneIntegration);
// singleItem.addMethod('PATCH', updateOneIntegration);
singleItem.addMethod('DELETE', deleteOneIntegration);
addCorsOptions(singleItem);


const portraitPath = npcApi.root.addResource("portrait");
portraitPath.addMethod("GET", portrait_lambdaIntegration, {
  authorizationType: AuthorizationType.IAM,
});
portraitPath.addMethod("POST", portrait_lambdaIntegration, {
  authorizationType: AuthorizationType.IAM,
});
addCorsOptions(portraitPath);

const conversePath = npcApi.root.addResource("converse");
conversePath.addMethod("POST", converse_lambdaIntegration, {
  authorizationType: AuthorizationType.IAM,
});
addCorsOptions(conversePath);

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(npcApiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${npcApi.arnForExecuteApi("*", "/npc", "dev")}`,
        `${npcApi.arnForExecuteApi("*", "/npc/*", "dev")}`,
        `${npcApi.arnForExecuteApi("*", "/portrait", "dev")}`,
        `${npcApi.arnForExecuteApi("*", "/converse", "dev")}`,
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: [
      "polly:SynthesizeSpeech",
    ],
    resources: ["*"],
  })
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);

// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [npcApi.restApiName]: {
        endpoint: npcApi.url,
        region: Stack.of(npcApi).region,
        apiName: npcApi.restApiName,
      },
    },
    Predictions: {
      convert: {
        speechGenerator: {
          defaults: {
            voiceId: "Ivy",
          },
          proxy: false,
          region: Stack.of(backend.auth.resources.authenticatedUserIamRole)
            .region,
        },
      },
      interpret: {
        interpretText: {
          defaults: {
            type: "ALL",
          },
          proxy: false,
          region: Stack.of(backend.auth.resources.authenticatedUserIamRole)
            .region,
        },
      },
    },
  },
});

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    // In case you want to use binary media types, uncomment the following line
    // contentHandling: ContentHandling.CONVERT_TO_TEXT,

    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    // In case you want to use binary media types, comment out the following line
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    authorizationType: AuthorizationType.NONE,
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  }, )
}
