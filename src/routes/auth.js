const jwt = require('jsonwebtoken');
app.post('/api/login', (req, res) => {
  // Validate user credentials
  const token = jwt.sign({ userId: user.id }, 'your-secret-key');
  res.json({ token });
});