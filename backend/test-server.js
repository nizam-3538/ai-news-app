const express = require('express');
const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.json({ message: 'Test server is running' });
});

app.get('/news', (req, res) => {
  res.json({ 
    ok: true, 
    articles: [
      { id: 1, title: 'Test Article', summary: 'This is a test article' }
    ] 
  });
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});