const mysql = require('mysql2/promise');
const express = require('express');
const dotenv = require('dotenv')

// Creating a connection pool
const pool = mysql.createPool({
  host: 'localhost',          
  user: 'root',               
  password: 'Mysql@1234',  
  database: 'quant_csv', 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Helper function to retrieve data based on the provided parameters
const fetchData = async (ticker, columns, period) => {
  try {
    let query = `SELECT ticker, ${columns} FROM quant_csv WHERE ticker = ?`;
    
    const queryParams = [ticker];

    if (period) {
      query += ` AND date >= DATE_SUB(STR_TO_DATE(?, '%m/%d/%Y') -  INTERVAL ? YEAR)`;
    }

    if(period){
        queryParams.push(period);
    }
    
    const [rows] = await pool.query(query, queryParams);
    return rows;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Route to handle /api/ticker
app.get('/api/ticker', async (req, res) => {
  const { ticker, columns, period } = req.query;
  if (!ticker || !columns) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const selectedColumns = columns.split(',').map(col => col.trim()).join(',');
    const data = await fetchData(ticker, selectedColumns, period);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/', async(req, res)=>{
    const datQuery = `SELECT * FROM quant_csv`
    const data = await pool.query(datQuery)
    res.send(data)
})

// Start the server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


