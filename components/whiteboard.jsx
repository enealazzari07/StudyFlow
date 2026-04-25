const { useCallback, useEffect, useMemo, useRef, useState } = React;

const WB_MIME = 'application/studyflow-whiteboard+json';
const PALETTE = ['#0f172a', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7'];
const PASTELS = ['#fef3a0', '#bfdbfe', '#fbcfe8', '#bbf7d0', '#fed7aa'];
const STICKY_THEMES = [
  { bg: '#fef3a0', border: '#eab308' },
  { bg: '#bfdbfe', border: '#3b82f6' },
  { bg: '#fbcfe8', border: '#ec4899' },
  { bg: '#bbf7d0', border: '#22c55e' },
  { bg: '#fed7aa', border: '#f97316' },
];
const STICKERS = ['⭐', '✅', '❗', '💡', '🔥', '🎯', '📌', '✏️', '🤔', '👍', '❤️', '🚀', '🏆', '⚡', '📝', '🎉'];
const TEMPLATES = [
  { id: 'mindmap', name: 'Mind Map', desc: 'Brainstorming für ein Thema', icon: '🧠' },
  { id: 'flow', name: 'Flussdiagramm', desc: 'Prozess oder Ablauf visualisieren', icon: '📊' },
  { id: 'matrix', name: 'Eisenhower-Matrix', desc: 'Aufgaben nach Wichtigkeit sortieren', icon: '🗂️' },
  { id: 'cards', name: 'Lern-Karteikarten', desc: 'Karten gruppieren und verbinden', icon: '🃏' },
];

const DEFAULT_BOARD = () => ({
  strokes: [],
  shapes: [],
  texts: [],
  notes: [],
  emojis: [],
  frames: [],
  comments: [],
  images: [],
});

const randomId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

const ToolIcon = ({ children, size = 18 }) => (
  <Icon size={size} stroke={1.9}>
    {children}
  </Icon>
);

const TOOL_DEFS = {
  select: { label: 'Auswählen', icon: <ToolIcon><path d="M5 3l13 8-6 2-2 6z" fill="currentColor" stroke="none"/></ToolIcon> },
  pan: { label: 'Verschieben', icon: <ToolIcon><path d="M9 11V5a2 2 0 0 1 4 0v6"/><path d="M9 11V8a2 2 0 0 0-4 0v6c0 4 3 7 7 7s7-3 7-7v-3a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0"/></ToolIcon> },
  pen: { label: 'Stift', icon: <Icons.Edit size={18}/> },
  highlight: { label: 'Marker', icon: <ToolIcon><path d="M4 15l7-7 5 5-7 7H4z"/><path d="M13 6l2-2 5 5-2 2"/></ToolIcon> },
  eraser: { label: 'Radierer', icon: <ToolIcon><path d="M20 20H7l-4-4 9-9 8 8z"/><path d="M16 16l-7-7"/></ToolIcon> },
  note: { label: 'Notiz', icon: <ToolIcon><path d="M4 4h16v16H4z" rx="3"/><path d="M9 9h6M9 13h4"/></ToolIcon> },
  rect: { label: 'Rechteck', icon: <ToolIcon><rect x="4" y="6" width="16" height="12" rx="2"/></ToolIcon> },
  circle: { label: 'Kreis', icon: <ToolIcon><circle cx="12" cy="12" r="7"/></ToolIcon> },
  arrow: { label: 'Pfeil', icon: <Icons.ArrowRight size={18}/> },
  text: { label: 'Text', icon: <ToolIcon><path d="M5 5h14"/><path d="M12 5v14"/></ToolIcon> },
  image: { label: 'Bild', icon: <ToolIcon><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L4 20"/></ToolIcon> },
  frame: { label: 'Frame', icon: <ToolIcon><path d="M5 7H3M5 17H3M19 7h2M19 17h2M7 5V3M17 5V3M7 21v-2M17 21v-2"/><rect x="5" y="5" width="14" height="14" rx="1"/></ToolIcon> },
  sticker: { label: 'Sticker', icon: <ToolIcon><path d="M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h9l6-6V6a3 3 0 0 0-3-3z"/><path d="M15 21v-4a2 2 0 0 1 2-2h4"/></ToolIcon> },
  connector: { label: 'Verbinder', icon: <ToolIcon><circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7l10 10"/></ToolIcon> },
  comment: { label: 'Kommentar', icon: <ToolIcon><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></ToolIcon> },
  more: { label: 'Mehr', icon: <Icons.Plus size={18}/> },
};

const TOOL_ROWS = ['select', 'pan', 'pen', 'highlight', 'eraser', 'note', 'divider', 'rect', 'circle', 'arrow', 'text', 'image', 'frame', 'sticker', 'connector', 'divider', 'comment', 'more'];

function getWorldPoint(evt, canvas, pan, zoom) {
  const rect = canvas.getBoundingClientRect();
  return { x: (evt.clientX - rect.left - pan.x) / zoom, y: (evt.clientY - rect.top - pan.y) / zoom };
}

function toScreen(x, y, pan, zoom) {
  return { x: x * zoom + pan.x, y: y * zoom + pan.y };
}

function drawBoard(ctx, board, pan, zoom) {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  for (const stroke of board.strokes) {
    if (!stroke.points?.length) continue;
    ctx.save();
    ctx.globalAlpha = stroke.alpha ?? 1;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i += 1) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    if (stroke.points.length === 1) ctx.lineTo(stroke.points[0].x + 0.01, stroke.points[0].y + 0.01);
    ctx.stroke();
    ctx.restore();
  }

  for (const shape of board.shapes) {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.width || 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(shape.type === 'connector' ? [6, 6] : []);
    ctx.beginPath();
    if (shape.type === 'rect') {
      const x = Math.min(shape.x1, shape.x2);
      const y = Math.min(shape.y1, shape.y2);
      const w = Math.abs(shape.x2 - shape.x1);
      const h = Math.abs(shape.y2 - shape.y1);
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10);
      else ctx.rect(x, y, w, h);
    } else if (shape.type === 'circle') {
      ctx.ellipse((shape.x1 + shape.x2) / 2, (shape.y1 + shape.y2) / 2, Math.abs(shape.x2 - shape.x1) / 2, Math.abs(shape.y2 - shape.y1) / 2, 0, 0, Math.PI * 2);
    } else {
      const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
      const head = 14;
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.moveTo(shape.x2 - head * Math.cos(angle - 0.45), shape.y2 - head * Math.sin(angle - 0.45));
      ctx.lineTo(shape.x2, shape.y2);
      ctx.lineTo(shape.x2 - head * Math.cos(angle + 0.45), shape.y2 - head * Math.sin(angle + 0.45));
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function withinBox(x, y, box, pad = 0) {
  return x >= box.x - pad && x <= box.x + box.width + pad && y >= box.y - pad && y <= box.y + box.height + pad;
}

function findStroke(board, x, y, zoom) {
  for (let i = board.strokes.length - 1; i >= 0; i -= 1) {
    const stroke = board.strokes[i];
    const radius = (stroke.width || 1) * 0.8 + 10 / zoom;
    if (stroke.points.some((pt) => Math.hypot(pt.x - x, pt.y - y) <= radius)) return { index: i, item: stroke };
  }
  return null;
}

function findSelection(board, x, y, zoom) {
  for (let i = board.comments.length - 1; i >= 0; i -= 1) {
    const item = board.comments[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'comments', item };
  }
  for (let i = board.images.length - 1; i >= 0; i -= 1) {
    const item = board.images[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'images', item };
  }
  for (let i = board.frames.length - 1; i >= 0; i -= 1) {
    const item = board.frames[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'frames', item };
  }
  for (let i = board.notes.length - 1; i >= 0; i -= 1) {
    const item = board.notes[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'notes', item };
  }
  for (let i = board.texts.length - 1; i >= 0; i -= 1) {
    const item = board.texts[i];
    if (withinBox(x, y, item, 12 / zoom)) return { kind: 'texts', item };
  }
  for (let i = board.emojis.length - 1; i >= 0; i -= 1) {
    const item = board.emojis[i];
    if (withinBox(x, y, { x: item.x, y: item.y, width: 48, height: 48 }, 12 / zoom)) return { kind: 'emojis', item };
  }
  for (let i = board.shapes.length - 1; i >= 0; i -= 1) {
    const item = board.shapes[i];
    const left = Math.min(item.x1, item.x2);
    const top = Math.min(item.y1, item.y2);
    const width = Math.abs(item.x2 - item.x1) || 24;
    const height = Math.abs(item.y2 - item.y1) || 24;
    if (withinBox(x, y, { x: left, y: top, width, height }, 12 / zoom)) return { kind: 'shapes', item };
  }
  return null;
}

function TemplatesPanel({ onClose, onInsert }) {
  return (
    <div style={{ position: 'absolute', right: 18, top: 70, bottom: 110, width: 320, background: 'white', borderRadius: 14, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 8px 28px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 30 }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Erstelle Vorlagen und Diagramme</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><Icons.X size={14}/></button>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: '#fafbfc', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: '#94a3b8', minHeight: 80 }}>
          Wähle eine Vorlage und füge sie direkt auf das Board ein.
        </div>
      </div>
      <div style={{ padding: '0 14px 14px', overflowY: 'auto', flex: 1 }}>
        {TEMPLATES.map((template) => (
          <div key={template.id} onClick={() => onInsert(template.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{template.icon}</div>
            <div style={{ fontSize: 12.5, color: '#0f172a' }}><span style={{ fontWeight: 600 }}>{template.name}</span> <span style={{ color: '#64748b' }}>{template.desc}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StickersPanel({ onClose, onPick }) {
  return (
    <div style={{ position: 'absolute', bottom: 78, left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: 14, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 8px 28px rgba(15,23,42,0.12)', padding: 12, width: 280, zIndex: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Sticker</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><Icons.X size={12}/></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
        {STICKERS.map((sticker) => (
          <button key={sticker} onClick={() => onPick(sticker)} style={{ padding: 6, background: 'transparent', border: '1px solid transparent', borderRadius: 6, fontSize: 18, cursor: 'pointer' }}>{sticker}</button>
        ))}
      </div>
    </div>
  );
}

const Whiteboard = () => {
  const docId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const clientId = useMemo(() => randomId('client'), []);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const autosaveRef = useRef(null);
  const boardRef = useRef(DEFAULT_BOARD());
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const drawRef = useRef({ active: false, stroke: null });
  const shapeRef = useRef({ active: false, type: null, x1: 0, y1: 0, x2: 0, y2: 0 });
  const moveRef = useRef({ active: false, kind: null, id: null, startX: 0, startY: 0, origin: null });
  const dragPanRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const [user, setUser] = useState(null);
  const [docRow, setDocRow] = useState(null);
  const [title, setTitle] = useState('Ohne Namen');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#0f172a');
  const [board, setBoard] = useState(DEFAULT_BOARD);
  const [history, setHistory] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showStickers, setShowStickers] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [selected, setSelected] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const pushHistory = useCallback(() => setHistory((prev) => [...prev.slice(-39), clone(boardRef.current)]), []);
  const mutateBoard = useCallback((fn) => setBoard((prev) => { const next = clone(prev); fn(next); return next; }), []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBoard(canvas.getContext('2d'), boardRef.current, panRef.current, zoomRef.current);
    if (shapeRef.current.active) {
      const preview = clone(boardRef.current);
      preview.shapes.push({ id: 'preview', type: shapeRef.current.type, x1: shapeRef.current.x1, y1: shapeRef.current.y1, x2: shapeRef.current.x2, y2: shapeRef.current.y2, color, width: 2.5 });
      drawBoard(canvas.getContext('2d'), preview, panRef.current, zoomRef.current);
    }
  }, [color]);

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
          setTitle(row.name || 'Ohne Namen');
          if (row.file_path) {
            const { data: blob } = await window.sb.storage.from('documents').download(row.file_path);
            if (blob) {
              try {
                const payload = JSON.parse(await blob.text());
                setTitle(payload.title || row.name || 'Ohne Namen');
                setBoard({
                  strokes: payload.strokes || [],
                  shapes: payload.shapes || [],
                  texts: payload.texts || [],
                  notes: payload.notes || [],
                  emojis: payload.emojis || [],
                  frames: payload.frames || [],
                  comments: payload.comments || [],
                  images: payload.images || [],
                });
              } catch {}
            }
          }
        }
      }
      setLoading(false);
    })();
  }, [docId]);

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

  const save = useCallback(async () => {
    if (!user) return null;
    setSaving(true);
    try {
      const payload = { type: 'studyflow_whiteboard', client_id: clientId, updated_at: new Date().toISOString(), title, ...boardRef.current };
      const blob = new Blob([JSON.stringify(payload)], { type: WB_MIME });
      const safe = title.replace(/[^a-zA-Z0-9._-]/g, '_') || 'whiteboard';
      const path = docRow?.file_path || `${user.id}/${Date.now()}_${safe}.whiteboard.json`;
      await window.sb.storage.from('documents').upload(path, blob, { contentType: WB_MIME, upsert: true });
      const meta = { name: title, file_path: path, file_size: blob.size, mime_type: WB_MIME };
      let row = docRow;
      if (docRow?.id) {
        const { data } = await window.sb.from('documents').update(meta).eq('id', docRow.id).select().single();
        if (data) row = data;
      } else {
        const { data } = await window.sb.from('documents').insert({ owner_id: user.id, doc_type: 'whiteboard', ...meta }).select().single();
        if (data) {
          row = data;
          const url = new URL(window.location.href);
          url.searchParams.set('id', data.id);
          window.history.replaceState({}, '', url.toString());
        }
      }
      setDocRow(row);
      setSavedAt(new Date());
      return row;
    } finally {
      setSaving(false);
    }
  }, [clientId, docRow, title, user]);

  useEffect(() => {
    if (loading || !user) return undefined;
    window.clearTimeout(autosaveRef.current);
    autosaveRef.current = window.setTimeout(() => { save(); }, 1200);
    return () => window.clearTimeout(autosaveRef.current);
  }, [board, title, loading, save, user]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setHistory((prev) => {
          if (!prev.length) return prev;
          setBoard(prev[prev.length - 1]);
          return prev.slice(0, -1);
        });
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selected) {
        mutateBoard((draft) => {
          draft[selected.kind] = draft[selected.kind].filter((item) => item.id !== selected.id);
        });
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mutateBoard, save, selected]);

  const insertTemplate = useCallback((templateId) => {
    const canvas = canvasRef.current;
    const cx = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current;
    const cy = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current;
    pushHistory();
    mutateBoard((draft) => {
      if (templateId === 'mindmap') {
        draft.notes.push({ id: randomId('note'), x: cx - 220, y: cy - 110, width: 180, height: 120, text: 'Mikro-Klausur\nThema: Marktversagen', ...STICKY_THEMES[0] });
        draft.notes.push({ id: randomId('note'), x: cx + 40, y: cy - 20, width: 160, height: 120, text: 'Externe Effekte\n(VL07, S. 12)', ...STICKY_THEMES[1] });
        draft.texts.push({ id: randomId('text'), x: cx - 60, y: cy + 110, width: 150, height: 38, text: 'Hauptthema', color: '#4f46e5', bubble: true });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - 10, y1: cy + 110, x2: cx + 100, y2: cy + 10, color: '#94a3b8', width: 2 });
      }
      if (templateId === 'flow') {
        draft.frames.push({ id: randomId('frame'), x: cx - 240, y: cy - 110, width: 520, height: 250, title: 'Ablauf' });
        draft.texts.push({ id: randomId('text'), x: cx - 170, y: cy - 10, width: 120, height: 38, text: 'Start', color: '#0f172a', bubble: true });
        draft.texts.push({ id: randomId('text'), x: cx + 50, y: cy - 10, width: 120, height: 38, text: 'Ende', color: '#0f172a', bubble: true });
        draft.shapes.push({ id: randomId('shape'), type: 'arrow', x1: cx - 40, y1: cy + 5, x2: cx + 50, y2: cy + 5, color: '#6366f1', width: 2.5 });
      }
      if (templateId === 'matrix') {
        draft.frames.push({ id: randomId('frame'), x: cx - 240, y: cy - 150, width: 480, height: 300, title: 'Eisenhower-Matrix' });
        draft.shapes.push({ id: randomId('shape'), type: 'rect', x1: cx - 240, y1: cy - 150, x2: cx + 240, y2: cy + 150, color: '#cbd5e1', width: 2 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx, y1: cy - 150, x2: cx, y2: cy + 150, color: '#cbd5e1', width: 2 });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - 240, y1: cy, x2: cx + 240, y2: cy, color: '#cbd5e1', width: 2 });
      }
      if (templateId === 'cards') {
        draft.notes.push({ id: randomId('note'), x: cx - 210, y: cy - 70, width: 160, height: 110, text: 'Begriff', ...STICKY_THEMES[2] });
        draft.notes.push({ id: randomId('note'), x: cx + 20, y: cy - 70, width: 160, height: 110, text: 'Definition', ...STICKY_THEMES[3] });
        draft.shapes.push({ id: randomId('shape'), type: 'connector', x1: cx - 40, y1: cy - 10, x2: cx + 20, y2: cy - 10, color: '#94a3b8', width: 2 });
      }
    });
    setShowTemplates(false);
  }, [mutateBoard, pushHistory]);

  const placeSticker = useCallback((emoji) => {
    const canvas = canvasRef.current;
    const x = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current + (Math.random() - 0.5) * 180;
    const y = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current + (Math.random() - 0.5) * 120;
    pushHistory();
    mutateBoard((draft) => {
      draft.emojis.push({ id: randomId('emoji'), x, y, emoji, rotate: (Math.random() - 0.5) * 30 });
    });
    setShowStickers(false);
  }, [mutateBoard, pushHistory]);

  const handleImagePick = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const canvas = canvasRef.current;
      const x = ((canvas?.offsetWidth || 1000) / 2 - panRef.current.x) / zoomRef.current;
      const y = ((canvas?.offsetHeight || 700) / 2 - panRef.current.y) / zoomRef.current;
      pushHistory();
      mutateBoard((draft) => {
        draft.images.push({ id: randomId('image'), x, y, width: 220, height: 140, src: reader.result });
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }, [mutateBoard, pushHistory]);

  const updateArrayItem = useCallback((kind, id, patch) => {
    mutateBoard((draft) => {
      draft[kind] = draft[kind].map((item) => item.id === id ? { ...item, ...patch } : item);
    });
  }, [mutateBoard]);

  const startOverlayMove = useCallback((event, kind, item) => {
    if (tool !== 'select') {
      setSelected({ kind, id: item.id });
      return;
    }
    event.stopPropagation();
    const world = getWorldPoint(event, canvasRef.current, panRef.current, zoomRef.current);
    moveRef.current = { active: true, kind, id: item.id, startX: world.x, startY: world.y, origin: clone(item) };
    setSelected({ kind, id: item.id });
  }, [tool]);

  const onPointerDown = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(event.pointerId);
    const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);

    if (tool === 'pan' || event.button === 1) {
      dragPanRef.current = { active: true, startX: event.clientX, startY: event.clientY, originX: panRef.current.x, originY: panRef.current.y };
      return;
    }
    if (tool === 'select') {
      const found = findSelection(boardRef.current, world.x, world.y, zoomRef.current);
      if (found) {
        moveRef.current = { active: true, kind: found.kind, id: found.item.id, startX: world.x, startY: world.y, origin: clone(found.item) };
        setSelected({ kind: found.kind, id: found.item.id });
      } else {
        setSelected(null);
      }
      return;
    }
    if (tool === 'note') {
      pushHistory();
      const theme = STICKY_THEMES[boardRef.current.notes.length % STICKY_THEMES.length];
      mutateBoard((draft) => { draft.notes.push({ id: randomId('note'), x: world.x, y: world.y, width: 180, height: 130, text: 'Neue Notiz', ...theme }); });
      return;
    }
    if (tool === 'text') {
      pushHistory();
      mutateBoard((draft) => { draft.texts.push({ id: randomId('text'), x: world.x, y: world.y, width: 180, height: 48, text: 'Text', color, bubble: false }); });
      return;
    }
    if (tool === 'comment') {
      pushHistory();
      mutateBoard((draft) => { draft.comments.push({ id: randomId('comment'), x: world.x, y: world.y, width: 260, height: 140, text: 'Kommentar' }); });
      return;
    }
    if (tool === 'frame') {
      pushHistory();
      mutateBoard((draft) => { draft.frames.push({ id: randomId('frame'), x: world.x, y: world.y, width: 360, height: 220, title: 'Frame' }); });
      return;
    }
    if (tool === 'eraser') {
      const found = findSelection(boardRef.current, world.x, world.y, zoomRef.current);
      const strokeHit = findStroke(boardRef.current, world.x, world.y, zoomRef.current);
      if (found || strokeHit) {
        pushHistory();
        mutateBoard((draft) => {
          if (found) draft[found.kind] = draft[found.kind].filter((item) => item.id !== found.item.id);
          if (strokeHit) draft.strokes.splice(strokeHit.index, 1);
        });
      }
      return;
    }
    if (['rect', 'circle', 'arrow', 'connector'].includes(tool)) {
      pushHistory();
      shapeRef.current = { active: true, type: tool, x1: world.x, y1: world.y, x2: world.x, y2: world.y };
      return;
    }
    if (tool === 'pen' || tool === 'highlight') {
      pushHistory();
      drawRef.current = { active: true, stroke: { id: randomId('stroke'), tool, color, alpha: tool === 'highlight' ? 0.3 : 1, width: tool === 'highlight' ? 12 : 3, points: [world] } };
    }
  }, [color, mutateBoard, pushHistory, tool]);

  const onPointerMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (dragPanRef.current.active) {
      setPan({ x: dragPanRef.current.originX + event.clientX - dragPanRef.current.startX, y: dragPanRef.current.originY + event.clientY - dragPanRef.current.startY });
      return;
    }
    if (moveRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      const dx = world.x - moveRef.current.startX;
      const dy = world.y - moveRef.current.startY;
      mutateBoard((draft) => {
        draft[moveRef.current.kind] = draft[moveRef.current.kind].map((item) => {
          if (item.id !== moveRef.current.id) return item;
          const origin = moveRef.current.origin;
          if (moveRef.current.kind === 'shapes') return { ...item, x1: origin.x1 + dx, y1: origin.y1 + dy, x2: origin.x2 + dx, y2: origin.y2 + dy };
          return { ...item, x: origin.x + dx, y: origin.y + dy };
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
    if (drawRef.current.active) {
      const world = getWorldPoint(event, canvas, panRef.current, zoomRef.current);
      drawRef.current.stroke.points.push(world);
      const preview = clone(boardRef.current);
      preview.strokes.push(drawRef.current.stroke);
      drawBoard(canvas.getContext('2d'), preview, panRef.current, zoomRef.current);
    }
  }, [mutateBoard, redraw]);

  const onPointerUp = useCallback((event) => {
    dragPanRef.current.active = false;
    moveRef.current.active = false;
    canvasRef.current?.releasePointerCapture?.(event.pointerId);
    if (shapeRef.current.active) {
      const current = shapeRef.current;
      shapeRef.current = { active: false, type: null, x1: 0, y1: 0, x2: 0, y2: 0 };
      mutateBoard((draft) => {
        draft.shapes.push({ id: randomId('shape'), type: current.type, x1: current.x1, y1: current.y1, x2: current.x2, y2: current.y2, color, width: 2.5 });
      });
      return;
    }
    if (drawRef.current.active) {
      const stroke = clone(drawRef.current.stroke);
      drawRef.current = { active: false, stroke: null };
      mutateBoard((draft) => { draft.strokes.push(stroke); });
    }
  }, [color, mutateBoard]);

  const shareUrl = (() => {
    const url = new URL(window.location.href);
    if (docRow?.id) url.searchParams.set('id', docRow.id);
    return url.toString();
  })();

  const copyShareLink = async () => {
    if (!docRow?.id) await save();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt('Link kopieren', shareUrl);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Whiteboard wird geladen…</div>;

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative', background: '#fafaf7' }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />

      <div className="dot-paper" style={{ position: 'absolute', inset: 0, backgroundColor: '#fafaf7' }}>
        <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }} />

        {board.frames.map((frame) => {
          const p = toScreen(frame.x, frame.y, pan, zoom);
          return (
            <div key={frame.id} onPointerDown={(e) => startOverlayMove(e, 'frames', frame)} style={{ position: 'absolute', left: p.x, top: p.y, width: frame.width * zoom, height: frame.height * zoom, border: selected?.kind === 'frames' && selected?.id === frame.id ? '2px dashed #6366f1' : '1.5px dashed #94a3b8', borderRadius: 14, background: 'rgba(255,255,255,0.16)' }}>
              <input value={frame.title} onChange={(e) => updateArrayItem('frames', frame.id, { title: e.target.value })} style={{ position: 'absolute', top: -18, left: 10, border: 'none', background: 'white', padding: '4px 10px', borderRadius: 999, fontSize: 12, color: '#475569', boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }} />
            </div>
          );
        })}

        {board.notes.map((note) => {
          const p = toScreen(note.x, note.y, pan, zoom);
          return (
            <textarea key={note.id} value={note.text} onPointerDown={(e) => startOverlayMove(e, 'notes', note)} onChange={(e) => updateArrayItem('notes', note.id, { text: e.target.value })} style={{ position: 'absolute', left: p.x, top: p.y, width: note.width * zoom, height: note.height * zoom, padding: `${14 * zoom}px`, background: note.bg, border: `${selected?.kind === 'notes' && selected?.id === note.id ? 2 : 1}px solid ${note.border}`, borderRadius: 6, boxShadow: '2px 3px 0 rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.08)', fontFamily: 'Caveat', fontSize: Math.max(14, 18 * zoom), color: '#0f172a', resize: 'none', outline: 'none' }} />
          );
        })}

        {board.texts.map((text) => {
          const p = toScreen(text.x, text.y, pan, zoom);
          return text.bubble ? (
            <input key={text.id} value={text.text} onPointerDown={(e) => startOverlayMove(e, 'texts', text)} onChange={(e) => updateArrayItem('texts', text.id, { text: e.target.value })} style={{ position: 'absolute', left: p.x, top: p.y, width: text.width * zoom, padding: '10px 16px', background: 'white', border: `${selected?.kind === 'texts' && selected?.id === text.id ? 3 : 2}px solid #6366f1`, borderRadius: 999, fontSize: 13 * zoom, fontWeight: 500, color: text.color, textAlign: 'center', outline: 'none' }} />
          ) : (
            <textarea key={text.id} value={text.text} onPointerDown={(e) => startOverlayMove(e, 'texts', text)} onChange={(e) => updateArrayItem('texts', text.id, { text: e.target.value })} style={{ position: 'absolute', left: p.x, top: p.y, width: text.width * zoom, height: text.height * zoom, background: selected?.kind === 'texts' && selected?.id === text.id ? 'rgba(255,255,255,0.8)' : 'transparent', border: 'none', color: text.color, fontSize: Math.max(14, 20 * zoom), fontFamily: 'Caveat', outline: selected?.kind === 'texts' && selected?.id === text.id ? '1px dashed #6366f1' : 'none', resize: 'none' }} />
          );
        })}

        {board.comments.map((comment) => {
          const p = toScreen(comment.x, comment.y, pan, zoom);
          return (
            <div key={comment.id} onPointerDown={(e) => startOverlayMove(e, 'comments', comment)} style={{ position: 'absolute', left: p.x, top: p.y, width: comment.width * zoom, background: 'white', borderRadius: 18, border: selected?.kind === 'comments' && selected?.id === comment.id ? '2px solid #6366f1' : '1px solid #cbd5e1', boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}>
              <textarea value={comment.text} onChange={(e) => updateArrayItem('comments', comment.id, { text: e.target.value })} style={{ width: '100%', height: comment.height * zoom, border: 'none', background: 'transparent', resize: 'none', outline: 'none', padding: `${16 * zoom}px`, fontSize: Math.max(12, 14 * zoom), color: '#334155' }} />
            </div>
          );
        })}

        {board.images.map((image) => {
          const p = toScreen(image.x, image.y, pan, zoom);
          return (
            <div key={image.id} onPointerDown={(e) => startOverlayMove(e, 'images', image)} style={{ position: 'absolute', left: p.x, top: p.y, width: image.width * zoom, height: image.height * zoom, borderRadius: 16, overflow: 'hidden', border: selected?.kind === 'images' && selected?.id === image.id ? '2px solid #6366f1' : '1px solid rgba(15,23,42,0.08)', boxShadow: '0 10px 24px rgba(15,23,42,0.12)', background: 'white' }}>
              <img src={image.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          );
        })}

        {board.emojis.map((emoji) => {
          const p = toScreen(emoji.x, emoji.y, pan, zoom);
          return <div key={emoji.id} onPointerDown={(e) => startOverlayMove(e, 'emojis', emoji)} style={{ position: 'absolute', left: p.x, top: p.y, fontSize: 32 * zoom, transform: `rotate(${emoji.rotate}deg)`, filter: 'drop-shadow(2px 3px 4px rgba(15,23,42,0.15))' }}>{emoji.emoji}</div>;
        })}
      </div>

      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 10, padding: '6px 10px 6px 8px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', zIndex: 20 }}>
        <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8, borderRight: '1px solid #e2e8f0', textDecoration: 'none' }}>
          <Icons.Logo size={22} />
          <span style={{ fontFamily: 'Caveat', fontSize: 18, fontWeight: 600, color: '#0f172a' }}>StudyFlow</span>
        </a>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', fontWeight: 500, width: 160 }} />
        <span style={{ fontSize: 10.5, color: '#a78bfa', background: '#f3e8ff', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>Kostenlos</span>
        {savedAt && <span style={{ fontSize: 11, color: '#94a3b8' }}>{savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>

      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 8, zIndex: 20 }}>
        <button style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', padding: '6px 10px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#475569', fontFamily: 'inherit' }}>
          <Avatar name={user?.email || 'Du'} color="#06b6d4" size={22} />
          <Icons.Chevron size={10}/>
        </button>
        <div style={{ display: 'flex' }}>
          <Avatar name="Lara K" color="#ec4899" size={28} ring />
          <div style={{ marginLeft: -6 }}><Avatar name="Tim R" color="#f59e0b" size={28} ring /></div>
        </div>
        <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', padding: '6px 10px', borderRadius: 10, fontFamily: 'JetBrains Mono', fontSize: 11.5, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icons.Clock size={11}/>
          {saving ? 'sync' : `${Math.round(zoom * 100)}%`}
        </div>
        <button onClick={() => setShareOpen(true)} style={{ padding: '7px 14px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 10, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Share size={14}/> Teilen
        </button>
      </div>

      {showTemplates && <TemplatesPanel onClose={() => setShowTemplates(false)} onInsert={insertTemplate} />}
      {!showTemplates && <div style={{ position: 'absolute', right: 30, top: 380, display: 'flex', alignItems: 'center', gap: 8, zIndex: 15 }}><span style={{ fontSize: 22 }}>✨</span><button onClick={() => setShowTemplates(true)} style={{ background: 'white', border: '1px solid rgba(15,23,42,0.08)', padding: '8px 14px', borderRadius: 999, fontSize: 13, color: '#0f172a', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>Mit einer Vorlage beginnen <span style={{ color: '#94a3b8' }}>›</span></button></div>}
      {showStickers && <StickersPanel onClose={() => setShowStickers(false)} onPick={placeSticker} />}

      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {(tool === 'pen' || tool === 'highlight') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
            {PASTELS.concat(PALETTE).map((swatch) => (
              <button key={swatch} onClick={() => setColor(swatch)} style={{ width: 18, height: 18, borderRadius: '50%', background: swatch, border: color === swatch ? '2px solid #0f172a' : '1px solid rgba(15,23,42,0.1)', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        )}

        {showShapePicker && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 999, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
            {['rect', 'circle', 'arrow', 'connector'].map((shapeTool) => (
              <button key={shapeTool} onClick={() => { setTool(shapeTool); setShowShapePicker(false); }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: tool === shapeTool ? '#0f172a' : 'transparent', color: tool === shapeTool ? 'white' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {TOOL_DEFS[shapeTool].icon}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'white', borderRadius: 12, padding: 5, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 6px 20px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04)' }}>
          {TOOL_ROWS.map((item, index) => {
            if (item === 'divider') return <div key={`d_${index}`} style={{ width: 1, height: 22, background: '#e2e8f0', margin: '0 4px' }} />;
            const active = tool === item || (item === 'more' && showTemplates) || (item === 'sticker' && showStickers);
            return (
              <button
                key={item}
                onClick={() => {
                  if (item === 'sticker') { setShowStickers((prev) => !prev); return; }
                  if (item === 'more') { setShowTemplates((prev) => !prev); return; }
                  if (item === 'image') { fileInputRef.current?.click(); return; }
                  if (['rect', 'circle', 'arrow', 'connector'].includes(item)) { setTool(item); setShowShapePicker(false); return; }
                  setTool(item);
                  setShowShapePicker(false);
                }}
                onContextMenu={(e) => {
                  if (['rect', 'circle', 'arrow', 'connector'].includes(item)) {
                    e.preventDefault();
                    setShowShapePicker((prev) => !prev);
                  }
                }}
                title={TOOL_DEFS[item].label}
                style={{ width: 34, height: 34, borderRadius: 10, background: active ? '#0f172a' : 'transparent', color: active ? 'white' : '#475569', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              >
                {TOOL_DEFS[item].icon}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6, zIndex: 20 }}>
        <div style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          <button onClick={() => setZoom((prev) => Math.max(0.2, prev - 0.1))} style={{ padding: 7, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}>-</button>
          <span style={{ fontSize: 11.5, color: '#475569', fontFamily: 'JetBrains Mono', minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((prev) => Math.min(4, prev + 0.1))} style={{ padding: 7, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }}><Icons.Plus size={13}/></button>
        </div>
        <button onClick={() => save()} style={{ width: 30, height: 30, background: 'white', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Speichern"><Icons.Doc size={14}/></button>
      </div>

      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 20 }}>
        <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }} style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', padding: 8, borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }} title="Board zentrieren">
          <ToolIcon size={14}><path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></ToolIcon>
        </button>
      </div>

      {shareOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.36)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 520, background: 'white', borderRadius: 24, boxShadow: '0 24px 60px rgba(15,23,42,0.22)', padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Board teilen</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Link für Coworking und gemeinsames Bearbeiten.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input readOnly value={shareUrl} style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 12, padding: '11px 12px', fontSize: 12, color: '#334155' }} />
              <button onClick={copyShareLink} style={{ border: 'none', borderRadius: 12, padding: '0 16px', background: copied ? '#16a34a' : '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{copied ? 'Kopiert' : 'Kopieren'}</button>
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShareOpen(false)} style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: 10, padding: '9px 14px', cursor: 'pointer' }}>Schließen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Whiteboard />);
