// StudyFlow — Whiteboard v3 (Miro-style, performant)
const { useEffect, useMemo, useRef, useState, useCallback } = React;
const WB_MIME = 'application/studyflow-whiteboard+json';

// ─── Palette ───────────────────────────────────────────────
const PALETTE = ['#1e293b','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ffffff'];
const STICKY_COLORS = [
  {bg:'#fef08a',border:'#ca8a04'},{bg:'#fbcfe8',border:'#db2777'},
  {bg:'#bbf7d0',border:'#16a34a'},{bg:'#bfdbfe',border:'#2563eb'},{bg:'#e9d5ff',border:'#7c3aed'}
];
const FONTS = [{id:'caveat',css:"'Caveat',cursive",label:'Handschrift'},{id:'inter',css:'inherit',label:'Normal'}];

// ─── Canvas helpers ────────────────────────────────────────
function getWorld(e, canvas, pan, zoom) {
  const r = canvas.getBoundingClientRect();
  const sx = (e.clientX - r.left), sy = (e.clientY - r.top);
  return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
}
function w2s(wx, wy, pan, zoom) {
  return { x: wx * zoom + pan.x, y: wy * zoom + pan.y };
}
// Safe findLastIndex polyfill
function findLastIdx(arr, pred) {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i], i)) return i;
  return -1;
}
function ptOnStroke(s, wx, wy, thr) {
  const r = thr + s.width * 0.5;
  for (const p of s.points) if (Math.hypot(p.x - wx, p.y - wy) < r) return true;
  return false;
}

// ─── Drawing engine ────────────────────────────────────────
function drawAll(ctx, strokes, shapes, pan, zoom) {
  const dpr = window.devicePixelRatio || 1;
  const { width: W, height: H } = ctx.canvas;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  for (const s of strokes) {
    const pts = s.points;
    if (!pts || !pts.length) continue;
    ctx.save();
    ctx.globalAlpha = s.alpha ?? 1;
    ctx.globalCompositeOperation = s.tool === 'eraser_px' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (pts.length === 1) {
      ctx.arc(pts[0].x, pts[0].y, s.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const sh of shapes) {
    ctx.save();
    ctx.strokeStyle = sh.color;
    ctx.fillStyle = sh.fill || 'transparent';
    ctx.lineWidth = sh.width || 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (sh.type === 'rect') {
      const [x,y,w,h] = [Math.min(sh.x1,sh.x2),Math.min(sh.y1,sh.y2),Math.abs(sh.x2-sh.x1),Math.abs(sh.y2-sh.y1)];
      ctx.roundRect ? ctx.roundRect(x,y,w,h,5) : ctx.rect(x,y,w,h);
    } else if (sh.type === 'circle') {
      ctx.ellipse((sh.x1+sh.x2)/2,(sh.y1+sh.y2)/2,Math.abs(sh.x2-sh.x1)/2,Math.abs(sh.y2-sh.y1)/2,0,0,Math.PI*2);
    } else if (sh.type === 'arrow') {
      const ang = Math.atan2(sh.y2-sh.y1, sh.x2-sh.x1), al = 14;
      ctx.moveTo(sh.x1,sh.y1); ctx.lineTo(sh.x2,sh.y2);
      ctx.moveTo(sh.x2-al*Math.cos(ang-0.45), sh.y2-al*Math.sin(ang-0.45));
      ctx.lineTo(sh.x2, sh.y2);
      ctx.lineTo(sh.x2-al*Math.cos(ang+0.45), sh.y2-al*Math.sin(ang+0.45));
    }
    ctx.stroke();
    if (sh.fill && sh.fill !== 'transparent') ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Draw a single line segment incrementally (no clear, no full redraw)
function drawSegment(ctx, x0, y0, x1, y1, stroke, pan, zoom) {
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);
  ctx.globalAlpha = stroke.alpha ?? 1;
  ctx.globalCompositeOperation = stroke.tool === 'eraser_px' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

// ─── Inline SVG Icons ──────────────────────────────────────
const I = ({ children, size = 20, sw = 1.9 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
// Tool icons
const SelectIcon  = () => <I><path d="M5 3l14 9-7 2-3 7z" fill="currentColor" strokeWidth="1.4"/></I>;
const PanIcon     = () => <I><path d="M18 11V8a2 2 0 00-4 0v1M14 9V7a2 2 0 00-4 0v4M10 11V8a2 2 0 00-4 0v6l-1.5-1.5A1.5 1.5 0 002 14.5L5 19a5 5 0 005 3h3a5 5 0 005-5v-4a2 2 0 00-4 0"/></I>;
const TextIcon    = () => <I><path d="M4 6h16M12 6v13M8 19h8"/></I>;
const FrameIcon   = () => <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></I>;
const TableIcon   = () => <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></I>;
const BubbleIcon  = () => <I><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></I>;
const ComponentIcon=() => <I><rect x="2" y="2" width="8" height="8" rx="1.5"/><rect x="14" y="2" width="8" height="8" rx="1.5"/><rect x="2" y="14" width="8" height="8" rx="1.5"/><rect x="14" y="14" width="8" height="8" rx="1.5"/></I>;
const PlusIcon    = () => <I><path d="M12 5v14M5 12h14"/></I>;
const RectIcon    = () => <I><rect x="3" y="5" width="18" height="14" rx="2"/></I>;
const CircleIcon  = () => <I><circle cx="12" cy="12" r="9"/></I>;
const ArrowIcon   = () => <I><path d="M5 12h14M13 5l7 7-7 7"/></I>;
const StickyIcon  = () => <I><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v12l-5 5H4a1 1 0 01-1-1z"/><path d="M15 20v-5h5"/></I>;
const UndoIcon    = () => <I><path d="M3 7h10a5 5 0 010 10H7"/><path d="M3 7l4-4M3 7l4 4"/></I>;
const SaveIcon    = () => <I><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></I>;
const CloseIcon   = () => <I sw={2}><path d="M6 6l12 12M18 6l-12 12"/></I>;

// Realistic pencil SVG for main toolbar
const PencilBig = ({ active }) => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect x="14" y="3" width="8" height="24" rx="2" fill={active ? '#a5b4fc' : '#d1d5db'}/>
    <rect x="14" y="3" width="8" height="6" rx="2" fill={active ? '#6366f1' : '#9ca3af'}/>
    <polygon points="14,27 22,27 18,33" fill="#f59e0b"/>
    <polygon points="16,30 20,30 18,33" fill="#1e293b"/>
    <rect x="14" y="24" width="8" height="3" fill={active ? '#818cf8' : '#bfc2c8'}/>
  </svg>
);

// Pen type button preview SVGs for sub-toolbar
const PenTypeIcon = ({ type, active }) => {
  const bg = active ? (
    type === 'ballpoint' ? '#c4b5fd' :
    type === 'highlighter' ? '#fde68a' :
    type === 'marker' ? '#bbf7d0' :
    '#fecaca'
  ) : '#f1f5f9';

  const contents = {
    ballpoint: (
      <text x="18" y="26" fontFamily="Georgia,serif" fontSize="22" fontWeight="900" fill={active ? '#4c1d95' : '#374151'} textAnchor="middle">A</text>
    ),
    highlighter: (
      <>
        <rect x="4" y="22" width="28" height="7" rx="2" fill="#fde047" opacity="0.8"/>
        <text x="18" y="26" fontFamily="Georgia,serif" fontSize="22" fontWeight="900" fill={active ? '#92400e' : '#374151'} textAnchor="middle">A</text>
      </>
    ),
    marker: (
      <>
        <rect x="5" y="14" width="26" height="12" rx="3" fill={active ? '#6ee7b7' : '#d1d5db'}/>
        <text x="18" y="26" fontFamily="Georgia,serif" fontSize="17" fontWeight="700" fill={active ? '#065f46' : '#374151'} textAnchor="middle">A</text>
      </>
    ),
    eraser: (
      <rect x="6" y="12" width="24" height="14" rx="3" fill={active ? '#fca5a5' : '#e5e7eb'}/>
    ),
  };

  return (
    <svg width="36" height="36" viewBox="0 0 36 36" style={{ borderRadius: 8, background: bg }}>
      {contents[type]}
    </svg>
  );
};

// ─── Whiteboard component ──────────────────────────────────
const Whiteboard = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);

  // Auth/doc
  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [title, setTitle] = useState('Neues Whiteboard');
  const [editingTitle, setEditingTitle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Canvas content (committed)
  const [strokes, setStrokes] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [texts, setTexts] = useState([]);
  const [stickies, setStickies] = useState([]);
  const [history, setHistory] = useState([]);

  // Viewport
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [zoom, setZoom] = useState(1);

  // Tool
  const [tool, setTool] = useState('ballpoint');
  const [color, setColor] = useState('#1e293b');
  const [brushSize, setBrushSize] = useState(3);
  const [textFont, setTextFont] = useState('caveat');
  const [activeTextId, setActiveTextId] = useState(null);
  const [activeStickyId, setActiveStickyId] = useState(null);

  // UI
  const [showPenSub, setShowPenSub] = useState(true); // shown when draw/eraser active
  const [showShapeSub, setShowShapeSub] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  const [addonTab, setAddonTab] = useState('vorlagen');

  // Refs for event handlers (avoid stale closures)
  const canvasRef = useRef(null);
  const panR = useRef({ x: 80, y: 60 });
  const zoomR = useRef(1);
  const toolR = useRef('ballpoint');
  const colorR = useRef('#1e293b');
  const brushR = useRef(3);
  const strokesR = useRef([]);
  const shapesR = useRef([]);

  useEffect(() => { panR.current = pan; }, [pan]);
  useEffect(() => { zoomR.current = zoom; }, [zoom]);
  useEffect(() => { toolR.current = tool; }, [tool]);
  useEffect(() => { colorR.current = color; }, [color]);
  useEffect(() => { brushR.current = brushSize; }, [brushSize]);
  useEffect(() => { strokesR.current = strokes; }, [strokes]);
  useEffect(() => { shapesR.current = shapes; }, [shapes]);

  // Gesture refs
  const drawG  = useRef({ active: false, stroke: null });
  const panG   = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });
  const shapeG = useRef({ active: false, x1: 0, y1: 0 });

  // Derived
  const isDrawTool = ['ballpoint','marker','highlighter'].includes(tool);
  const isEraserTool = ['eraser_obj','eraser_px'].includes(tool);
  const isPenGroup = isDrawTool || isEraserTool;
  const isShapeTool = ['rect','circle','arrow'].includes(tool);

  // ─── Load ─────────────────────────────────────────────
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
                const p = JSON.parse(await dl.text());
                setTitle(p.title || row.name || 'Whiteboard');
                setStrokes(Array.isArray(p.strokes) ? p.strokes : []);
                setShapes(Array.isArray(p.shapes) ? p.shapes : []);
                setTexts(Array.isArray(p.texts) ? p.texts : []);
                setStickies(Array.isArray(p.stickies) ? p.stickies : []);
              } catch {}
            }
          }
        }
      }
      setLoading(false);
    })();
  }, [docId]);

  // ─── Full redraw (triggered on state changes) ──────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawAll(canvas.getContext('2d'), strokesR.current, shapesR.current, panR.current, zoomR.current);
  }, []);

  useEffect(() => { redraw(); }, [strokes, shapes, pan, zoom, redraw]);

  // ─── Canvas resize ─────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [loading, redraw]);

  // ─── Wheel zoom ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      const delta = e.deltaY < 0 ? 1.08 : 0.93;
      setZoom(z => {
        const nz = Math.max(0.1, Math.min(4, z * delta));
        setPan(p => ({ x: cx - (cx - p.x) * (nz / z), y: cy - (cy - p.y) * (nz / z) }));
        return nz;
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [loading]);

  // ─── Keyboard ──────────────────────────────────────────
  useEffect(() => {
    const kd = (e) => {
      const tag = document.activeElement?.tagName;
      const ce = document.activeElement?.contentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || ce === 'true') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); return; }
      const map = { v:'select', h:'pan', p:'ballpoint', m:'marker', l:'highlighter', e:'eraser_obj', t:'text', n:'sticky', r:'rect', c:'circle' };
      if (map[e.key]) activateTool(map[e.key]);
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, []);

  // ─── Tool helpers ──────────────────────────────────────
  const activateTool = (t) => {
    setTool(t);
    setActiveTextId(null); setActiveStickyId(null); setShowAddons(false);
    const isPen = ['ballpoint','marker','highlighter','eraser_obj','eraser_px'].includes(t);
    const isShape = ['rect','circle','arrow'].includes(t);
    setShowPenSub(isPen);
    setShowShapeSub(isShape);
  };

  const snapshot = useCallback(() => {
    setHistory(h => [...h.slice(-40), { strokes: strokesR.current, shapes: shapesR.current, texts: [], stickies: [] }]);
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setStrokes(prev.strokes || []);
      setShapes(prev.shapes || []);
      return h.slice(0, -1);
    });
  }, []);

  // ─── Pointer events ────────────────────────────────────
  const onPD = useCallback((e) => {
    if (e.button !== 0 && e.button !== 1) return;
    const canvas = canvasRef.current;
    canvas?.setPointerCapture?.(e.pointerId);
    const t = toolR.current;
    const p = panR.current, z = zoomR.current;
    const w = getWorld(e, canvas, p, z);

    // Middle button or pan tool → pan
    if (e.button === 1 || t === 'pan' || e.spaceKey) {
      panG.current = { active: true, sx: e.clientX, sy: e.clientY, px: p.x, py: p.y };
      return;
    }

    if (t === 'text') {
      const id = Date.now().toString();
      setActiveTextId(id);
      setTexts(prev => [...prev, { id, x: w.x, y: w.y, content: '', font: textFont, size: 22, color: colorR.current }]);
      return;
    }
    if (t === 'sticky') {
      const id = Date.now().toString();
      const sc = STICKY_COLORS[stickies.length % STICKY_COLORS.length];
      setActiveStickyId(id);
      setStickies(prev => [...prev, { id, x: w.x, y: w.y, content: 'Neue Notiz', ...sc }]);
      return;
    }
    if (t === 'eraser_obj') {
      snapshot();
      const idx = findLastIdx(strokesR.current, s => ptOnStroke(s, w.x, w.y, 16 / z));
      if (idx !== -1) setStrokes(prev => prev.filter((_, i) => i !== idx));
      return;
    }
    if (['rect','circle','arrow'].includes(t)) {
      snapshot();
      shapeG.current = { active: true, x1: w.x, y1: w.y };
      return;
    }
    if (['ballpoint','marker','highlighter','eraser_px'].includes(t)) {
      snapshot();
      const cfg = {
        ballpoint:   { width: brushR.current,       alpha: 1,    color: colorR.current },
        marker:      { width: brushR.current * 4,   alpha: 1,    color: colorR.current },
        highlighter: { width: brushR.current * 9,   alpha: 0.30, color: colorR.current },
        eraser_px:   { width: brushR.current * 6,   alpha: 1,    color: '#1e293b' },
      }[t];
      const s = { id: Date.now().toString(), tool: t, ...cfg, points: [w] };
      drawG.current = { active: true, stroke: s, prevPt: w };
    }
  }, [snapshot, textFont, stickies]);

  const onPM = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = panR.current, z = zoomR.current;

    if (panG.current.active) {
      const dx = e.clientX - panG.current.sx, dy = e.clientY - panG.current.sy;
      setPan({ x: panG.current.px + dx, y: panG.current.py + dy });
      return;
    }
    if (shapeG.current.active) {
      const w = getWorld(e, canvas, p, z);
      // Draw in-progress shape overlay
      const ctx = canvas.getContext('2d');
      drawAll(ctx, strokesR.current, shapesR.current, p, z);
      const tmpShape = { type: toolR.current, x1: shapeG.current.x1, y1: shapeG.current.y1, x2: w.x, y2: w.y, color: colorR.current, width: brushR.current };
      drawAll(ctx, strokesR.current, [...shapesR.current, tmpShape], p, z);
      return;
    }
    if (!drawG.current.active) return;
    const w = getWorld(e, canvas, p, z);
    const prev = drawG.current.prevPt;
    drawG.current.stroke.points.push(w);
    drawG.current.prevPt = w;
    // Incremental draw — no state update, no full redraw
    const ctx = canvas.getContext('2d');
    if (drawG.current.stroke.tool === 'eraser_px') {
      // For eraser, redraw to avoid artifacts
      drawAll(ctx, strokesR.current, shapesR.current, p, z);
      // Draw all eraser points so far
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(p.x, p.y);
      ctx.scale(z, z);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.lineWidth = drawG.current.stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const pts = drawG.current.stroke.points;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.restore();
    } else {
      drawSegment(ctx, prev.x, prev.y, w.x, w.y, drawG.current.stroke, p, z);
    }
  }, []);

  const onPU = useCallback((e) => {
    panG.current.active = false;
    if (shapeG.current.active) {
      const canvas = canvasRef.current;
      if (canvas) {
        const w = getWorld(e, canvas, panR.current, zoomR.current);
        if (Math.hypot(w.x - shapeG.current.x1, w.y - shapeG.current.y1) > 5) {
          const s = { id: Date.now().toString(), type: toolR.current, x1: shapeG.current.x1, y1: shapeG.current.y1, x2: w.x, y2: w.y, color: colorR.current, width: brushR.current };
          setShapes(prev => [...prev, s]);
        }
      }
      shapeG.current.active = false;
      return;
    }
    if (drawG.current.active) {
      const s = { ...drawG.current.stroke, points: [...drawG.current.stroke.points] };
      setStrokes(prev => [...prev, s]);
      drawG.current = { active: false, stroke: null };
    }
  }, []);

  // ─── Save ──────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = { type: 'studyflow_whiteboard', title, strokes, shapes, texts, stickies, updated_at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(payload)], { type: WB_MIME });
      const safe = title.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = (docRow?.file_path && docRow.file_path !== '')
        ? docRow.file_path
        : `${user.id}/${Date.now()}_${safe}.whiteboard.json`;
      await window.sb.storage.from('documents').upload(path, blob, { contentType: WB_MIME, upsert: true });
      const upd = { name: title, file_path: path, file_size: blob.size, mime_type: WB_MIME };
      if (docRow?.id) {
        const { data } = await window.sb.from('documents').update(upd).eq('id', docRow.id).select().single();
        if (data) setDocRow(data);
      } else {
        const { data } = await window.sb.from('documents').insert({ owner_id: user.id, doc_type: 'whiteboard', ...upd }).select().single();
        if (data) {
          setDocRow(data);
          const u2 = new URL(window.location.href); u2.searchParams.set('id', data.id);
          window.history.replaceState({}, '', u2.toString());
        }
      }
      setSavedAt(new Date());
    } catch (err) { alert(err.message); }
    setSaving(false);
  }, [user, docRow, title, strokes, shapes, texts, stickies]);

  // ─── Insert template ────────────────────────────────────
  const insertTemplate = (tpl) => {
    const c = canvasRef.current;
    const cx = ((c?.offsetWidth || 800) / 2 - panR.current.x) / zoomR.current;
    const cy = ((c?.offsetHeight || 600) / 2 - panR.current.y) / zoomR.current;
    const id = Date.now();
    if (tpl === 'mindmap') {
      setTexts(prev => [...prev,
        { id:id+'_c', x:cx, y:cy, content:'Hauptthema', font:'caveat', size:30, color:'#6366f1' },
        { id:id+'_1', x:cx-170, y:cy-90, content:'Idee 1', font:'caveat', size:22, color:'#1e293b' },
        { id:id+'_2', x:cx+130, y:cy-90, content:'Idee 2', font:'caveat', size:22, color:'#1e293b' },
        { id:id+'_3', x:cx-170, y:cy+90, content:'Idee 3', font:'caveat', size:22, color:'#1e293b' },
        { id:id+'_4', x:cx+130, y:cy+90, content:'Idee 4', font:'caveat', size:22, color:'#1e293b' },
      ]);
      setShapes(prev => [...prev,
        ...[[-160,-80],[ 140,-80],[-160,80],[140,80]].map(([dx,dy],i) => ({
          id:id+'_l'+i, type:'arrow', x1:cx+dx*0.4, y1:cy+dy*0.4, x2:cx+dx*0.85, y2:cy+dy*0.85, color:'#c7d2fe', width:1.5
        }))
      ]);
    } else if (tpl === 'brainstorm') {
      [0,1,2,3,4].forEach(i => {
        const a = (i/5)*Math.PI*2;
        setStickies(prev => [...prev, { id:id+'_'+i, x:cx+Math.cos(a)*140, y:cy+Math.sin(a)*110, content:'Idee '+(i+1), ...STICKY_COLORS[i] }]);
      });
    } else if (tpl === 'todo') {
      ['Aufgabe 1','Aufgabe 2','Aufgabe 3','Aufgabe 4'].forEach((l,i) => {
        setTexts(prev => [...prev, { id:id+'_'+i, x:cx-120, y:cy-50+i*40, content:'☐  '+l, font:'caveat', size:22, color:'#1e293b' }]);
      });
    } else if (tpl === 'timeline') {
      setShapes(prev => [...prev, { id:id+'_l', type:'arrow', x1:cx-220, y1:cy, x2:cx+220, y2:cy, color:'#6366f1', width:2.5 }]);
      [-150,-50,50,150].forEach((dx,i) => {
        setTexts(prev => [...prev, { id:id+'_t'+i, x:cx+dx, y:cy-36, content:'Phase '+(i+1), font:'caveat', size:18, color:'#1e293b' }]);
        setShapes(prev => [...prev, { id:id+'_d'+i, type:'circle', x1:cx+dx-7, y1:cy-7, x2:cx+dx+7, y2:cy+7, color:'#6366f1', fill:'#6366f1', width:0 }]);
      });
    }
    setShowAddons(false);
  };

  const deleteText = (id) => setTexts(prev => prev.filter(t => t.id !== id));
  const deleteSticky = (id) => setStickies(prev => prev.filter(s => s.id !== id));

  // Cursor
  const cursor = tool === 'pan' ? 'grab' : tool === 'text' ? 'text' : tool === 'eraser_obj' ? 'cell' : 'crosshair';

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f8f6', backgroundImage:'radial-gradient(circle, #d1d5db 1.2px, transparent 1.2px)', backgroundSize:'22px 22px' }}>
      <span style={{ fontFamily:'Caveat', fontSize:28, color:'#94a3b8' }}>Lädt…</span>
    </div>
  );

  // ─── Toolbar button style ──────────────────────────────
  const tbtn = (active, extra = {}) => ({
    width:44, height:44, border:'none', borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
    background: active ? '#ede9fe' : 'transparent',
    color: active ? '#6366f1' : '#475569',
    transition:'background 0.12s, color 0.12s',
    flexShrink:0,
    ...extra,
  });

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', background:'#f8f8f6',
      backgroundImage:'radial-gradient(circle, #d1d5db 1.2px, transparent 1.2px)', backgroundSize:'22px 22px' }}>

      {/* ─── Top bar ───────────────────────────────────── */}
      <div style={{ height:50, flexShrink:0, background:'white', borderBottom:'1px solid rgba(15,23,42,0.07)', display:'flex', alignItems:'center', padding:'0 14px', gap:10, zIndex:30, boxShadow:'0 1px 4px rgba(15,23,42,0.06)' }}>
        <a href="dashboard.html?tab=docs" style={{ display:'flex', alignItems:'center', gap:7, textDecoration:'none', flexShrink:0 }}>
          <Icons.Logo size={28}/>
        </a>
        <div style={{ width:1, height:22, background:'#e2e8f0', flexShrink:0 }}/>
        {editingTitle
          ? <input autoFocus value={title} onChange={e=>setTitle(e.target.value)}
              onBlur={()=>setEditingTitle(false)}
              onKeyDown={e=>{ if(e.key==='Enter'||e.key==='Escape') setEditingTitle(false); }}
              style={{ fontFamily:'Instrument Sans', fontSize:14, fontWeight:600, color:'#0f172a', border:'none', outline:'none', background:'#f1f5f9', borderRadius:6, padding:'3px 8px', minWidth:120 }}/>
          : <div onClick={()=>setEditingTitle(true)}
              style={{ fontFamily:'Instrument Sans', fontSize:14, fontWeight:600, color:'#0f172a', cursor:'text', padding:'3px 8px', borderRadius:6, whiteSpace:'nowrap' }}>
              {title}
            </div>
        }
        {savedAt && <span style={{ fontSize:11, color:'#94a3b8' }}>· {savedAt.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</span>}
        <div style={{ flex:1 }}/>
        <button onClick={undo} disabled={!history.length} title="Rückgängig (Strg+Z)"
          style={{ ...tbtn(false), opacity: history.length ? 1 : 0.3 }}>
          <UndoIcon/>
        </button>
        <button onClick={save} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', background:'#0f172a', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:500, fontFamily:'inherit', cursor:'pointer', opacity:saving?0.7:1 }}>
          <SaveIcon/> {saving ? 'Speichert…' : 'Speichern'}
        </button>
      </div>

      {/* ─── Canvas ────────────────────────────────────── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <canvas ref={canvasRef} onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerCancel={onPU}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', touchAction:'none', cursor }}/>

        {/* HTML overlay */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
          {texts.map(t => {
            const sp = w2s(t.x, t.y, pan, zoom);
            const isA = activeTextId === t.id;
            return (
              <div key={t.id} style={{ position:'absolute', left:sp.x, top:sp.y, pointerEvents:'all', zIndex:isA?20:10 }}>
                {isA && (
                  <div style={{ position:'absolute', top:-34, left:0, display:'flex', gap:3, background:'white', border:'1px solid #e2e8f0', borderRadius:8, padding:'4px 6px', boxShadow:'0 4px 12px rgba(15,23,42,0.12)', zIndex:30, whiteSpace:'nowrap' }}>
                    {FONTS.map(f=>(
                      <button key={f.id} onClick={()=>setTexts(p=>p.map(tx=>tx.id===t.id?{...tx,font:f.id}:tx))}
                        style={{ fontSize:11.5, fontFamily:f.css, padding:'3px 7px', border:'none', borderRadius:5, cursor:'pointer', background:t.font===f.id?'#eef2ff':'transparent', color:t.font===f.id?'#6366f1':'#64748b' }}>
                        {f.label}
                      </button>
                    ))}
                    <div style={{ width:1, background:'#e2e8f0', margin:'2px 1px' }}/>
                    {[16,20,24,30,40].map(s=>(
                      <button key={s} onClick={()=>setTexts(p=>p.map(tx=>tx.id===t.id?{...tx,size:s}:tx))}
                        style={{ fontSize:11, padding:'3px 5px', border:'none', borderRadius:5, cursor:'pointer', background:t.size===s?'#eef2ff':'transparent', color:'#64748b' }}>{s}</button>
                    ))}
                    <div style={{ width:1, background:'#e2e8f0', margin:'2px 1px' }}/>
                    {PALETTE.slice(0,6).map(c=>(
                      <button key={c} onClick={()=>setTexts(p=>p.map(tx=>tx.id===t.id?{...tx,color:c}:tx))}
                        style={{ width:15, height:15, borderRadius:'50%', background:c, border:c==='#ffffff'?'1px solid #e2e8f0':'none', cursor:'pointer', padding:0, flexShrink:0 }}/>
                    ))}
                    <div style={{ width:1, background:'#e2e8f0', margin:'2px 1px' }}/>
                    <button onClick={()=>{deleteText(t.id);setActiveTextId(null);}}
                      style={{ fontSize:11, padding:'3px 5px', border:'none', borderRadius:5, cursor:'pointer', color:'#ef4444', background:'transparent' }}>✕</button>
                  </div>
                )}
                <div contentEditable={isA} suppressContentEditableWarning
                  onFocus={()=>setActiveTextId(t.id)}
                  onBlur={e=>{ const v=e.currentTarget.innerText.trim(); if(!v){deleteText(t.id);setActiveTextId(null);return;} setTexts(p=>p.map(tx=>tx.id===t.id?{...tx,content:v}:tx)); setActiveTextId(null); }}
                  onPointerDown={e=>{e.stopPropagation();setActiveTextId(t.id);}}
                  style={{ minWidth:60, fontFamily:t.font==='caveat'?"'Caveat',cursive":'inherit', fontSize:t.size*zoom, color:t.color,
                    outline:isA?'1.5px dashed #6366f1':'none', borderRadius:4, padding:'2px 4px',
                    background:isA?'rgba(255,255,255,0.9)':'transparent',
                    cursor:isA?'text':'pointer', whiteSpace:'pre', userSelect:isA?'text':'none', lineHeight:1.3 }}
                  dangerouslySetInnerHTML={isA?undefined:{__html: t.content||'<span style="opacity:0.25">Text…</span>'}}
                />
              </div>
            );
          })}

          {stickies.map(s => {
            const sp = w2s(s.x, s.y, pan, zoom);
            const isA = activeStickyId === s.id;
            const W = 164*zoom, H = 148*zoom;
            return (
              <div key={s.id} onPointerDown={e=>{e.stopPropagation();setActiveStickyId(s.id);}}
                style={{ position:'absolute', left:sp.x, top:sp.y, width:W, height:H, pointerEvents:'all', zIndex:isA?20:10,
                  background:s.bg, border:`1.5px solid ${s.border}`, borderRadius:4,
                  boxShadow:isA?`0 0 0 2px #6366f1,0 8px 24px rgba(0,0,0,0.16)`:'0 4px 16px rgba(0,0,0,0.1)',
                  display:'flex', flexDirection:'column', overflow:'hidden' }}>
                <div style={{ height:H*0.13, background:s.border, opacity:0.35, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:`0 ${6*zoom}px` }}>
                  <div style={{ display:'flex', gap:3 }}>
                    {STICKY_COLORS.map((c,i)=>(
                      <button key={i} onClick={()=>setStickies(p=>p.map(st=>st.id===s.id?{...st,...c}:st))}
                        style={{ width:8*zoom, height:8*zoom, minWidth:8, borderRadius:'50%', background:c.bg, border:`1.5px solid ${c.border}`, cursor:'pointer', padding:0, flexShrink:0 }}/>
                    ))}
                  </div>
                  <button onClick={()=>deleteSticky(s.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#475569', padding:0, lineHeight:1 }}>✕</button>
                </div>
                <textarea placeholder="Notiz…" value={s.content}
                  onChange={e=>setStickies(p=>p.map(st=>st.id===s.id?{...st,content:e.target.value}:st))}
                  style={{ flex:1, border:'none', background:'transparent', resize:'none', fontFamily:"'Caveat',cursive", fontSize:Math.max(13,17*zoom), color:'#1e293b', padding:`${6*zoom}px ${8*zoom}px`, outline:'none', cursor:'text' }}/>
              </div>
            );
          })}
        </div>

        {/* ─── Toolbar (bottom center) ──────────────────── */}
        <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:40, display:'flex', flexDirection:'column', alignItems:'center', gap:6, userSelect:'none' }}>

          {/* Pen sub-toolbar */}
          {showPenSub && (
            <div style={{ background:'white', borderRadius:18, padding:'7px 12px', display:'flex', alignItems:'center', gap:6,
              boxShadow:'0 4px 24px rgba(15,23,42,0.14)', border:'1px solid rgba(15,23,42,0.07)' }}>
              {/* Pen types */}
              {[
                { id:'ballpoint', label:'Kugelschreiber' },
                { id:'highlighter', label:'Textmarker' },
                { id:'marker', label:'Marker' },
                { id:'eraser_obj', label:'Radierer (Objekt)' },
              ].map(pt => (
                <button key={pt.id} onClick={()=>activateTool(pt.id)} title={pt.label}
                  style={{ background:'none', border:'none', padding:2, cursor:'pointer', borderRadius:8,
                    outline: tool === pt.id ? '2px solid #6366f1' : 'none', outlineOffset:1 }}>
                  <PenTypeIcon type={pt.id === 'eraser_obj' ? 'eraser' : pt.id} active={tool === pt.id}/>
                </button>
              ))}

              <div style={{ width:1, height:32, background:'#e2e8f0', margin:'0 2px' }}/>

              {/* Colors */}
              {PALETTE.map(c => (
                <button key={c} onClick={()=>{ setColor(c); if(isEraserTool) activateTool('ballpoint'); }}
                  style={{ width:24, height:24, borderRadius:'50%', background:c, border:'none', padding:0, cursor:'pointer', flexShrink:0,
                    boxShadow: color===c ? `0 0 0 2.5px white, 0 0 0 4px #6366f1` : c==='#ffffff' ? '0 0 0 1.5px #cbd5e1' : 'none',
                    transform: color===c ? 'scale(1.18)' : 'scale(1)', transition:'transform 0.1s, box-shadow 0.1s' }}/>
              ))}

              <div style={{ width:1, height:32, background:'#e2e8f0', margin:'0 2px' }}/>

              {/* Size */}
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {[1,3,6,10].map(s => (
                  <button key={s} onClick={()=>setBrushSize(s)}
                    style={{ width:Math.max(10,s*2.8)+4, height:Math.max(10,s*2.8)+4, borderRadius:'50%', background:'#1e293b', border:'none', padding:0, cursor:'pointer', flexShrink:0,
                      outline: brushSize===s ? '2px solid #6366f1' : 'none', outlineOffset:2 }}/>
                ))}
              </div>
            </div>
          )}

          {/* Shape sub-toolbar */}
          {showShapeSub && (
            <div style={{ background:'white', borderRadius:18, padding:'7px 12px', display:'flex', alignItems:'center', gap:6, boxShadow:'0 4px 24px rgba(15,23,42,0.14)', border:'1px solid rgba(15,23,42,0.07)' }}>
              {[{id:'rect',label:'Rechteck',icon:<RectIcon/>},{id:'circle',label:'Kreis',icon:<CircleIcon/>},{id:'arrow',label:'Pfeil',icon:<ArrowIcon/>}].map(sh=>(
                <button key={sh.id} onClick={()=>activateTool(sh.id)} title={sh.label} style={tbtn(tool===sh.id,{width:40,height:40})}>{sh.icon}</button>
              ))}
              <div style={{ width:1, height:28, background:'#e2e8f0' }}/>
              {PALETTE.map(c=>(
                <button key={c} onClick={()=>setColor(c)}
                  style={{ width:20, height:20, borderRadius:'50%', background:c, border:'none', padding:0, cursor:'pointer', flexShrink:0,
                    boxShadow: color===c ? '0 0 0 2px white, 0 0 0 3.5px #6366f1' : c==='#ffffff'?'0 0 0 1.5px #cbd5e1':'none' }}/>
              ))}
            </div>
          )}

          {/* Main toolbar */}
          <div style={{ background:'white', borderRadius:20, padding:'7px 12px', display:'flex', alignItems:'center', gap:2,
            boxShadow:'0 8px 32px rgba(15,23,42,0.16)', border:'1px solid rgba(15,23,42,0.06)' }}>

            {/* Select */}
            <button onClick={()=>activateTool('select')} title="Auswahl (V)" style={tbtn(tool==='select')}><SelectIcon/></button>
            {/* Pan */}
            <button onClick={()=>activateTool('pan')} title="Bewegen (H)" style={tbtn(tool==='pan')}><PanIcon/></button>

            <div style={{ width:1, height:28, background:'#e2e8f0', margin:'0 4px' }}/>

            {/* Pen (big pencil) */}
            <button onClick={()=>{ activateTool(isDrawTool?tool:'ballpoint'); setShowPenSub(v=>!(isDrawTool&&v)||true); setShowShapeSub(false); }}
              title="Stift (P)" style={{ background: isPenGroup ? '#ede9fe' : 'transparent', border:'none', borderRadius:12, padding:'4px 8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:56, height:44 }}>
              <PencilBig active={isPenGroup}/>
            </button>

            {/* Sticky */}
            <button onClick={()=>activateTool('sticky')} title="Notizzettel (N)" style={tbtn(tool==='sticky')}><StickyIcon/></button>

            {/* Shapes */}
            <button onClick={()=>{ activateTool(isShapeTool?tool:'rect'); setShowShapeSub(v=>!v); setShowPenSub(false); }}
              title="Formen" style={tbtn(isShapeTool||showShapeSub)}>
              {tool==='circle'?<CircleIcon/>:tool==='arrow'?<ArrowIcon/>:<RectIcon/>}
            </button>

            <div style={{ width:1, height:28, background:'#e2e8f0', margin:'0 4px' }}/>

            {/* Text */}
            <button onClick={()=>activateTool('text')} title="Text (T)" style={tbtn(tool==='text')}><TextIcon/></button>
            {/* Frame */}
            <button onClick={()=>{}} title="Rahmen" style={tbtn(false)}><FrameIcon/></button>
            {/* Table */}
            <button onClick={()=>{}} title="Tabelle" style={tbtn(false)}><TableIcon/></button>
            {/* Bubble */}
            <button onClick={()=>{}} title="Sprechblase" style={tbtn(false)}><BubbleIcon/></button>
            {/* Components */}
            <button onClick={()=>{}} title="Elemente" style={tbtn(false)}><ComponentIcon/></button>

            <div style={{ width:1, height:28, background:'#e2e8f0', margin:'0 4px' }}/>

            {/* Plus / addons */}
            <button onClick={()=>setShowAddons(v=>!v)} title="Einfügen"
              style={tbtn(showAddons,{ background:showAddons?'#6366f1':'transparent', color:showAddons?'white':'#475569', borderRadius:10 })}>
              <PlusIcon/>
            </button>
          </div>
        </div>

        {/* ─── Zoom controls ─────────────────────────────── */}
        <div style={{ position:'absolute', bottom:20, right:16, zIndex:40, display:'flex', flexDirection:'column', gap:4 }}>
          <button onClick={()=>setZoom(z=>Math.min(4,z+0.15))}
            style={{ width:34, height:34, borderRadius:8, border:'1px solid rgba(15,23,42,0.1)', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', boxShadow:'0 2px 8px rgba(15,23,42,0.07)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
          </button>
          <div onClick={()=>{setPan({x:80,y:60});setZoom(1);}}
            style={{ background:'white', border:'1px solid rgba(15,23,42,0.1)', borderRadius:7, textAlign:'center', fontSize:10.5, fontWeight:700, color:'#64748b', padding:'4px 0', boxShadow:'0 2px 6px rgba(15,23,42,0.06)', cursor:'pointer' }}>
            {Math.round(zoom*100)}%
          </div>
          <button onClick={()=>setZoom(z=>Math.max(0.1,z-0.15))}
            style={{ width:34, height:34, borderRadius:8, border:'1px solid rgba(15,23,42,0.1)', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', boxShadow:'0 2px 8px rgba(15,23,42,0.07)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7h10"/></svg>
          </button>
        </div>

        {/* ─── Addons panel ──────────────────────────────── */}
        {showAddons && (
          <div style={{ position:'absolute', bottom:80, right:16, zIndex:50, width:300, background:'white', borderRadius:18, boxShadow:'0 12px 40px rgba(15,23,42,0.18)', border:'1px solid rgba(15,23,42,0.07)', overflow:'hidden' }}>
            <div style={{ padding:'13px 14px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'Instrument Sans', fontSize:14, fontWeight:700, color:'#0f172a' }}>Einfügen</span>
              <button onClick={()=>setShowAddons(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:3, display:'flex' }}><CloseIcon/></button>
            </div>
            <div style={{ display:'flex', gap:0, padding:'8px 12px 0', borderBottom:'1px solid #f1f5f9' }}>
              {['vorlagen','ideen','formen'].map(tab=>(
                <button key={tab} onClick={()=>setAddonTab(tab)}
                  style={{ padding:'5px 10px', fontSize:12, fontWeight:500, border:'none', borderRadius:'6px 6px 0 0', cursor:'pointer', fontFamily:'inherit',
                    background:addonTab===tab?'#f8fafc':'transparent', color:addonTab===tab?'#0f172a':'#64748b',
                    borderBottom:addonTab===tab?'2px solid #6366f1':'2px solid transparent' }}>
                  {tab==='vorlagen'?'Vorlagen':tab==='ideen'?'Ideen':'Formen'}
                </button>
              ))}
            </div>
            <div style={{ padding:12, maxHeight:300, overflowY:'auto' }}>
              {addonTab==='vorlagen' && (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {[
                    {id:'mindmap',label:'Mindmap',desc:'Thema + 4 Äste',icon:'🧠'},
                    {id:'brainstorm',label:'Brainstorm',desc:'5 Notizzettel im Kreis',icon:'💡'},
                    {id:'todo',label:'To-do Liste',desc:'4 Aufgaben mit Checkbox',icon:'✅'},
                    {id:'timeline',label:'Timeline',desc:'Pfeil + 4 Phasen',icon:'📅'},
                  ].map(tpl=>(
                    <button key={tpl.id} onClick={()=>insertTemplate(tpl.id)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 11px', border:'1px solid #e2e8f0', borderRadius:10, background:'white', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'border-color 0.12s' }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='#a5b4fc'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='#e2e8f0'}>
                      <div style={{ width:40, height:40, borderRadius:9, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{tpl.icon}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{tpl.label}</div>
                        <div style={{ fontSize:11.5, color:'#64748b', marginTop:1 }}>{tpl.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {addonTab==='ideen' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                  {STICKY_COLORS.map((sc,i)=>(
                    <button key={i} onClick={()=>{
                      const cv = canvasRef.current;
                      const cx = ((cv?.offsetWidth||600)/2-panR.current.x)/zoomR.current + i*20;
                      const cy = ((cv?.offsetHeight||400)/2-panR.current.y)/zoomR.current;
                      setStickies(p=>[...p,{id:Date.now()+'_'+i,x:cx,y:cy,content:'Neue Idee',...sc}]);
                      setShowAddons(false);
                    }} style={{ padding:'14px 0', borderRadius:10, border:`1.5px solid ${sc.border}`, background:sc.bg, cursor:'pointer', fontFamily:"'Caveat',cursive", fontSize:16, color:'#1e293b', textAlign:'center' }}>
                      Notizzettel
                    </button>
                  ))}
                </div>
              )}
              {addonTab==='formen' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7 }}>
                  {[{id:'rect',label:'Rechteck',ch:'▭'},{id:'circle',label:'Kreis',ch:'○'},{id:'arrow',label:'Pfeil',ch:'→'}].map(sh=>(
                    <button key={sh.id} onClick={()=>{activateTool(sh.id);setShowAddons(false);}}
                      style={{ padding:'14px 8px', borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                      <span style={{ fontSize:22 }}>{sh.ch}</span>
                      <span style={{ fontSize:11, color:'#64748b' }}>{sh.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Whiteboard/>);
