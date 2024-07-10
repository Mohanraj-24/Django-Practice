const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' });

async function createIndex() {
  try {
    const indexName = 'checklist';

    // Delete the index if it already exists (for demonstration purposes)
    const { body: exists } = await client.indices.exists({ index: indexName });
    if (exists) {
      await client.indices.delete({ index: indexName });
    }

    // Create the index with the desired mapping
    const { body: response } = await client.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            admin: {
              type: 'nested',
              properties: {
                item: { type: 'text' }
              }
            },
            manager: {
              type: 'nested',
              properties: {
                item: { type: 'text' }
              }
            },
            developer: {
              type: 'nested',
              properties: {
                item: { type: 'text' }
              }
            }
          }
        }
      }
    });

    console.log('Index created successfully:', response);
  } catch (error) {
    console.error('Error creating index:', error);
  }
}

createIndex();
