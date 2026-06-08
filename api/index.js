import express from 'express';
const app = express();
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'API running' }));
app.get('/api', (req, res) => res.json({ status: 'ok', message: 'School API' }));
export default app;
