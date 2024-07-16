import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TableComponent from './TableComponent';
import HeadingComponent from './HeadingComponent';

const App = () => {
  const heading = "Lessons Learned Table";
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/checklists/manager');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="App">
      <HeadingComponent heading={heading} />
      <TableComponent data={data} />
    </div>
  );
};

export default App;
