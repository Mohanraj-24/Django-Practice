const { Client } = require('@elastic/elasticsearch');

// Create a new client instance
const client = new Client({ node: 'http://localhost:9200' });

async function deleteIndex(indexName) {
  try {
    // Check if the index exists
    const { body: indexExists } = await client.indices.exists({ index: indexName });

    if (indexExists) {
      // Delete the index
      const { body: deleteResponse } = await client.indices.delete({ index: indexName });
      console.log(`Index "${indexName}" deleted successfully:`, deleteResponse);
    } else {
      console.log(`Index "${indexName}" does not exist.`);
    }
  } catch (error) {
    console.error('Error deleting the index:', error);
  }
}

// Replace 'your_index_name' with the name of the index you want to delete
deleteIndex('your_index_name');
