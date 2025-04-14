// backend/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// In-memory login logs (for demo purposes)
let loginLogs = [];

// Load dataset from data.json
const individuals = JSON.parse(fs.readFileSync(path.join(__dirname, 'bias_data.json'), 'utf8'));

// Endpoint: Get individuals data
app.get('/api/individuals', (req, res) => {
  res.json(individuals);
});

// Endpoint: Dummy login (logs username, timestamp and IP)
app.post('/api/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required" });
  const logEntry = { username, timestamp: new Date().toISOString(), ip: req.ip };
  loginLogs.push(logEntry);
  console.log(`User ${username} logged in at ${logEntry.timestamp}`);
  res.json({ status: 'success', user: username });
});

// Endpoint: Get login logs (for admin)
app.get('/api/logs', (req, res) => {
  res.json(loginLogs);
});

// Endpoint: Export individuals data as CSV
app.get('/api/export', (req, res) => {
  try {
    const parser = new Parser();
    const csv = parser.parse(individuals);
    res.header('Content-Type', 'text/csv');
    res.attachment('individuals.csv');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const buildPath = path.join(__dirname, 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Error handling middleware (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running on port ${port}`);
});
