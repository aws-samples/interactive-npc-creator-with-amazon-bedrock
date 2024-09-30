'use client';
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import React from 'react';
import {
  Container,
  ContentLayout,
  SpaceBetween,
  Grid,
  Button,
  Link,
  Header,
  Box
} from '@cloudscape-design/components';
import { useRouter } from 'next/navigation';


const LOCALE = 'en';

export default function Main() {
  const router = useRouter();
  return (
    <ContentLayout
      defaultPadding
      disableOverlap
      maxContentWidth={1040}
      headerVariant="high-contrast"
      header={
        <Box data-testid="hero-header" padding={{ top: 'xs', bottom: 'l' }}>
          <Grid gridDefinition={[{ colspan: { default: 12, xs: 8, s: 9 } }, { colspan: { default: 12, xs: 4, s: 3 } }]}>
            <div>
              <Box variant="h1">Dynamic NPC dialogue with Gen AI</Box>
              <Box variant="p" color="text-body-secondary" margin={{ top: 'xxs', bottom: 's' }}>
                Game NPC(Non-Player Character) Playground to design, develop(prompt-engineering), and test game NPCs that interect with players more naturally using dynamic dialogue powered by Amazon Bedrock.
              </Box>
              <SpaceBetween size="xs">
              </SpaceBetween>
            </div>

            <Box margin={{ top: 'l' }}>
              <SpaceBetween size="s">
                <Button variant="primary" onClick={() => { router.push('/npc/create'); }} fullWidth={true}>
                  Create
                </Button>
                <Button onClick={() => { router.push('/npc/list'); }} fullWidth={true}>View NPCs</Button>
              </SpaceBetween>
            </Box>
          </Grid>
        </Box>

      }
    >
      <div className="mt-10">
        <section className="page-section" aria-label="Product overview" >
          <Header variant="h1">
            <span id="product-overview">Create own NPC</span>
          </Header>
          <SpaceBetween size="l">
            <Box margin={{ top: 'xl' }}>
            <img src={'/images/create-npc.png'} alt="Video thumbnail" />
            </Box>
          </SpaceBetween>
        </section>
      </div>
    </ContentLayout>
  );
}
