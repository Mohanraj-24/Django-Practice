const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const client = new Client({ node: 'http://localhost:9200' });

// Insert a new user
app.post('/users', async (req, res) => {
  const { userId, lob, techStack } = req.body;

  try {
    await client.index({
      index: 'users',
      id: userId,
      body: {
        user_id: userId,
        lob: lob,
        tech_stack: techStack,
        last_login: new Date().toISOString() // Initial last login time, if needed
      }
    });
    res.status(201).send({ message: 'New user inserted' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to insert new user' });
  }
});

// Update last login on logout
app.post('/users/:userId/logout', async (req, res) => {
  const { userId } = req.params;

  try {
    await client.update({
      index: 'users',
      id: userId,
      body: {
        doc: {
          last_login: new Date().toISOString()
        }
      }
    });
    res.send({ message: 'Last login updated' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to update last login' });
  }
});

// Update user profile
app.put('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { lob, techStack } = req.body;

  try {
    await client.update({
      index: 'users',
      id: userId,
      body: {
        doc: {
          lob: lob,
          tech_stack: techStack
        }
      }
    });
    res.send({ message: 'User profile updated' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to update user profile' });
  }
});

// Fetch user profile
app.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const { body } = await client.get({
      index: 'users',
      id: userId
    });

    res.send(body._source);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to fetch user profile' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
