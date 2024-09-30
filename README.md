# Dynamic NPC dialog with Gen AI

This repository is a 'Game NPC(Non-Player Character) Playground' to design, develop(prompt-engineering), and test game NPCs that interect with players more naturally using dynamic dialogue powered by Amazon Bedrock.


<!-- https://github.com/user-attachments/assets/ -->


# Architecture

<!-- ![Image](https://github.com/user-attachments/assets/) -->

## Deployment

### Prerequisites

1. Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) & Set up [AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)

2. Install [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install) & CDK [Bootstrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-env.html#bootstrapping-howto) (for the first time)

3. [Manage Model Access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)

> [!IMPORTANT]
> - The application uses Amazon Bedrock in the **us-west-2** region. Please allow model access in **us-west-2**.
> - Supported model : Anthropic Claude 3.0 Haiku, 3.5 Sonnet
<!-- > - The application only supports models from Anthropic Claude 3.0 and above **(3.0 Haiku, 3.0 Sonnet, 3.0 Opus, 3.5 Sonnet)**. -->

### Sandbox Deployment

1. Clone repository

```sh
git clone https://github.com/aws-samples/interactive-npc-creator-with-amazon-bedrock.git
```

2. Install dependencies

```sh
cd interactive-npc-creator-with-amazon-bedrock
npm install
```

3. Deploy cloud sandbox

```sh
npx ampx sandbox
```

> [!IMPORTANT]
> - It takes about 10-20 minutes to deploy.
> - Do not terminate the sandbox environment while running the front-end application.

4. Run frontend app

```sh
npm run dev
```

### Amplify Deployment

Create your own repository and follow [Amplify deployment steps](https://docs.amplify.aws/react/start/quickstart/#2-deploy-the-starter-app)

## Clean Up

### Sandbox Environment

```sh
npx ampx sandbox delete
```

> [!IMPORTANT]
> You can verify whether all the resources have been deleted in the AWS CloudFormation console.

### Amplify Development

To delete an Amplify project that has been deployed from the Amplify Development Step, 

1. Go to your Amplify project console
2. Navigate to `App Settings > General Settings > Delete app`

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## Contacts

- [Junghee Kang](https://github.com/wenotme)


## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.

## Open Source Library

For detailed information about the open source libraries used in this application, please refer to the [ATTRIBUTION](ATTRIBUTION.md) file.