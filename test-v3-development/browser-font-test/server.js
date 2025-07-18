// Simple static server for browser font testing
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from the parent directory (to access assets and lib)
app.use(express.static(path.join(__dirname, '..')));

// Serve the test page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.listen(PORT, () => {
  console.log(`🌐 Browser Font Test Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, '..')}`);
  console.log(`🎯 Font file should be accessible at: http://localhost:${PORT}/assets/fonts/Roboto-Regular.ttf`);
  console.log(`🧪 Test page: http://localhost:${PORT}`);
});
