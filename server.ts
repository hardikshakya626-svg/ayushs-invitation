import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Data storage for RSVPs
const dataDir = path.resolve(__dirname, 'data');
const rsvpsJsonPath = path.resolve(dataDir, 'rsvps.json');
const rsvpsCsvPath = path.resolve(dataDir, 'rsvps.csv');

function ensureDataStorage() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(rsvpsJsonPath)) {
    fs.writeFileSync(rsvpsJsonPath, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(rsvpsCsvPath)) {
    const csvHeader = '"Guest Name","Phone / WhatsApp","Attendance","Guests Count","Attending Events","Blessings Message","Submitted At"\r\n';
    fs.writeFileSync(rsvpsCsvPath, csvHeader, 'utf-8');
  }
}

ensureDataStorage();

function getRsvps() {
  try {
    ensureDataStorage();
    const data = fs.readFileSync(rsvpsJsonPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveRsvp(entry: any) {
  ensureDataStorage();
  const list = getRsvps();
  list.unshift(entry);
  fs.writeFileSync(rsvpsJsonPath, JSON.stringify(list, null, 2), 'utf-8');

  // Format CSV row
  const escapeCsv = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
  const eventsStr = Array.isArray(entry.events) ? entry.events.join('; ') : (entry.events || '');
  const row = [
    escapeCsv(entry.name),
    escapeCsv(entry.phone),
    escapeCsv(entry.attendance),
    escapeCsv(entry.guestsCount),
    escapeCsv(eventsStr),
    escapeCsv(entry.message),
    escapeCsv(entry.submittedAt)
  ].join(',') + '\r\n';

  fs.appendFileSync(rsvpsCsvPath, row, 'utf-8');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Submit RSVP endpoint
app.post('/api/rsvp', (req, res) => {
  try {
    const { name, phone, attendance, guestsCount, events, message } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Guest name is required' });
    }

    const now = new Date();
    const submittedAt = now.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const newRsvp = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: (phone || '').trim(),
      attendance: attendance === 'declined' ? 'declined' : 'attending',
      guestsCount: attendance === 'declined' ? 0 : Number(guestsCount) || 1,
      events: attendance === 'declined' ? [] : (Array.isArray(events) ? events : []),
      message: (message || '').trim(),
      submittedAt
    };

    saveRsvp(newRsvp);
    res.json({ success: true, message: 'RSVP recorded with honor', rsvp: newRsvp });
  } catch (err: any) {
    console.error('Error saving RSVP:', err);
    res.status(500).json({ error: 'Failed to record RSVP', details: err?.message });
  }
});

// Get all RSVPs
app.get('/api/rsvps', (req, res) => {
  try {
    const rsvps = getRsvps();
    res.json({ total: rsvps.length, rsvps });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve RSVPs' });
  }
});

// Export RSVPs CSV endpoint
app.get('/api/rsvps/export', (req, res) => {
  ensureDataStorage();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ayush_somya_wedding_rsvps.csv"');
  const stream = fs.createReadStream(rsvpsCsvPath);
  stream.pipe(res);
});

// Dynamic Vite setup in development or static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Wedding Invitation Server running on port ${port}`);
  });
}

startServer();
