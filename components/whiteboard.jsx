// StudyFlow — Whiteboard (Miro-style)
const { useEffect, useMemo, useRef, useState, useCallback } = React;
const WB_MIME = 'application/studyflow-whiteboard+json';

// ─── Palette & constants ───────────────────────────────────
const PALETTE = ['#1e293b','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#ffffff'];
const STICKY_COLORS = [{bg:'#fef08a',border:'#eab308'},{bg:'#fbcfe8',border:'#ec4899'},{bg:'#bbf7d0',border:'#22c55e'},{bg:'#bfdbfe',border:'#3b82f6'},{bg:'#e9d5ff',border:'#8b5cf6'}];
const FONTS = [{id:'caveat',name:'Handschrift',css:"'Caveat', cursive"},{id:'inter',name:'Normal',css:'inherit'}];

// ─── Inline tool icons ─────────────────────────────────────
const TIcon = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const TIcons = {
  Select:   () => <TIcon><path d="M5 3l14 9-8 2-3 7z" fill="currentColor" strokeWidth="1.4"/></TIcon>,
  Pan:      () => <TIcon><path d="M18 11V8a2 2 0 00-4 0v1M14 9V7a2 2 0 00-4 0v4M10 11V8a2 2 0 00-4 0v6l-1.5-1.5A1.5 1.5 0 002 14.5L5 19a5 5 0 005 3h3a5 5 0 005-5v-4a2 2 0 00-4 0"/></TIcon>,
  Ballpoint:() => <TIcon><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5l-5 1.5 1.5-5z"/></TIcon>,
  Marker:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 20h4L19 9a3 3 0 00-4-4L4 16z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 20l2-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  Highlight:() => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.9"/><path d="M8 8V5m4 3V4m4 4V5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  EraserObj:() => <TIcon><path d="M20 20H7L3 16l11-11 7 7-1 8z"/><path d="M6.5 17.5l4-4"/></TIcon>,
  EraserPx: () => <TIcon><path d="M3 6h18M8 6V4m8 2V4M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></TIcon>,
  Rect:     () => <TIcon><rect x="3" y="5" width="18" height="14" rx="2"/></TIcon>,
  Circle:   () => <TIcon><circle cx="12" cy="12" r="9"/></TIcon>,
  Arrow:    () => <TIcon><path d="M5 12h14M13 5l7 7-7 7"/></TIcon>,
  TextT:    () => <TIcon><path d="M4 6h16M12 6v13M8 19h8"/></TIcon>,
  Sticky:   () => <TIcon><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v12l-5 5H4a1 1 0 01-1-1z"/><path d="M15 20v-5h5"/></TIcon>,
  Undo:     () => <TIcon><path d="M3 7h10a5 5 0 010 10H7"/><path d="M3 7l4-4M3 7l4 4"/></TIcon>,
  ZoomIn:   () => <TIcon><circle cx="11" cy="11" r="7"/><path d="M8 11h6M11 8v6M21 21l-3.5-3.5"/></TIcon>,
  ZoomOut:  () => <TIcon><circle cx="11" cy="11" r="7"/><path d="M8 11h6M21 21l-3.5-3.5"/></TIcon>,
  Plus:     () => <TIcon><path d="M12 5v14M5 12h14"/></TIcon>,
  Save:     () => <TIcon><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></TIcon>,
  Back:     () => <TIcon><path d="M19 12H5M11 19l-7-7 7-7"/></TIcon>,
  Close:    () => <TIcon><path d="M6 6l12 12M18 6l-12 12"/></TIcon>,
};

// ─── Helpers ───────────────────────────────────────────────
function screenToWorld(sx, sy, pan, zoom) {
  return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
}
function worldToScreen(wx, wy, pan, zoom) {
  return { x: wx * zoom + pan.x, y: wy * zoom + pan.y };
}
function pointOnStroke(stroke, wx, wy, threshold) {
  const r = threshold + stroke.width * 0.5;
  for (const pt of stroke.points) {
    if (Math.hypot(pt.x - wx, pt.y - wy) < r) return true;
  }
  return false;
}

// ─── Canvas drawing ────────────────────────────────────────
function redrawCanvas(ctx, strokes, shapes, pan, zoom) {
  const { width: W, height: H } = ctx.canvas;
  ctx.clearRect(0, 0, W, H);
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  // Draw strokes
  strokes.forEach(s => {
    const pts = s.points;
    if (!pts || pts.length === 0) return;
    ctx.save();
    ctx.globalAlpha = s.alpha ?? 1;
    ctx.globalCompositeOperation = s.tool === 'eraser_px' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.color || '#1e293b';
    ctx.fillStyle = s.color || '#1e293b';
    ctx.lineWidth = s.width || 3;
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
  });

  // Draw shapes
  shapes.forEach(sh => {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = sh.color;
    ctx.lineWidth = sh.width || 2.5;
    ctx.lineCap = 'round';
    ctx.fillStyle = sh.fill || 'transparent';
    ctx.beginPath();
    if (sh.type === 'rect') {
      const [x, y, w, h] = [Math.min(sh.x1, sh.x2), Math.min(sh.y1, sh.y2), Math.abs(sh.x2 - sh.x1), Math.abs(sh.y2 - sh.y1)];
      ctx.roundRect ? ctx.roundRect(x, y, w, h, 4) : ctx.rect(x, y, w, h);
    } else if (sh.type === 'circle') {
      const cx = (sh.x1 + sh.x2) / 2, cy = (sh.y1 + sh.y2) / 2;
      const rx = Math.abs(sh.x2 - sh.x1) / 2, ry = Math.abs(sh.y2 - sh.y1) / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    } else if (sh.type === 'arrow') {
      ctx.moveTo(sh.x1, sh.y1);
      ctx.lineTo(sh.x2, sh.y2);
      const ang = Math.atan2(sh.y2 - sh.y1, sh.x2 - sh.x1);
      const al = 12;
      ctx.moveTo(sh.x2 - al * Math.cos(ang - 0.5), sh.y2 - al * Math.sin(ang - 0.5));
      ctx.lineTo(sh.x2, sh.y2);
      ctx.lineTo(sh.x2 - al * Math.cos(ang + 0.5), sh.y2 - al * Math.sin(ang + 0.5));
    }
    ctx.stroke();
    if (sh.fill && sh.fill !== 'transparent') ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}

// ─── Whiteboard ────────────────────────────────────────────
const Whiteboard = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [title, setTitle] = useState('Neues Whiteboard');
  const [editingTitle, setEditingTitle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Canvas content
  const [strokes, setStrokes] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [texts, setTexts] = useState([]); // {id,x,y,content,font,size,color}
  const [stickies, setStickies] = useState([]); // {id,x,y,content,color}
  const [history, setHistory] = useState([]); // snapshots for undo

  // Viewport
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Tool
  const [tool, setTool] = useState('ballpoint');
  const [color, setColor] = useState('#1e293b');
  const [brushSize, setBrushSize] = useState(3);
  const [textFont, setTextFont] = useState('caveat');
  const [textSize, setTextSize] = useState(24);
  const [activeTextId, setActiveTextId] = useState(null);
  const [activeStickyId, setActiveStickyId] = useState(null);

  // UI
  const [subMenu, setSubMenu] = useState(null); // 'draw'|'eraser'|'shape'|null
  const [showAddons, setShowAddons] = useState(false);
  const [addonTab, setAddonTab] = useState('vorlagen');
  const [hoveredStroke, setHoveredStroke] = useState(null);

  // Refs
  const canvasRef = useRef(null);
  const drawRef = useRef({ active: false, stroke: null });
  const panRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const shapeRef = useRef({ active: false, x1: 0, y1: 0 });
  const inProgressShape = useRef(null);
  const strokesRef = useRef(strokes);
  const shapesRef = useRef(shapes);
  strokesRef.current = strokes;
  shapesRef.current = shapes;
  const panRef2 = useRef(pan);
  const zoomRef = useRef(zoom);
  panRef2.current = pan; zoomRef.current = zoom;
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const brushRef = useRef(brushSize);
  toolRef.current = tool; colorRef.current = color; brushRef.current = brushSize;

  // Derived
  const isDrawTool = ['ballpoint','marker','highlighter'].includes(tool);
  const isEraserTool = ['eraser_obj','eraser_px'].includes(tool);
  const isShapeTool = ['rect','circle','arrow'].includes(tool);
  const toolGroup = isDrawTool ? 'draw' : isEraserTool ? 'eraser' : isShapeTool ? 'shape' : tool;

  // ─── Load ───────────────────────────────────────────────
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

  // ─── Canvas redraw ──────────────────────────────────────
  const scheduleRedraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    redrawCanvas(ctx, strokesRef.current, shapesRef.current, panRef2.current, zoomRef.current);
  }, []);

  useEffect(() => { scheduleRedraw(); }, [strokes, shapes, pan, zoom]);

  // ─── Canvas resize ──────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      scheduleRedraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [loading, scheduleRedraw]);

  // ─── Keyboard shortcuts ──────────────────────────────────
  useEffect(() => {
    const kd = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); return; }
      const map = { v:'select', h:'pan', p:'ballpoint', m:'marker', l:'highlighter', e:'eraser_obj', t:'text', n:'sticky', r:'rect', c:'circle' };
      if (map[e.key.toLowerCase()]) {
        const t = map[e.key.toLowerCase()];
        setTool(t);
        setSubMenu(['ballpoint','marker','highlighter'].includes(t) ? 'draw' : ['eraser_obj','eraser_px'].includes(t) ? 'eraser' : ['rect','circle','arrow'].includes(t) ? 'shape' : null);
      }
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(3, z + 0.1));
      if (e.key === '-') setZoom(z => Math.max(0.2, z - 0.1));
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, []);

  // ─── Pointer events ──────────────────────────────────────
  const getWorld = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return {x:0,y:0};
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    return screenToWorld(sx, sy, panRef2.current, zoomRef.current);
  }, []);

  const saveSnapshot = useCallback(() => {
    setHistory(h => [...h.slice(-30), { strokes: strokesRef.current, shapes: shapesRef.current, texts: texts, stickies: stickies }]);
  }, [texts, stickies]);

  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setStrokes(prev.strokes || []);
      setShapes(prev.shapes || []);
      setTexts(prev.texts || []);
      setStickies(prev.stickies || []);
      return h.slice(0, -1);
    });
  }, []);

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    canvasRef.current?.setPointerCapture?.(e.pointerId);
    const w = getWorld(e);
    const t = toolRef.current;

    // Pan tool or middle button
    if (t === 'pan' || e.button === 1 || (e.altKey)) {
      panRef.current = { active: true, startX: e.clientX, startY: e.clientY, panX: panRef2.current.x, panY: panRef2.current.y };
      return;
    }

    // Text tool
    if (t === 'text') {
      const id = Date.now().toString();
      setActiveTextId(id);
      setTexts(prev => [...prev, { id, x: w.x, y: w.y, content: '', font: textFont, size: textSize, color: colorRef.current }]);
      return;
    }

    // Sticky note
    if (t === 'sticky') {
      const id = Date.now().toString();
      const sc = STICKY_COLORS[stickies.length % STICKY_COLORS.length];
      setActiveStickyId(id);
      setStickies(prev => [...prev, { id, x: w.x, y: w.y, content: '', ...sc }]);
      return;
    }

    // Object eraser
    if (t === 'eraser_obj') {
      saveSnapshot();
      const idx = strokesRef.current.findLastIndex(s => pointOnStroke(s, w.x, w.y, 16 / zoomRef.current));
      if (idx !== -1) setStrokes(prev => prev.filter((_, i) => i !== idx));
      return;
    }

    // Shape tools
    if (['rect','circle','arrow'].includes(t)) {
      saveSnapshot();
      shapeRef.current = { active: true, x1: w.x, y1: w.y };
      return;
    }

    // Draw tools (ballpoint, marker, highlighter, eraser_px)
    if (['ballpoint','marker','highlighter','eraser_px'].includes(t)) {
      saveSnapshot();
      const cfg = {
        ballpoint: { width: brushRef.current, alpha: 1, color: colorRef.current },
        marker:    { width: brushRef.current * 3.5, alpha: 1, color: colorRef.current },
        highlighter:{ width: brushRef.current * 8, alpha: 0.32, color: colorRef.current },
        eraser_px: { width: brushRef.current * 5, alpha: 1, color: '#000' },
      }[t];
      const newStroke = { id: Date.now().toString(), tool: t, ...cfg, points: [w] };
      drawRef.current = { active: true, stroke: newStroke };
      setStrokes(prev => [...prev, newStroke]);
    }
  }, [getWorld, saveSnapshot, textFont, textSize, stickies]);

  const onPointerMove = useCallback((e) => {
    const w = getWorld(e);

    // Panning
    if (panRef.current.active) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setPan({ x: panRef.current.panX + dx, y: panRef.current.panY + dy });
      return;
    }

    // Object eraser hover
    if (toolRef.current === 'eraser_obj') {
      const idx = strokesRef.current.findLastIndex(s => pointOnStroke(s, w.x, w.y, 14 / zoomRef.current));
      setHoveredStroke(idx >= 0 ? strokesRef.current[idx]?.id : null);
    }

    // Shape in progress
    if (shapeRef.current.active) {
      const { x1, y1 } = shapeRef.current;
      inProgressShape.current = { type: toolRef.current, x1, y1, x2: w.x, y2: w.y, color: colorRef.current, width: brushRef.current };
      scheduleRedraw();
      return;
    }

    // Drawing
    if (!drawRef.current.active) return;
    drawRef.current.stroke.points.push(w);
    setStrokes(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = { ...drawRef.current.stroke, points: [...drawRef.current.stroke.points] };
      return updated;
    });
  }, [getWorld, scheduleRedraw]);

  const onPointerUp = useCallback((e) => {
    panRef.current.active = false;

    if (shapeRef.current.active) {
      const w = getWorld(e);
      const { x1, y1 } = shapeRef.current;
      if (Math.hypot(w.x - x1, w.y - y1) > 4) {
        const newShape = { id: Date.now().toString(), type: toolRef.current, x1, y1, x2: w.x, y2: w.y, color: colorRef.current, width: brushRef.current };
        setShapes(prev => [...prev, newShape]);
      }
      shapeRef.current.active = false;
      inProgressShape.current = null;
      return;
    }

    if (drawRef.current.active) {
      drawRef.current.active = false;
    }
  }, [getWorld]);

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1.08 : 0.93;
    setZoom(z => {
      const nz = Math.min(3, Math.max(0.15, z * delta));
      setPan(p => ({
        x: cx - (cx - p.x) * (nz / z),
        y: cy - (cy - p.y) * (nz / z),
      }));
      return nz;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ─── Save ────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = { type: 'studyflow_whiteboard', title, strokes, shapes, texts, stickies, updated_at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(payload)], { type: WB_MIME });
      const safe = title.replace(/[^a-zA-Z0-9._-]/g, '_');
      let path = (docRow?.file_path && docRow.file_path !== '') ? docRow.file_path : `${user.id}/${Date.now()}_${safe}.whiteboard.json`;
      await window.sb.storage.from('documents').upload(path, blob, { contentType: WB_MIME, upsert: true });
      const update = { name: title, file_path: path, file_size: blob.size, mime_type: WB_MIME };
      if (docRow?.id) {
        const { data } = await window.sb.from('documents').update(update).eq('id', docRow.id).select().single();
        if (data) setDocRow(data);
      } else {
        const { data } = await window.sb.from('documents').insert({ owner_id: user.id, doc_type: 'whiteboard', ...update }).select().single();
        if (data) {
          setDocRow(data);
          const url = new URL(window.location.href); url.searchParams.set('id', data.id); window.history.replaceState({}, '', url.toString());
        }
      }
      setSavedAt(new Date());
    } catch (e) { alert(e.message); }
    setSaving(false);
  }, [user, docRow, title, strokes, shapes, texts, stickies]);

  // ─── Tool helpers ────────────────────────────────────────
  const selectTool = (t) => {
    setTool(t);
    setActiveTextId(null); setActiveStickyId(null);
    const g = ['ballpoint','marker','highlighter'].includes(t) ? 'draw' : ['eraser_obj','eraser_px'].includes(t) ? 'eraser' : ['rect','circle','arrow'].includes(t) ? 'shape' : null;
    setSubMenu(g);
    setShowAddons(false);
  };

  const deleteText = (id) => setTexts(prev => prev.filter(t => t.id !== id));
  const deleteSticky = (id) => setStickies(prev => prev.filter(s => s.id !== id));

  // ─── Cursor ──────────────────────────────────────────────
  const getCursor = () => {
    if (tool === 'pan') return 'grab';
    if (tool === 'select') return 'default';
    if (isEraserTool) return hoveredStroke ? 'pointer' : 'crosshair';
    if (tool === 'text') return 'text';
    return 'crosshair';
  };

  // ─── Addons templates ────────────────────────────────────
  const insertTemplate = (tpl) => {
    const cx = (canvasRef.current?.offsetWidth / 2 - pan.x) / zoom;
    const cy = (canvasRef.current?.offsetHeight / 2 - pan.y) / zoom;
    if (tpl === 'mindmap') {
      const id = Date.now();
      setTexts(prev => [...prev,
        { id: id+'_c', x: cx, y: cy, content: 'Hauptthema', font: 'caveat', size: 28, color: '#6366f1' },
        { id: id+'_1', x: cx - 160, y: cy - 80, content: 'Idee 1', font: 'caveat', size: 20, color: '#0f172a' },
        { id: id+'_2', x: cx + 140, y: cy - 80, content: 'Idee 2', font: 'caveat', size: 20, color: '#0f172a' },
        { id: id+'_3', x: cx - 160, y: cy + 80, content: 'Idee 3', font: 'caveat', size: 20, color: '#0f172a' },
        { id: id+'_4', x: cx + 140, y: cy + 80, content: 'Idee 4', font: 'caveat', size: 20, color: '#0f172a' },
      ]);
    } else if (tpl === 'brainstorm') {
      const colors = STICKY_COLORS;
      const id = Date.now();
      ['Idee A','Idee B','Idee C','Idee D','Idee E'].forEach((label, i) => {
        const angle = (i / 5) * Math.PI * 2;
        setStickies(prev => [...prev, { id: id+'_'+i, x: cx + Math.cos(angle)*130, y: cy + Math.sin(angle)*100, content: label, ...colors[i] }]);
      });
    } else if (tpl === 'todo') {
      const id = Date.now();
      setTexts(prev => [...prev,
        { id: id+'_h', x: cx - 100, y: cy - 80, content: '☐ Aufgabe 1', font: 'caveat', size: 22, color: '#0f172a' },
        { id: id+'_2', x: cx - 100, y: cy - 40, content: '☐ Aufgabe 2', font: 'caveat', size: 22, color: '#0f172a' },
        { id: id+'_3', x: cx - 100, y: cy, content: '☐ Aufgabe 3', font: 'caveat', size: 22, color: '#0f172a' },
      ]);
    } else if (tpl === 'timeline') {
      const id = Date.now();
      setShapes(prev => [...prev, { id: id+'_l', type: 'arrow', x1: cx-200, y1: cy, x2: cx+200, y2: cy, color: '#6366f1', width: 2.5 }]);
      [-150,-50,50,150].forEach((dx, i) => {
        setTexts(prev => [...prev, { id: id+'_'+i, x: cx+dx, y: cy-40, content: `Phase ${i+1}`, font: 'caveat', size: 18, color: '#0f172a' }]);
        setShapes(prev => [...prev, { id: id+'_d'+i, type: 'circle', x1: cx+dx-8, y1: cy-8, x2: cx+dx+8, y2: cy+8, color: '#6366f1', fill: '#6366f1', width: 0 }]);
      });
    }
    setShowAddons(false);
  };

  // ─── Toolbar config ──────────────────────────────────────
  const mainTools = [
    { id: 'select', label: 'Auswahl (V)', icon: <TIcons.Select/> },
    { id: 'pan', label: 'Bewegen (H)', icon: <TIcons.Pan/> },
    { id: 'draw', label: 'Zeichnen (P)', icon: tool === 'marker' ? <TIcons.Marker/> : tool === 'highlighter' ? <TIcons.Highlight/> : <TIcons.Ballpoint/> },
    { id: 'eraser', label: 'Radierer (E)', icon: tool === 'eraser_px' ? <TIcons.EraserPx/> : <TIcons.EraserObj/> },
    { id: 'shape', label: 'Formen', icon: tool === 'circle' ? <TIcons.Circle/> : tool === 'arrow' ? <TIcons.Arrow/> : <TIcons.Rect/> },
    { id: 'text', label: 'Text (T)', icon: <TIcons.TextT/> },
    { id: 'sticky', label: 'Notizzettel (N)', icon: <TIcons.Sticky/> },
  ];

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f6' }}>
      <div style={{ fontFamily: 'Caveat', fontSize: 26, color: '#94a3b8' }}>Lädt…</div>
    </div>
  );

  const toolBtnStyle = (active) => ({
    width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? '#ede9fe' : 'transparent',
    color: active ? '#6366f1' : '#475569',
    transition: 'background 0.12s, color 0.12s',
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8f8f6',
      backgroundImage: 'radial-gradient(circle, #d1d5db 1.2px, transparent 1.2px)',
      backgroundSize: '22px 22px',
    }}>

      {/* ─── Top Bar ───────────────────────────────────────── */}
      <div style={{ height: 50, flexShrink: 0, background: 'white', borderBottom: '1px solid rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, zIndex: 30, boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        <a href="dashboard.html?tab=docs" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
          <Icons.Logo size={28}/>
        </a>
        <div style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }}/>
        {editingTitle ? (
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
            style={{ fontFamily: 'Instrument Sans', fontSize: 14, fontWeight: 600, color: '#0f172a', border: 'none', outline: 'none', background: '#f1f5f9', borderRadius: 6, padding: '3px 8px', minWidth: 140 }}/>
        ) : (
          <div onClick={() => setEditingTitle(true)} style={{ fontFamily: 'Instrument Sans', fontSize: 14, fontWeight: 600, color: '#0f172a', cursor: 'text', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
            {title}
          </div>
        )}
        {savedAt && <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>· gespeichert {savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
        <div style={{ flex: 1 }}/>
        <button onClick={undo} title="Rückgängig (Strg+Z)" style={{ ...toolBtnStyle(false), width: 34, height: 34 }}>
          <TIcons.Undo/>
        </button>
        <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          <TIcons.Save/> {saving ? 'Speichert…' : 'Speichern'}
        </button>
      </div>

      {/* ─── Canvas workspace ──────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Canvas */}
        <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: getCursor() }}/>

        {/* HTML overlay for texts & stickies */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {texts.map(t => {
            const sp = worldToScreen(t.x, t.y, pan, zoom);
            const isActive = activeTextId === t.id;
            return (
              <div key={t.id} style={{ position: 'absolute', left: sp.x, top: sp.y, pointerEvents: 'all', transform: 'translate(-2px, -2px)', zIndex: isActive ? 20 : 10 }}>
                <div
                  contentEditable={isActive}
                  suppressContentEditableWarning
                  onFocus={() => setActiveTextId(t.id)}
                  onBlur={(e) => {
                    const content = e.currentTarget.innerText.trim();
                    if (!content) { deleteText(t.id); setActiveTextId(null); return; }
                    setTexts(prev => prev.map(tx => tx.id === t.id ? { ...tx, content } : tx));
                    setActiveTextId(null);
                  }}
                  onPointerDown={e => { e.stopPropagation(); setActiveTextId(t.id); }}
                  style={{
                    minWidth: 60, minHeight: t.size * zoom * 1.3,
                    fontFamily: t.font === 'caveat' ? "'Caveat', cursive" : 'inherit',
                    fontSize: t.size * zoom,
                    color: t.color,
                    outline: isActive ? '1.5px dashed #6366f1' : 'none',
                    borderRadius: 4,
                    padding: '2px 4px',
                    background: isActive ? 'rgba(255,255,255,0.85)' : 'transparent',
                    cursor: isActive ? 'text' : 'pointer',
                    whiteSpace: 'pre',
                    userSelect: isActive ? 'text' : 'none',
                    lineHeight: 1.25,
                  }}
                  dangerouslySetInnerHTML={isActive ? undefined : { __html: t.content || '<span style="opacity:0.3;font-family:inherit">Text…</span>' }}
                />
                {isActive && (
                  <div style={{ position: 'absolute', top: -28, left: 0, display: 'flex', gap: 4, background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 5px', boxShadow: '0 2px 8px rgba(15,23,42,0.12)' }}>
                    {FONTS.map(f => (
                      <button key={f.id} onClick={() => setTexts(prev => prev.map(tx => tx.id === t.id ? { ...tx, font: f.id } : tx))}
                        style={{ fontSize: 11, fontFamily: f.css, padding: '2px 6px', border: 'none', borderRadius: 4, cursor: 'pointer', background: t.font === f.id ? '#eef2ff' : 'transparent', color: t.font === f.id ? '#6366f1' : '#64748b' }}>
                        {f.name}
                      </button>
                    ))}
                    <div style={{ width: 1, background: '#e2e8f0', margin: '2px 0' }}/>
                    {[16,20,24,32,40].map(s => (
                      <button key={s} onClick={() => setTexts(prev => prev.map(tx => tx.id === t.id ? { ...tx, size: s } : tx))}
                        style={{ fontSize: 10, padding: '2px 5px', border: 'none', borderRadius: 4, cursor: 'pointer', background: t.size === s ? '#eef2ff' : 'transparent', color: '#64748b' }}>
                        {s}
                      </button>
                    ))}
                    <div style={{ width: 1, background: '#e2e8f0', margin: '2px 0' }}/>
                    {PALETTE.slice(0,5).map(c => (
                      <button key={c} onClick={() => setTexts(prev => prev.map(tx => tx.id === t.id ? { ...tx, color: c } : tx))}
                        style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: c === '#ffffff' ? '1px solid #e2e8f0' : 'none', cursor: 'pointer' }}/>
                    ))}
                    <div style={{ width: 1, background: '#e2e8f0', margin: '2px 0' }}/>
                    <button onClick={() => { deleteText(t.id); setActiveTextId(null); }} style={{ fontSize: 11, padding: '2px 5px', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#ef4444', background: 'transparent' }}>✕</button>
                  </div>
                )}
              </div>
            );
          })}

          {stickies.map(s => {
            const sp = worldToScreen(s.x, s.y, pan, zoom);
            const isActive = activeStickyId === s.id;
            const noteW = 160 * zoom, noteH = 140 * zoom;
            return (
              <div key={s.id} onPointerDown={e => { e.stopPropagation(); setActiveStickyId(s.id); }}
                style={{ position: 'absolute', left: sp.x, top: sp.y, width: noteW, height: noteH, pointerEvents: 'all', zIndex: isActive ? 20 : 10,
                  background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 4,
                  boxShadow: isActive ? `0 0 0 2px #6366f1, 0 8px 24px rgba(0,0,0,0.15)` : '0 4px 16px rgba(0,0,0,0.1)',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                <div style={{ height: noteH * 0.15, background: s.border, opacity: 0.35, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {STICKY_COLORS.map((c, i) => (
                      <button key={i} onClick={() => setStickies(prev => prev.map(st => st.id === s.id ? { ...st, ...c } : st))}
                        style={{ width: 9, height: 9, borderRadius: '50%', background: c.bg, border: `1.5px solid ${c.border}`, cursor: 'pointer', flexShrink: 0, padding: 0 }}/>
                    ))}
                  </div>
                  <button onClick={() => deleteSticky(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#475569', padding: 0, lineHeight: 1 }}>✕</button>
                </div>
                <textarea
                  placeholder="Notiz…"
                  value={s.content}
                  onChange={e => setStickies(prev => prev.map(st => st.id === s.id ? { ...st, content: e.target.value } : st))}
                  style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', fontFamily: "'Caveat', cursive", fontSize: 15 * zoom, color: '#1e293b', padding: '6px 8px', outline: 'none', cursor: 'text' }}
                />
              </div>
            );
          })}
        </div>

        {/* ─── Bottom Toolbar ──────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

          {/* Sub-menus */}
          {subMenu === 'draw' && (
            <div style={{ background: 'white', borderRadius: 16, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px rgba(15,23,42,0.14)', border: '1px solid rgba(15,23,42,0.06)' }}>
              {[
                { id: 'ballpoint', label: 'Kugelschreiber', icon: <TIcons.Ballpoint/> },
                { id: 'marker', label: 'Marker', icon: <TIcons.Marker/> },
                { id: 'highlighter', label: 'Textmarker', icon: <TIcons.Highlight/> },
              ].map(dt => (
                <button key={dt.id} onClick={() => selectTool(dt.id)} title={dt.label}
                  style={{ ...toolBtnStyle(tool === dt.id), width: 44, height: 44, borderRadius: 12, background: tool === dt.id ? '#ede9fe' : '#f8fafc' }}>
                  {dt.icon}
                </button>
              ))}
              <div style={{ width: 1, height: 32, background: '#e2e8f0' }}/>
              {PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: color === c ? '2.5px solid #6366f1' : c === '#ffffff' ? '1.5px solid #cbd5e1' : '2px solid transparent', cursor: 'pointer', transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s' }}/>
              ))}
              <div style={{ width: 1, height: 32, background: '#e2e8f0' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="range" min={1} max={14} value={brushSize} onChange={e => setBrushSize(+e.target.value)}
                  style={{ width: 70, accentColor: '#6366f1' }}/>
                <span style={{ fontSize: 11, color: '#64748b', minWidth: 26 }}>{brushSize}px</span>
              </div>
            </div>
          )}

          {subMenu === 'eraser' && (
            <div style={{ background: 'white', borderRadius: 16, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 24px rgba(15,23,42,0.14)', border: '1px solid rgba(15,23,42,0.06)' }}>
              {[
                { id: 'eraser_obj', label: 'Objekte löschen', icon: <TIcons.EraserObj/> },
                { id: 'eraser_px', label: 'Pixel löschen', icon: <TIcons.EraserPx/> },
              ].map(et => (
                <button key={et.id} onClick={() => selectTool(et.id)} title={et.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
                    background: tool === et.id ? '#ede9fe' : '#f8fafc', color: tool === et.id ? '#6366f1' : '#475569' }}>
                  {et.icon} {et.label}
                </button>
              ))}
              <div style={{ width: 1, height: 32, background: '#e2e8f0' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="range" min={1} max={14} value={brushSize} onChange={e => setBrushSize(+e.target.value)} style={{ width: 64, accentColor: '#6366f1' }}/>
              </div>
            </div>
          )}

          {subMenu === 'shape' && (
            <div style={{ background: 'white', borderRadius: 16, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 24px rgba(15,23,42,0.14)', border: '1px solid rgba(15,23,42,0.06)' }}>
              {[
                { id: 'rect', label: 'Rechteck', icon: <TIcons.Rect/> },
                { id: 'circle', label: 'Ellipse', icon: <TIcons.Circle/> },
                { id: 'arrow', label: 'Pfeil', icon: <TIcons.Arrow/> },
              ].map(sh => (
                <button key={sh.id} onClick={() => selectTool(sh.id)} title={sh.label}
                  style={{ ...toolBtnStyle(tool === sh.id), width: 44, height: 44, borderRadius: 12, background: tool === sh.id ? '#ede9fe' : '#f8fafc' }}>
                  {sh.icon}
                </button>
              ))}
              <div style={{ width: 1, height: 32, background: '#e2e8f0' }}/>
              {PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: color === c ? '2.5px solid #6366f1' : c === '#ffffff' ? '1.5px solid #cbd5e1' : '2px solid transparent', cursor: 'pointer', transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s' }}/>
              ))}
            </div>
          )}

          {/* Main toolbar pill */}
          <div style={{ background: 'white', borderRadius: 18, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 8px 30px rgba(15,23,42,0.16)', border: '1px solid rgba(15,23,42,0.06)' }}>
            {mainTools.map((item, i) => {
              const isGroupActive = toolGroup === item.id || tool === item.id;
              const isDrawGroup = item.id === 'draw';
              const isEraserGroup = item.id === 'eraser';
              const isShapeGroup = item.id === 'shape';
              const needsSep = i === 2;
              return (
                <React.Fragment key={item.id}>
                  {needsSep && <div style={{ width: 1, height: 28, background: '#e2e8f0', margin: '0 4px' }}/>}
                  <button onClick={() => {
                    if (isDrawGroup) { selectTool(isGroupActive && subMenu === 'draw' ? tool : 'ballpoint'); setSubMenu(s => s === 'draw' ? null : 'draw'); }
                    else if (isEraserGroup) { selectTool(isGroupActive && subMenu === 'eraser' ? tool : 'eraser_obj'); setSubMenu(s => s === 'eraser' ? null : 'eraser'); }
                    else if (isShapeGroup) { selectTool(isGroupActive && subMenu === 'shape' ? tool : 'rect'); setSubMenu(s => s === 'shape' ? null : 'shape'); }
                    else { selectTool(item.id); }
                  }} title={item.label}
                    style={{ width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isGroupActive ? '#ede9fe' : 'transparent',
                      color: isGroupActive ? '#6366f1' : '#475569',
                      transition: 'background 0.12s, color 0.12s',
                    }}>
                    {item.icon}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ─── Zoom controls (bottom right) ───────────────── */}
        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 40, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.15))}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(15,23,42,0.1)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 2px 8px rgba(15,23,42,0.08)' }}>
            <TIcons.ZoomIn/>
          </button>
          <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#64748b', padding: '4px 2px', boxShadow: '0 2px 8px rgba(15,23,42,0.06)', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => { setPan({x:0,y:0}); setZoom(1); }}>
            {Math.round(zoom * 100)}%
          </div>
          <button onClick={() => setZoom(z => Math.max(0.15, z - 0.15))}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(15,23,42,0.1)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 2px 8px rgba(15,23,42,0.08)' }}>
            <TIcons.ZoomOut/>
          </button>
        </div>

        {/* ─── Plus / Addons button (bottom right above zoom) ─ */}
        <div style={{ position: 'absolute', bottom: 148, right: 20, zIndex: 40 }}>
          <button onClick={() => setShowAddons(v => !v)}
            style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: showAddons ? '#6366f1' : 'white', color: showAddons ? 'white' : '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.25)', border: `1.5px solid ${showAddons ? '#6366f1' : '#c7d2fe'}`, transition: 'all 0.15s' }}>
            <TIcons.Plus/>
          </button>
        </div>

        {/* ─── Addons panel ───────────────────────────────── */}
        {showAddons && (
          <div style={{ position: 'absolute', bottom: 200, right: 16, zIndex: 50, width: 320, background: 'white', borderRadius: 18, boxShadow: '0 12px 40px rgba(15,23,42,0.18)', border: '1px solid rgba(15,23,42,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Instrument Sans', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Einfügen</div>
              <button onClick={() => setShowAddons(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><TIcons.Close/></button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, padding: '10px 14px 0', borderBottom: '1px solid #f1f5f9' }}>
              {['vorlagen','ideen','formen'].map(tab => (
                <button key={tab} onClick={() => setAddonTab(tab)}
                  style={{ padding: '6px 12px', fontSize: 12.5, fontWeight: 500, border: 'none', borderRadius: '7px 7px 0 0', cursor: 'pointer', fontFamily: 'inherit',
                    background: addonTab === tab ? '#f1f5f9' : 'transparent', color: addonTab === tab ? '#0f172a' : '#64748b',
                    borderBottom: addonTab === tab ? '2px solid #6366f1' : '2px solid transparent' }}>
                  {tab === 'vorlagen' ? 'Vorlagen' : tab === 'ideen' ? 'Ideen' : 'Formen'}
                </button>
              ))}
            </div>
            <div style={{ padding: 14, maxHeight: 340, overflowY: 'auto' }}>
              {addonTab === 'vorlagen' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'mindmap', label: 'Mindmap', desc: 'Zentrales Thema mit 4 Ästen', preview: '🧠' },
                    { id: 'brainstorm', label: 'Brainstorm', desc: '5 Notizzettel im Kreis', preview: '💡' },
                    { id: 'todo', label: 'To-do Liste', desc: '3 Aufgaben mit Checkbox', preview: '✅' },
                    { id: 'timeline', label: 'Timeline', desc: 'Pfeil mit 4 Phasen', preview: '📅' },
                  ].map(tpl => (
                    <button key={tpl.id} onClick={() => insertTemplate(tpl.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'border-color 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='#a5b4fc'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{tpl.preview}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{tpl.label}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>{tpl.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {addonTab === 'ideen' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {STICKY_COLORS.map((sc, i) => (
                    <button key={i} onClick={() => {
                      const cx = (canvasRef.current?.offsetWidth/2 - pan.x)/zoom;
                      const cy = (canvasRef.current?.offsetHeight/2 - pan.y)/zoom + i*30;
                      setStickies(prev => [...prev, { id: Date.now()+'_'+i, x: cx + (i%2)*20-10, y: cy, content: 'Neue Idee', ...sc }]);
                      setShowAddons(false);
                    }} style={{ padding: '14px', borderRadius: 10, border: `1.5px solid ${sc.border}`, background: sc.bg, cursor: 'pointer', fontFamily: "'Caveat', cursive", fontSize: 16, color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Notizzettel
                    </button>
                  ))}
                </div>
              )}
              {addonTab === 'formen' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { type: 'rect', label: 'Rechteck', icon: '▭' },
                    { type: 'circle', label: 'Kreis', icon: '○' },
                    { type: 'arrow', label: 'Pfeil', icon: '→' },
                  ].map(sh => (
                    <button key={sh.type} onClick={() => { selectTool(sh.type); setShowAddons(false); }}
                      style={{ padding: '16px 8px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                      <span style={{ fontSize: 24 }}>{sh.icon}</span>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>{sh.label}</span>
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
