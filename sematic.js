const { Client } = require('@elastic/elasticsearch');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const client = new Client({ node: 'http://localhost:9200' });
const app = express();

app.use(bodyParser.json());

const INDEX_NAME = 'incidents_v2';

// Function to generate embeddings for a given text using the Flask server
async function generateEmbedding(text) {
  try {
    if (!text) {
      console.log('Empty text received, returning zero vector.');
      return new Array(768).fill(0); // Assuming the embedding size is 768
    }

    console.log(Generating embedding for text: ${text});
    const payload = {text: text };
    const response = await axios.post('http://localhost:5000/embed', payload);
    return response.data.embeddings;
  } catch (error) {
    console.error('Error generating embedding:', error.response ? error.response.data : error.message);
    throw error;
  }
}

app.get('/semantic_search', async (req, res) => {
  const { query, size = 10 } = req.body;

  if (!query) {
    return res.status(400).send('Query parameter is required');
  }

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    const knnFieldNames = [
      'why1_vector',
      'why2_vector',
      'why3_vector',
      'why4_vector',
      'why5_vector',
      'lessons_learned_vector'
    ];

    const knnQueries = knnFieldNames.map(field => ({
      knn: {
        field: field,
        query_vector: queryEmbedding,
        k: parseInt(size),
        num_candidates: 100
      }
    }));

    const body = {
      query: {
        bool: {
          should: knnQueries,
          minimum_should_match: 1
        }
      }
    };

   
    res.json({
      hits: response.hits.hits,
      count: response.hits.total.value
    });
  } catch (error) {
    console.error('Error performing semantic search:', error);
    res.status(500).send('Error performing semantic search');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(Server is running on http://localhost:${port});
});
