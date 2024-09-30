'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NPCForm from '@/components/NPCForm';
import { put } from 'aws-amplify/api';
import { Flashbar, FlashbarProps } from '@cloudscape-design/components';

//: React.FC
const UpdateNPCPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const { id } = params;
  const [saveStatus, setSaveStatus] = useState<FlashbarProps.MessageDefinition[]>([]);

  useEffect(() => {
    if (!id) {
      // Redirect to the NPC list page or show an error if no ID is provided
      router.push('/npc/list');
      return;
    }
  }, []);

  const handleSave = async (characterData: any) => {
    try {
      const restOperation = put({
        apiName: 'npcApi',
        path: `npc/${id}`,
        options: {
          body: characterData
        }
      });
      await restOperation.response;

      setSaveStatus([{ type: 'success', content: 'NPC updated successfully!', onDismiss: () => setSaveStatus([]), dismissible: true }]);
      // Optionally, redirect to the NPC list or detail page after successful update
      router.push('/npc/list');
    } catch (error) {
      console.error('Error updating NPC:', error);
      setSaveStatus([{ type: 'error', content: 'An error occurred while updating. Please try again.', onDismiss: () => setSaveStatus([]), dismissible: true }]);
    }
  };

  return (
    <>
      <Flashbar items={saveStatus} />
      <NPCForm mode="update" npcId={id} onSave={handleSave} />
    </>
  );
};

export default UpdateNPCPage;