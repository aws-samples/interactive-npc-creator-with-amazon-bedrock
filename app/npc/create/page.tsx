// app/npc/create/page.tsx
'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NPCForm from '@/components/NPCForm';
import { post } from 'aws-amplify/api';
import { Flashbar, FlashbarProps } from '@cloudscape-design/components';

const CreateNPCPage: React.FC = () => {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<FlashbarProps.MessageDefinition[]>([]);

  const handleSave = async (characterData: any) => {
    try {
      const restOperation = post({
        apiName: 'npcApi',
        path: 'npc',
        options: {
          body: characterData
        }
      });
      await restOperation.response;

      setSaveStatus([{ type: 'success', content: 'NPC created successfully!', onDismiss: () => setSaveStatus([]), dismissible: true }]);
      // Optionally, redirect to the NPC list or detail page after successful creation
      router.push('/npc/list');
    } catch (error) {
      console.error('Error creating NPC:', error);
      setSaveStatus([{ type: 'error', content: 'An error occurred while saving. Please try again.', onDismiss: () => setSaveStatus([]), dismissible: true }]);
    }
  };

  return (
    <>
      <Flashbar items={saveStatus} />
      <NPCForm mode="create" onSave={handleSave} />
    </>
  );
};

export default CreateNPCPage;