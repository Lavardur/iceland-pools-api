// Import the configured app
const app = require('./app');

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));