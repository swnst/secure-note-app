import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://securenote-api.onrender.com/api/notes';

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      setError('Failed to load notes. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ title, content })
      });

      if (res.status === 401) throw new Error('Unauthorized: Invalid Secret Token');
      if (!res.ok) throw new Error('Failed to add note');

      setTitle('');
      setContent('');
      fetchNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!token) {
      setError('Please enter the Secret Token to delete notes.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });

      if (res.status === 401) throw new Error('Unauthorized: Invalid Secret Token');
      if (!res.ok) throw new Error('Failed to delete note');

      fetchNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleUpdateNote = async (id) => {
    if (!token) {
      setError('Please enter the Secret Token to update notes.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ title: editTitle, content: editContent })
      });

      if (res.status === 401) throw new Error('Unauthorized: Invalid Secret Token');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update note');
      }

      setEditingId(null);
      fetchNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">SecureNote App</h1>

      <div className="bg-white p-4 rounded shadow mb-6 border-l-4 border-yellow-500">
        <label className="block text-sm font-medium text-gray-700 mb-1">Authorization Token (Required for Create/Update/Delete)</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full border p-2 rounded focus:ring-2 focus:ring-yellow-500"
          placeholder="Enter secret token..."
        />
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 font-semibold">{error}</div>}

      <form onSubmit={handleAddNote} className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Note</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          className="w-full border p-2 mb-4 rounded focus:ring-2 focus:ring-blue-500"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Note Content"
          className="w-full border p-2 mb-4 rounded h-24 focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Save Note'}
        </button>
      </form>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Notes</h2>
        {isLoading && notes.length === 0 ? (
          <p className="text-gray-500">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-500">No notes found.</p>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                {editingId === note.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="border p-2 rounded"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="border p-2 rounded h-20"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={isLoading}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={isLoading}
                        className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{note.title}</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{note.content}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEditClick(note)}
                        disabled={isLoading}
                        className="text-blue-500 hover:text-blue-700 font-medium text-sm disabled:text-gray-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={isLoading}
                        className="text-red-500 hover:text-red-700 font-medium text-sm disabled:text-gray-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;