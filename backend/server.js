require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDatabase = require('./db');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 4000;
const DIST_DIR = path.resolve(__dirname, '../universe/dist');

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Universe backend server is running. Build the frontend into ../universe/dist to serve it from this server.');
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server listening on http://localhost:${PORT}`);
      if (fs.existsSync(DIST_DIR)) {
        console.log(`Serving frontend from ${DIST_DIR}`);
      }
    });
  })
  .catch((error) => {
    console.error('Unable to connect to MongoDB:', error.message);
    process.exit(1);
  });
