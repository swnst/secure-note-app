const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = process.env.SECRET_TOKEN;
const DATA_FILE = path.join(__dirname, 'notes.json');

app.use(cors());
app.use(express.json());

async function initializeDataStore() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        await fs.writeFile(DATA_FILE, JSON.stringify([]));
        console.log('[System] Initialized empty notes.json for data persistence.');
    }
}
initializeDataStore();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== SECRET_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
    }
    next();
};

const readNotes = async () => {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
};
const writeNotes = async (notes) => {
    await fs.writeFile(DATA_FILE, JSON.stringify(notes, null, 2));
};

app.get('/api/notes', async (req, res) => {
    try {
        const notes = await readNotes();
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'Bad Request: Title and content are required' });
        }

        const notes = await readNotes();
        const newNote = {
            id: Date.now().toString(),
            title,
            content
        };

        notes.push(newNote);
        await writeNotes(notes);

        res.status(201).json(newNote);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let notes = await readNotes();

        const noteIndex = notes.findIndex(note => note.id === id);
        if (noteIndex === -1) {
            return res.status(404).json({ error: 'Not Found: Note does not exist' });
        }

        notes.splice(noteIndex, 1);
        await writeNotes(notes);

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`[System] Backend server is running on http://localhost:${PORT}`);
});