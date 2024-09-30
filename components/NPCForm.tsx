// @ts-nocheck
// components/NPCForm.tsx
'use client'
import React, { useState, useEffect } from 'react';
import {
    ContentLayout,
    Container,
    Header,
    Select,
    Button,
    SpaceBetween,
    TextContent,
    Grid,
    Tabs,
    Input,
    Box,
    Textarea,
    FormField,
    Flashbar,
    Spinner,
    FlashbarProps
} from '@cloudscape-design/components';
import { v4 as uuidv4 } from 'uuid';
import { post, get } from 'aws-amplify/api';
import { remove } from 'aws-amplify/storage';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import LoadingBar from "@cloudscape-design/chat-components/loading-bar";

const gameGenres = ['Fantasy', 'Sci-Fi', 'Horror', 'Adventure', 'RPG'];
const genders = ['Male', 'Female', 'Non-binary'];
const races = ['Human', 'Elf', 'Dwarf', 'Orc', 'Alien', 'Undead'];
const classes = ['Warrior', 'Mage', 'Rogue', 'Healer', 'Archer'];
const personalities = ['Brave', 'Cunning', 'Wise', 'Mysterious', 'Cheerful'];
const emotions = ['Basic', 'Joy', 'Sadness', 'Angry', 'Pain'];
const models = [
    { label: 'Stable Image Ultra', value: 'stability.stable-image-ultra-v1:0' },
    { label: 'Stable Diffusion XL v1', value: 'stability.stable-diffusion-xl-v1' },
];
const languages = [
    { label: 'Korean', value: 'ko-kr' },
    { label: 'English', value: 'en-us' },
];

const MAX_SEED = 4294967294;

interface NPCFormProps {
    mode: 'create' | 'update';
    npcId?: string;
    onSave: (characterData: any) => void;
}

const NPCForm: React.FC<NPCFormProps> = ({ mode, npcId, onSave }) => {
    const [characterName, setCharacterName] = useState('');
    const [genre, setGenre] = useState<string | undefined>('RPG');
    const [gender, setGender] = useState<string | undefined>('Female');
    const [race, setRace] = useState<string | undefined>('Human');
    const [characterClass, setCharacterClass] = useState<string | undefined>('Rogue');
    const [personality, setPersonality] = useState<string | undefined>('Mysterious');
    const [language, setLanguage] = useState<string>('ko-kr');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [editablePrompt, setEditablePrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [imageGenerated, setImageGenerated] = useState(false);
    const [activeTab, setActiveTab] = useState('Basic');
    const [seed, setSeed] = useState(Math.floor(Math.random() * (MAX_SEED + 1)));
    const [saveStatus, setSaveStatus] = useState<FlashbarProps.MessageDefinition[]>([]);
    const [realImagesPath, setRealImagesPath] = useState<{ [id: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string | undefined>(models[0].value);
    const [chatbotPrompt, setChatbotPrompt] = useState('');

    const characterId = mode === 'create' ? uuidv4() : npcId;

    useEffect(() => {
        if (mode === 'update' && npcId) {
            fetchNPCData();
        } else if (mode === 'create') {
            generateChatbotPrompt();
        }
    }, [mode, npcId]);

    const fetchNPCData = async () => {
        try {
            const response = await get({ apiName: 'npcApi', path: `npc/${npcId}` }).response;
            const data: any = await response.body.json();
            // Update state with fetched data
            setCharacterName(data.npc_name);
            setGenre(data.genre);
            setGender(data.gender);
            setRace(data.race);
            setCharacterClass(data.npc_class);
            setPersonality(data.personality);
            setLanguage(data.npc_language || 'ko-kr');
            setEditablePrompt(data.prompt);
            setNegativePrompt(data.negative_prompt);
            setSeed(data.seed);
            setSelectedModel(data.model);
            setRealImagesPath(data.images);
            setChatbotPrompt(data.chatbotPrompt);
            setImageGenerated(true);
        } catch (error) {
            console.error('Error fetching NPC data:', error);
            setSaveStatus([{ type: 'error', content: 'Failed to fetch NPC data.', dismissible: true }]);
        }
    };

    const generatePrompt = () => {
        const promptText = `((portrait)). ${genre} game character, ${gender} ${race} ${characterClass} with a ${personality} personality. high detail`;
        setGeneratedPrompt(promptText);
        setEditablePrompt(promptText);
    };

    const generateChatbotPrompt = () => {
        const template = `You are {characterName}, a {gender} {race} {characterClass} with a {personality} personality in a {genre} setting. Your responses should reflect your background and traits. Please follow these guidelines:

1. Use language and terms fitting for a {genre} world.
2. Show your {personality} nature in your speech and actions.
3. Reference your skills as a {characterClass} when relevant.
4. Occasionally mention your {race} heritage or physical traits.
5. Respond to queries about your world, your past, or current events in a way that's consistent with your character and setting.
6. Always stay in character and provide immersive, engaging responses that bring your unique persona to life.

If you don't use any tools, for each response, return a JSON object with the following structure:
{
  "npc_response": "Your in-character response here",
  "emotion": "One of: Basic, Joy, Sadness, Angry, or Pain"
}

Choose the emotion that best fits your response:
- Basic: For neutral or calm responses
- Joy: For happy, excited, or positive responses
- Sadness: For sad, disappointed, or melancholic responses
- Angry: For angry, frustrated, or irritated responses
- Pain: For responses indicating physical or emotional pain

Remember to analyze the content and tone of your response to determine the most appropriate emotion.
Please response with {language} for 'npc_response'.`;

        setChatbotPrompt(template);
    };

    const getFilledChatbotPrompt = () => {
        return chatbotPrompt
            .replaceAll('{characterName}', characterName)
            .replaceAll('{gender}', gender || '')
            .replaceAll('{race}', race || '')
            .replaceAll('{characterClass}', characterClass || '')
            .replaceAll('{personality}', personality || '')
            .replaceAll('{genre}', genre || '')
            .replaceAll('{language}', language === 'ko-kr' ? 'Korean' : 'English');
    };

    const handleGenerateCharacter = async () => {
        setIsLoading(true);
        const basePrompt = editablePrompt;
        let generatedSeed = seed;
        const previousImages = { ...realImagesPath };

        try {
            const imageResults = await Promise.all(emotions.map(async (emotion, index) => {
                const emotionPrompt = `${basePrompt}. With ${emotion} emotion.`;
                const imageId = uuidv4();
                const restOperation: any = post({
                    apiName: 'npcApi',
                    path: 'portrait',
                    options: {
                        body: {
                            modelId: selectedModel,
                            characterId,
                            imageId,
                            emotion,
                            prompt: emotionPrompt,
                            negative_prompt: negativePrompt,
                            seed: index === 0 ? seed : generatedSeed
                        }
                    }
                });

                const { body } = await restOperation.response;
                const data: any = await body.json();

                if (index === 0 && data && data.image) {
                    generatedSeed = data.seed;
                    setSeed(generatedSeed);
                }
                return { emotion, image: data.image };
            }));

            const newImageMap: { [id: string]: string } = {};
            imageResults.forEach(({ emotion, image }) => {
                newImageMap[emotion] = image;
            });

            // 새 이미지 생성이 성공적으로 완료된 후 이전 이미지 삭제
            await Promise.all(Object.entries(previousImages).map(async ([emotion, imagePath]) => {
                try {
                    await remove({ path: imagePath });
                    console.log(`Previous ${emotion} image deleted successfully.`);
                } catch (error) {
                    console.error(`Error deleting previous ${emotion} image:`, error);
                    // 이미지 삭제 실패 시 사용자에게 알림
                    setSaveStatus(prev => [...prev, {
                        type: 'warning',
                        content: `Failed to delete previous ${emotion} image. It may need manual cleanup.`,
                        dismissible: true
                    }]);
                }
            }));

            setRealImagesPath(newImageMap);
            setImageGenerated(true);
        } catch (error) {
            console.error('Error generating images:', error);
            setSaveStatus([{ type: 'error', content: 'Failed to generate images. Please try again.', dismissible: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        const characterData = {
            npc_name: characterName,
            genre,
            gender,
            race,
            npc_class: characterClass,
            personality,
            npc_language:language,
            prompt: editablePrompt,
            negative_prompt: negativePrompt,
            seed,
            model: selectedModel,
            images: realImagesPath,
            chatbotPrompt
        };

        onSave(characterData);
    };

    return (
        <ContentLayout
            defaultPadding
            maxContentWidth={1620}
            headerVariant="high-contrast"
            header={
                <Box margin={{ top: "l" }} padding="l">
                    <Header variant="h1"
                        actions={
                            <SpaceBetween direction="horizontal" size="xs">
                                {imageGenerated && (
                                    <Button variant="primary" onClick={handleSave}>
                                        {mode === 'create' ? 'Save Character' : 'Update Character'}
                                    </Button>
                                )}
                            </SpaceBetween>
                        }
                    >
                        {mode === 'create' ? 'Create a NPC' : 'Update NPC'}
                    </Header>
                </Box>
            }
            notifications={<Flashbar items={saveStatus} />}
        >
            <Grid
                gridDefinition={[
                    { colspan: { default: 5, xl: 12 } },
                    { colspan: { default: 7, xl: 12 } },
                    { colspan: 12 }
                ]}
            >
                <SpaceBetween size="l">
                    <Container>
                        <SpaceBetween size="m">
                            <Header variant="h1">
                                Choose characteristics
                            </Header>
                            <FormField stretch label="Character Name">
                                <Input
                                    value={characterName}
                                    onChange={({ detail }) => setCharacterName(detail.value)}
                                    placeholder="Enter character name"
                                />
                            </FormField>

                            <FormField stretch label="Game Genre">
                                <Select
                                    selectedOption={{ label: genre, value: genre }}
                                    onChange={({ detail }) => setGenre(detail.selectedOption.value)}
                                    options={gameGenres.map(g => ({ label: g, value: g }))}
                                    placeholder="Select game genre"
                                />
                            </FormField>

                            <FormField stretch label="Gender">
                                <Select
                                    selectedOption={{ label: gender, value: gender }}
                                    onChange={({ detail }) => setGender(detail.selectedOption.value)}
                                    options={genders.map(g => ({ label: g, value: g }))}
                                    placeholder="Select gender"
                                />
                            </FormField>

                            <FormField stretch label="Race">
                                <Select
                                    selectedOption={{ label: race, value: race }}
                                    onChange={({ detail }) => setRace(detail.selectedOption.value)}
                                    options={races.map(r => ({ label: r, value: r }))}
                                    placeholder="Select race"
                                />
                            </FormField>

                            <FormField stretch label="Character Class">
                                <Select
                                    selectedOption={{ label: characterClass, value: characterClass }}
                                    onChange={({ detail }) => setCharacterClass(detail.selectedOption.value)}
                                    options={classes.map(c => ({ label: c, value: c }))}
                                    placeholder="Select class"
                                />
                            </FormField>
                            <FormField stretch label="Personality">
                                <Select
                                    selectedOption={{ label: personality, value: personality }}
                                    onChange={({ detail }) => setPersonality(detail.selectedOption.value)}
                                    options={personalities.map(p => ({ label: p, value: p }))}
                                    placeholder="Select personality"
                                />
                            </FormField>

                            <Button onClick={generatePrompt} disabled={!characterName}>Generate Image Prompt</Button>
                        </SpaceBetween>
                    </Container>
                    {(generatedPrompt !== '' || mode === 'update') && (
                        <Container>
                            <SpaceBetween size="l">
                                <Header variant="h1">
                                    Generate Portraits
                                </Header>
                                <FormField label="Generated Prompt">
                                    <Textarea
                                        value={editablePrompt}
                                        onChange={({ detail }) => setEditablePrompt(detail.value)}
                                        placeholder="Edit your prompt here"
                                        rows={4}
                                    />
                                </FormField>
                                <FormField label="Negative Prompt">
                                    <Textarea
                                        value={negativePrompt}
                                        onChange={({ detail }) => setNegativePrompt(detail.value)}
                                        placeholder="Enter negative prompt here"
                                        rows={4}
                                    />
                                </FormField>
                                <FormField
                                    label="Seed Value"
                                    constraintText="Do not use '0' (the default random seed for stable diffusion) to synchronize seeds between each image with different emotions."
                                    secondaryControl={<Button iconName="refresh" onClick={() => setSeed(Math.floor(Math.random() * (MAX_SEED + 1)))}>Try more!</Button>}>
                                    <Input
                                        type="number"
                                        value={seed.toString()}
                                        onChange={({ detail }) => setSeed(parseInt(detail.value) || 0)}
                                    />
                                </FormField>
                                <FormField label="Image Generation Model">
                                    <Select
                                        selectedOption={{ label: (models.find(m => m.value === selectedModel)?.label), value: selectedModel }}
                                        onChange={({ detail }) => setSelectedModel(detail.selectedOption.value)}
                                        options={models}
                                    />
                                </FormField>
                                <Button iconAlign="left" iconName="gen-ai" onClick={handleGenerateCharacter} disabled={!editablePrompt || isLoading}>
                                    {isLoading ? <Spinner /> : 'Generate Character'}
                                </Button>
                            </SpaceBetween>
                        </Container>
                    )}
                </SpaceBetween>

                <Container fitHeight={true} >
                    <SpaceBetween size="l">
                        <Header variant="h2">Generated Character</Header>
                        {imageGenerated ? (
                            <Tabs
                                tabs={emotions.map(emotion => ({
                                    label: emotion,
                                    id: emotion,
                                    content: (
                                        <StorageImage path={realImagesPath[emotion]}
                                            alt={`Generated character ${characterName} - ${emotion}`}
                                            style={{ width: '100%', height: 'auto' }}
                                        />
                                    )
                                }))}
                                activeTabId={activeTab}
                                onChange={({ detail }) => setActiveTab(detail.activeTabId)}
                            />
                        ) : (
                            <React.Fragment>
                                <TextContent>Character images will appear here after generation.</TextContent>
                                {isLoading && <LoadingBar variant="gen-ai-masked" />}
                            </React.Fragment>
                        )}
                    </SpaceBetween>
                </Container>
                <Container>
                    <SpaceBetween size="l">
                        <Header variant="h2">Chatbot Prompt Template</Header>
                        <FormField label="Language">
                            <Select
                                selectedOption={{ label: languages.find(l => l.value === language)?.label, value: language }}
                                onChange={({ detail }) => setLanguage(detail.selectedOption.value as string)}
                                options={languages}
                            />
                        </FormField>
                        <FormField
                            label="NPC Chatbot Prompt Template"
                            description="This template will be used to generate the chatbot prompt. Use {characterName}, {gender}, {race}, {characterClass}, {personality}, {genre}, and {language} as placeholders."
                        >
                            <Textarea
                                value={chatbotPrompt}
                                onChange={({ detail }) => setChatbotPrompt(detail.value)}
                                placeholder="Enter or edit the chatbot prompt template here"
                                rows={10}
                            />
                        </FormField>
                        <Button onClick={generateChatbotPrompt}>Reset Template</Button>
                        <FormField
                            label="Preview Generated Prompt"
                            description="This is how the filled prompt will look like based on current character details."
                        >
                            <Textarea
                                value={getFilledChatbotPrompt()}
                                readOnly
                                rows={10}
                            />
                        </FormField>
                    </SpaceBetween>
                </Container>
            </Grid>
        </ContentLayout>
    );
};

export default NPCForm;