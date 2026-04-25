// StudyFlow — AI Upload: Vision KI + Dokument-Upload
const { useState, useEffect, useRef } = React;

const AIRFORCE_KEY = 'sk-air-tWdMV6mXgoa1zAfHr8UfGVI9BFzyr5dXE2jdZO4pPApRVrXDyH6W6Bdv6RwmUctq';
const AI_URL = 'https://api.airforce/v1/chat/completions';
const VISION_MODEL = 'llama-4-scout';
const TEXT_MODEL = 'claude-sonnet-4-6';

const STAGES = [
  { key: 'idle',      label: 'Bereit' },
  { key: 'uploading', label: 'Lade hoch',          pct: 15 },
  { key: 'scanning',  label: 'Scanne Bild mit KI', pct: 45 },
  { key: 'reading',   label: 'Lese Dokument',       pct: 40 },
  { key: 'analyzing', label: 'Analysiere Themen',   pct: 70 },
  { key: 'generating',label: 'Erstelle Karten',     pct: 90 },
  { key: 'done',      label: 'Fertig!',             pct: 100 },
];

const IMAGE_TYPES = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp','image/tiff'];

function isImageFile(file) {
  return file && IMAGE_TYPES.includes(file.type.toLowerCase());
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h / 24)} T.`;
}

function readFileAsBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// Robustly extract JSON array from raw AI text
function extractJSON(raw) {
  if (!raw) return null;
  let s = raw.replace(/```(?:json|JSON)?\s*/g, '').replace(/```\s*/g, '').trim();
  const arr = s.match(/\[[\s\S]*\]/);
  if (arr) { try { const p = JSON.parse(arr[0]); if (Array.isArray(p) && p.length) return p; } catch {} }
  return null;
}

// Call llama-4-scout with image (base64 data URL) → returns raw AI text
async function analyzeImageWithVision(base64DataUrl) {
  const resp = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRFORCE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: base64DataUrl },
          },
          {
            type: 'text',
            text:
              'Du bist ein Lernassistent. Analysiere dieses Bild genau und erstelle Lern-Karteikarten.\n\n' +
              'WICHTIGE REGELN:\n' +
              '1. Wenn das Bild zwei Sprachen zeigt (z.B. Spanisch-Deutsch, Englisch-Deutsch, Vokabelliste), ' +
              'nutze Sprache A als "front" und Sprache B als "back". Vermische NICHT beide Sprachen auf einer Seite.\n' +
              '2. Wenn es eine Vokabelliste ist (z.B. Wort + Artikel wie "das Brot"), ' +
              'setze die Frage auf "front" (z.B. "Welchen Artikel hat Brot?") und die Antwort auf "back" (z.B. "das Brot").\n' +
              '3. Die Vorder- und Rückseite müssen sich INHALTLICH unterscheiden und ergänzen — niemals fast dasselbe auf beiden Seiten.\n' +
              '4. Bei Definitionen: Begriff → Erklärung. Bei Formeln: Formelname → Formel. Bei Fakten: Frage → Antwort.\n' +
              '5. Schreibe in der Sprache des Bildinhalts.\n\n' +
              'Gib NUR ein JSON-Array zurück, kein anderer Text:\n' +
              '[{"front":"Frage oder Begriff","back":"Antwort oder Erklärung"},...]',
          },
        ],
      }],
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    if (resp.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(`Vision-API Fehler ${resp.status}: ${txt.slice(0, 120)}`);
  }

  const data = await resp.json();
  return data.choices[0].message.content;
}

// Call text model to generate cards from document text
async function generateCardsFromText(text, cardCount) {
  const resp = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRFORCE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [{
        role: 'user',
        content:
          `Erstelle aus diesem Text genau ${cardCount} Lern-Karteikarten.\n` +
          'Gib NUR ein JSON-Array zurück, kein anderer Text.\n' +
          'Format: [{"front":"Frage oder Begriff","back":"Antwort oder Erklärung"},...]\n\n' +
          `Text:\n${text.slice(0, 12000)}`,
      }],
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Text-API Fehler ${resp.status}: ${txt.slice(0, 120)}`);
  }

  const data = await resp.json();
  return data.choices[0].message.content;
}

const AIUpload = () => {
  const [file, setFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [stage, setStage] = useState('idle');
  const [dragging, setDragging] = useState(false);
  const [output, setOutput] = useState({ summary: true, cards: 20, quiz: true });
  const [noSummaryMode, setNoSummaryMode] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const paramNoSummary = params.get('noSummary') === '1' || params.get('noSummary') === 'true';
  const paramTargetSetId = params.get('targetSetId') || null;
  const [userId, setUserId] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [error, setError] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [generatedCards, setGeneratedCards] = useState([]);
  const [saving, setSaving] = useState(false);
  const [rawAIOutput, setRawAIOutput] = useState('');
  const [scanProgress, setScanProgress] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const session = await window.requireAuth();
      if (!session) return;
      setUserId(session.user.id);
      loadRecentDocs(session.user.id);
    })();
    if (paramNoSummary) {
      setNoSummaryMode(true);
      setOutput(o => ({ ...o, summary: false }));
    }
  }, []);

  const loadRecentDocs = async (uid) => {
    const { data } = await window.sb.from('documents')
      .select('*')
      .eq('owner_id', uid)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentDocs(data || []);
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setStage('idle');
    setError('');
    setUploadedDoc(null);
    setGeneratedCards([]);
    setRawAIOutput('');
    setScanProgress('');

    // Image preview
    if (isImageFile(selectedFile)) {
      const url = URL.createObjectURL(selectedFile);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleInputChange = (e) => {
    const f = e.target.files[0];
    if (f) handleFileSelect(f);
  };

  const start = async () => {
    if (!file || !userId) return;
    setError('');
    setGeneratedCards([]);
    setRawAIOutput('');

    try {
      // ── Stage 1: Upload to Supabase Storage ──
      setStage('uploading');
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${Date.now()}_${safeFilename}`;

      const { error: uploadErr } = await window.sb.storage
        .from('documents')
        .upload(path, file, { contentType: file.type });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data: doc } = await window.sb.from('documents').insert({
        owner_id: userId,
        name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      }).select().single();

      if (doc) setUploadedDoc(doc);

      // ── Stage 2: Image or Document processing ──
      if (isImageFile(file)) {
        // ── IMAGE PATH: Vision AI ──
        setStage('scanning');
        setScanProgress('Lese Bilddaten…');

        const base64DataUrl = await readFileAsBase64(file);
        setScanProgress('KI analysiert Bild…');

        const aiRaw = await analyzeImageWithVision(base64DataUrl);
        setScanProgress('Verarbeite Antwort…');

        setRawAIOutput(aiRaw);

        const parsed = extractJSON(aiRaw);
        if (parsed && parsed.length > 0) {
          // Normalize keys (some models return "question"/"answer" variants)
          const normalized = parsed.map(c => ({
            front: c.front || c.question || c.Begriff || c.term || '',
            back:  c.back  || c.answer  || c.Erklärung || c.definition || '',
          })).filter(c => c.front || c.back);
          setGeneratedCards(normalized);
        } else {
          // Fallback: try text parser on raw output
          const fallback = parseRawToCards(aiRaw);
          if (fallback.length > 0) setGeneratedCards(fallback);
        }

        setScanProgress('');

      } else {
        // ── DOCUMENT PATH: simulated stages + text extraction ──
        setStage('reading');
        await new Promise(r => setTimeout(r, 1000));
        setStage('analyzing');
        await new Promise(r => setTimeout(r, 1200));
        setStage('generating');

        // Try to read text content for PDF/TXT/MD
        if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
          try {
            const text = await new Promise((res, rej) => {
              const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file);
            });
            if (text && text.trim().length > 10) {
              const aiRaw = await generateCardsFromText(text, output.cards || 20);
              setRawAIOutput(aiRaw);
              const parsed = extractJSON(aiRaw);
              if (parsed && parsed.length > 0) {
                const normalized = parsed.map(c => ({
                  front: c.front || c.question || '',
                  back:  c.back  || c.answer  || '',
                })).filter(c => c.front || c.back);
                setGeneratedCards(normalized);
              }
            }
          } catch (textErr) {
            console.warn('Text-Extraktion fehlgeschlagen', textErr);
          }
        }

        await new Promise(r => setTimeout(r, 800));
      }

      // Mark as AI processed
      if (doc) {
        await window.sb.from('documents').update({ ai_processed: true }).eq('id', doc.id);
      }

      setStage('done');
      loadRecentDocs(userId);

    } catch (err) {
      const msg = err.message || 'Fehler beim Verarbeiten';
      setError(msg === 'RATE_LIMIT' ? 'Rate-Limit erreicht — bitte kurz warten und nochmal versuchen.' : msg);
      setStage('idle');
      setScanProgress('');
    }
  };

  const stageObj = STAGES.find(s => s.key === stage) || STAGES[0];
  const isRunning = stage !== 'idle' && stage !== 'done';
  const isImage = file && isImageFile(file);

  // Visible progress stages depending on file type
  const visibleStages = isImage
    ? STAGES.filter(s => ['uploading','scanning','done'].includes(s.key))
    : STAGES.filter(s => ['uploading','reading','analyzing','generating','done'].includes(s.key));

  return (
    <div className="dot-paper" style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', background: 'white', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <a href="dashboard.html" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
          <Icons.ArrowLeft size={14}/> Dashboard
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Sparkles size={14}/>
          </div>
          Flow AI
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{recentDocs.length} Dokumente</div>
      </header>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 32px 80px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -10, left: 60, transform: 'rotate(-12deg)' }}>
            <Doodles.Sparkle color="#f59e0b" size={18}/>
          </div>
          <div style={{ position: 'absolute', top: 10, right: 80, transform: 'rotate(8deg)' }}>
            <Doodles.Star color="#6366f1" size={22}/>
          </div>
          <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 36, fontWeight: 600, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Foto oder Skript hochladen.
          </h1>
          <div style={{ fontFamily: 'Caveat', fontSize: 32, color: '#6366f1', fontWeight: 600, marginTop: 4 }}>
            Flow macht den Rest.
          </div>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 10, maxWidth: 520, marginInline: 'auto' }}>
            Bild, PDF, DOCX oder Text — Flow scannt den Inhalt mit KI und baut automatisch Karteikarten.
          </p>

          {/* AI badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '4px 12px', background: '#f1f5f9', borderRadius: 999, border: '1px solid #e2e8f0' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/>
            <span style={{ fontSize: 11.5, color: '#475569', fontWeight: 500 }}>
              Bild-Scan mit <span style={{ color: '#6366f1', fontWeight: 700 }}>Flow Vision KI</span>
            </span>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#991b1b', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {/* Dropzone or file preview */}
        {!file ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#6366f1' : '#cbd5e1'}`,
              borderRadius: 20,
              padding: 48,
              textAlign: 'center',
              background: dragging ? '#eef2ff' : 'white',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe' }}>
                <Icons.Eye size={24}/>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bbf7d0' }}>
                <Icons.Upload size={24}/>
              </div>
            </div>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 18, fontWeight: 600, color: '#0f172a' }}>
              Bild oder Datei hierher ziehen
            </div>
            <div style={{ fontSize: 13.5, color: '#64748b', marginTop: 6 }}>
              oder <span style={{ color: '#4f46e5', fontWeight: 500 }}>durchsuchen</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 16, lineHeight: 1.8 }}>
              <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>📷 Foto / Screenshot</span>
              {'  '}
              <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>📄 PDF · DOCX · TXT · MD</span>
              <br/>
              <span style={{ marginTop: 6, display: 'block' }}>max. 50 MB</span>
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>

            {/* File header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {isImage && imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="Vorschau"
                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 48, height: 58, background: '#eef2ff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
                  <Icons.Doc size={24}/>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500, color: '#0f172a' }}>{file.name}</div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>
                  {formatFileSize(file.size)}
                  {isImage && (
                    <span style={{ marginLeft: 8, background: '#eef2ff', color: '#4f46e5', padding: '2px 7px', borderRadius: 5, fontWeight: 500, fontSize: 11 }}>
                      📷 Bild-Scan
                    </span>
                  )}
                </div>
              </div>
              {!isRunning && stage !== 'done' && (
                <button
                  onClick={() => { setFile(null); setStage('idle'); setImagePreviewUrl(null); setGeneratedCards([]); }}
                  style={{ background: 'none', border: 'none', padding: 8, color: '#94a3b8', cursor: 'pointer' }}
                >
                  <Icons.X size={18}/>
                </button>
              )}
              {stage === 'done' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: '#d1fae5', color: '#065f46', fontSize: 12, fontWeight: 500 }}>
                  <Icons.Check size={12}/> Fertig
                </div>
              )}
            </div>

            {/* Progress while running */}
            {isRunning && (
              <div style={{ marginTop: 24, padding: 18, background: '#fafaf7', borderRadius: 12, border: '1px solid rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="float" style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Sparkles size={14}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{stageObj.label}…</div>
                    {scanProgress && <div style={{ fontSize: 11.5, color: '#6366f1', marginTop: 2 }}>{scanProgress}</div>}
                  </div>
                </div>
                <div style={{ height: 4, background: '#e2e8f0', borderRadius: 999, marginTop: 14, overflow: 'hidden' }}>
                  <div style={{ width: `${stageObj.pct || 20}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', transition: 'width 0.6s ease' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11.5, color: '#94a3b8' }}>
                  {visibleStages.slice(0, -1).map(s => (
                    <span key={s.key} style={{ color: stage === s.key ? '#4f46e5' : ((stageObj.pct || 0) >= s.pct ? '#10b981' : '#cbd5e1'), fontWeight: 500 }}>
                      {(stageObj.pct || 0) >= s.pct ? <span style={{ display: 'inline-flex', marginRight: 3 }}><Icons.Check size={12}/></span> : null}
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Done state */}
            {stage === 'done' && (
              <div style={{ marginTop: 24, padding: 20, background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', borderRadius: 14, border: '1px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4f46e5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  <Icons.Sparkles size={14}/>
                  {isImage ? 'BILD WURDE GESCANNT' : 'FLOW HAT ERSTELLT'}
                </div>
                <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 600, color: '#0f172a', marginTop: 4, lineHeight: 1.15 }}>
                  {generatedCards.length > 0
                    ? `${generatedCards.length} Karteikarten erkannt!`
                    : 'Dokument ist hochgeladen'}
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>
                  {isImage
                    ? `Flow KI hat den Bildinhalt analysiert und ${generatedCards.length} Karten erstellt.`
                    : 'Das Dokument wurde gespeichert.'}
                </div>

                {/* Generated cards (editable) */}
                {generatedCards.length > 0 && (
                  <div style={{ marginTop: 20, background: 'white', padding: 16, borderRadius: 12, border: '1px solid rgba(15,23,42,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                        Karteikarten bearbeiten
                      </div>
                      <button
                        onClick={() => setGeneratedCards([...generatedCards, { front: '', back: '' }])}
                        style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px' }}
                      >
                        + Karte hinzufügen
                      </button>
                    </div>

                    {/* Column headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', padding: '0 8px' }}>VORDERSEITE</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', padding: '0 8px' }}>RÜCKSEITE</div>
                      <div/>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                      {generatedCards.map((g, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'start' }}>
                          <textarea
                            value={g.front}
                            onChange={e => {
                              const copy = [...generatedCards]; copy[idx] = { ...copy[idx], front: e.target.value }; setGeneratedCards(copy);
                            }}
                            style={{ padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', minHeight: 56, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                            placeholder="Frage / Begriff"
                          />
                          <textarea
                            value={g.back}
                            onChange={e => {
                              const copy = [...generatedCards]; copy[idx] = { ...copy[idx], back: e.target.value }; setGeneratedCards(copy);
                            }}
                            style={{ padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', minHeight: 56, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                            placeholder="Antwort / Erklärung"
                          />
                          <button
                            onClick={() => setGeneratedCards(generatedCards.filter((_, i) => i !== idx))}
                            style={{ padding: 8, background: 'none', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', color: '#dc2626', fontSize: 12, display: 'flex', alignItems: 'center' }}
                            title="Entfernen"
                          >
                            <Icons.X size={12}/>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Save actions */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      {paramTargetSetId ? (
                        <button
                          onClick={async () => {
                            if (generatedCards.length === 0) return;
                            setSaving(true);
                            try {
                              const rows = generatedCards
                                .filter(c => c.front || c.back)
                                .map(c => ({ set_id: paramTargetSetId, front: c.front, back: c.back }));
                              const { error: insertErr } = await window.sb.from('cards').insert(rows);
                              if (insertErr) throw new Error(insertErr.message || 'Fehler beim Speichern');
                              window.location.href = `lernset.html?id=${encodeURIComponent(paramTargetSetId)}`;
                            } catch (err) {
                              alert(err.message || 'Fehler beim Speichern');
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className="btn-primary"
                          style={{ padding: '10px 18px', flex: 1, justifyContent: 'center' }}
                          disabled={saving}
                        >
                          {saving ? 'Speichert…' : <><Icons.Check size={14}/> {generatedCards.filter(c=>c.front||c.back).length} Karten ins Lernset speichern</>}
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            if (generatedCards.length === 0 || !userId) return;
                            setSaving(true);
                            try {
                              const title = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
                              const { data: newSet, error: setErr } = await window.sb.from('study_sets').insert({
                                owner_id: userId,
                                title: title.slice(0, 60) || 'Neues Lernset',
                              }).select().single();
                              if (setErr) throw new Error(setErr.message);
                              const rows = generatedCards
                                .filter(c => c.front || c.back)
                                .map(c => ({ set_id: newSet.id, front: c.front, back: c.back }));
                              const { error: insertErr } = await window.sb.from('cards').insert(rows);
                              if (insertErr) throw new Error(insertErr.message);
                              window.location.href = `lernset.html?id=${encodeURIComponent(newSet.id)}`;
                            } catch (err) {
                              alert(err.message || 'Fehler beim Erstellen');
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className="btn-primary"
                          style={{ padding: '10px 18px', flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                          disabled={saving}
                        >
                          {saving ? 'Erstelle Lernset…' : <><Icons.Sparkles size={14}/> Neues Lernset mit {generatedCards.filter(c=>c.front||c.back).length} Karten erstellen</>}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {generatedCards.length === 0 && (
                  <div style={{ marginTop: 16, padding: 14, background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.06)' }}>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
                      Kein Inhalt erkannt. Text manuell einfügen:
                    </div>
                    <textarea
                      value={rawAIOutput}
                      onChange={e => setRawAIOutput(e.target.value)}
                      style={{ width: '100%', minHeight: 100, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                      placeholder={'Frage 1; Antwort 1\nFrage 2; Antwort 2\n…'}
                    />
                    <button
                      onClick={() => {
                        const parsed = parseRawToCards(rawAIOutput);
                        if (parsed.length === 0) return alert('Keine Karten erkannt — Trennzeichen: ; | Tab oder Q:/A: Format.');
                        setGeneratedCards(parsed);
                      }}
                      className="btn-primary"
                      style={{ marginTop: 8, padding: '8px 16px' }}
                    >
                      Analysieren & Karten erstellen
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <a href="dashboard.html" className="btn-primary" style={{ padding: '10px 18px', flex: 1, justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a' }}>
                    <Icons.Home size={14}/> Dashboard
                  </a>
                  <button
                    onClick={() => { setFile(null); setStage('idle'); setUploadedDoc(null); setImagePreviewUrl(null); setGeneratedCards([]); }}
                    className="btn-ghost"
                    style={{ padding: '10px 16px' }}
                  >
                    Weiteres hochladen
                  </button>
                </div>
              </div>
            )}

            {/* Idle: options */}
            {stage === 'idle' && (
              <>
                {isImage ? (
                  /* Image mode: just a start button, no need for options */
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                    <div style={{ padding: 14, background: '#eef2ff', borderRadius: 12, border: '1px solid #c7d2fe', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4f46e5', fontWeight: 600 }}>
                        <Icons.Eye size={15}/> Flow Vision — Bild-Scan
                      </div>
                      <div style={{ fontSize: 12.5, color: '#475569', marginTop: 5, lineHeight: 1.6 }}>
                        Flow KI analysiert das Bild, erkennt Texte, Sprachen, Begriffe und Konzepte und erstellt automatisch passende Karteikarten.
                        Funktioniert mit Fotos, Screenshots, Tafelbildern und handschriftlichen Notizen.
                      </div>
                    </div>
                    <button onClick={start} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                      <Icons.Sparkles size={14}/> Bild scannen & Karten erstellen
                    </button>
                  </div>
                ) : (
                  /* Document mode: show output options */
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>Was soll Flow erstellen?</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { key: 'summary', label: 'Zusammenfassung', sub: 'Kompakte Übersicht der Kernthemen', icon: <Icons.Doc size={16}/> },
                        { key: 'quiz', label: 'Quizfragen', sub: '~8 Multiple-Choice-Fragen', icon: <Icons.Brain size={16}/> },
                      ].map(o => (
                        <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafaf7', borderRadius: 10, cursor: (o.key === 'summary' && noSummaryMode) ? 'default' : 'pointer', border: '1px solid rgba(15,23,42,0.04)', opacity: (o.key === 'summary' && noSummaryMode) ? 0.6 : 1 }}>
                          <div style={{ color: '#6366f1' }}>{o.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a' }}>{o.label}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{o.sub}</div>
                          </div>
                          <div style={{
                            width: 36, height: 20, borderRadius: 999,
                            background: output[o.key] ? '#6366f1' : '#cbd5e1',
                            position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                          }} onClick={() => { if (!(o.key === 'summary' && noSummaryMode)) setOutput({ ...output, [o.key]: !output[o.key] }); }}>
                            <div style={{
                              position: 'absolute', top: 2, left: output[o.key] ? 18 : 2,
                              width: 16, height: 16, borderRadius: '50%',
                              background: 'white', transition: 'left 0.2s',
                              boxShadow: '0 1px 2px rgba(15,23,42,0.15)',
                            }}/>
                          </div>
                        </label>
                      ))}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafaf7', borderRadius: 10, border: '1px solid rgba(15,23,42,0.04)' }}>
                        <div style={{ color: '#6366f1' }}><Icons.Cards size={16}/></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0f172a' }}>Karteikarten</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Frage-Antwort-Paare für Spaced Repetition</div>
                        </div>
                        <input type="number" value={output.cards} onChange={e => setOutput({...output, cards: parseInt(e.target.value) || 0})} style={{ width: 60, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, textAlign: 'center', fontFamily: 'inherit' }}/>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Karten</span>
                      </div>
                    </div>

                    <button onClick={start} className="btn-primary" style={{ marginTop: 20, width: '100%', justifyContent: 'center', padding: '13px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                      <Icons.Sparkles size={14}/> Hochladen & verarbeiten
                      <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.85 }}>~8 Sek</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Recent uploads */}
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Zuletzt verarbeitet</div>
          {recentDocs.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Noch keine Dokumente hochgeladen</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentDocs.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid rgba(15,23,42,0.04)' }}>
                  <Icons.Doc size={14}/>
                  <span style={{ fontSize: 13, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  {r.ai_processed && <span style={{ fontSize: 11, color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: 4 }}>KI</span>}
                  <span style={{ fontSize: 12, color: '#64748b' }}>{formatFileSize(r.file_size || 0)}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{relativeTime(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<AIUpload/>);

// ─── Helper: parse raw text into card pairs ───────────────────
function parseRawToCards(text) {
  if (!text || !text.trim()) return [];
  const t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  const lines = t.split('\n');
  const csvCandidates = lines.filter(l => /;|\t|\|/.test(l));
  if (csvCandidates.length >= 1) {
    const parsed = csvCandidates.map(l => {
      const sep = l.includes(';') ? ';' : (l.includes('\t') ? '\t' : '|');
      const [q, a] = l.split(sep).map(s => s.trim());
      return q && a ? { front: q, back: a } : null;
    }).filter(Boolean);
    if (parsed.length) return parsed;
  }

  const blocks = t.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  const pairs = [];
  for (const block of blocks) {
    if (/\bQ[:]?\b/i.test(block) && /\bA[:]?\b/i.test(block)) {
      const qMatch = block.match(/Q[:]?\s*(.*?)\s*(?=A[:]?)/is);
      const aMatch = block.match(/A[:]?\s*([\s\S]*)/i);
      const q = qMatch ? qMatch[1].trim() : '';
      const a = aMatch ? aMatch[1].trim() : '';
      if (q || a) pairs.push({ front: q || block, back: a || '' });
      continue;
    }
    const blines = block.split('\n').map(s => s.trim()).filter(Boolean);
    if (blines.length === 1) {
      const sepMatch = block.match(/\s[-–—:]\s/);
      if (sepMatch) {
        const sep = sepMatch[0];
        const [q, a] = block.split(sep).map(s => s.trim());
        if (q && a) { pairs.push({ front: q, back: a }); continue; }
      }
      pairs.push({ front: blines[0], back: '' });
    } else {
      pairs.push({ front: blines[0], back: blines.slice(1).join(' ') });
    }
  }

  if (pairs.length === 0 && lines.length >= 2) {
    const out = [];
    for (let i = 0; i < lines.length; i += 2) {
      const q = lines[i].trim();
      const a = (lines[i + 1] || '').trim();
      if (q) out.push({ front: q, back: a });
    }
    if (out.length) return out;
  }

  return pairs;
}
