// @ts-nocheck
'use client'
import React, { useState, useEffect, useRef } from 'react';
import {
  ContentLayout,
  Box,
  Container,
  Header,
  Button,
  SpaceBetween,
  TextContent,
  Input,
  FormField,
  Grid,
  PromptInput,
  Toggle,
  Select,
  ColumnLayout,
  Textarea,
  Slider,
  Spinner,
  Badge,
  ExpandableSection,
  Icon
} from '@cloudscape-design/components';
import { get, post } from 'aws-amplify/api';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import LoadingBar from "@cloudscape-design/chat-components/loading-bar";
import { Predictions } from '@aws-amplify/predictions';

const VOICE_OPTIONS = [
  { label: "Seoyeon (ko-KR)", value: "Seoyeon" },
  { label: "Amy (en-GB)", value: "Amy" },
  { label: "Emma (en-GB)", value: "Emma" },
  { label: "Brian (en-GB)", value: "Brian" },
  { label: "Arthur (en-GB)", value: "Arthur" },
  { label: "Danielle (en-US)", value: "Danielle" },
  { label: "Gregory (en-US)", value: "Gregory" },
  { label: "Ivy (en-US)", value: "Ivy" },
  { label: "Joanna (en-US)", value: "Joanna" },
  { label: "Kendra (en-US)", value: "Kendra" },
  { label: "Kimberly (en-US)", value: "Kimberly" },
  { label: "Salli (en-US)", value: "Salli" },
  { label: "Joey (en-US)", value: "Joey" },
  { label: "Justin (en-US)", value: "Justin" },
  { label: "Kevin (en-US)", value: "Kevin" },
  { label: "Matthew (en-US)", value: "Matthew" },
  { label: "Ruth (en-US)", value: "Ruth" },
  { label: "Stephen (en-US)", value: "Stephen" }
];

const FOUNDATION_MODEL_OPTIONS = [
  { label: "Claude 3.5 Sonnet", value: "anthropic.claude-3-sonnet-20240229-v1:0" },
  { label: "Claude 3 Haiku", value: "anthropic.claude-3-haiku-20240307-v1:0" },
  { label: "Nova Pro", value: "amazon.nova-pro-v1:0" },
  { label: "Nova Lite", value: "amazon.nova-lite-v1:0" },
  { label: "Nova Micro", value: "amazon.nova-micro-v1:0" }
];

const LANGUAGE_OPTIONS = [
  { label: "Korean", value: "ko-kr" },
  { label: "English", value: "en-us" }
];

const CURRENT_CHOICES = {
  "ko-kr": [
    { label: "퀘스트 정보 (RAG : 지식 기반 통합) - 추후 구현", message: "현재 진행 중인 퀘스트에 대해 자세히 알려주세요.", disable: true },
    { label: "동료 소개 (Tool Use : 게임 로직 통합)", message: "당신의 동료들에 대해 소개해 주시겠어요?" },
    { label: "공격 (감정 정보 활용)", message: "(공격한다.)" }
  ],
  "en-us": [
    { label: "Quest Information (RAG: Knowledge-based Integration) - TBU", message: "Can you tell me more about the current quest I'm on?", disable: true },
    { label: "Companion Introduction (Tool Use: Game Logic Integration)", message: "Could you introduce your companions to me?" },
    { label: "Attack (Using Emotion Information)", message: "(Attack)" }
  ]
};

const INITIAL_USER_GREETING = {
  "ko-kr": "안녕하세요, {npcName}님. 반갑습니다.",
  "en-us": "Hello, {npcName}. Nice to meet you."
};

const NPCChat = ({ params }: { params: { id: string } }) => {
  const { id } = params;

  const [npc, setNpc] = useState<any | null>(null);
  const [dialogue, setDialogue]: any = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fetchedRef = useRef(false);
  const [currentChoices, setCurrentChoices] = useState(CURRENT_CHOICES["ko-kr"]);
  const [modelId, setModelId] = useState("anthropic.claude-3-sonnet-20240229-v1:0");
  const [temperature, setTemperature] = useState(0.6);
  const [topP, setTopP] = useState(0.999);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [chatbotPromptTemplate, setChatbotPromptTemplate] = useState("");
  const [filledChatbotPrompt, setFilledChatbotPrompt] = useState("");
  const emotions = ['Basic', 'Joy', 'Sadness', 'Angry', 'Pain'];
  const [currentEmotion, setCurrentEmotion] = useState('Basic');
  const [manualEmotionOverride, setManualEmotionOverride] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(false);
  const audioRef = useRef(new Audio());
  const [npcs, setNpcs] = useState([]);
  const [useToolConfig, setUseToolConfig] = useState(true);
  const [voiceId, setVoiceId] = useState(VOICE_OPTIONS[0].value);
  const [language, setLanguage] = useState("ko-kr");

  const dialogueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchNPC(id);
    }
  }, [id]);

  useEffect(() => {
    if (dialogueRef.current) {
      dialogueRef.current.scrollTop = dialogueRef.current.scrollHeight;
    }
  }, [dialogue]);

  useEffect(() => {
    setCurrentChoices(CURRENT_CHOICES[language]);
  }, [language]);

  const getFilledChatbotPrompt = (npcData: any, chatbotPrompt: string) => {
    if (!npcData) return "";
    return chatbotPrompt
      .replaceAll('{characterName}', npcData.npc_name)
      .replaceAll('{gender}', npcData.gender || '')
      .replaceAll('{race}', npcData.race || '')
      .replaceAll('{characterClass}', npcData.npc_class || '')
      .replaceAll('{personality}', npcData.personality || '')
      .replaceAll('{genre}', npcData.genre || '')
      .replaceAll('{language}', npcData.npc_language === 'ko-kr' ? 'Korean' : 'English');
  };

  const fetchNPC = async (npcId: any) => {
    try {
      const restOperation = get({
        apiName: 'npcApi',
        path: `npc/${npcId}`
      });
      const { body } = await restOperation.response;
      const data: any = await body.json();
      setNpc(data);
      setChatbotPromptTemplate(data.chatbotPrompt);

      if (data.npc_language) {
        setLanguage(data.npc_language);
      }

      const initialUserGreeting = INITIAL_USER_GREETING[language].replace('{npcName}', data.npc_name);

      const temp_filledChatbotPrompt = getFilledChatbotPrompt(data, data.chatbotPrompt)
      setFilledChatbotPrompt(temp_filledChatbotPrompt);

      const initialGreeting: any = await converseWithAPI(initialUserGreeting, temp_filledChatbotPrompt, []);
      setDialogue([
        { text: initialUserGreeting, sender: 'user' },
        { text: initialGreeting.npc_response, sender: 'npc', emotion: initialGreeting.emotion, metrics: initialGreeting.metrics }
      ]);

      playTextToSpeech(initialGreeting.npc_response);
    } catch (error) {
      console.log('GET call failed: ', error);
    }
  };

  const toolConfig = {
    "tools": [
      {
        "toolSpec": {
          "name": "check_companions",
          "description": "Returns information about the companions of the character in JSON format. When asking about companions or party members during a conversation, the character will respond with companion's information such as name, race, occupation.",
          "inputSchema": {
            "json": {
              "type": "object",
              "properties": {}
            }
          }
        }
      }
    ]
  };

  const converseWithAPI = async (userMessage: string, systemPrompt: string, history: any[]) => {
    setIsLoading(true);
    try {
      const messages = [
        ...history.map(entry => ({
          role: entry.sender === 'user' ? 'user' : 'assistant',
          content: [{ text: entry.text }]
        })),
        { role: "user", content: [{ text: userMessage }] }
      ];

      const requestBody = {
        modelId: modelId,
        messages: messages,
        system: [
          {
            "text": systemPrompt
          }
        ],
        inferenceConfig: {
          temperature: temperature,
          top_p: topP,
          max_tokens: maxTokens
        }
      };

      if (useToolConfig) {
        requestBody['toolConfig'] = toolConfig;
      }

      const response = await post({
        apiName: "npcApi",
        path: "converse",
        options: {
          body: requestBody
        }
      });

      const { body } = await response.response;
      var data: any = await body.json();

      const metrics = {
        latencyMs: data.metrics.latencyMs,
        inputTokens: data.usage.inputTokens,
        outputTokens: data.usage.outputTokens
      };
      var tool_metrics = null;
      if (data.stopReason === 'tool_use') {
        setIsLoading(true);  // Keep loading state active
        messages.push(data.output.message);
        const tool_requests = data.output.message.content;
        for (const tool_request of tool_requests) {
          if (tool_request['toolUse']) {
            const tool = tool_request['toolUse'];
            if (tool.name === 'check_companions') {
              var tool_result = {};
              try {
                const companionInfo = await check_companions();
                tool_result = {
                  "toolUseId": tool.toolUseId,
                  "content": [{ "json": { companionInfo } }]
                }
              } catch (error) {
                tool_result = {
                  "toolUseId": tool.toolUseId,
                  "content": [{ "text": error }],
                  "status": 'error'
                }
              }

              const tool_result_message = {
                "role": "user",
                "content": [
                  {
                    "toolResult": tool_result
                  }
                ]
              }
              messages.push(tool_result_message);

              const final_response = await post({
                apiName: "npcApi",
                path: "converse",
                options: {
                  body: {
                    modelId: modelId,
                    messages: messages,
                    system: [
                      {
                        "text": systemPrompt
                      }
                    ],
                    inferenceConfig: {
                      temperature: temperature,
                      top_p: topP,
                      max_tokens: maxTokens
                    },
                    toolConfig: useToolConfig ? toolConfig : undefined,
                  }
                }
              });

              const { body } = await final_response.response;
              const final_data: any = await body.json();
              data = final_data;
              tool_metrics = final_data ? {
                latencyMs: final_data.metrics.latencyMs,
                inputTokens: final_data.usage.inputTokens,
                outputTokens: final_data.usage.outputTokens
              } : null;
            }
          }
        }
      }

      setIsLoading(false);

      try {
        const parsedResponse = JSON.parse(data.output.message.content[0].text);
        return { ...parsedResponse, metrics, tool_metrics };
      } catch (parseError) {
        return {
          npc_response: data.output.message.content[0].text,
          emotion: "Basic",
          metrics,
          tool_metrics
        };
      }

    } catch (error) {
      console.error('Error in API call:', error);
      setIsLoading(false);
      return {
        npc_response: language === "ko-kr" ? "죄송합니다. 오류가 발생했습니다." : "Sorry, an error occurred.",
        emotion: "Basic",
        metrics: { latencyMs: 0, inputTokens: 0, outputTokens: 0 }
      };
    }
  };

  const check_companions = async () => {
    try {
      const restOperation = get({
        apiName: 'npcApi',
        path: 'npc'
      });
      const { body } = await restOperation.response;
      const data = await body.json();
      return data;
    } catch (error) {
      console.log('GET call failed: ', error);
      addFlashbarItem('error', 'Failed to fetch NPCs');
      return null;
    }
  };

  const playTextToSpeech = async (text) => {
    if (textToSpeechEnabled) {
      try {
        const result = await Predictions.convert(
          {
            textToSpeech: {
              source: {
                text: text,
              },
              voiceId: voiceId
            }
          });
        if (result.audioStream) {
          const blob = new Blob([result.audioStream], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          audioRef.current.src = url;
          audioRef.current.play();
        }
      } catch (error) {
        console.error('Error converting text to speech:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || isLoading) return;
    const messageToSend = inputText;
    setTimeout(() => setInputText(''), 0);

    const userMessage = { text: messageToSend, sender: 'user' };
    setDialogue((prev: any) => [...prev, userMessage]);

    const npcResponse = await converseWithAPI(messageToSend, filledChatbotPrompt, dialogue);
    setDialogue((prev: any) => [...prev, { text: npcResponse.npc_response, sender: 'npc', emotion: npcResponse.emotion, metrics: npcResponse.metrics, tool_metrics: npcResponse.tool_metrics }]);

    if (!manualEmotionOverride) {
      setCurrentEmotion(npcResponse.emotion);
    }

    playTextToSpeech(npcResponse.npc_response);
  };

  const handleChoice = async (choice: { label: string, message: string }) => {
    setDialogue((prev: any) => [...prev, { text: choice.message, sender: 'user' }]);
    const npcResponse = await converseWithAPI(choice.message, filledChatbotPrompt, dialogue);
    setDialogue((prev: any) => [...prev, { text: npcResponse.npc_response, sender: 'npc', emotion: npcResponse.emotion, metrics: npcResponse.metrics, tool_metrics: npcResponse.tool_metrics }]);
    if (!manualEmotionOverride) {
      setCurrentEmotion(npcResponse.emotion);
    }
    playTextToSpeech(npcResponse.npc_response);
  };

  const handleResetConversation = () => {
    setDialogue([]);
    setManualEmotionOverride(false);
    setCurrentEmotion('Basic');
    setChatbotPromptTemplate(npc.chatbotPrompt);
    // fetchNPC(id);
  };

  const handleEmotionChange = ({ detail }: { detail: { value: number } }) => {
    setCurrentEmotion(emotions[detail.value]);
  };

  const handleLanguageChange = ({ detail }: { detail: { selectedOption: { value: string } } }) => {
    setLanguage(detail.selectedOption.value);
    setCurrentChoices(CURRENT_CHOICES[detail.selectedOption.value]);
    setChatbotPromptTemplate(npc.chatbotPrompt);
    const temp_npc = { ...npc, npc_language: detail.selectedOption.value }
    setFilledChatbotPrompt(getFilledChatbotPrompt(temp_npc, chatbotPromptTemplate));
  };

  if (!npc) {
    return <Box className='m-10'><Spinner /> Loading...</Box>;
  }

  return (
    <ContentLayout
      defaultPadding
      maxContentWidth={1620}
      headerVariant="high-contrast"
      header={
        <Box margin={{ top: "l" }} padding="l">
          <Header variant="h1">
            Conversation with {npc.npc_name}
          </Header>
        </Box>
      }
    >
      <Grid
        gridDefinition={[
          { colspan: { default: 12, s: 6 } }, { colspan: { default: 12, s: 6 } }, { colspan: 12 }
        ]}
      >
        <Container >
          <SpaceBetween size="l">
            <div className='relative'>
              <StorageImage
                path={npc.images[currentEmotion]}
                alt={`${npc.npc_name} Portrait`}
                style={{ width: '100%', height: 'auto' }}
              />
              {dialogue.length > 0 && (<>
                <div className="absolute inset-x-0 bottom-6 h-36 bg-gray-700 opacity-90 rounded-md mx-3"></div>
                <div className="absolute inset-x-0 bottom-6 h-36 p-2  mx-3">
                  <h1 className="text-white inline text-2xl">{npc.npc_name} <span className="text-rose-600 text-lg ml-1">{npc.npc_class}</span> </h1>
                  {(dialogue.length > 0 && dialogue[dialogue.length - 1].sender === 'npc') && <p className="text-white text-base line-clamp-3 hover:line-clamp-none mt-1">{dialogue[dialogue.length - 1].text}</p>}
                </div>
                <div className="absolute inset-x-0 bottom-7 h-2 p-2 flex items-center justify-center">
                  {(dialogue.length > 0 && dialogue[dialogue.length - 1].sender === 'npc') &&
                    <Icon name="angle-down" variant="inverted" className="animate-bounce w-6 h-6" />}
                </div></>)
              }
            </div>

            <Container>
              <TextContent>
                <span className="text-slate-500 font-bold text-lg mt-1">Current emotion: {currentEmotion}
                  {manualEmotionOverride && <p>(Manually overridden)</p>}
                </span>
              </TextContent>
              <Slider
                onChange={handleEmotionChange}
                value={emotions.indexOf(currentEmotion)}
                min={0}
                max={4}
                step={1}
                tickMarks
                ariaDescription="NPC emotion slider"
                labels={emotions.map((emotion, index) => ({ label: emotion, value: index }))}
              />
            </Container>
          </SpaceBetween>
        </Container>
        <Container>
          <SpaceBetween size="l">
            <SpaceBetween size="s" direction="horizontal">
              {currentChoices.map((choice, index) => (
                <Button key={index} onClick={() => handleChoice(choice)} disabled={isLoading || choice.disable}>
                  {choice.label}
                </Button>
              ))}
            </SpaceBetween>
            <div ref={dialogueRef} style={{ height: '600px', overflowY: 'auto' }}>
              {dialogue.map((entry: any, index: number) => (
                <div key={index} style={{
                  textAlign: entry.sender === 'user' ? 'right' : 'left',
                  margin: '10px 0'
                }}>
                  <span style={{
                    background: entry.sender === 'user' ? '#0073bb' : '#879596',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '10px',
                    display: 'inline-block',
                    maxWidth: '80%'
                  }}>
                    {entry.text}
                    {entry.sender !== 'user' && showMetrics && entry.metrics && (
                      <span className="inset-x-0 inline gap-1 flex my-2">
                        <Badge color="blue">{entry.metrics.latencyMs}ms</Badge> <Badge color="red">i: {entry.metrics.inputTokens} tokens</Badge> <Badge>o: {entry.metrics.outputTokens} tokens</Badge>
                      </span>
                    )}
                    {entry.sender !== 'user' && showMetrics && entry.tool_metrics && (
                      <span className="inset-x-0 inline gap-1 flex my-2">
                        <Badge color="blue">{entry.tool_metrics.latencyMs}ms</Badge> <Badge color="red">i: {entry.tool_metrics.inputTokens} tokens</Badge> <Badge>o: {entry.tool_metrics.outputTokens} tokens</Badge>  (Tool Selection + Text Generation)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            {isLoading && <LoadingBar variant="gen-ai-masked" />}
            <FormField stretch >
              <PromptInput
                onChange={({ detail }) => setInputText(detail.value)}
                value={inputText}
                actionButtonAriaLabel="Send message"
                actionButtonIconName="send"
                ariaLabel="Prompt input with min and max rows"
                maxRows={3}
                minRows={1}
                placeholder="Enter a message..."
                onAction={handleSendMessage}
              />
            </FormField>
          </SpaceBetween>
        </Container>

        <ExpandableSection
          variant="container"
          headerActions={
            <SpaceBetween className="items-center" size="l" direction="horizontal">
              <Toggle
                onChange={({ detail }) => setShowMetrics(detail.checked)}
                checked={showMetrics}
              >
                Show Metrics
              </Toggle>
              <Toggle
                onChange={({ detail }) => setUseToolConfig(detail.checked)}
                checked={useToolConfig}
              >
                Enable Tool use
              </Toggle>
              <Toggle
                onChange={({ detail }) => setTextToSpeechEnabled(detail.checked)}
                checked={textToSpeechEnabled}
              >
                Text-to-Speech
              </Toggle>
              {textToSpeechEnabled &&
                <Select
                  selectedOption={{ label: VOICE_OPTIONS.find(option => option.value === voiceId)?.label || voiceId, value: voiceId }}
                  onChange={({ detail }) => setVoiceId(detail.selectedOption.value as string)}
                  options={VOICE_OPTIONS}
                />
              }

              <h2 className='font-bold mr-0'>Language :</h2>
              <Select
                selectedOption={{ label: LANGUAGE_OPTIONS.find(option => option.value === language)?.label || language, value: language }}
                onChange={handleLanguageChange}
                options={LANGUAGE_OPTIONS}
              />
              <Button onClick={handleResetConversation}>Reset conversation</Button>
            </SpaceBetween>
          }
          headerText="Conversation option"
        >
          <SpaceBetween size="xl">
            <FormField label="Foundation Model">
              <Select
                selectedOption={{
                  label: FOUNDATION_MODEL_OPTIONS.find(option => option.value === modelId)?.label || modelId,
                  value: modelId
                }}
                onChange={({ detail }) => setModelId(detail.selectedOption.value as string)}
                options={FOUNDATION_MODEL_OPTIONS}
              />
            </FormField>
            <ColumnLayout columns={3}>
              <FormField label="Temperature">
                <Input
                  type="number"
                  value={temperature.toString()}
                  onChange={({ detail }) => setTemperature(Number(detail.value))}
                />
              </FormField>
              <FormField label="Top P">
                <Input
                  type="number"
                  value={topP.toString()}
                  onChange={({ detail }) => setTopP(Number(detail.value))}
                />
              </FormField>
              <FormField label="Max Tokens">
                <Input
                  type="number"
                  value={maxTokens.toString()}
                  onChange={({ detail }) => setMaxTokens(Number(detail.value))}
                />
              </FormField>
            </ColumnLayout>
            <FormField label="System Prompt Template"
              description="This template will be used to generate the chatbot prompt. Use {characterName}, {gender}, {race}, {characterClass}, {personality}, {genre}, and {language} as placeholders."
            >
              <Textarea
                value={chatbotPromptTemplate}
                onChange={({ detail }) => { setChatbotPromptTemplate(detail.value); setFilledChatbotPrompt(getFilledChatbotPrompt(npc, detail.value)); }}
                rows={10}
              />
            </FormField>
            <FormField
              label="Preview Generated Prompt"
              description="This is how the filled prompt will look like based on current character details."
            >
              <Textarea
                value={filledChatbotPrompt}
                readOnly
                rows={10}
              />
            </FormField>
          </SpaceBetween>

        </ExpandableSection>

      </Grid>
    </ContentLayout>
  );
};

export default NPCChat;