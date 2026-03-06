import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/notes';

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState('local');

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const [showToken, setShowToken] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    fetchNotes();
  }, [dataSource]);

  useEffect(() => {
    if (!editingId || !token) return;

    setIsAutoSaving(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PATCH',
          headers: getHeaders(true),
          body: JSON.stringify({ title: editTitle, content: editContent })
        });
        if (res.ok) {
          setNotes(current => current.map(n => n.id === editingId ? { ...n, title: editTitle, content: editContent } : n));
        }
      } catch (err) {
        console.error('Auto-save background task failed');
      } finally {
        setIsAutoSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editTitle, editContent, editingId, token]);

  const getHeaders = (includeAuth = false) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Data-Source': dataSource
    };
    if (includeAuth) headers['Authorization'] = token;
    return headers;
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setNotes(await res.json());
    } catch (err) { setError('Failed to load notes. Check server connection.'); }
    finally { setIsLoading(false); }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!token) return setError('Secret Token required.');

    const tempId = crypto.randomUUID();
    const newNote = { id: tempId, title, content };
    const previousNotes = [...notes];

    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ title: newNote.title, content: newNote.content })
      });
      if (res.status === 401) throw new Error('Unauthorized: Invalid Secret Token');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to add note');
      }
      const savedNote = await res.json();
      setNotes(current => current.map(n => n.id === tempId ? savedNote : n));
    } catch (err) {
      setNotes(previousNotes);
      setTitle(newNote.title);
      setContent(newNote.content);
      setError(err.message);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!token) return setError('Secret Token required.');

    const previousNotes = [...notes];
    setNotes(notes.filter(n => n.id !== id));

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getHeaders(true) });
      if (res.status === 401) throw new Error('Unauthorized: Invalid Secret Token');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete note');
      }
    } catch (err) {
      setNotes(previousNotes);
      setError(err.message);
    }
  };

  const handleEditClick = (note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleManualSave = async (id) => {
    if (!token) return setError('Secret Token required.');

    const previousNotes = [...notes];
    setNotes(notes.map(n => n.id === id ? { ...n, title: editTitle, content: editContent } : n));
    setEditingId(null);

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ title: editTitle, content: editContent })
      });
      if (res.status === 401) throw new Error('Unauthorized: Invalid Secret Token');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update note');
      }
    } catch (err) {
      setNotes(previousNotes);
      setEditingId(id);
      setError(err.message);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SkeletonLoader = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-[200px] animate-pulse flex flex-col">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4 mb-4"></div>
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-5/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 text-slate-800 dark:text-slate-200 transition-colors duration-300">

      {error && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className="bg-rose-500 text-white px-6 py-4 rounded-xl shadow-2xl font-medium flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
            {error}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-300 tracking-tight">SecureNote</h1>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500" title="Toggle Theme">
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row lg:flex-col gap-1">
              <button onClick={() => setDataSource('local')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${dataSource === 'local' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-200 dark:ring-emerald-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                Public Mode (Local FS)
              </button>
              <button onClick={() => setDataSource('pockethost')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${dataSource === 'pockethost' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                Instructor Mode (API)
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 dark:bg-amber-500"></div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">System Token</label>
              <div className="relative">
                <input type={showToken ? "text" : "password"} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter secret token..." className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-3 pr-12 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 [&::-ms-reveal]:hidden" />
                <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  {showToken ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>}
                </button>
              </div>
            </div>

            <form onSubmit={handleAddNote} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                Create Document
              </h2>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-3 mb-4 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" required />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Supports Markdown (e.g. **bold**, *italic*, `code`)" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-3 mb-5 rounded-xl h-32 resize-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none transition-all font-mono text-sm placeholder-slate-400 dark:placeholder-slate-500" required />
              <button type="submit" disabled={isLoading || !title.trim() || !content.trim()} className="w-full bg-indigo-600 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 dark:shadow-none flex justify-center items-center gap-2">
                Save Document
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                Database Records
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ${dataSource === 'local' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'}`}>
                  {dataSource}
                </span>
              </h2>

              <div className="relative w-full sm:w-64">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            {isLoading && notes.length === 0 ? (
              <SkeletonLoader />
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 bg-white/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-slate-400 dark:text-slate-500">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <p className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-1">No Records Found</p>
                <p className="text-sm">Create your first document using the form.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {filteredNotes.map(note => (
                  <div key={note.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group flex flex-col h-full relative">
                    {editingId === note.id ? (
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Edit Mode</span>
                          {isAutoSaving && <span className="text-xs font-semibold text-emerald-500 animate-pulse">Auto-saving...</span>}
                        </div>
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none font-bold text-slate-800 dark:text-white" />
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg h-full min-h-[120px] resize-none focus:ring-2 focus:ring-indigo-400 focus:outline-none text-slate-600 dark:text-slate-300 font-mono text-sm" />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleManualSave(note.id)} className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-lg hover:bg-emerald-600 transition-colors text-sm">Done</button>
                          <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3 leading-tight border-b border-slate-100 dark:border-slate-700 pb-2">{note.title}</h3>
                          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none break-words">
                            <ReactMarkdown>{note.content}</ReactMarkdown>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(note)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-sm flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg> Edit
                          </button>
                          <button onClick={() => handleDeleteNote(note.id)} className="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold text-sm flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;