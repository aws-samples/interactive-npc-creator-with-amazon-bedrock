// @ts-nocheck
'use client'
import React, { useState, useEffect } from 'react';
import {
  ContentLayout,
  Box,
  Container,
  Header,
  Button,
  SpaceBetween,
  TextContent,
  Grid,
  Cards,
  Flashbar
} from '@cloudscape-design/components';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { get, del } from 'aws-amplify/api';

const NPCListPage = () => {
  const [npcs, setNpcs] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [flashbarItems, setFlashbarItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNPCs();
  }, []);

  const fetchNPCs = async () => {
    setIsLoading(true);
    try {
      const restOperation = get({
        apiName: 'npcApi',
        path: 'npc'
      });
      const { body } = await restOperation.response;
      const data = await body.json();
      setNpcs(data);
      setIsLoading(false);
    } catch (error) {
      console.log('GET call failed: ', error);
      addFlashbarItem('error', 'Failed to fetch NPCs');
      setIsLoading(false);
    }
  };

  const deleteNPC = async () => {
    if (selectedItems.length === 0) return;

    const itemToDelete = selectedItems[0];
    try {
      await del({
        apiName: 'npcApi',
        path: `npc/${itemToDelete.id}`
      });
      setNpcs(npcs.filter(npc => npc.id !== itemToDelete.id));
      setSelectedItems([]);
      addFlashbarItem('success', `Successfully deleted ${itemToDelete.npc_name}`);
    } catch (error) {
      console.log('DELETE call failed: ', error);
      addFlashbarItem('error', `Failed to delete ${itemToDelete.npc_name}`);
    }
  };

  const addFlashbarItem = (type: string, content: string) => {
    const newItem = {
      type,
      content,
      dismissible: true,
      onDismiss: () => setFlashbarItems(items => items.filter(i => i !== newItem))
    };
    setFlashbarItems(items => [...items, newItem]);
  };

  const handleChatWith = () => {
    if (selectedItems.length === 0) return;
    router.push(`/npc/${selectedItems[0].id}/converse`);
  };

  return (
    <ContentLayout
      defaultPadding
      maxContentWidth={1620}
      headerVariant="high-contrast"
      header={
        <Box margin={{ top: "l" }} padding="l">
          <Header variant="h1">
            All NPCs
          </Header>
        </Box>
      }
      notifications={<Flashbar items={flashbarItems} />}
    >
      <Cards
        header={
          <Header
            actions={
              <SpaceBetween
                direction="horizontal"
                size="xs"
              >
                <Button onClick={() => { router.push(`/npc/${selectedItems[0].id}/edit`); }}
                  disabled={selectedItems.length === 0}
                >Edit</Button>
                <Button
                  onClick={deleteNPC}
                  disabled={selectedItems.length === 0}
                >
                  Delete
                </Button>
                <Button
                  onClick={handleChatWith}
                  disabled={selectedItems.length === 0}
                >
                  Chat with
                </Button>
                <Button onClick={() => { router.push('/npc/create'); }}
                  variant="primary">
                  Create NPC
                </Button>
              </SpaceBetween>
            }
          >
          </Header>
        }
        loadingText="Loading resources"
        loading={isLoading}
        empty={
          <Box
            margin={{ vertical: "xs" }}
            textAlign="center"
            color="inherit"
          >
            <SpaceBetween size="m">
              <b>No NPCs</b>
              <Button onClick={() => { router.push('/npc/create'); }}>
                  Create NPC
                </Button>
            </SpaceBetween>
          </Box>
        }  
        selectionType="single"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
        items={npcs}
        cardDefinition={{
          header: item => (
            <Link href={`/npc/create`}>
              {item.npc_name}
            </Link>
          ),
          sections: [
            {
              id: "image",
              content: item => (
                <StorageImage path={item.images.Basic}
                  alt={item.npc_name}
                  style={{ width: '100%', height: 'auto' }}
                />
              )
            },
            {
              id: 'genre',
              header: 'Genre',
              content: item => item.genre,
              width: 50
            },
            {
              id: 'gender',
              header: 'Gender',
              content: item => item.gender,
              width: 50
            },
            {
              id: 'race',
              header: 'Race',
              content: item => item.race,
              width: 50
            },
            {
              id: 'class',
              header: 'Class',
              content: item => item.npc_class,
              width: 50
            },
            {
              id: 'personality',
              header: 'Personality',
              content: item => item.personality,
              width: 50
            },
            {
              id: "actions",
              content: item => (
                <Link href={`/npc/${item.id}/converse`} passHref>
                  <Button variant="primary">Start Conversation</Button>
                </Link>
              )
            }
          ]
        }}
      />
    </ContentLayout>
  );
};

export default NPCListPage;