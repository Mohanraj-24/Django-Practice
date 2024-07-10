const express = require('express');
const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' });
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to insert data into checklist
app.post('/insert', async (req, res) => {
  try {
    let body;
    const { field, checklist } = req.body;

    switch (field) {
      case 'admin':
        body = { admin: checklist.map(item => ({ item })) };
        break;
      case 'manager':
        body = { manager: checklist.map(item => ({ item })) };
        break;
      default:
        return res.status(400).json({ error: 'Invalid field specified' });
    }

    const { body: response } = await client.index({
      index: 'checklist',
      body
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch existing checklists
app.get('/checklists', async (req, res) => {
  try {
    const { body } = await client.search({
      index: 'checklist',
      body: {
        query: {
          match_all: {}
        }
      }
    });

    res.json(body.hits.hits.map(hit => hit._source));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to update existing checklist
app.put('/update/:field', async (req, res) => {
  try {
    const { field } = req.params;
    const { checklist } = req.body;

    let body;
    switch (field) {
      case 'admin':
        body = { admin: checklist.map(item => ({ item })) };
        break;
      case 'manager':
        body = { manager: checklist.map(item => ({ item })) };
        break;
      default:
        return res.status(400).json({ error: 'Invalid field specified' });
    }

    const { body: response } = await client.updateByQuery({
      index: 'checklist',
      body: {
        script: {
          lang: 'painless',
          source: `
            ctx._source.${field} = params.${field}
          `,
          params: {
            [field]: body[field]
          }
        }
      }
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
