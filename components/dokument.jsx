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
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </div>
  );

  return (
    <div className="dot-paper" style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, flexShrink: 0 }}>
            <Icons.ArrowLeft size={14}/> Dashboard
          </a>
          <div style={{ height: 20, width: 1, background: '#e2e8f0' }}></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 16, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title || 'Dokument'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {docRow ? `Gespeichert · ${formatFileSize(docRow.file_size)}` : 'Noch nicht gespeichert'}
              {savedAt && <span> · zuletzt {savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: '9px 14px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Speichert…' : <><Icons.Check size={14}/> Speichern</>}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 32px 100px' }}>
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#991b1b', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: 0 }}><Icons.X size={14}/></button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, alignItems: 'start' }}>
          {/* Text */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notizen</div>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-paper"
                placeholder="Titel…"
                style={{ width: 280, fontSize: 13 }}
              />
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Schreib deine Notizen…"
              style={{
                width: '100%',
                minHeight: 420,
                padding: 16,
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#334155',
                background: 'transparent',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Draw */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Skizze</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setPen(p => ({ ...p, mode: 'pen' }))} className="btn-ghost" style={{ padding: '7px 10px', fontSize: 12, background: pen.mode === 'pen' ? '#f1f5f9' : 'transparent' }}>
                  <Icons.Edit size={13}/> Stift
                </button>
                <button onClick={() => setPen(p => ({ ...p, mode: 'eraser' }))} className="btn-ghost" style={{ padding: '7px 10px', fontSize: 12, background: pen.mode === 'eraser' ? '#f1f5f9' : 'transparent' }}>
                  <Icons.Trash size={13}/> Radierer
                </button>
                <button onClick={clearCanvas} className="btn-ghost" style={{ padding: '7px 10px', fontSize: 12 }}>
                  Löschen
                </button>
              </div>
            </div>

            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="color" value={pen.color} disabled={pen.mode !== 'pen'} onChange={e => setPen(p => ({ ...p, color: e.target.value }))} style={{ width: 42, height: 28, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white' }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 6 }}>Strichstärke</div>
                  <input type="range" min={2} max={12} value={pen.width} onChange={e => setPen(p => ({ ...p, width: +e.target.value }))} style={{ width: '100%', accentColor: '#6366f1' }}/>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', width: 42, textAlign: 'right' }}>{pen.width}px</div>
              </div>

              <div style={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12, overflow: 'hidden', background: 'white', height: 420 }}>
                <canvas
                  ref={canvasRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                  style={{ width: '100%', height: '100%', touchAction: 'none', cursor: pen.mode === 'eraser' ? 'crosshair' : 'crosshair' }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Tipp: Mit Touch/Stift funktioniert’s am besten.
              </div>
            </div>
          </div>
        </div>
      </div>

      <AIAssistant/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<DokumentEditor/>);

