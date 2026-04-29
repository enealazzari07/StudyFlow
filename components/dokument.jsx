// StudyFlow — Dokument Editor (Text + Zeichnen)
const { useEffect, useMemo, useRef, useState } = React;

const DOC_MIME = 'application/studyflow-doc+json';
const DOC_VERSION = 1;

function formatFileSize(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function toCanvasPoint(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = (clientX - r.left) * (canvas.width / r.width);
  const y = (clientY - r.top) * (canvas.height / r.height);
  return { x, y };
}

function drawStrokes(ctx, strokes) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  (strokes || []).forEach(s => {
    const pts = s.points || [];
    if (pts.length < 2) return;
    ctx.strokeStyle = s.color || '#0f172a';
    ctx.lineWidth = s.width || 3;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  });
}

const DokumentEditor = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);

  const [title, setTitle] = useState('Neues Dokument');
  const [text, setText] = useState('');
  const [strokes, setStrokes] = useState([]);
  const [pen, setPen] = useState({ color: '#0f172a', width: 4, mode: 'pen' }); // mode: pen | eraser

  const canvasRef = useRef(null);
  const drawingRef = useRef({ active: false, stroke: null });

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
            const parsed = JSON.parse(raw);
            setTitle(parsed?.title || row?.name?.replace(/\.[^.]+$/, '') || 'Dokument');
            setText(parsed?.text || '');
            setStrokes(Array.isArray(parsed?.strokes) ? parsed.strokes : []);
          }
        }
      } catch (e) {
        setError(e?.message || 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    })();
  }, [docId]);

  // Setup canvas sizing and redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(300, Math.floor(r.width * dpr));
      const h = Math.max(220, Math.floor(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext('2d');
      drawStrokes(ctx, strokes);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('resize', resize);
    return () => { ro.disconnect(); window.removeEventListener('resize', resize); };
  }, [strokes]);

  const startStroke = (x, y) => {
    const base = pen.mode === 'eraser'
      ? { color: '#ffffff', width: clamp(pen.width * 2, 10, 40) }
      : { color: pen.color, width: pen.width };
    const s = { ...base, points: [{ x, y }] };
    drawingRef.current = { active: true, stroke: s };
    setStrokes(prev => [...prev, s]);
  };

  const appendPoint = (x, y) => {
    if (!drawingRef.current.active) return;
    const s = drawingRef.current.stroke;
    s.points.push({ x, y });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawStrokes(ctx, strokes); // strokes already contains s reference
  };

  const endStroke = () => {
    drawingRef.current = { active: false, stroke: null };
  };

  const onPointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(e.pointerId);
    const p = toCanvasPoint(canvas, e.clientX, e.clientY);
    startStroke(p.x, p.y);
  };
  const onPointerMove = (e) => {
    if (!drawingRef.current.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toCanvasPoint(canvas, e.clientX, e.clientY);
    appendPoint(p.x, p.y);
  };
  const onPointerUp = () => endStroke();
  const onPointerCancel = () => endStroke();

  const clearCanvas = () => {
    if (!confirm('Zeichnung wirklich löschen?')) return;
    setStrokes([]);
  };

  const serialize = () => ({
    type: 'studyflow_doc',
    version: DOC_VERSION,
    title: title?.trim() || 'Dokument',
    text: text || '',
    strokes: strokes || [],
    updated_at: new Date().toISOString(),
  });

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const payload = serialize();
      const json = JSON.stringify(payload);
      const blob = new Blob([json], { type: DOC_MIME });
      const safe = (payload.title || 'Dokument').replace(/[^a-zA-Z0-9._-]/g, '_');

      let path = docRow?.file_path;
      if (!path) path = `${user.id}/${Date.now()}_${safe}.studyflow.json`;

      const { error: upErr } = await window.sb.storage
        .from('documents')
        .upload(path, blob, { contentType: DOC_MIME, upsert: true });
      if (upErr) throw new Error(upErr.message);

      if (!docRow) {
        const { data: row, error: rowErr } = await window.sb.from('documents').insert({
          owner_id: user.id,
          name: `${payload.title}.studyflow.json`,
          file_path: path,
          file_size: blob.size,
          mime_type: DOC_MIME,
          ai_processed: false,
        }).select().single();
        if (rowErr) throw new Error(rowErr.message);
        setDocRow(row);
        const url = new URL(window.location.href);
        url.searchParams.set('id', row.id);
        window.history.replaceState({}, '', url.toString());
      } else {
        const { data: row, error: rowErr } = await window.sb.from('documents').update({
          name: `${payload.title}.studyflow.json`,
          file_path: path,
          file_size: blob.size,
          mime_type: DOC_MIME,
          ai_processed: false,
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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 28, color: '#94a3b8' }}>Lädt…</div>
    </div>
  );

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const DOC_COLORS = ['#0f172a','#6366f1','#ef4444','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6'];
  const PEN_SIZES_DOC = [{v:2,label:'S'},{v:5,label:'M'},{v:10,label:'L'}];

  return (
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(15,23,42,0.07)',
        padding: '0 28px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Icons.Logo size={26}/>
            <span style={{ fontFamily: 'Caveat', fontSize: 22, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>StudyFlow</span>
          </a>
          <div style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Doc size={14} style={{ color: '#6366f1' }}/>
            </div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Dokumenttitel…"
              style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 500, color: '#0f172a', background: 'transparent', width: 220 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {savedAt && (
            <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Check size={11}/> {savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {docRow && <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{formatFileSize(docRow.file_size)}</span>}
          <button onClick={save} disabled={saving} style={{ padding: '8px 18px', background: saving ? '#f1f5f9' : '#0f172a', color: saving ? '#94a3b8' : 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}>
            {saving ? 'Speichert…' : <><Icons.Check size={13}/> Speichern</>}
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ flex: 1, maxWidth: 1240, width: '100%', margin: '0 auto', padding: '28px 28px 80px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start', boxSizing: 'border-box' }}>

        {error && (
          <div style={{ gridColumn: '1/-1', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {error}
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: 0 }}><Icons.X size={14}/></button>
          </div>
        )}

        {/* ── Notes panel ── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 2px 16px rgba(15,23,42,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }}/>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Notizen</span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{wordCount} Wörter</span>
          </div>
          {/* Lined paper textarea */}
          <div style={{ position: 'relative', flex: 1 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(99,102,241,0.08) 31px, rgba(99,102,241,0.08) 32px)', backgroundPositionY: '20px', pointerEvents: 'none' }}/>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Schreib deine Notizen hier…"
              style={{ position: 'relative', width: '100%', minHeight: 560, padding: '20px 24px 28px', border: 'none', outline: 'none', resize: 'vertical', fontSize: 15, lineHeight: '32px', color: '#1e293b', background: 'transparent', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* ── Sketch panel ── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 2px 16px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
          {/* Panel header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}/>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Skizze</span>
            </div>
            <button onClick={clearCanvas} style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 6, fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >Löschen</button>
          </div>

          {/* Tool strip */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3, gap: 2 }}>
              {[{mode:'pen',label:'✏️ Stift'},{mode:'eraser',label:'Radierer'}].map(({mode,label}) => (
                <button key={mode} onClick={() => setPen(p => ({ ...p, mode }))} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', background: pen.mode === mode ? 'white' : 'transparent', color: pen.mode === mode ? '#0f172a' : '#64748b', boxShadow: pen.mode === mode ? '0 1px 3px rgba(15,23,42,0.1)' : 'none', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Color swatches */}
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {DOC_COLORS.map(c => (
                <button key={c} onClick={() => setPen(p => ({ ...p, color: c, mode: 'pen' }))}
                  style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', padding: 0, outline: pen.color === c && pen.mode === 'pen' ? `2.5px solid ${c}` : 'none', outlineOffset: 2, transform: pen.color === c && pen.mode === 'pen' ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.12s' }}
                />
              ))}
            </div>

            {/* Size */}
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
              {PEN_SIZES_DOC.map(s => (
                <button key={s.label} onClick={() => setPen(p => ({ ...p, width: s.v }))}
                  style={{ width: 30, height: 30, borderRadius: 8, border: pen.width === s.v ? '2px solid #6366f1' : '1px solid #e2e8f0', background: pen.width === s.v ? '#eef2ff' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                  <div style={{ width: s.v, height: s.v, borderRadius: '50%', background: pen.width === s.v ? '#6366f1' : '#334155' }}/>
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div style={{ margin: '14px 16px', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.07)', boxShadow: 'inset 0 1px 3px rgba(15,23,42,0.04)' }}>
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              style={{ width: '100%', height: 480, display: 'block', touchAction: 'none', cursor: 'crosshair' }}
            />
          </div>
          <div style={{ padding: '0 16px 14px', fontSize: 11.5, color: '#94a3b8', textAlign: 'center' }}>
            Mit Touch oder Stift zeichnen
          </div>
        </div>

      </div>

      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<DokumentEditor/>);

