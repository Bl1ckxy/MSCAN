const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://atlas-sql-68f2467f34c53e35a1c99c20-dnpw4m.a.query.mongodb.net/sample_mflix?ssl=true&authSource=admin');

// Schema to save history
const ScanSchema = new mongoose.Schema({
  username: String,
  risk_level: String,
  concern_score: Number,
  scanned_at: { type: Date, default: Date.now }
});
const Scan = mongoose.model('Scan', ScanSchema);

// Main analyze route
app.post('/api/analyze', async (req, res) => {
  const { username } = req.body;
  
  // Call Python ML service
  const mlResult = await axios.post('http://localhost:5001/analyze', { username });
  const data = mlResult.data;
  
  // Save to MongoDB
  await Scan.create({ username, risk_level: data.risk_level, concern_score: data.concern_score });
  
  res.json(data);
});


app.get('/api/history', async (req, res) => {
  const history = await Scan.find().sort({ scanned_at: -1 }).limit(20);
  res.json(history);
});

app.listen(5000, () => console.log('Server on port 5000'));