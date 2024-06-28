const { Client } = require('@elastic/elasticsearch');
const express = require('express');
const bodyParser = require('body-parser');

const client = new Client({ node: 'http://localhost:9200' });
const app = express();

app.use(bodyParser.json());

const INDEX_NAME = 'incidents_v2';

app.get('/incidents_over_time', async (req, res) => {
  const { lob, size = 12 } = req.query;

  const now = new Date();
  const lastYear = new Date();
  lastYear.setFullYear(now.getFullYear() - 1);

  const queryObj = {
    bool: {
      must: [],
      filter: [
        {
          range: {
            issue_start_date: {
              gte: lastYear.toISOString(),
              lte: now.toISOString(),
            }
          }
        }
      ]
    }
  };

  if (lob) {
    queryObj.bool.filter.push({ term: { lob: lob } });
  }

  try {
    const body = {
      size: 0,  // We're only interested in the aggregations
      query: queryObj,
      aggs: {
        by_month: {
          date_histogram: {
            field: 'issue_start_date',
            calendar_interval: 'month'
          },
          aggs: {
            by_lob: {
              terms: {
                field: 'lob.keyword',
                size: 10000  // Adjust if needed
              }
            }
          }
        }
      }
    };

    const startTime = Date.now();
    const response = await client.search({ index: INDEX_NAME, body });
    const endTime = Date.now();
    const timeTaken = response.body.took;

    console.log(`Query executed in ${timeTaken}ms (Server Time: ${endTime - startTime}ms)`);

    res.json(response.aggregations.by_month.buckets);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).send('Error performing search');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
