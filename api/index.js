import express from 'express';
const app = express();
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api', (req, res) => res.json({ status: 'ok' }));
export default app;
