const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');

const client = new Client({ node: 'http://localhost:9200' });

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

// Initialize personas with empty data array if they don't exist
const initialPersonas = [
  "manager",
  "developer",
  "code_reviewer",
  "release_coordinator",
  "psg",
  "pte",
  "dare"
];

(async () => {
  for (const persona of initialPersonas) {
    try {
      const { body: exists } = await client.exists({
        index: 'checklists',
        id: persona
      });

      if (!exists) {
        await client.index({
          index: 'checklists',
          id: persona,
          body: {
            persona: persona,
            data: []
          }
        });
      }
    } catch (error) {
      console.error(`Error initializing persona ${persona}:`, error);
    }
  }
})();

// Insert checklist items for a specific persona
app.post('/checklists', async (req, res) => {
  const { persona } = req.query;
  const { data } = req.body;

  if (!Array.isArray(data)) {
    return res.status(400).send('Data should be an array of objects.');
  }

  try {
    const { body: existingDoc } = await client.get({
      index: 'checklists',
      id: persona
    });

    const updatedData = [...existingDoc._source.data, ...data];

    await client.update({
      index: 'checklists',
      id: persona,
      body: {
        doc: {
          data: updatedData
        }
      }
    });

    res.status(200).send('Data added successfully.');
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).send('Error inserting data.');
  }
});

// Fetch data for a specific persona
app.get('/checklists/:persona', async (req, res) => {
  const { persona } = req.params;

  try {
    const { body } = await client.get({
      index: 'checklists',
      id: persona
    });

    const { data } = body._source;

    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching data for persona ${persona}:`, error);
    res.status(500).send(`Error fetching data for persona ${persona}.`);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
