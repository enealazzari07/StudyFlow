// StudyFlow — Dokument Editor (Word-ähnlicher Rich-Text-Editor)
const { useCallback, useEffect, useMemo, useRef, useState } = React;

const DOC_MIME = 'application/studyflow-doc+json';
const DOC_VERSION = 2;

function formatFileSize(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

/* ── Toolbar-Button ── */
const TBtn = ({ title, active, onClick, children, disabled }) => (
  <button
    title={title}
    disabled={disabled}
    onMouseDown={e => { e.preventDefault(); onClick && onClick(); }}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, height: 28, padding: '0 5px',
      background: active ? '#e0e7ff' : 'transparent',
      border: active ? '1px solid #c7d2fe' : '1px solid transparent',
      borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
      color: active ? '#4338ca' : '#334155', fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
      transition: 'background 0.1s, border-color 0.1s',
      opacity: disabled ? 0.4 : 1,
    }}
    onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = '#f1f5f9'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? '#e0e7ff' : 'transparent'; }}
  >
    {children}
  </button>
);

const Sep = () => <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 3px' }}/>;

/* ── Table-Picker ── */
const TablePicker = ({ onInsert, onClose }) => {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, zIndex: 100, boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
        {hover.r > 0 && hover.c > 0 ? `${hover.r} × ${hover.c} Tabelle` : 'Größe wählen'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 22px)', gap: 3 }}>
        {Array.from({ length: 36 }, (_, i) => {
          const r = Math.floor(i / 6) + 1;
          const c = (i % 6) + 1;
          const isActive = r <= hover.r && c <= hover.c;
          return (
            <div
              key={i}
              onMouseEnter={() => setHover({ r, c })}
              onMouseLeave={() => setHover({ r: 0, c: 0 })}
              onClick={() => { onInsert(hover.r, hover.c); onClose(); }}
              style={{ width: 22, height: 22, border: `1px solid ${isActive ? '#6366f1' : '#e2e8f0'}`, borderRadius: 3, background: isActive ? '#eef2ff' : 'white', cursor: 'pointer', transition: 'all 0.08s' }}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ── Toolbar ── */
const Toolbar = ({ editorRef }) => {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});

  const exec = useCallback((cmd, val) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val || null);
    editorRef.current?.focus();
  }, [editorRef]);

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
    });
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.addEventListener('keyup', updateActiveFormats);
    el.addEventListener('mouseup', updateActiveFormats);
    el.addEventListener('selectionchange', updateActiveFormats);
    return () => {
      el.removeEventListener('keyup', updateActiveFormats);
      el.removeEventListener('mouseup', updateActiveFormats);
      el.removeEventListener('selectionchange', updateActiveFormats);
    };
  }, [editorRef, updateActiveFormats]);

  const insertTable = (rows, cols) => {
    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;width:100%;margin:12px 0;';
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const td = r === 0 ? document.createElement('th') : document.createElement('td');
        td.style.cssText = 'border:1px solid #cbd5e1;padding:8px 10px;text-align:left;min-width:60px;';
        if (r === 0) td.style.background = '#f8fafc';
        td.innerHTML = '&nbsp;';
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      range.insertNode(table);
      const br = document.createElement('p');
      br.innerHTML = '<br>';
      table.after(br);
      range.setStart(br, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current?.appendChild(table);
    }
  };

  const formatBlock = (tag) => exec('formatBlock', tag);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 10 }}>
      {/* Text format */}
      <TBtn title="Fett (Ctrl+B)" active={activeFormats.bold} onClick={() => exec('bold')}><b>B</b></TBtn>
      <TBtn title="Kursiv (Ctrl+I)" active={activeFormats.italic} onClick={() => exec('italic')}><i>I</i></TBtn>
      <TBtn title="Unterstrichen (Ctrl+U)" active={activeFormats.underline} onClick={() => exec('underline')}><u>U</u></TBtn>
      <TBtn title="Durchgestrichen" active={activeFormats.strikeThrough} onClick={() => exec('strikeThrough')}>
        <s style={{ fontSize: 11 }}>S</s>
      </TBtn>
      <Sep/>
      {/* Headings */}
      <TBtn title="Überschrift 1" onClick={() => formatBlock('h1')} active={false}>H1</TBtn>
      <TBtn title="Überschrift 2" onClick={() => formatBlock('h2')} active={false}>H2</TBtn>
      <TBtn title="Überschrift 3" onClick={() => formatBlock('h3')} active={false}>H3</TBtn>
      <TBtn title="Normaler Text" onClick={() => formatBlock('p')} active={false}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14"/><path d="M12 3v18"/><path d="M3 9h12"/></svg>
      </TBtn>
      <Sep/>
      {/* Lists */}
      <TBtn title="Aufzählung" active={activeFormats.insertUnorderedList} onClick={() => exec('insertUnorderedList')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
      </TBtn>
      <TBtn title="Nummerierte Liste" active={activeFormats.insertOrderedList} onClick={() => exec('insertOrderedList')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </TBtn>
      <Sep/>
      {/* Align */}
      <TBtn title="Linksbündig" active={activeFormats.justifyLeft} onClick={() => exec('justifyLeft')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
      </TBtn>
      <TBtn title="Zentriert" active={activeFormats.justifyCenter} onClick={() => exec('justifyCenter')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
      </TBtn>
      <TBtn title="Rechtsbündig" active={activeFormats.justifyRight} onClick={() => exec('justifyRight')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
      </TBtn>
      <Sep/>
      {/* Table */}
      <div style={{ position: 'relative' }}>
        <TBtn title="Tabelle einfügen" onClick={() => setShowTablePicker(p => !p)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
        </TBtn>
        {showTablePicker && (
          <TablePicker onInsert={insertTable} onClose={() => setShowTablePicker(false)}/>
        )}
      </div>
      <Sep/>
      {/* Link */}
      <TBtn title="Link einfügen" onClick={() => {
        const url = prompt('URL eingeben:');
        if (url) exec('createLink', url);
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </TBtn>
      {/* Color */}
      <TBtn title="Textfarbe">
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <input type="color" defaultValue="#0f172a" onChange={e => exec('foreColor', e.target.value)}
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}/>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 7H6l-3 10h3l1-3h4l1 3h3L9 7z"/><path d="M15 7l5 10"/><path d="M18 13h-4"/></svg>
        </label>
      </TBtn>
    </div>
  );
};

/* ── Main ── */
const DokumentEditor = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [title, setTitle] = useState('Neues Dokument');

  const editorRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      setUser(session.user);

      try {
        if (docId) {
          const { data: row, error: rowErr } = await window.sb
            .from('documents')
            .select('*')
            .eq('id', docId)
            .single();
          if (rowErr) throw new Error(rowErr.message);
          setDocRow(row);
          setTitle(row?.name ? row.name.replace(/\.[^.]+$/, '') : 'Dokument');

          if (row?.file_path) {
            const { data: dl, error: dlErr } = await window.sb.storage
              .from('documents')
              .download(row.file_path);
            if (dlErr) throw new Error(dlErr.message);
            const raw = await dl.text();
            try {
              const parsed = JSON.parse(raw);
              const t = parsed?.title || row?.name?.replace(/\.[^.]+$/, '') || 'Dokument';
              setTitle(t);
              if (editorRef.current) {
                if (parsed?.version >= 2 && parsed?.html) {
                  editorRef.current.innerHTML = parsed.html;
                } else if (parsed?.text) {
                  // Legacy v1: plain text → convert to paragraphs
                  editorRef.current.innerHTML = parsed.text
                    .split('\n')
                    .map(l => `<p>${l || '<br>'}</p>`)
                    .join('');
                }
              }
            } catch {
              setError('Dokument konnte nicht gelesen werden (ungültiges Format).');
            }
          }
        } else {
          // New doc: set placeholder
          if (editorRef.current) {
            editorRef.current.innerHTML = '<p><br></p>';
          }
        }
      } catch (e) {
        setError(e?.message || 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    })();
  }, [docId]);

  // Focus editor after load
  useEffect(() => {
    if (!loading && editorRef.current) {
      editorRef.current.focus();
    }
  }, [loading]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const docTitle = title?.trim() || 'Dokument';
      const html = editorRef.current?.innerHTML || '';
      const payload = { type: 'studyflow_doc', version: DOC_VERSION, title: docTitle, html, updated_at: new Date().toISOString() };
      const json = JSON.stringify(payload);
      const blob = new Blob([json], { type: DOC_MIME });
      const safe = docTitle.replace(/[^a-zA-Z0-9._-]/g, '_');

      let path = docRow?.file_path;
      if (!path) path = `${user.id}/${Date.now()}_${safe}.studyflow.json`;

      const { error: upErr } = await window.sb.storage
        .from('documents')
        .upload(path, blob, { contentType: DOC_MIME, upsert: true });
      if (upErr) throw new Error(upErr.message);

      if (!docRow) {
        const { data: row, error: rowErr } = await window.sb.from('documents').insert({
          owner_id: user.id,
          name: `${docTitle}.studyflow.json`,
          file_path: path,
          file_size: blob.size,
          mime_type: DOC_MIME,
          doc_type: 'doc',
          ai_processed: false,
        }).select().single();
        if (rowErr) throw new Error(rowErr.message);
        setDocRow(row);
        const url = new URL(window.location.href);
        url.searchParams.set('id', row.id);
        window.history.replaceState({}, '', url.toString());
      } else {
        const { data: row, error: rowErr } = await window.sb.from('documents').update({
          name: `${docTitle}.studyflow.json`,
          file_path: path,
          file_size: blob.size,
          mime_type: DOC_MIME,
        }).eq('id', docRow.id).select().single();
        if (rowErr) throw new Error(rowErr.message);
        setDocRow(row);
      }
      setSavedAt(new Date());
    } catch (e) {
      setError(e?.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  // Ctrl+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user, docRow, title]);

  if (loading) return (
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 20, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 12.5, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            Dashboard
          </a>
          <div style={{ width: 1, height: 18, background: '#e2e8f0', flexShrink: 0 }}/>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Dokumenttitel…"
            style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', minWidth: 0, flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {savedAt && (
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
              Gespeichert {savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {docRow && (
            <span style={{ fontSize: 11.5, color: '#cbd5e1' }}>{formatFileSize(docRow.file_size)}</span>
          )}
          <button onClick={save} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: '#6366f1', color: 'white', border: 'none', borderRadius: 8,
            fontSize: 13, fontFamily: 'inherit', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
          }}>
            {saving ? 'Speichert…' : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                Speichern
              </>
            )}
          </button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', borderBottom: '1px solid #fecaca', padding: '10px 24px', fontSize: 13, color: '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: 2, display: 'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Formatting Toolbar */}
      <Toolbar editorRef={editorRef}/>

      {/* Page area */}
      <div style={{ flex: 1, padding: '40px 24px 80px', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 860, background: 'white', borderRadius: 4, boxShadow: '0 1px 4px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.04)', minHeight: 'calc(100vh - 200px)', padding: '48px 64px', position: 'relative' }}>
          <style>{`
            #doc-editor { outline: none; min-height: 300px; font-size: 14.5px; line-height: 1.75; color: #1e293b; font-family: inherit; }
            #doc-editor h1 { font-size: 2em; font-weight: 700; color: #0f172a; margin: 0.8em 0 0.4em; line-height: 1.25; font-family: 'Instrument Sans', sans-serif; }
            #doc-editor h2 { font-size: 1.5em; font-weight: 600; color: #0f172a; margin: 0.75em 0 0.35em; font-family: 'Instrument Sans', sans-serif; }
            #doc-editor h3 { font-size: 1.2em; font-weight: 600; color: #1e293b; margin: 0.6em 0 0.3em; font-family: 'Instrument Sans', sans-serif; }
            #doc-editor p { margin: 0 0 0.6em; }
            #doc-editor ul, #doc-editor ol { padding-left: 1.6em; margin: 0.4em 0 0.8em; }
            #doc-editor li { margin-bottom: 0.25em; }
            #doc-editor table { border-collapse: collapse; width: 100%; margin: 12px 0; }
            #doc-editor th, #doc-editor td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            #doc-editor th { background: #f8fafc; font-weight: 600; }
            #doc-editor a { color: #6366f1; text-decoration: underline; }
            #doc-editor:empty:before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }
            #doc-editor blockquote { border-left: 3px solid #c7d2fe; margin: 0.5em 0; padding: 4px 12px; color: #475569; }
          `}</style>
          <div
            id="doc-editor"
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Beginne zu schreiben…"
            spellCheck="true"
            lang="de"
          />
        </div>
      </div>

      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<DokumentEditor/>);
