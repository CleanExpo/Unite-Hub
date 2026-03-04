/**
 * Basic usage example for the @unite-group/sdk package.
 *
 * Run with: npx ts-node examples/basic.ts
 */
import { UniteHubClient } from '../src';

async function main() {
  const client = new UniteHubClient({
    baseUrl: 'https://unite-group.in/api',
    apiKey: process.env.UNITE_API_KEY || 'your-api-key-here',
  });

  // --- Contacts ---
  console.log('--- Listing contacts ---');
  const contacts = await client.contacts.list({ limit: 5 });
  console.log(`Found ${contacts.length} contacts`);

  // Create a contact
  const newContact = await client.contacts.create({
    name: 'Jane Smith',
    email: 'jane@example.com',
    company: 'Acme Corp',
    status: 'lead',
    tags: ['demo', 'sdk-test'],
  });
  console.log(`Created contact: ${newContact.id}`);

  // Update a contact
  const updated = await client.contacts.update(newContact.id, {
    status: 'customer',
  });
  console.log(`Updated status to: ${updated.status}`);

  // --- Project Events ---
  console.log('\n--- Sending project event ---');
  const event = await client.events.send({
    project_id: 'proj_123',
    event_type: 'deployment',
    payload: { environment: 'production', version: '1.2.3' },
    source: 'sdk-example',
  });
  console.log(`Event created: ${event.id}`);

  // --- Vault ---
  console.log('\n--- Vault credentials ---');
  const creds = await client.vault.list();
  console.log(`Found ${creds.length} vault credentials`);

  // Get a specific credential by service
  const stripeCred = await client.vault.getByService('stripe');
  if (stripeCred) {
    console.log(`Stripe credential found: ${stripeCred.id}`);
  }

  // Clean up
  await client.contacts.delete(newContact.id);
  console.log('\nDone. Contact cleaned up.');
}

main().catch(console.error);
