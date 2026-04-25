// StudyFlow — Whiteboard (dot-paper canvas)
const { useEffect, useMemo, useRef, useState } = React;

const WB_MIME = 'application/studyflow-whiteboard+json';

function toCanvasPoint(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left) * (canvas.width / r.width),
    y: (clientY - r.top) * (canvas.height / r.height),
  };
}

function redraw(ctx, strokes) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (strokes || []).forEach(s => {
    const pts = s.points || [];
    if (pts.length < 1) return;
    ctx.strokeStyle = s.color || '#0f172a';
    ctx.lineWidth = s.width || 3;
    ctx.globalAlpha = s.alpha ?? 1;
    ctx.beginPath();
    if (pts.length === 1) {
      ctx.arc(pts[0].x, pts[0].y, s.width / 2, 0, Math.PI * 2);
      ctx.fillStyle = s.color || '#0f172a';
      ctx.fill();
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

const COLORS = ['#0f172a', '#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'];

const Whiteboard = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [title, setTitle] = useState('Neues Whiteboard');
  const [editingTitle, setEditingTitle] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [history, setHistory] = useState([]); // undo stack
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pen, setPen] = useState({ color: '#0f172a', width: 3, mode: 'pen' }); // pen | eraser | highlighter

  const canvasRef = useRef(null);
  const drawing = useRef({ active: false, stroke: null, strokesSnapshot: null });
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      setUser(session.user);
      if (docId) {
        const { data: row } = await window.sb.from('documents').select('*').eq('id', docId).single();
        if (row) {
          setDocRow(row);
          setTitle(row.name || 'Whiteboard');
          if (row.file_path && row.file_path !== '') {
            const { data: dl } = await window.sb.storage.from('documents').download(row.file_path);
            if (dl) {
              try {
                const parsed = JSON.parse(await dl.text());
                setTitle(parsed.title || row.name || 'Whiteboard');
                setStrokes(Array.isArray(parsed.strokes) ? parsed.strokes : []);
              } catch {}
            }
          }
        }
      }
      setLoading(false);
    })();
  }, [docId]);

  // Canvas sizing + redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.offsetWidth * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
      redraw(canvas.getContext('2d'), strokesRef.current);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [loading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    redraw(canvas.getContext('2d'), strokes);
  }, [strokes]);

  const startStroke = (cx, cy) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toCanvasPoint(canvas, cx, cy);
    const isEraser = pen.mode === 'eraser';
    const isHL = pen.mode === 'highlighter';
    const s = {
      color: isEraser ? '#f9f7f2' : pen.color,
      width: isEraser ? pen.width * 6 : isHL ? pen.width * 5 : pen.width,
      alpha: isHL ? 0.35 : 1,
      points: [p],
    };
    drawing.current = { active: true, stroke: s, strokesSnapshot: strokesRef.current };
    setStrokes(prev => [...prev, s]);
  };

  const addPoint = (cx, cy) => {
    if (!drawing.current.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = toCanvasPoint(canvas, cx, cy);
    drawing.current.stroke.points.push(p);
    redraw(canvas.getContext('2d'), strokesRef.current);
  };

  const endStroke = () => {
    if (!drawing.current.active) return;
    setHistory(prev => [...prev, drawing.current.strokesSnapshot]);
    drawing.current = { active: false, stroke: null, strokesSnapshot: null };
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setStrokes(prev);
    setHistory(h => h.slice(0, -1));
  };

  const clearAll = () => {
    if (!confirm('Whiteboard leeren?')) return;
    setHistory(h => [...h, strokes]);
    setStrokes([]);
  };

  const onPD = (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); startStroke(e.clientX, e.clientY); };
  const onPM = (e) => { if (!drawing.current.active) return; addPoint(e.clientX, e.clientY); };
  const onPU = () => endStroke();

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = { type: 'studyflow_whiteboard', title, strokes, updated_at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(payload)], { type: WB_MIME });
      const safe = title.replace(/[^a-zA-Z0-9._-]/g, '_');
      let path = docRow?.file_path && docRow.file_path !== '' ? docRow.file_path : `${user.id}/${Date.now()}_${safe}.whiteboard.json`;
      await window.sb.storage.from('documents').upload(path, blob, { contentType: WB_MIME, upsert: true });
      const update = { name: title, file_path: path, file_size: blob.size, mime_type: WB_MIME };
      if (docRow) {
        const { data } = await window.sb.from('documents').update(update).eq('id', docRow.id).select().single();
        setDocRow(data);
      } else {
        const { data } = await window.sb.from('documents').insert({ owner_id: user.id, doc_type: 'whiteboard', ...update }).select().single();
        setDocRow(data);
        const url = new URL(window.location.href);
        url.searchParams.set('id', data.id);
        window.history.replaceState({}, '', url.toString());
      }
      setSavedAt(new Date());
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f7f2' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </div>
  );

  const cursorStyle = pen.mode === 'eraser' ? 'cell' : pen.mode === 'highlighter' ? 'crosshair' : 'crosshair';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f9f7f2' }}>
      {/* Toolbar */}
      <div style={{ height: 52, flexShrink: 0, background: 'white', borderBottom: '1px solid rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', gap: 0, padding: '0 16px', zIndex: 10 }}>
        {/* Back */}
        <a href="dashboard.html?tab=docs" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, textDecoration: 'none', marginRight: 14, flexShrink: 0 }}>
          <Icons.ArrowLeft size={14}/> Zurück
        </a>
        <div style={{ width: 1, height: 22, background: '#e2e8f0', marginRight: 14 }}/>

        {/* Title */}
        {editingTitle ? (
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
            style={{ fontFamily: 'Instrument Sans', fontSize: 14, fontWeight: 600, color: '#0f172a', border: 'none', outline: 'none', background: '#f1f5f9', borderRadius: 6, padding: '3px 8px', width: 200 }}/>
        ) : (
          <div onClick={() => setEditingTitle(true)} style={{ fontFamily: 'Instrument Sans', fontSize: 14, fontWeight: 600, color: '#0f172a', cursor: 'text', padding: '3px 8px', borderRadius: 6, marginRight: 8 }}
            title="Klicken zum Bearbeiten">{title}</div>
        )}
        {savedAt && <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 8 }}>· {savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}

        <div style={{ flex: 1 }}/>

        {/* Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
          {[
            { mode: 'pen', label: 'Stift', icon: <Icons.Edit size={14}/> },
            { mode: 'highlighter', label: 'Marker', icon: <Icons.Eye size={14}/> },
            { mode: 'eraser', label: 'Radierer', icon: <Icons.Trash size={14}/> },
          ].map(t => (
            <button key={t.mode} onClick={() => setPen(p => ({ ...p, mode: t.mode }))} title={t.label}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, background: pen.mode === t.mode ? '#eef2ff' : 'transparent', color: pen.mode === t.mode ? '#4f46e5' : '#64748b', transition: 'background 0.12s' }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 12 }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setPen(p => ({ ...p, color: c, mode: p.mode === 'eraser' ? 'pen' : p.mode }))}
              style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: pen.color === c && pen.mode !== 'eraser' ? '2.5px solid #6366f1' : c === '#ffffff' ? '1.5px solid #e2e8f0' : '2px solid transparent', cursor: 'pointer', flexShrink: 0, outline: 'none', transition: 'transform 0.1s', transform: pen.color === c && pen.mode !== 'eraser' ? 'scale(1.25)' : 'scale(1)' }}/>
          ))}
        </div>

        {/* Width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 14 }}>
          <input type="range" min={1} max={14} value={pen.width} onChange={e => setPen(p => ({ ...p, width: +e.target.value }))}
            style={{ width: 72, accentColor: '#6366f1' }}/>
          <span style={{ fontSize: 11, color: '#64748b', width: 24 }}>{pen.width}px</span>
        </div>

        <div style={{ width: 1, height: 22, background: '#e2e8f0', marginRight: 12 }}/>

        {/* Actions */}
        <button onClick={undo} disabled={history.length === 0} title="Rückgängig (Strg+Z)" className="btn-ghost" style={{ padding: '5px 9px', opacity: history.length === 0 ? 0.4 : 1, marginRight: 4 }}>
          <Icons.ArrowLeft size={14}/>
        </button>
        <button onClick={clearAll} className="btn-ghost" style={{ padding: '5px 9px', marginRight: 10 }} title="Alles löschen">
          <Icons.Trash size={14}/>
        </button>
        <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: '7px 16px', fontSize: 13, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Speichert…' : <><Icons.Check size={13}/> Speichern</>}
        </button>
      </div>

      {/* Canvas — dot-paper background */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden',
        backgroundImage: 'radial-gradient(circle, #c8c5bd 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        backgroundColor: '#f9f7f2',
      }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onPD}
          onPointerMove={onPM}
          onPointerUp={onPU}
          onPointerCancel={onPU}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: cursorStyle }}
        />
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Whiteboard/>);
