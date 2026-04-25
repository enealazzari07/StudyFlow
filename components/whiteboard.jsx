const { useCallback, useEffect, useMemo, useRef, useState } = React;

const WB_MIME = 'application/studyflow-whiteboard+json';
const COLORS = ['#0f172a', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff'];
const STICKY_COLORS = [
  { bg: '#fef08a', border: '#ca8a04' },
  { bg: '#fecdd3', border: '#e11d48' },
  { bg: '#bbf7d0', border: '#16a34a' },
  { bg: '#bfdbfe', border: '#2563eb' },
  { bg: '#e9d5ff', border: '#7c3aed' },
];
const FONTS = [
  { id: 'caveat', label: 'Handschrift', css: "'Caveat', cursive" },
  { id: 'inter', label: 'Normal', css: 'inherit' },
];

const randomId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

function getWorldPoint(evt, canvas, pan, zoom) {
  const rect = canvas.getBoundingClientRect();
  const sx = evt.clientX - rect.left;
  const sy = evt.clientY - rect.top;
  return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
}

function toScreen(x, y, pan, zoom) {
  return { x: x * zoom + pan.x, y: y * zoom + pan.y };
}

function drawBoard(ctx, board, pan, zoom) {
  const dpr = window.devicePixelRatio || 1;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  for (const stroke of board.strokes) {
    if (!stroke.points?.length) continue;
    ctx.save();
    ctx.globalAlpha = stroke.alpha ?? 1;
    ctx.globalCompositeOperation = stroke.tool === 'eraser_px' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (stroke.points.length === 1) {
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i += 1) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const shape of board.shapes) {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.fill || 'transparent';
    ctx.lineWidth = shape.width || 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (shape.type === 'rect') {
      const x = Math.min(shape.x1, shape.x2);
      const y = Math.min(shape.y1, shape.y2);
      const w = Math.abs(shape.x2 - shape.x1);
      const h = Math.abs(shape.y2 - shape.y1);
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, 8);
      else ctx.rect(x, y, w, h);
    } else if (shape.type === 'circle') {
      ctx.ellipse((shape.x1 + shape.x2) / 2, (shape.y1 + shape.y2) / 2, Math.abs(shape.x2 - shape.x1) / 2, Math.abs(shape.y2 - shape.y1) / 2, 0, 0, Math.PI * 2);
    } else if (shape.type === 'arrow') {
      const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
      const head = 18;
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.moveTo(shape.x2 - head * Math.cos(angle - 0.45), shape.y2 - head * Math.sin(angle - 0.45));
      ctx.lineTo(shape.x2, shape.y2);
      ctx.lineTo(shape.x2 - head * Math.cos(angle + 0.45), shape.y2 - head * Math.sin(angle + 0.45));
    }
    ctx.stroke();
    if (shape.fill && shape.fill !== 'transparent') ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function findStrokeIndex(strokes, x, y, zoom) {
  for (let i = strokes.length - 1; i >= 0; i -= 1) {
    const stroke = strokes[i];
    const radius = (stroke.width || 1) * 0.75 + 12 / zoom;
    if (stroke.points?.some((pt) => Math.hypot(pt.x - x, pt.y - y) <= radius)) return i;
  }
  return -1;
}

function shapeBounds(shape) {
  return {
    left: Math.min(shape.x1, shape.x2),
    top: Math.min(shape.y1, shape.y2),
    right: Math.max(shape.x1, shape.x2),
    bottom: Math.max(shape.y1, shape.y2),
  };
}

function hitShape(shapes, x, y, zoom) {
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    const shape = shapes[i];
    const b = shapeBounds(shape);
    const pad = 12 / zoom;
    if (x >= b.left - pad && x <= b.right + pad && y >= b.top - pad && y <= b.bottom + pad) return shape;
  }
  return null;
}

const Icon = ({ children, size = 20, strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const SelectIcon = () => <Icon><path d="M4 3l14 9-6 2-2 6z" fill="currentColor" strokeWidth="1.4" /></Icon>;
const PanIcon = () => <Icon><path d="M18 11V8a2 2 0 0 0-4 0v1M14 9V7a2 2 0 0 0-4 0v4M10 11V8a2 2 0 0 0-4 0v6l-1.5-1.5A1.5 1.5 0 0 0 2 14.5L5 19a5 5 0 0 0 5 3h3a5 5 0 0 0 5-5v-4a2 2 0 0 0-4 0" /></Icon>;
const TextIcon = () => <Icon><path d="M4 6h16M12 6v13M8 19h8" /></Icon>;
const StickyIcon = () => <Icon><path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v12l-5 5H4a1 1 0 0 1-1-1z" /><path d="M15 20v-5h5" /></Icon>;
const RectIcon = () => <Icon><rect x="3" y="5" width="18" height="14" rx="2" /></Icon>;
const CircleIcon = () => <Icon><circle cx="12" cy="12" r="8.5" /></Icon>;
const ArrowIcon = () => <Icon><path d="M4 12h14" /><path d="M13 5l7 7-7 7" /></Icon>;
const FrameIcon = () => <Icon><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></Icon>;
const TableIcon = () => <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 4v16M15 4v16" /></Icon>;
const BubbleIcon = () => <Icon><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>;
const PlusIcon = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
const UndoIcon = () => <Icon><path d="M3 7h10a5 5 0 1 1 0 10H7" /><path d="M3 7l4-4M3 7l4 4" /></Icon>;
const SaveIcon = () => <Icon><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></Icon>;
const ShareIcon = () => <Icon><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>;
const CloseIcon = () => <Icon strokeWidth={2}><path d="M6 6l12 12M18 6l-12 12" /></Icon>;

const defaultBoard = () => ({
  strokes: [],
  shapes: [],
  texts: [],
  stickies: [],
  tables: [],
  frames: [],
  bubbles: [],
});

const Whiteboard = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const clientId = useMemo(() => randomId('client'), []);
  const channelName = useMemo(() => `studyflow_whiteboard_${docId || 'draft'}`, [docId]);

  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [title, setTitle] = useState('Neues Whiteboard');
  const [editingTitle, setEditingTitle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [remoteAt, setRemoteAt] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareReady, setShareReady] = useState(Boolean(docId));

  const [board, setBoard] = useState(defaultBoard);
  const [history, setHistory] = useState([]);
  const [pan, setPan] = useState({ x: 120, y: 90 });
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState('ballpoint');
  const [color, setColor] = useState('#0f172a');
  const [brushSize, setBrushSize] = useState(3);
  const [fontId, setFontId] = useState('caveat');
  const [activeSelection, setActiveSelection] = useState(null);
  const [showPenSub, setShowPenSub] = useState(true);
  const [showShapeSub, setShowShapeSub] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  const [addonTab, setAddonTab] = useState('vorlagen');
  const [collaborators, setCollaborators] = useState([]);

  const boardRef = useRef(defaultBoard());
  const panRef = useRef({ x: 120, y: 90 });
  const zoomRef = useRef(1);
  const toolRef = useRef('ballpoint');
  const colorRef = useRef('#0f172a');
  const brushRef = useRef(3);
  const channelRef = useRef(null);
  const lastUpdatedRef = useRef(null);
  const isApplyingRemoteRef = useRef(false);
  const drawRef = useRef({ active: false, stroke: null, prev: null });
  const panDragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const shapeRef = useRef({ active: false, x1: 0, y1: 0, type: null });
  const moveRef = useRef({ active: false, kind: null, id: null, startX: 0, startY: 0, origin: null });
  const canvasRef = useRef(null);
  const autosaveRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushRef.current = brushSize; }, [brushSize]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-39), clone(boardRef.current)]);
  }, []);

  const replaceBoard = useCallback((nextBoard) => {
    const normalized = {
      strokes: Array.isArray(nextBoard.strokes) ? nextBoard.strokes : [],
      shapes: Array.isArray(nextBoard.shapes) ? nextBoard.shapes : [],
      texts: Array.isArray(nextBoard.texts) ? nextBoard.texts : [],
      stickies: Array.isArray(nextBoard.stickies) ? nextBoard.stickies : [],
      tables: Array.isArray(nextBoard.tables) ? nextBoard.tables : [],
      frames: Array.isArray(nextBoard.frames) ? nextBoard.frames : [],
      bubbles: Array.isArray(nextBoard.bubbles) ? nextBoard.bubbles : [],
    };
    setBoard(normalized);
  }, []);

  const mutateBoard = useCallback((mutator) => {
    setBoard((prev) => {
      const draft = clone(prev);
      mutator(draft);
      return draft;
    });
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBoard(canvas.getContext('2d'), boardRef.current, panRef.current, zoomRef.current);
    if (shapeRef.current.active) {
      const ctx = canvas.getContext('2d');
      const preview = clone(boardRef.current);
      preview.shapes.push({
        id: 'preview',
        type: shapeRef.current.type,
        x1: shapeRef.current.x1,
        y1: shapeRef.current.y1,
        x2: shapeRef.current.x2,
        y2: shapeRef.current.y2,
        color: colorRef.current,
        width: brushRef.current,
      });
      drawBoard(ctx, preview, panRef.current, zoomRef.current);
    }
  }, []);

  useEffect(() => { redraw(); }, [board, pan, zoom, redraw]);

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
          setShareReady(true);
          if (row.file_path) {
            const { data: blob } = await window.sb.storage.from('documents').download(row.file_path);
            if (blob) {
              try {
                const payload = JSON.parse(await blob.text());
                replaceBoard(payload);
                setTitle(payload.title || row.name || 'Whiteboard');
                lastUpdatedRef.current = payload.updated_at || null;
              } catch (err) {
                console.error(err);
              }
            }
          }
        }
      }
      setLoading(false);
    })();
  }, [docId, replaceBoard]);

  useEffect(() => {
    if (loading) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
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

  const save = useCallback(async (options = {}) => {
    if (!user) return null;
    const { silent = false, ensureDoc = false } = options;
    let savedRow = null;
    setSaving(!silent);
    try {
      const payload = {
        type: 'studyflow_whiteboard',
        client_id: clientId,
        updated_by: user.email || user.id,
        updated_at: new Date().toISOString(),
        title,
        ...boardRef.current,
      };
      const blob = new Blob([JSON.stringify(payload)], { type: WB_MIME });
      const safe = title.replace(/[^a-zA-Z0-9._-]/g, '_') || 'whiteboard';
      const path = docRow?.file_path || `${user.id}/${Date.now()}_${safe}.whiteboard.json`;
      await window.sb.storage.from('documents').upload(path, blob, { contentType: WB_MIME, upsert: true });
      const updateData = { name: title, file_path: path, file_size: blob.size, mime_type: WB_MIME };
      let row = docRow;
      if (docRow?.id) {
        const { data } = await window.sb.from('documents').update(updateData).eq('id', docRow.id).select().single();
        if (data) row = data;
      } else {
        const { data } = await window.sb.from('documents').insert({ owner_id: user.id, doc_type: 'whiteboard', ...updateData }).select().single();
        if (data) {
          row = data;
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set('id', data.id);
          window.history.replaceState({}, '', nextUrl.toString());
        }
      }
      if (row) {
        setDocRow(row);
        setShareReady(true);
        savedRow = row;
      }
      lastUpdatedRef.current = payload.updated_at;
      setSavedAt(new Date());
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'snapshot', payload, user: user.email || user.id });
      }
      return savedRow;
    } catch (err) {
      if (!silent) alert(err.message);
      return null;
    } finally {
      setSaving(false);
      if (ensureDoc && savedRow) setShareOpen(true);
    }
  }, [board, clientId, docRow, title, user]);

  useEffect(() => {
    if (loading || !user) return undefined;
    if (isApplyingRemoteRef.current) {
      isApplyingRemoteRef.current = false;
      return undefined;
    }
    window.clearTimeout(autosaveRef.current);
    autosaveRef.current = window.setTimeout(() => {
      save({ silent: true });
    }, 1200);
    return () => window.clearTimeout(autosaveRef.current);
  }, [board, title, loading, save, user]);

  useEffect(() => {
    if (loading) return undefined;
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null;
    channelRef.current = bc;
    if (!bc) return undefined;
    bc.onmessage = (event) => {
      const message = event.data || {};
      if (message.type === 'hello') {
        setCollaborators((prev) => {
          const next = prev.filter((item) => item.id !== message.clientId);
          next.push({ id: message.clientId, label: message.user, seenAt: Date.now() });
          return next.slice(-8);
        });
        bc.postMessage({ type: 'presence', clientId, user: user?.email || user?.id || 'Du' });
      }
      if (message.type === 'presence' && message.clientId !== clientId) {
        setCollaborators((prev) => {
          const next = prev.filter((item) => item.id !== message.clientId);
          next.push({ id: message.clientId, label: message.user, seenAt: Date.now() });
          return next.slice(-8);
        });
      }
      if (message.type === 'snapshot' && message.payload?.client_id !== clientId) {
        const remote = message.payload;
        if (!lastUpdatedRef.current || new Date(remote.updated_at) > new Date(lastUpdatedRef.current)) {
          isApplyingRemoteRef.current = true;
          replaceBoard(remote);
          setTitle(remote.title || 'Whiteboard');
          lastUpdatedRef.current = remote.updated_at;
          setRemoteAt(new Date(remote.updated_at));
        }
      }
    };
    bc.postMessage({ type: 'hello', clientId, user: user?.email || user?.id || 'Du' });
    return () => {
      bc.close();
      channelRef.current = null;
    };
  }, [channelName, clientId, loading, replaceBoard, user]);

  useEffect(() => {
    if (!docRow?.file_path) return undefined;
    pollRef.current = window.setInterval(async () => {
      const { data: blob } = await window.sb.storage.from('documents').download(docRow.file_path);
      if (!blob) return;
      try {
        const payload = JSON.parse(await blob.text());
        if (payload.client_id === clientId) return;
        if (!lastUpdatedRef.current || new Date(payload.updated_at) > new Date(lastUpdatedRef.current)) {
          isApplyingRemoteRef.current = true;
          replaceBoard(payload);
          setTitle(payload.title || title);
          lastUpdatedRef.current = payload.updated_at;
          setRemoteAt(new Date(payload.updated_at));
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);
    return () => window.clearInterval(pollRef.current);
  }, [clientId, docRow?.file_path, replaceBoard, title]);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (!prev.length) return prev;
      const next = prev[prev.length - 1];
      replaceBoard(next);
      return prev.slice(0, -1);
    });
  }, [replaceBoard]);

  useEffect(() => {
    const onWheel = (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;
      const ratio = event.deltaY < 0 ? 1.08 : 0.92;
      setZoom((prev) => {
        const next = Math.max(0.15, Math.min(4, prev * ratio));
        setPan((old) => ({
          x: cx - (cx - old.x) * (next / prev),
          y: cy - (cy - old.y) * (next / prev),
        }));
        return next;
      });
    };
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [loading]);

  const activateTool = useCallback((nextTool) => {
    setTool(nextTool);
    setActiveSelection(null);
    const isPen = ['ballpoint', 'marker', 'highlighter', 'eraser_obj', 'eraser_px'].includes(nextTool);
    const isShape = ['rect', 'circle', 'arrow'].includes(nextTool);
    setShowPenSub(isPen);
    setShowShapeSub(isShape);
    if (!isShape) setShowAddons(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = document.activeElement?.tagName;
      const ce = document.activeElement?.contentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || ce === 'true') return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
        return;
      }
      const map = {
        v: 'select',
        h: 'pan',
        p: 'ballpoint',
        m: 'marker',
        l: 'highlighter',
        e: 'eraser_obj',
        t: 'text',
        n: 'sticky',
        r: 'rect',
        c: 'circle',
        a: 'arrow',
      };
      const next = map[event.key.toLowerCase()];
      if (next) activateTool(next);
      if (event.key === 'Escape') {
        setActiveSelection(null);
        setShowAddons(false);
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && activeSelection) {
        pushHistory();
        mutateBoard((draft) => {
          draft[activeSelection.kind] = draft[activeSelection.kind].filter((item) => item.id !== activeSelection.id);
        });
        setActiveSelection(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activateTool, activeSelection, mutateBoard, pushHistory, save, undo]);

  const startMove = useCallback((kind, id, x, y, origin) => {
    moveRef.current = { active: true, kind, id, startX: x, startY: y, origin };
    setActiveSelection({ kind, id });
  }, []);

  const insertText = useCallback((x, y) => {
    pushHistory();
    const id = randomId('text');
    mutateBoard((draft) => {
      draft.texts.push({ id, x, y, content: 'Text', font: fontId, size: 26, color: colorRef.current });
    });
    setActiveSelection({ kind: 'texts', id });
  }, [fontId, mutateBoard, pushHistory]);

  const insertSticky = useCallback((x, y) => {
    pushHistory();
    const id = randomId('sticky');
    const theme = STICKY_COLORS[boardRef.current.stickies.length % STICKY_COLORS.length];
    mutateBoard((draft) => {
      draft.stickies.push({ id, x, y, width: 180, height: 170, content: 'Neue Notiz', ...theme });
    });
    setActiveSelection({ kind: 'stickies', id });
  }, [mutateBoard, pushHistory]);

  const insertFrame = useCallback((x, y) => {
    pushHistory();
    const id = randomId('frame');
    mutateBoard((draft) => {
      draft.frames.push({ id, x, y, width: 420, height: 260, title: 'Rahmen' });
    });
    setActiveSelection({ kind: 'frames', id });
  }, [mutateBoard, pushHistory]);

  const insertTable = useCallback((x, y) => {
    pushHistory();
    const id = randomId('table');
    mutateBoard((draft) => {
      draft.tables.push({
        id,
        x,
        y,
        cols: 3,
        rows: 3,
        width: 360,
        height: 210,
        cells: Array.from({ length: 9 }, (_, index) => (index < 3 ? `Spalte ${index + 1}` : '')),
      });
    });
    setActiveSelection({ kind: 'tables', id });
  }, [mutateBoard, pushHistory]);

  const insertBubble = useCallback((x, y) => {
    pushHistory();
    const id = randomId('bubble');
    mutateBoard((draft) => {
      draft.bubbles.push({ id, x, y, width: 280, height: 160, content: 'Kommentar oder Frage' });
    });
    setActiveSelection({ kind: 'bubbles', id });
  }, [mutateBoard, pushHistory]);

  const insertTemplate = useCallback((type) => {
    const canvas = canvasRef.current;
    const centerX = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current;
    const centerY = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current;
    pushHistory();
    mutateBoard((draft) => {
      if (type === 'mindmap') {
        draft.texts.push(
          { id: randomId('text'), x: centerX, y: centerY, content: 'Hauptthema', font: 'caveat', size: 32, color: '#4f46e5' },
          { id: randomId('text'), x: centerX - 230, y: centerY - 110, content: 'Ast 1', font: 'caveat', size: 24, color: '#0f172a' },
          { id: randomId('text'), x: centerX + 170, y: centerY - 100, content: 'Ast 2', font: 'caveat', size: 24, color: '#0f172a' },
          { id: randomId('text'), x: centerX - 210, y: centerY + 120, content: 'Ast 3', font: 'caveat', size: 24, color: '#0f172a' },
          { id: randomId('text'), x: centerX + 190, y: centerY + 120, content: 'Ast 4', font: 'caveat', size: 24, color: '#0f172a' },
        );
        draft.shapes.push(
          { id: randomId('shape'), type: 'arrow', x1: centerX - 10, y1: centerY - 10, x2: centerX - 130, y2: centerY - 70, color: '#c4b5fd', width: 2 },
          { id: randomId('shape'), type: 'arrow', x1: centerX + 20, y1: centerY - 5, x2: centerX + 140, y2: centerY - 65, color: '#c4b5fd', width: 2 },
          { id: randomId('shape'), type: 'arrow', x1: centerX - 10, y1: centerY + 10, x2: centerX - 115, y2: centerY + 90, color: '#c4b5fd', width: 2 },
          { id: randomId('shape'), type: 'arrow', x1: centerX + 20, y1: centerY + 10, x2: centerX + 150, y2: centerY + 95, color: '#c4b5fd', width: 2 },
        );
      }
      if (type === 'brainstorm') {
        STICKY_COLORS.forEach((theme, index) => {
          const angle = (Math.PI * 2 * index) / STICKY_COLORS.length;
          draft.stickies.push({
            id: randomId('sticky'),
            x: centerX + Math.cos(angle) * 190,
            y: centerY + Math.sin(angle) * 130,
            width: 180,
            height: 170,
            content: `Idee ${index + 1}`,
            ...theme,
          });
        });
      }
      if (type === 'planning') {
        draft.frames.push({ id: randomId('frame'), x: centerX - 260, y: centerY - 120, width: 620, height: 310, title: 'Sprintplanung' });
        draft.tables.push({
          id: randomId('table'),
          x: centerX - 220,
          y: centerY - 60,
          cols: 3,
          rows: 4,
          width: 520,
          height: 220,
          cells: ['Backlog', 'In Arbeit', 'Erledigt', 'Task 1', '', '', 'Task 2', '', '', '', '', ''],
        });
      }
      if (type === 'review') {
        draft.bubbles.push({ id: randomId('bubble'), x: centerX - 100, y: centerY - 80, width: 280, height: 150, content: 'Was lief gut?' });
        draft.bubbles.push({ id: randomId('bubble'), x: centerX + 220, y: centerY - 40, width: 280, height: 150, content: 'Was blockiert noch?' });
        draft.bubbles.push({ id: randomId('bubble'), x: centerX + 60, y: centerY + 170, width: 280, height: 150, content: 'Naechste Schritte' });
      }
    });
    setShowAddons(false);
  }, [mutateBoard, pushHistory]);

  const updateArrayItem = useCallback((kind, id, patch) => {
    mutateBoard((draft) => {
      draft[kind] = draft[kind].map((item) => (item.id === id ? { ...item, ...patch } : item));
    });
  }, [mutateBoard]);

  const removeSelection = useCallback(() => {
    if (!activeSelection) return;
    pushHistory();
    mutateBoard((draft) => {
      draft[activeSelection.kind] = draft[activeSelection.kind].filter((item) => item.id !== activeSelection.id);
    });
    setActiveSelection(null);
  }, [activeSelection, mutateBoard, pushHistory]);

  const onPointerDown = useCallback((event) => {
    if (event.button !== 0 && event.button !== 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(event.pointerId);
    const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);

    if (event.button === 1 || toolRef.current === 'pan') {
      panDragRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        originX: panRef.current.x,
        originY: panRef.current.y,
      };
      return;
    }

    if (toolRef.current === 'select') {
      const shape = hitShape(boardRef.current.shapes, world.x, world.y, zoomRef.current);
      if (shape) {
        pushHistory();
        startMove('shapes', shape.id, world.x, world.y, clone(shape));
        return;
      }
      setActiveSelection(null);
      return;
    }

    if (toolRef.current === 'text') {
      insertText(world.x, world.y);
      return;
    }
    if (toolRef.current === 'sticky') {
      insertSticky(world.x, world.y);
      return;
    }
    if (toolRef.current === 'frame') {
      insertFrame(world.x, world.y);
      return;
    }
    if (toolRef.current === 'table') {
      insertTable(world.x, world.y);
      return;
    }
    if (toolRef.current === 'bubble') {
      insertBubble(world.x, world.y);
      return;
    }
    if (toolRef.current === 'eraser_obj') {
      const strokeIndex = findStrokeIndex(boardRef.current.strokes, world.x, world.y, zoomRef.current);
      if (strokeIndex !== -1) {
        pushHistory();
        mutateBoard((draft) => {
          draft.strokes.splice(strokeIndex, 1);
        });
      }
      return;
    }
    if (['rect', 'circle', 'arrow'].includes(toolRef.current)) {
      pushHistory();
      shapeRef.current = { active: true, type: toolRef.current, x1: world.x, y1: world.y, x2: world.x, y2: world.y };
      return;
    }
    if (['ballpoint', 'marker', 'highlighter', 'eraser_px'].includes(toolRef.current)) {
      pushHistory();
      const config = {
        ballpoint: { width: brushRef.current, alpha: 1, color: colorRef.current },
        marker: { width: brushRef.current * 4, alpha: 1, color: colorRef.current },
        highlighter: { width: brushRef.current * 9, alpha: 0.3, color: colorRef.current },
        eraser_px: { width: brushRef.current * 6, alpha: 1, color: '#0f172a' },
      }[toolRef.current];
      drawRef.current = {
        active: true,
        stroke: { id: randomId('stroke'), tool: toolRef.current, ...config, points: [world] },
        prev: world,
      };
    }
  }, [insertBubble, insertFrame, insertSticky, insertTable, insertText, mutateBoard, pushHistory, startMove]);

  const onPointerMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (panDragRef.current.active) {
      setPan({
        x: panDragRef.current.originX + (event.clientX - panDragRef.current.startX),
        y: panDragRef.current.originY + (event.clientY - panDragRef.current.startY),
      });
      return;
    }

    if (moveRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      const dx = world.x - moveRef.current.startX;
      const dy = world.y - moveRef.current.startY;
      mutateBoard((draft) => {
        draft[moveRef.current.kind] = draft[moveRef.current.kind].map((item) => {
          if (item.id !== moveRef.current.id) return item;
          const base = moveRef.current.origin;
          if (moveRef.current.kind === 'shapes') {
            return { ...item, x1: base.x1 + dx, y1: base.y1 + dy, x2: base.x2 + dx, y2: base.y2 + dy };
          }
          return { ...item, x: base.x + dx, y: base.y + dy };
        });
      });
      return;
    }

    if (shapeRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      shapeRef.current = { ...shapeRef.current, x2: world.x, y2: world.y };
      redraw();
      return;
    }

    if (!drawRef.current.active) return;
    const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
    drawRef.current.stroke.points.push(world);
    drawRef.current.prev = world;
    redraw();
    const previewBoard = clone(boardRef.current);
    previewBoard.strokes.push(drawRef.current.stroke);
    drawBoard(canvas.getContext('2d'), previewBoard, panRef.current, zoomRef.current);
  }, [mutateBoard, redraw]);

  const onPointerUp = useCallback((event) => {
    panDragRef.current.active = false;
    moveRef.current.active = false;
    canvasRef.current?.releasePointerCapture?.(event.pointerId);

    if (shapeRef.current.active) {
      const current = shapeRef.current;
      shapeRef.current = { active: false, x1: 0, y1: 0, x2: 0, y2: 0, type: null };
      if (Math.hypot(current.x2 - current.x1, current.y2 - current.y1) > 6) {
        mutateBoard((draft) => {
          draft.shapes.push({
            id: randomId('shape'),
            type: current.type,
            x1: current.x1,
            y1: current.y1,
            x2: current.x2,
            y2: current.y2,
            color: colorRef.current,
            width: brushRef.current,
          });
        });
      }
      redraw();
      return;
    }

    if (drawRef.current.active) {
      const nextStroke = clone(drawRef.current.stroke);
      drawRef.current = { active: false, stroke: null, prev: null };
      mutateBoard((draft) => {
        draft.strokes.push(nextStroke);
      });
      return;
    }

  }, [mutateBoard, redraw]);

  const beginOverlayMove = useCallback((event, kind, item) => {
    if (toolRef.current !== 'select') {
      setActiveSelection({ kind, id: item.id });
      return;
    }
    if (activeSelection?.kind === kind && activeSelection?.id === item.id) {
      setActiveSelection({ kind, id: item.id });
      return;
    }
    event.stopPropagation();
    pushHistory();
    const world = getWorldPoint(event, canvasRef.current, panRef.current, zoomRef.current);
    startMove(kind, item.id, world.x, world.y, clone(item));
  }, [activeSelection?.id, activeSelection?.kind, pushHistory, startMove]);

  const toolButton = (active, extra = {}) => ({
    width: 44,
    height: 44,
    border: 'none',
    borderRadius: 12,
    background: active ? '#ede9fe' : 'transparent',
    color: active ? '#5b21b6' : '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    ...extra,
  });

  const selectionKind = activeSelection?.kind;
  const selectionId = activeSelection?.id;
  const selectedText = selectionKind === 'texts' ? board.texts.find((item) => item.id === selectionId) : null;

  const ensureShareLink = useCallback(async () => {
    if (!shareReady) await save({ silent: false, ensureDoc: true });
    else setShareOpen(true);
  }, [save, shareReady]);

  const copyShareLink = useCallback(async () => {
    const url = new URL(window.location.href);
    if (docRow?.id) url.searchParams.set('id', docRow.id);
    const text = url.toString();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      window.prompt('Link kopieren', text);
    }
  }, [docRow?.id]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#94a3b8', fontSize: 18 }}>
        Whiteboard wird geladen...
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc', backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.22) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}>
      <div style={{ height: 58, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 12px rgba(15,23,42,0.05)', zIndex: 40 }}>
        <a href="dashboard.html?tab=docs" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Icons.Logo size={30} />
        </a>
        <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === 'Escape') setEditingTitle(false);
            }}
            style={{ border: '1px solid #cbd5e1', outline: 'none', borderRadius: 8, padding: '7px 10px', background: '#fff', fontSize: 14, fontWeight: 600, color: '#0f172a', minWidth: 180 }}
          />
        ) : (
          <button onClick={() => setEditingTitle(true)} style={{ background: 'none', border: 'none', padding: '6px 8px', fontSize: 14, fontWeight: 600, color: '#0f172a', cursor: 'text' }}>
            {title}
          </button>
        )}
        {savedAt && <span style={{ fontSize: 11, color: '#64748b' }}>Gespeichert um {savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
        {remoteAt && <span style={{ fontSize: 11, color: '#7c3aed' }}>Live Sync {remoteAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
        <div style={{ flex: 1 }} />
        {!!collaborators.length && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
            {collaborators.slice(-3).map((item) => (
              <div key={item.id} title={item.label} style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', color: '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, border: '1px solid #c4b5fd' }}>
                {(item.label || '?').slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        )}
        <button onClick={undo} disabled={!history.length} style={{ ...toolButton(false), opacity: history.length ? 1 : 0.35 }}>
          <UndoIcon />
        </button>
        <button onClick={ensureShareLink} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#5b21b6', fontWeight: 600, cursor: 'pointer' }}>
          <ShareIcon /> Teilen
        </button>
        <button onClick={() => save()} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', background: '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.65 : 1 }}>
          <SaveIcon /> {saving ? 'Speichert...' : 'Speichern'}
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: tool === 'pan' ? 'grab' : tool === 'text' ? 'text' : tool === 'select' ? 'default' : 'crosshair' }}
        />

        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {board.frames.map((frame) => {
            const pos = toScreen(frame.x, frame.y, pan, zoom);
            const active = selectionKind === 'frames' && selectionId === frame.id;
            return (
              <div
                key={frame.id}
                onPointerDown={(event) => beginOverlayMove(event, 'frames', frame)}
                style={{ position: 'absolute', left: pos.x, top: pos.y, width: frame.width * zoom, height: frame.height * zoom, borderRadius: 14, border: active ? '2px solid #7c3aed' : '2px dashed #a5b4fc', background: 'rgba(255,255,255,0.22)', boxShadow: active ? '0 0 0 3px rgba(124,58,237,0.14)' : 'none', pointerEvents: 'auto' }}
              >
                <input
                  value={frame.title}
                  onChange={(event) => updateArrayItem('frames', frame.id, { title: event.target.value })}
                  onFocus={() => setActiveSelection({ kind: 'frames', id: frame.id })}
                  style={{ position: 'absolute', top: -18, left: 14, width: 180, border: '1px solid #ddd6fe', borderRadius: 999, padding: '6px 10px', background: 'white', fontSize: 12, fontWeight: 600, color: '#5b21b6' }}
                />
              </div>
            );
          })}

          {board.tables.map((table) => {
            const pos = toScreen(table.x, table.y, pan, zoom);
            const active = selectionKind === 'tables' && selectionId === table.id;
            const cellWidth = (table.width / table.cols) * zoom;
            const cellHeight = (table.height / table.rows) * zoom;
            return (
              <div key={table.id} onPointerDown={(event) => beginOverlayMove(event, 'tables', table)} style={{ position: 'absolute', left: pos.x, top: pos.y, width: table.width * zoom, minHeight: table.height * zoom, background: 'rgba(255,255,255,0.96)', borderRadius: 12, border: active ? '2px solid #7c3aed' : '1px solid #cbd5e1', boxShadow: '0 12px 30px rgba(15,23,42,0.08)', overflow: 'hidden', pointerEvents: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${table.cols}, 1fr)` }}>
                  {table.cells.map((cell, index) => (
                    <textarea
                      key={index}
                      value={cell}
                      onFocus={() => setActiveSelection({ kind: 'tables', id: table.id })}
                      onChange={(event) => {
                        const next = [...table.cells];
                        next[index] = event.target.value;
                        updateArrayItem('tables', table.id, { cells: next });
                      }}
                      style={{ width: cellWidth, minHeight: cellHeight, border: '1px solid #e2e8f0', resize: 'none', padding: `${10 * zoom}px`, fontSize: Math.max(11, 13 * zoom), outline: 'none', color: '#334155', background: index < table.cols ? '#f8fafc' : 'white', fontWeight: index < table.cols ? 600 : 400 }}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {board.bubbles.map((bubble) => {
            const pos = toScreen(bubble.x, bubble.y, pan, zoom);
            const active = selectionKind === 'bubbles' && selectionId === bubble.id;
            return (
              <div key={bubble.id} onPointerDown={(event) => beginOverlayMove(event, 'bubbles', bubble)} style={{ position: 'absolute', left: pos.x, top: pos.y, width: bubble.width * zoom, minHeight: bubble.height * zoom, background: 'white', borderRadius: 20, border: active ? '2px solid #7c3aed' : '1px solid #cbd5e1', boxShadow: '0 16px 36px rgba(15,23,42,0.1)', pointerEvents: 'auto' }}>
                <textarea
                  value={bubble.content}
                  onChange={(event) => updateArrayItem('bubbles', bubble.id, { content: event.target.value })}
                  onFocus={() => setActiveSelection({ kind: 'bubbles', id: bubble.id })}
                  style={{ width: '100%', minHeight: bubble.height * zoom, border: 'none', borderRadius: 20, outline: 'none', resize: 'none', padding: `${18 * zoom}px`, fontSize: Math.max(13, 15 * zoom), color: '#334155', background: 'transparent' }}
                />
                <div style={{ position: 'absolute', bottom: -18, left: 28, width: 28, height: 28, transform: 'rotate(45deg)', background: 'white', borderRight: active ? '2px solid #7c3aed' : '1px solid #cbd5e1', borderBottom: active ? '2px solid #7c3aed' : '1px solid #cbd5e1' }} />
              </div>
            );
          })}

          {board.texts.map((text) => {
            const pos = toScreen(text.x, text.y, pan, zoom);
            const active = selectionKind === 'texts' && selectionId === text.id;
            const font = FONTS.find((item) => item.id === text.font)?.css || 'inherit';
            return (
              <div key={text.id} style={{ position: 'absolute', left: pos.x, top: pos.y, pointerEvents: 'auto' }}>
                {active && (
                  <div style={{ position: 'absolute', top: -40, left: 0, display: 'flex', gap: 4, padding: '6px 8px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 24px rgba(15,23,42,0.12)' }}>
                    {FONTS.map((option) => (
                      <button key={option.id} onClick={() => updateArrayItem('texts', text.id, { font: option.id })} style={{ border: 'none', background: text.font === option.id ? '#ede9fe' : 'transparent', color: text.font === option.id ? '#5b21b6' : '#64748b', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontFamily: option.css, fontSize: 12 }}>
                        {option.label}
                      </button>
                    ))}
                    {[18, 24, 30, 36].map((size) => (
                      <button key={size} onClick={() => updateArrayItem('texts', text.id, { size })} style={{ border: 'none', background: text.size === size ? '#ede9fe' : 'transparent', color: '#475569', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', fontSize: 12 }}>
                        {size}
                      </button>
                    ))}
                  </div>
                )}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => setActiveSelection({ kind: 'texts', id: text.id })}
                  onPointerDown={(event) => beginOverlayMove(event, 'texts', text)}
                  onBlur={(event) => updateArrayItem('texts', text.id, { content: event.currentTarget.innerText.trim() || 'Text' })}
                  style={{ minWidth: 90, padding: '2px 4px', fontFamily: font, fontSize: text.size * zoom, color: text.color, background: active ? 'rgba(255,255,255,0.86)' : 'transparent', outline: active ? '1px dashed #7c3aed' : 'none', borderRadius: 6, whiteSpace: 'pre-wrap', cursor: tool === 'select' ? 'grab' : 'text' }}
                >
                  {text.content}
                </div>
              </div>
            );
          })}

          {board.stickies.map((sticky) => {
            const pos = toScreen(sticky.x, sticky.y, pan, zoom);
            const active = selectionKind === 'stickies' && selectionId === sticky.id;
            return (
              <div key={sticky.id} onPointerDown={(event) => beginOverlayMove(event, 'stickies', sticky)} style={{ position: 'absolute', left: pos.x, top: pos.y, width: sticky.width * zoom, minHeight: sticky.height * zoom, background: sticky.bg, border: `1.5px solid ${sticky.border}`, borderRadius: 6, boxShadow: active ? '0 0 0 3px rgba(124,58,237,0.18), 0 18px 30px rgba(15,23,42,0.12)' : '0 12px 24px rgba(15,23,42,0.08)', overflow: 'hidden', pointerEvents: 'auto' }}>
                <div style={{ height: 28 * zoom, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${10 * zoom}px`, background: sticky.border, opacity: 0.22 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {STICKY_COLORS.map((theme, index) => (
                      <button key={index} onClick={() => updateArrayItem('stickies', sticky.id, theme)} style={{ width: 10 * zoom, height: 10 * zoom, borderRadius: '50%', border: `1px solid ${theme.border}`, background: theme.bg, padding: 0, cursor: 'pointer' }} />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      pushHistory();
                      mutateBoard((draft) => {
                        draft.stickies = draft.stickies.filter((item) => item.id !== sticky.id);
                      });
                      setActiveSelection(null);
                    }}
                    style={{ border: 'none', background: 'none', color: '#334155', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                  >
                    x
                  </button>
                </div>
                <textarea
                  value={sticky.content}
                  onFocus={() => setActiveSelection({ kind: 'stickies', id: sticky.id })}
                  onChange={(event) => updateArrayItem('stickies', sticky.id, { content: event.target.value })}
                  style={{ width: '100%', minHeight: sticky.height * zoom - 28 * zoom, border: 'none', background: 'transparent', resize: 'none', outline: 'none', padding: `${10 * zoom}px`, fontFamily: "'Caveat', cursive", fontSize: Math.max(13, 18 * zoom), color: '#1e293b' }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 35 }}>
          {showPenSub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 18, boxShadow: '0 18px 36px rgba(15,23,42,0.12)' }}>
              {['ballpoint', 'marker', 'highlighter', 'eraser_obj', 'eraser_px'].map((id) => (
                <button key={id} onClick={() => activateTool(id)} style={{ border: 'none', background: tool === id ? '#ede9fe' : '#f8fafc', color: tool === id ? '#5b21b6' : '#475569', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                  {id === 'ballpoint' ? 'Pen' : id === 'marker' ? 'Marker' : id === 'highlighter' ? 'Textmarker' : id === 'eraser_obj' ? 'Objekt' : 'Pixel'}
                </button>
              ))}
              <div style={{ width: 1, height: 26, background: '#e2e8f0' }} />
              {COLORS.map((swatch) => (
                <button key={swatch} onClick={() => setColor(swatch)} style={{ width: 22, height: 22, borderRadius: '50%', border: swatch === '#ffffff' ? '1px solid #cbd5e1' : 'none', background: swatch, boxShadow: color === swatch ? '0 0 0 2px white, 0 0 0 4px #7c3aed' : 'none', padding: 0, cursor: 'pointer' }} />
              ))}
              <div style={{ width: 1, height: 26, background: '#e2e8f0' }} />
              {[1, 3, 6, 10].map((size) => (
                <button key={size} onClick={() => setBrushSize(size)} style={{ width: size * 3 + 8, height: size * 3 + 8, borderRadius: '50%', border: 'none', background: '#0f172a', outline: brushSize === size ? '2px solid #7c3aed' : 'none', cursor: 'pointer' }} />
              ))}
            </div>
          )}

          {showShapeSub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 18, boxShadow: '0 18px 36px rgba(15,23,42,0.12)' }}>
              {[{ id: 'rect', icon: <RectIcon /> }, { id: 'circle', icon: <CircleIcon /> }, { id: 'arrow', icon: <ArrowIcon /> }].map((item) => (
                <button key={item.id} onClick={() => activateTool(item.id)} style={toolButton(tool === item.id)}>
                  {item.icon}
                </button>
              ))}
              <div style={{ width: 1, height: 26, background: '#e2e8f0' }} />
              {COLORS.map((swatch) => (
                <button key={swatch} onClick={() => setColor(swatch)} style={{ width: 22, height: 22, borderRadius: '50%', border: swatch === '#ffffff' ? '1px solid #cbd5e1' : 'none', background: swatch, boxShadow: color === swatch ? '0 0 0 2px white, 0 0 0 4px #7c3aed' : 'none', padding: 0, cursor: 'pointer' }} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 20, boxShadow: '0 18px 36px rgba(15,23,42,0.12)' }}>
            <button onClick={() => activateTool('select')} style={toolButton(tool === 'select')} title="Auswahl">
              <SelectIcon />
            </button>
            <button onClick={() => activateTool('pan')} style={toolButton(tool === 'pan')} title="Bewegen">
              <PanIcon />
            </button>
            <div style={{ width: 1, height: 28, background: '#e2e8f0', margin: '0 4px' }} />
            <button onClick={() => { activateTool('ballpoint'); setShowPenSub(true); setShowShapeSub(false); }} style={toolButton(['ballpoint', 'marker', 'highlighter', 'eraser_obj', 'eraser_px'].includes(tool))} title="Stift">
              <Icons.Edit size={18} />
            </button>
            <button onClick={() => activateTool('sticky')} style={toolButton(tool === 'sticky')} title="Sticker">
              <StickyIcon />
            </button>
            <button onClick={() => { activateTool('rect'); setShowShapeSub(true); setShowPenSub(false); }} style={toolButton(['rect', 'circle', 'arrow'].includes(tool))} title="Formen">
              {tool === 'circle' ? <CircleIcon /> : tool === 'arrow' ? <ArrowIcon /> : <RectIcon />}
            </button>
            <button onClick={() => activateTool('text')} style={toolButton(tool === 'text')} title="Text">
              <TextIcon />
            </button>
            <button onClick={() => activateTool('frame')} style={toolButton(tool === 'frame')} title="Rahmen">
              <FrameIcon />
            </button>
            <button onClick={() => activateTool('table')} style={toolButton(tool === 'table')} title="Tabelle">
              <TableIcon />
            </button>
            <button onClick={() => activateTool('bubble')} style={toolButton(tool === 'bubble')} title="Sprechblase">
              <BubbleIcon />
            </button>
            <div style={{ width: 1, height: 28, background: '#e2e8f0', margin: '0 4px' }} />
            <button onClick={() => setShowAddons((prev) => !prev)} style={toolButton(showAddons, showAddons ? { background: '#7c3aed', color: 'white' } : {})} title="Mehr einfuegen">
              <PlusIcon />
            </button>
          </div>
        </div>

        <div style={{ position: 'absolute', right: 16, bottom: 18, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 35 }}>
          <button onClick={() => setZoom((prev) => Math.min(4, prev + 0.15))} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(15,23,42,0.08)', background: 'white', cursor: 'pointer', boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}>+</button>
          <button onClick={() => { setPan({ x: 120, y: 90 }); setZoom(1); }} style={{ minWidth: 38, height: 30, borderRadius: 10, border: '1px solid rgba(15,23,42,0.08)', background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#64748b', boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}>{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom((prev) => Math.max(0.15, prev - 0.15))} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(15,23,42,0.08)', background: 'white', cursor: 'pointer', boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}>-</button>
        </div>

        {showAddons && (
          <div style={{ position: 'absolute', right: 16, bottom: 88, width: 330, borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 20px 48px rgba(15,23,42,0.16)', zIndex: 45 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Einfuegen</div>
              <button onClick={() => setShowAddons(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <CloseIcon />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '12px 16px 0', borderBottom: '1px solid #f1f5f9' }}>
              {['vorlagen', 'ideen', 'elemente'].map((tab) => (
                <button key={tab} onClick={() => setAddonTab(tab)} style={{ border: 'none', background: addonTab === tab ? '#f5f3ff' : 'transparent', color: addonTab === tab ? '#5b21b6' : '#64748b', borderRadius: '8px 8px 0 0', padding: '7px 12px', cursor: 'pointer', fontWeight: 600 }}>
                  {tab === 'vorlagen' ? 'Vorlagen' : tab === 'ideen' ? 'Ideen' : 'Elemente'}
                </button>
              ))}
            </div>
            <div style={{ padding: 16, maxHeight: 340, overflowY: 'auto' }}>
              {addonTab === 'vorlagen' && (
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { id: 'mindmap', title: 'Mindmap', desc: 'Thema mit Aesten und Verbindungen' },
                    { id: 'brainstorm', title: 'Brainstorming', desc: 'Farbsticker fuer schnelle Ideen' },
                    { id: 'planning', title: 'Planung', desc: 'Rahmen und Tabelle fuer Boards' },
                    { id: 'review', title: 'Review', desc: 'Sprechblasen fuer Retro und Feedback' },
                  ].map((item) => (
                    <button key={item.id} onClick={() => insertTemplate(item.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '12px 14px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.title}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</span>
                    </button>
                  ))}
                </div>
              )}
              {addonTab === 'ideen' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {STICKY_COLORS.map((theme, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const centerX = ((canvasRef.current?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current;
                        const centerY = ((canvasRef.current?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current;
                        pushHistory();
                        mutateBoard((draft) => {
                          draft.stickies.push({ id: randomId('sticky'), x: centerX + index * 16, y: centerY + index * 12, width: 180, height: 170, content: 'Neue Idee', ...theme });
                        });
                        setShowAddons(false);
                      }}
                      style={{ borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.bg, padding: '20px 12px', cursor: 'pointer', fontFamily: "'Caveat', cursive", fontSize: 20, color: '#1e293b' }}
                    >
                      Notizzettel
                    </button>
                  ))}
                </div>
              )}
              {addonTab === 'elemente' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { id: 'frame', label: 'Rahmen', action: () => activateTool('frame') },
                    { id: 'table', label: 'Tabelle', action: () => activateTool('table') },
                    { id: 'bubble', label: 'Sprechblase', action: () => activateTool('bubble') },
                    { id: 'arrow', label: 'Pfeil', action: () => activateTool('arrow') },
                  ].map((item) => (
                    <button key={item.id} onClick={() => { item.action(); setShowAddons(false); }} style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '16px 12px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSelection && (
          <div style={{ position: 'absolute', top: 80, right: 16, zIndex: 45, width: 240, borderRadius: 16, background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 20px 40px rgba(15,23,42,0.1)', padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Auswahl</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              {activeSelection.kind === 'texts' ? 'Text' : activeSelection.kind === 'stickies' ? 'Sticker' : activeSelection.kind === 'tables' ? 'Tabelle' : activeSelection.kind === 'frames' ? 'Rahmen' : activeSelection.kind === 'bubbles' ? 'Sprechblase' : 'Form'}
            </div>
            {activeSelection.kind === 'texts' && (
              <>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {FONTS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setFontId(item.id);
                        updateArrayItem('texts', activeSelection.id, { font: item.id });
                      }}
                      style={{ flex: 1, border: 'none', background: selectedText?.font === item.id ? '#ede9fe' : '#f8fafc', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: '#475569', fontFamily: item.css }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {COLORS.map((swatch) => (
                    <button key={swatch} onClick={() => updateArrayItem('texts', activeSelection.id, { color: swatch })} style={{ width: 20, height: 20, borderRadius: '50%', border: swatch === '#ffffff' ? '1px solid #cbd5e1' : 'none', background: swatch, cursor: 'pointer' }} />
                  ))}
                </div>
              </>
            )}
            <button onClick={removeSelection} style={{ marginTop: 14, width: '100%', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 600 }}>
              Element loeschen
            </button>
          </div>
        )}

        {shareOpen && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.36)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
            <div style={{ width: 520, maxWidth: 'calc(100vw - 32px)', borderRadius: 24, background: 'white', boxShadow: '0 24px 60px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Board teilen</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Den Link koennen andere fuer Coworking und Live-Sync oeffnen.</div>
                </div>
                <button onClick={() => setShareOpen(false)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <CloseIcon />
                </button>
              </div>
              <div style={{ padding: 20, display: 'grid', gap: 18 }}>
                <div style={{ padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Freigabelink</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input readOnly value={(() => { const url = new URL(window.location.href); if (docRow?.id) url.searchParams.set('id', docRow.id); return url.toString(); })()} style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 12, padding: '11px 12px', fontSize: 12, color: '#334155', background: 'white' }} />
                    <button onClick={copyShareLink} style={{ border: 'none', borderRadius: 12, padding: '0 16px', background: copied ? '#16a34a' : '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                      {copied ? 'Kopiert' : 'Kopieren'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                  <div style={{ padding: 16, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Coworking</div>
                    <div style={{ display: 'grid', gap: 10, fontSize: 13, color: '#334155' }}>
                      <div style={{ padding: '10px 12px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0' }}>Autosave ist aktiv, Aenderungen werden laufend synchronisiert.</div>
                      <div style={{ padding: '10px 12px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0' }}>Offene Tabs mit demselben Board sehen Updates live ueber BroadcastChannel.</div>
                      <div style={{ padding: '10px 12px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0' }}>Geteilte Links arbeiten ueber gespeicherte Snapshots und periodische Syncs.</div>
                    </div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Aktive Teilnehmer</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'white', border: '1px solid #ddd6fe' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', color: '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>DU</div>
                        <div style={{ fontSize: 13, color: '#334155' }}>Du bearbeitest dieses Board</div>
                      </div>
                      {collaborators.length ? collaborators.slice(-4).reverse().map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {(item.label || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ fontSize: 13, color: '#334155' }}>{item.label}</div>
                        </div>
                      )) : (
                        <div style={{ padding: '10px 12px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                          Noch niemand anders verbunden.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Whiteboard />);
