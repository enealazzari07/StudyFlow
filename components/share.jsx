// StudyFlow — Set Share Accept Page
const { useState, useEffect } = React;

const token = new URLSearchParams(window.location.search).get('token');

const ShareAccept = () => {
  const [state, setState] = useState('loading'); // loading | found | already | done | error | invalid
  const [shareInfo, setShareInfo] = useState(null); // { set, cards, creatorName }
  const [user, setUser] = useState(null);
  const [copying, setCopying] = useState(false);
  const [newSetId, setNewSetId] = useState(null);

  useEffect(() => {
    (async () => {
      if (!token) { setState('invalid'); return; }

      const session = await window.requireAuth();
      if (!session) return;
      setUser(session.user);

      // Fetch token + set info
      const { data: tokenRow } = await window.sb
        .from('set_share_tokens')
        .select('set_id, created_by, study_sets(id, title, description, tags, visibility, owner_id)')
        .eq('token', token)
        .maybeSingle();

      if (!tokenRow || !tokenRow.study_sets) { setState('invalid'); return; }

      const originalSet = tokenRow.study_sets;

      // Check if user already has a copy
      const { data: existing } = await window.sb
        .from('study_sets')
        .select('id')
        .eq('owner_id', session.user.id)
        .eq('source_set_id', originalSet.id)
        .maybeSingle();

      if (existing) {
        setNewSetId(existing.id);
        setState('already');
        return;
      }

      // Fetch cards
      const { data: cards } = await window.sb
        .from('cards')
        .select('front, back, hint')
        .eq('set_id', originalSet.id)
        .order('created_at', { ascending: true });

      // Fetch creator display name
      const { data: creatorProfile } = await window.sb
        .from('profiles')
        .select('display_name')
        .eq('id', tokenRow.created_by)
        .maybeSingle();

      setShareInfo({
        set: originalSet,
        cards: cards || [],
        creatorName: creatorProfile?.display_name || 'Jemand',
      });
      setState('found');
    })();
  }, []);

  const handleAccept = async () => {
    if (!shareInfo || !user) return;
    setCopying(true);
    try {
      // Copy the set
      const { data: newSet, error: setErr } = await window.sb
        .from('study_sets')
        .insert({
          owner_id: user.id,
          title: shareInfo.set.title,
          description: shareInfo.set.description || null,
          tags: shareInfo.set.tags || [],
          visibility: 'private',
          source_set_id: shareInfo.set.id,
        })
        .select()
        .single();

      if (setErr || !newSet) throw setErr || new Error('Fehler beim Erstellen');

      // Copy all cards
      if (shareInfo.cards.length > 0) {
        const cardRows = shareInfo.cards.map(c => ({
          set_id: newSet.id,
          front: c.front,
          back: c.back,
          hint: c.hint || null,
          mastery_level: 'new',
        }));
        await window.sb.from('cards').insert(cardRows);
      }

      setNewSetId(newSet.id);
      setState('done');
    } catch (err) {
      console.error(err);
      setState('error');
    }
    setCopying(false);
  };

  // ── UI ────────────────────────────────────────────────────────
  const Wrapper = ({ children }) => (
    <div className="dot-paper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Logo bar */}
      <a href="dashboard.html" style={{ position: 'fixed', top: 20, left: 24, display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
          <Icons.Sparkles size={15} style={{ color: 'white' }}/>
        </div>
        <span style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 16, color: '#0f172a', letterSpacing: '-0.01em' }}>StudyFlow</span>
      </a>
      <div style={{ maxWidth: 440, width: '100%' }}>{children}</div>
    </div>
  );

  if (state === 'loading') return (
    <Wrapper>
      <div style={{ textAlign: 'center', fontFamily: 'Caveat', fontSize: 24, color: '#64748b' }}>Lädt…</div>
    </Wrapper>
  );

  if (state === 'invalid') return (
    <Wrapper>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 4px 20px rgba(15,23,42,0.07)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icons.X size={24}/>
        </div>
        <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Link ungültig</div>
        <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>Dieser Teilen-Link existiert nicht oder wurde entfernt.</div>
        <a href="dashboard.html" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#6366f1', color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 13.5, fontWeight: 600 }}>
          <Icons.ArrowLeft size={13}/> Zum Dashboard
        </a>
      </div>
    </Wrapper>
  );

  if (state === 'already') return (
    <Wrapper>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 4px 20px rgba(15,23,42,0.07)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icons.Check size={24}/>
        </div>
        <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Bereits in deiner Bibliothek</div>
        <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>Du hast dieses Lernset schon hinzugefügt.</div>
        <a href={`lernset.html?id=${newSetId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#6366f1', color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 13.5, fontWeight: 600 }}>
          <Icons.Cards size={13}/> Lernset öffnen
        </a>
      </div>
    </Wrapper>
  );

  if (state === 'done') return (
    <Wrapper>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 4px 20px rgba(15,23,42,0.07)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #c7d2fe' }}>
          <Icons.Cards size={24}/>
        </div>
        <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Lernset hinzugefügt! 🎉</div>
        <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>Du findest es jetzt in deiner eigenen Bibliothek — mit eigenem Lernfortschritt.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <a href={`lernset.html?id=${newSetId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#6366f1', color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 13.5, fontWeight: 600 }}>
            <Icons.Cards size={13}/> Lernset öffnen
          </a>
          <a href="dashboard.html" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f1f5f9', color: '#475569', borderRadius: 10, textDecoration: 'none', fontSize: 13.5 }}>
            Dashboard
          </a>
        </div>
      </div>
    </Wrapper>
  );

  if (state === 'error') return (
    <Wrapper>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 4px 20px rgba(15,23,42,0.07)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Caveat', fontSize: 22, color: '#dc2626', marginBottom: 12 }}>Etwas ist schiefgelaufen</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Bitte versuche es erneut.</div>
        <button onClick={() => setState('found')} style={{ padding: '9px 18px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Erneut versuchen
        </button>
      </div>
    </Wrapper>
  );

  // state === 'found'
  const { set, cards, creatorName } = shareInfo;
  return (
    <Wrapper>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 4px 20px rgba(15,23,42,0.07)' }}>
        {/* Set preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe', flexShrink: 0 }}>
            <Icons.Cards size={24}/>
          </div>
          <div>
            <div style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{set.title}</div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>{cards.length} Karten · von {creatorName}</div>
          </div>
        </div>

        {set.description && (
          <div style={{ fontSize: 13.5, color: '#475569', background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: '1px solid #e2e8f0', lineHeight: 1.55 }}>
            {set.description}
          </div>
        )}

        <div style={{ fontSize: 12.5, color: '#475569', background: '#eff6ff', borderRadius: 10, padding: '10px 14px', marginBottom: 20, border: '1px solid #bfdbfe', lineHeight: 1.55 }}>
          Dieses Lernset wird <strong>in deine Bibliothek kopiert</strong>. Dein Lernfortschritt ist unabhängig vom Original.
        </div>

        {/* Card preview (first 3) */}
        {cards.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Vorschau</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cards.slice(0, 3).map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f8fafc', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: 12.5 }}>
                  <div style={{ color: '#0f172a', fontFamily: 'Caveat', fontSize: 16 }}>{c.front}</div>
                  <div style={{ color: '#475569', borderLeft: '1px solid #e2e8f0', paddingLeft: 10 }}>{c.back}</div>
                </div>
              ))}
              {cards.length > 3 && <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>+ {cards.length - 3} weitere Karten</div>}
            </div>
          </div>
        )}

        <button onClick={handleAccept} disabled={copying}
          style={{ width: '100%', padding: '12px 0', background: copying ? '#818cf8' : '#6366f1', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: copying ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.15s' }}>
          {copying ? 'Wird hinzugefügt…' : <><Icons.Cards size={15}/> Zu meiner Bibliothek hinzufügen</>}
        </button>
      </div>
    </Wrapper>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<ShareAccept/>);
