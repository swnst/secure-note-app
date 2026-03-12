const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = process.env.SECRET_TOKEN;

const POCKETHOST_URL = 'https://app-tracking.pockethost.io/api/collections/notes/records';
const DATA_FILE = path.join(__dirname, 'notes.json');

app.use(cors());
app.use(express.json());

const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

const getDataSource = (req) => req.headers['x-data-source'] === 'local' ? 'local' : 'pockethost';

const extractToken = (req, res, next) => {
    req.rawToken = req.headers['authorization'] || '';
    next();
};

app.get('/api/notes', extractToken, async (req, res) => {
    try {
        if (getDataSource(req) === 'pockethost') {
            const response = await fetch(POCKETHOST_URL);
            if (!response.ok) throw new Error('PocketHost API error');
            const data = await response.json();
            const notes = data.items ? data.items.map(i => ({ id: i.id, title: i.title, content: i.content })) : [];
            return res.status(200).json(notes);
        }
        res.status(200).json(readData());
    } catch (error) { res.status(500).json({ error: 'Internal Server Error' }); }
});

app.post('/api/notes', extractToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Bad Request' });

        if (getDataSource(req) === 'pockethost') {
            if (!req.rawToken) return res.status(401).json({ error: 'Unauthorized: Token required for Instructor Mode' });
            const authHeader = req.rawToken.startsWith('Bearer ') ? req.rawToken : `Bearer ${req.rawToken}`;

            const pocketHostPayload = { title, content, user_id: 2 };

            const response = await fetch(POCKETHOST_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(pocketHostPayload)
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                return res.status(response.status).json({ error: errData.message || 'Upstream API Error' });
            }
            const data = await response.json();
            return res.status(201).json({ id: data.id, title: data.title, content: data.content });
        }

        if (req.rawToken !== SECRET_TOKEN) return res.status(401).json({ error: 'Unauthorized: Invalid local token' });
        const notes = readData();
        const newNote = { id: crypto.randomUUID(), title, content };
        notes.push(newNote);
        writeData(notes);
        res.status(201).json(newNote);
    } catch (error) { res.status(500).json({ error: 'Internal Server Error' }); }
});

app.patch('/api/notes/:id', extractToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Bad Request' });

        if (getDataSource(req) === 'pockethost') {
            if (!req.rawToken) return res.status(401).json({ error: 'Unauthorized: Token required for Instructor Mode' });
            const authHeader = req.rawToken.startsWith('Bearer ') ? req.rawToken : `Bearer ${req.rawToken}`;
            const pocketHostPayload = { title, content, user_id: 2 };

            const response = await fetch(`${POCKETHOST_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(pocketHostPayload)
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const msg = errData.message === "Only admins can perform this action." ? "Admin rights required to update." : (errData.message || 'Upstream API Error');
                return res.status(response.status).json({ error: msg });
            }
            const data = await response.json();
            return res.status(200).json({ id: data.id, title: data.title, content: data.content });
        }

        if (req.rawToken !== SECRET_TOKEN) return res.status(401).json({ error: 'Unauthorized: Invalid local token' });
        const notes = readData();
        const index = notes.findIndex(n => n.id === id);
        if (index === -1) return res.status(404).json({ error: 'Not Found' });
        notes[index] = { ...notes[index], title, content };
        writeData(notes);
        res.status(200).json(notes[index]);
    } catch (error) { res.status(500).json({ error: 'Internal Server Error' }); }
});

app.delete('/api/notes/:id', extractToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (getDataSource(req) === 'pockethost') {
            if (!req.rawToken) return res.status(401).json({ error: 'Unauthorized: Token required for Instructor Mode' });
            const authHeader = req.rawToken.startsWith('Bearer ') ? req.rawToken : `Bearer ${req.rawToken}`;

            const response = await fetch(`${POCKETHOST_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': authHeader }
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const msg = errData.message === "Only admins can perform this action." ? "Admin rights required to delete." : (errData.message || 'Upstream API Error');
                return res.status(response.status).json({ error: msg });
            }
            return res.status(200).json({ message: 'Deleted successfully' });
        }

        if (req.rawToken !== SECRET_TOKEN) return res.status(401).json({ error: 'Unauthorized: Invalid local token' });
        let notes = readData();
        const len = notes.length;
        notes = notes.filter(n => n.id !== id);
        if (notes.length === len) return res.status(404).json({ error: 'Not Found' });
        writeData(notes);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) { res.status(500).json({ error: 'Internal Server Error' }); }
});

app.listen(PORT, () => {
    console.log(`[System] Server port ${PORT} active.`);
    console.log(`[System] Routing Architecture: Hybrid (Local FS / PocketHost)`);
});