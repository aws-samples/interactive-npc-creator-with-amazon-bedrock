import { defineStorage } from '@aws-amplify/backend';
import { portrait_handler } from '../functions/portrait/resources';

export const storage = defineStorage({
  name: 'npc_portrait',
  access: (allow) => ({
    'images/*': [
      allow.resource(portrait_handler).to(['read', 'write', 'delete']),
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});