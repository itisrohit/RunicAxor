// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { runInContainer } = require('./dockerExecution');
const { validateCodeExecutionRequest } = require('./validators');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());
app.get('/', (req, res) => res.send('Code Engine API is working!'));

// Endpoint to execute code in Docker containers
app.post('/execute', async (req, res, next) => {
  try {
    const { code, language = 'nodejs' } = req.body;

    // Validate the request
    const validationError = validateCodeExecutionRequest(code, language);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    // Run the code in Docker container
    const output = await runInContainer(code, language);
    res.json({ success: true, output });
  } catch (error) {
    next(error); // Pass error to the error handler
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
