const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = process.env.SECRET_TOKEN;
const POCKETHOST_URL = 'https://app-tracking.pockethost.io/api/collections/notes/records';

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== SECRET_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
    }
    next();
};

app.get('/api/notes', async (req, res) => {
    try {
        const response = await fetch(POCKETHOST_URL);
        if (!response.ok) throw new Error('PocketHost API error');
        const data = await response.json();
        const notes = data.items ? data.items.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content
        })) : [];
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetch(`${POCKETHOST_URL}/${id}`);
        if (!response.ok) {
            if (response.status === 404) return res.status(404).json({ error: 'Not Found' });
            throw new Error('Failed to fetch record');
        }
        const data = await response.json();
        res.status(200).json({ id: data.id, title: data.title, content: data.content });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Bad Request' });

        const response = await fetch(POCKETHOST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) throw new Error('Failed to create record');
        const data = await response.json();
        res.status(201).json({ id: data.id, title: data.title, content: data.content });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Bad Request' });

        const response = await fetch(`${POCKETHOST_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) {
            if (response.status === 404) return res.status(404).json({ error: 'Not Found' });
            throw new Error('Failed to update record');
        }

        const data = await response.json();
        res.status(200).json({ id: data.id, title: data.title, content: data.content });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetch(`${POCKETHOST_URL}/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            if (response.status === 404) return res.status(404).json({ error: 'Not Found' });
            throw new Error('Failed to delete record');
        }
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`[System] Backend server is running on port ${PORT}`);
});