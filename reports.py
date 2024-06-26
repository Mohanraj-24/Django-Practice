const { Client } = require('@elastic/elasticsearch');
const express = require('express');
const bodyParser = require('body-parser');

const client = new Client({ node: 'http://localhost:9200' });
const app = express();

app.use(bodyParser.json());

const INDEX_NAME = 'incidents_v2';

app.get('/search', async (req, res) => {
  const { query, startDate, endDate, filterSeverity, filterAppName, filterChannelName, column, size = 10 } = req.query;

  const queryObj = {
    bool: {
      must: [],
      filter: []
    }
  };

  if (query) {
    queryObj.bool.must.push({
      multi_match: {
        query: query,
        fields: ['lessons_learned', 'summary', 'description'] // Add more fields as needed
      }
    });
  }

  if (startDate || endDate) {
    const dateRange = {};
    if (startDate) dateRange.gte = startDate;
    if (endDate) dateRange.lte = endDate;
    queryObj.bool.filter.push({ range: { issue_start_date: dateRange } });
  }

  if (filterSeverity) queryObj.bool.filter.push({ term: { severity: filterSeverity } });
  if (filterAppName) queryObj.bool.filter.push({ term: { app_name: filterAppName } });
  if (filterChannelName) queryObj.bool.filter.push({ term: { channel_name: filterChannelName } });

  try {
    const body = {
      query: queryObj,
      size: parseInt(size), // Adjust the number of returned documents
    };

    if (column) {
      const aggregations = {
        app_name: { terms: { field: 'app_name', size: 10000 } },
        channel_name: { 
          terms: { field: 'channel_name', size: 10000 },
          aggs: {
            severity: { terms: { field: 'severity', size: 10000 } }
          }
        },
        severity: { stats: { field: 'severity' } },
        category: { terms: { field: 'category', size: 10000 } },
        issue_id: { terms: { field: 'issue_id', size: 10000 } }
      };

      if (!aggregations[column]) return res.status(400).send('Invalid column name');

      body.size = 0;
      body.aggs = { [column]: aggregations[column] };
    }

    const startTime = Date.now();
    const response = await client.search({ index: INDEX_NAME, body });
    const endTime = Date.now();
    const timeTaken = response.body.took;

    console.log(`Query executed in ${timeTaken}ms (Server Time: ${endTime - startTime}ms)`);

    if (column) {
      const aggResult = response.aggregations[column];
      if (aggResult && aggResult.buckets) {
        const resultWithExplanation = {
          ...aggResult,
          explanation: {
            doc_count_error_upper_bound: "The maximum possible error in the document count due to shard-level approximation.",
            sum_other_doc_count: "The sum of document counts for all terms that are not included in the response."
          }
        };
        res.json(resultWithExplanation);
      } else {
        res.json(aggResult);
      }
    } else {
      res.json({
        hits: response.hits.hits,
        count: response.hits.total.value
      });
    }
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).send('Error performing search');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
