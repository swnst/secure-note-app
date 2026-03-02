import { useState, useEffect } from 'react';

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

  const [showToken, setShowToken] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    e.preventDefault(); setIsLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ title, content })
      });
      if (res.status === 401) throw new Error('Unauthorized: Invalid Secret Token');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to add note');
      }
      setTitle(''); setContent(''); fetchNotes();
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleDeleteNote = async (id) => {
    if (!token) return setError('Secret Token required.');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getHeaders(true) });
      if (res.status === 401) throw new Error('Unauthorized: Invalid Secret Token');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete note');
      }
      fetchNotes();
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleEditClick = (note) => {
    setEditingId(note.id); setEditTitle(note.title); setEditContent(note.content);
  };

  const handleUpdateNote = async (id) => {
    if (!token) return setError('Secret Token required.');
    setIsLoading(true);
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
      setEditingId(null); fetchNotes();
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

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
                <input type={showToken ? "text" : "password"} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter secret token..." className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-3 pr-12 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all [&::-ms-reveal]:hidden" />
                <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  {showToken ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>}
                </button>
              </div>
            </div>

            <form onSubmit={handleAddNote} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                Create Document
              </h2>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-3 mb-4 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none transition-all" required />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your content here..." className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-3 mb-5 rounded-xl h-32 resize-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none transition-all" required />
              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-all shadow-md shadow-indigo-200 dark:shadow-none flex justify-center items-center gap-2">
                {isLoading ? <span className="animate-pulse">Processing...</span> : 'Save Document'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Database Records
              </h2>
              <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ${dataSource === 'local' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'}`}>
                {dataSource}
              </span>
            </div>

            {isLoading && notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="font-medium animate-pulse">Synchronizing...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 bg-white/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-slate-300 dark:text-slate-600"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
                <p className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-1">No Records Found</p>
                <p className="text-sm">Create your first document using the form.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {notes.map(note => (
                  <div key={note.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group flex flex-col h-full">
                    {editingId === note.id ? (
                      <div className="flex flex-col gap-3 flex-1">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none font-bold text-slate-800 dark:text-white" />
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg h-full min-h-[100px] resize-none focus:ring-2 focus:ring-indigo-400 focus:outline-none text-slate-600 dark:text-slate-300 text-sm" />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleUpdateNote(note.id)} disabled={isLoading} className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 text-sm">Save</button>
                          <button onClick={() => setEditingId(null)} disabled={isLoading} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 leading-tight">{note.title}</h3>
                          <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-sm leading-relaxed">{note.content}</p>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(note)} disabled={isLoading} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-sm flex items-center gap-1 disabled:opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg> Edit
                          </button>
                          <button onClick={() => handleDeleteNote(note.id)} disabled={isLoading} className="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold text-sm flex items-center gap-1 disabled:opacity-50">
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