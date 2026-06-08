import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/test-import', async (req, res) => {
  try {
    const User = (await import('../backend/models/User.js')).default;
    res.json({ ok: true, hasModel: !!User });
  } catch(e) {
    res.json({ ok: false, error: e.message, stack: e.stack?.split('\n').slice(0,3).join('; ') });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

export default app;
