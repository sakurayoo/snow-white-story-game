import { useState, useRef, useEffect } from 'react';
import { api, RateLimitError } from './api/api';

/* ── Mood detection ── */
function detectMood(text = '') {
  if (/害怕|危險|恐懼|顫抖|黑暗|陰影/.test(text)) return { emoji: '😨', label: '憂慮不安', color: '#9B6FD4' };
  if (/哭泣|悲傷|難過|眼淚|傷心/.test(text))      return { emoji: '😢', label: '悲傷憂鬱', color: '#5B8AD4' };
  if (/生氣|憤怒|皇后|詛咒|邪惡/.test(text))      return { emoji: '😤', label: '憤慨不平', color: '#E05252' };
  if (/驚訝|驚喜|神奇|魔法|奇蹟/.test(text))      return { emoji: '✨', label: '驚奇探索', color: '#C9920A' };
  if (/開心|快樂|喜悅|歡笑|美好|感謝/.test(text)) return { emoji: '😊', label: '開心喜悅', color: '#52A55B' };
  if (/愛|思念|溫柔|善良|美麗|純真/.test(text))   return { emoji: '💕', label: '溫柔善良', color: '#E07CAB' };
  return { emoji: '🌸', label: '期待冒險', color: '#D4689A' };
}

/* ── Parse A/B/C from AI text ── */
function parseStory(text = '') {
  const choices = {};
  const storyLines = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-C])[.、．]\s*(.+)/);
    if (m) choices[m[1]] = m[2].trim();
    else storyLines.push(line);
  }
  return { story: storyLines.join('\n').trim(), choices };
}

/* ── Format seconds → "X 分 Y 秒" ── */
function formatWait(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m > 0 && s > 0) return `${m} 分 ${s} 秒`;
  if (m > 0) return `${m} 分鐘`;
  return `${s} 秒`;
}

/* ── Icons ── */
const MoonIcon  = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
const SunIcon   = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
const SendIcon  = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;

/* ══════════════════════════════════
   BOOK OPENING SCREEN
══════════════════════════════════ */
function BookScreen({ onBookClick, bookPhase, dark, setDark }) {
  const isOpening = bookPhase === 'flipping';

  return (
    <div className="min-h-screen sakura-bg flex flex-col items-center justify-center gap-6 p-4 relative overflow-hidden">
      <span className="absolute top-6  left-10  text-3xl opacity-20 rotate-12  select-none pointer-events-none">🌸</span>
      <span className="absolute top-14 right-14 text-2xl opacity-15 -rotate-12 select-none pointer-events-none">🌸</span>
      <span className="absolute bottom-16 left-16 text-2xl opacity-15 rotate-45  select-none pointer-events-none">🌸</span>
      <span className="absolute bottom-10 right-10 text-3xl opacity-20 -rotate-6 select-none pointer-events-none">🌸</span>

      <p className="text-pink-400 text-xs tracking-[0.3em] uppercase select-none">✦ A Fairy Tale ✦</p>

      {/* ── The Book ── */}
      <div
        style={{ perspective: '1200px', cursor: isOpening ? 'default' : 'pointer' }}
        onClick={isOpening ? undefined : onBookClick}
      >
        {/* Outer wrapper — slight 3D tilt when idle */}
        <div className="select-none" style={{
          position: 'relative', width: 240, height: 340,
          transform: isOpening ? 'none' : 'rotateY(-8deg) rotateX(3deg)',
          transition: 'transform 0.3s ease',
        }}>

          {/* ── BODY: spine + inner pages + page edges (always visible) ── */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '5px 12px 12px 5px',
            background: '#FFF5EE',
            boxShadow: '6px 8px 28px rgba(0,0,0,0.32)',
            overflow: 'hidden',
          }}>
            {/* Spine strip */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 26,
              background: 'linear-gradient(to right, #3A1608, #6B3210, #3A1608)',
              borderRadius: '5px 0 0 5px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}>
              <div style={{ width: 1, height: 32, background: 'rgba(180,130,60,0.3)' }}/>
              <p style={{ fontSize: 7, color: 'rgba(180,130,60,0.45)', margin: 0,
                          writingMode: 'vertical-rl', letterSpacing: '0.18em' }}>SNOW WHITE</p>
              <div style={{ width: 1, height: 32, background: 'rgba(180,130,60,0.3)' }}/>
            </div>

            {/* Inner page area (revealed when cover opens) */}
            <div style={{
              position: 'absolute', left: 26, right: 13, top: 0, bottom: 0,
              background: '#FFF8F2',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '60%' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(201,168,128,0.3)' }}/>
                <span style={{ color: 'rgba(201,168,128,0.4)', fontSize: 9 }}>✦</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(201,168,128,0.3)' }}/>
              </div>
              <span style={{ fontSize: 30, opacity: 0.18 }}>🌸</span>
              <p style={{ fontFamily: "'Noto Serif TC', serif", fontSize: 10,
                          color: 'rgba(201,168,128,0.45)', margin: 0 }}>書頁翻開中…</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '60%' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(201,168,128,0.3)' }}/>
                <span style={{ color: 'rgba(201,168,128,0.4)', fontSize: 9 }}>✦</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(201,168,128,0.3)' }}/>
              </div>
            </div>

            {/* Page edges (right side — layered lines suggesting pages) */}
            <div style={{
              position: 'absolute', right: 0, top: 5, bottom: 5, width: 13,
              background: 'linear-gradient(to right, #E8D4BA, #F2E6D4)',
              borderRadius: '0 8px 8px 0',
            }}>
              {Array.from({ length: 22 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: `${4 + i * 4.2}%`,
                  left: 1, right: 1, height: 1,
                  background: `rgba(0,0,0,${0.04 + (i % 3) * 0.01})`,
                }}/>
              ))}
            </div>
          </div>

          {/* ── COVER: rotates open from spine ── */}
          <div className={`book-cover${isOpening ? ' book-cover-open' : ''}`}
               style={{ position: 'absolute', inset: 0 }}>

            {/* Front face — leather cover with title & image */}
            <div className="book-face-front" style={{
              background: 'linear-gradient(150deg, #7B3A1A 0%, #9B4C22 35%, #7B3A1A 70%, #5A2C0E 100%)',
              borderRadius: '5px 12px 12px 5px',
              boxShadow: isOpening ? 'none' : '4px 4px 18px rgba(0,0,0,0.45), inset -5px 0 10px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}>
              {/* Spine strip on front face */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 26,
                background: 'linear-gradient(to right, #3A1608, #6B3210, #3A1608)',
                borderRadius: '5px 0 0 5px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 6,
              }}>
                <div style={{ width: 1, height: 32, background: 'rgba(180,130,60,0.35)' }}/>
                <p style={{ fontSize: 7, color: 'rgba(180,130,60,0.5)', margin: 0,
                            writingMode: 'vertical-rl', letterSpacing: '0.18em' }}>SNOW WHITE</p>
                <div style={{ width: 1, height: 32, background: 'rgba(180,130,60,0.35)' }}/>
              </div>

              {/* Main cover area */}
              <div style={{
                marginLeft: 26, height: '100%', padding: '18px 14px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(180,130,60,0.45)' }}/>
                  <span style={{ color: 'rgba(180,130,60,0.65)', fontSize: 10 }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(180,130,60,0.45)' }}/>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,215,150,0.6)', fontSize: 9,
                              letterSpacing: '0.28em', margin: '0 0 5px 0' }}>童 話 冒 險</p>
                  <h1 style={{ fontFamily: "'Noto Serif TC', serif", color: 'white',
                               fontSize: 24, fontWeight: 700, lineHeight: 1.2, margin: 0,
                               textShadow: '0 2px 10px rgba(0,0,0,0.65)' }}>白雪公主</h1>
                  <p style={{ color: 'rgba(255,215,150,0.5)', fontSize: 10,
                              margin: '3px 0 0 0', fontStyle: 'italic' }}>的故事</p>
                </div>
                <div style={{ width: 110, height: 126, borderRadius: 8, overflow: 'hidden',
                              border: '2px solid rgba(180,130,60,0.55)',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.45)' }}>
                  <img src="/snowwhite.jpg" alt="白雪公主"
                       style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}/>
                </div>
                <p style={{ color: 'rgba(255,230,180,0.4)', fontSize: 10, margin: 0 }}
                   className={isOpening ? '' : 'animate-pulse'}>
                  {isOpening ? '書本打開中…' : '點擊打開書本 ✦'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(180,130,60,0.45)' }}/>
                  <span style={{ color: 'rgba(180,130,60,0.65)', fontSize: 10 }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(180,130,60,0.45)' }}/>
                </div>
              </div>
            </div>

            {/* Back face — inside cover (cream endpaper) */}
            <div className="book-face-back" style={{
              borderRadius: '12px 5px 5px 12px',
              background: 'linear-gradient(135deg, #FFF8F2 0%, #FAEEDD 50%, #F5E8D0 100%)',
              boxShadow: 'inset 5px 0 18px rgba(0,0,0,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center', opacity: 0.2 }}>
                <div style={{ fontSize: 36 }}>🌸</div>
                <div style={{ height: 1, width: 60, background: 'rgba(201,168,128,1)', margin: '8px auto' }}/>
                <p style={{ fontFamily: "'Noto Serif TC', serif", fontSize: 9,
                            color: 'rgba(160,100,60,1)', letterSpacing: '0.15em', margin: 0 }}>Snow White</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {!isOpening && (
        <button onClick={() => setDark(!dark)}
          className="flex items-center gap-1.5 text-[11px] text-pink-400 hover:text-pink-600 transition-colors px-3 py-2 rounded-full">
          {dark ? <SunIcon/> : <MoonIcon/>}
          {dark ? '淺色模式' : '深色模式'}
        </button>
      )}
    </div>
  );
}

/* ── Page divider ── */
const PageDivider = () => (
  <div className="flex items-center gap-2 my-4">
    <div className="h-px flex-1 bg-[#DDBB99]/45 dark:bg-[#6B3030]/50"/>
    <span className="text-[#C9A880] dark:text-[#6B3030] text-[10px]">✦</span>
    <div className="h-px flex-1 bg-[#DDBB99]/45 dark:bg-[#6B3030]/50"/>
  </div>
);

/* ══════════════════════════════════
   MAIN APP
══════════════════════════════════ */
export default function App() {
  const [convId, setConvId]         = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [started, setStarted]       = useState(false);
  const [error, setError]           = useState('');
  const [dark, setDark]             = useState(false);
  const [bookPhase, setBookPhase]   = useState('idle');
  const [customMode, setCustomMode] = useState(false);
  const [showInfo, setShowInfo]     = useState(false);
  const [rateLimit, setRateLimit]   = useState(null); // { seconds: N } or null
  const [countdown, setCountdown]   = useState(0);

  const inputRef    = useRef(null);
  const storyEndRef = useRef(null);
  const animTextRef = useRef('');

  /* ── Derived ── */
  const latestAI      = [...messages].reverse().find(m => m.role === 'assistant');
  const { choices }   = parseStory(latestAI?.content);
  const mood          = detectMood(latestAI?.content);
  const allUserMsgs   = messages.filter(m => m.role === 'user');
  const round         = allUserMsgs.length;
  const storySegments = messages
    .filter(m => m.role === 'assistant')
    .map(m => parseStory(m.content).story)
    .filter(Boolean);
  const aiMsgCount    = storySegments.length;

  const recentCount   = Math.min(4, round);
  const recentChoices = allUserMsgs.slice(-recentCount).map((m, i) => ({
    content: m.content,
    roundNum: round - recentCount + i + 1,
  }));

  const isDisabled = loading || rateLimit !== null;

  /* ── Typewriter state ── */
  const [animatingIdx,  setAnimatingIdx]  = useState(-1);
  const [animatedChars, setAnimatedChars] = useState(0);
  const [showChoices,   setShowChoices]   = useState(false);

  /* ── Effects ── */
  useEffect(() => { if (customMode) inputRef.current?.focus(); }, [customMode]);
  useEffect(() => { storyEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  /* Countdown when rate limited */
  useEffect(() => {
    if (!rateLimit) { setCountdown(0); return; }
    setCountdown(Math.ceil(rateLimit.seconds));
  }, [rateLimit]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /* Start typewriter when a new AI segment arrives */
  useEffect(() => {
    if (aiMsgCount === 0) return;
    setRateLimit(null);
    const lastIdx = aiMsgCount - 1;
    animTextRef.current = storySegments[lastIdx] ?? '';
    setAnimatingIdx(lastIdx);
    setAnimatedChars(0);
    setShowChoices(false);
  }, [aiMsgCount]); // eslint-disable-line

  /* Typewriter tick — 28ms per character */
  useEffect(() => {
    if (animatingIdx < 0 || showChoices) return;
    const text = animTextRef.current;
    if (animatedChars >= text.length) { setShowChoices(true); return; }
    const t = setTimeout(() => setAnimatedChars(c => c + 1), 28);
    return () => clearTimeout(t);
  }, [animatedChars, animatingIdx, showChoices]);

  /* Skip animation on story-area click */
  function skipAnimation() {
    if (!showChoices && animatingIdx >= 0) {
      setAnimatedChars(animTextRef.current.length);
    }
  }

  /* ── API actions ── */
  async function startAdventure() {
    setLoading(true); setError(''); setRateLimit(null);
    try {
      const conv = await api.createConversation('白雪公主的故事');
      setConvId(conv.id);
      const aiMsg = await api.sendMessage(conv.id, '開始遊戲');
      setMessages([aiMsg]);
    } catch (e) {
      if (e instanceof RateLimitError) {
        setRateLimit({ seconds: e.waitSeconds });
      } else {
        console.error('[Groq]', e);
      }
    } finally { setLoading(false); }
  }

  function handleBookClick() {
    if (bookPhase !== 'idle') return;
    setBookPhase('flipping');
    setTimeout(() => {
      setStarted(true);
      startAdventure();
    }, 1200);
  }

  async function sendChoice(content) {
    if (!content.trim() || isDisabled) return;
    setLoading(true); setError(''); setRateLimit(null); setCustomMode(false); setInput('');
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, role: 'user', content }]);
    try {
      const aiMsg = await api.sendMessage(convId, content);
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      if (e instanceof RateLimitError) {
        setRateLimit({ seconds: e.waitSeconds });
      } else {
        console.error('[Groq]', e);
      }
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally { setLoading(false); }
  }

  function restart() {
    setStarted(false); setMessages([]); setConvId(null);
    setError(''); setCustomMode(false); setInput('');
    setBookPhase('idle'); setShowInfo(false); setRateLimit(null); setCountdown(0);
    setAnimatingIdx(-1); setAnimatedChars(0); setShowChoices(false);
  }

  /* ── Opening screen ── */
  if (!started) return (
    <div className={dark ? 'dark' : ''}>
      <BookScreen onBookClick={handleBookClick} bookPhase={bookPhase} dark={dark} setDark={setDark}/>
    </div>
  );

  /* ── LEFT PAGE content ── */
  const leftContent = (
    <div className="flex flex-col h-full overflow-y-auto p-5">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div className="w-28 h-32 rounded-xl overflow-hidden border-2 border-[#DDBB99]/80 dark:border-[#6B3030]/80 shadow-md">
          <img src="/snowwhite.jpg" alt="白雪公主" className="w-full h-full object-cover object-top"/>
        </div>
        <h2 className="mt-3 text-sm font-bold text-[#6B3A1A] dark:text-rose-300"
            style={{ fontFamily: "'Noto Serif TC', serif" }}>白雪公主</h2>
        <p className="text-[9px] text-[#C9A880] tracking-[0.25em]">SNOW WHITE</p>
      </div>

      <PageDivider/>

      {/* Mood */}
      <div className="bg-rose-50/70 dark:bg-rose-900/20 rounded-xl p-3 text-center border border-[#DDBB99]/60 dark:border-rose-800/40">
        <p className="text-xl mb-1">{mood.emoji}</p>
        <p className="text-[11px] font-semibold" style={{ color: mood.color }}>{mood.label}</p>
        <p className="text-[9px] text-[#C9A880] mt-0.5">心情狀態</p>
      </div>

      <PageDivider/>

      {/* Story progress */}
      <div>
        <p className="text-[10px] font-semibold text-[#9B6040] dark:text-[#C9A880] mb-2 tracking-wide text-center">── 故事進展 ──</p>
        {recentChoices.length === 0 ? (
          <p className="text-[11px] text-[#C9A880]/60 italic text-center"
             style={{ fontFamily: "'Noto Serif TC', serif" }}>冒險尚未開始…</p>
        ) : (
          <div className="space-y-2">
            {recentChoices.map(({ content, roundNum }) => (
              <div key={roundNum} className="flex gap-1.5 text-[10px]">
                <span className="text-[#C9A880] flex-shrink-0 font-medium w-8">第{roundNum}回</span>
                <p className="text-[#5D3820] dark:text-[#D4B090] line-clamp-2 leading-relaxed flex-1">{content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1"/>

      {/* Controls */}
      <div className="space-y-1.5 mt-3">
        <p className="text-center text-[9px] text-[#C9A880] mb-1">第 {round} 回合</p>
        <button onClick={restart}
          className="w-full text-[10px] py-2 rounded-xl border border-[#DDBB99]/60 dark:border-[#6B3030]/40 text-[#9B6040] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
          ↺ 重新開始
        </button>
        <button onClick={() => setDark(!dark)}
          className="w-full flex items-center justify-center gap-1 text-[10px] py-1.5 text-[#C9A880] hover:text-[#9B6040] dark:hover:text-rose-300 transition-colors">
          {dark ? <SunIcon/> : <MoonIcon/>}
          {dark ? '淺色模式' : '深色模式'}
        </button>
      </div>
    </div>
  );

  /* ── RIGHT PAGE content ── */
  const hasChoices = Object.keys(choices).length > 0;

  const rightContent = (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#DDBB99]/40 dark:border-[#6B3030]/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInfo(true)}
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-[#DDBB99]/60 dark:border-[#6B3030]/40 text-sm">
            👸
          </button>
          <h1 className="text-[13px] font-bold text-[#6B3A1A] dark:text-rose-300"
              style={{ fontFamily: "'Noto Serif TC', serif" }}>白雪公主的故事</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#C9A880] bg-rose-50/80 dark:bg-rose-900/20 border border-[#DDBB99]/50 dark:border-[#6B3030]/40 px-2 py-0.5 rounded-full">
            第 {round} 回合
          </span>
          <button onClick={() => setDark(!dark)}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded text-[#C9A880] hover:text-[#9B6040] dark:hover:text-rose-300 transition-colors">
            {dark ? <SunIcon/> : <MoonIcon/>}
          </button>
        </div>
      </div>

      {/* Story text — click anywhere to skip typewriter */}
      <div className="flex-1 min-h-0 overflow-y-auto" onClick={skipAnimation}>
        <div className="min-h-full px-5 py-4 flex flex-col">

          {/* Initial loading: book-page placeholder */}
          {storySegments.length === 0 && loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-6">
              <div className="flex items-center gap-2 w-full max-w-[200px]">
                <div className="h-px flex-1 bg-[#DDBB99]/40 dark:bg-[#6B3030]/40"/>
                <span className="text-[#C9A880] text-[10px]">✦</span>
                <div className="h-px flex-1 bg-[#DDBB99]/40 dark:bg-[#6B3030]/40"/>
              </div>
              <div className="w-14 h-14 rounded-full border border-[#DDBB99]/50 dark:border-[#6B3030]/50 flex items-center justify-center text-2xl opacity-50 select-none">
                🌸
              </div>
              <p className="text-[#C9A880] text-sm" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                書頁翻開中…
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A880] dot-1"/>
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A880] dot-2"/>
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A880] dot-3"/>
              </div>
              <div className="flex items-center gap-2 w-full max-w-[200px]">
                <div className="h-px flex-1 bg-[#DDBB99]/40 dark:bg-[#6B3030]/40"/>
                <span className="text-[#C9A880] text-[10px]">✦</span>
                <div className="h-px flex-1 bg-[#DDBB99]/40 dark:bg-[#6B3030]/40"/>
              </div>
            </div>
          )}

          {/* Rate limit notice — initial start */}
          {storySegments.length === 0 && rateLimit && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-6 px-4">
              <div className="text-4xl select-none">{countdown === 0 ? '✨' : '🌙'}</div>
              <p className="text-[#8B4060] dark:text-rose-300 text-[13px]" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {countdown === 0 ? '魔法恢復了！' : '公主需要先休息片刻…'}
              </p>
              <div className="bg-rose-50/80 dark:bg-rose-900/20 border border-[#DDBB99]/50 dark:border-[#6B3030]/40 rounded-xl px-5 py-3 text-center min-w-[160px]">
                <p className="text-[12px] text-[#9B6040] dark:text-[#C9A880] font-medium">免費魔法額度暫時用完</p>
                {countdown > 0
                  ? <p className="text-[11px] text-[#C9A880] mt-1">
                      請等待 <span className="font-semibold tabular-nums text-[#9B6040] dark:text-rose-300 text-[13px]">{formatWait(countdown)}</span>
                    </p>
                  : <p className="text-[11px] text-[#52A55B] dark:text-green-400 mt-1 font-medium">可以繼續冒險了！</p>
                }
              </div>
              <button
                onClick={() => { setRateLimit(null); startAdventure(); }}
                className={`mt-1 px-4 py-1.5 rounded-full text-[11px] border transition-colors ${
                  countdown === 0
                    ? 'border-[#52A55B]/70 text-[#52A55B] bg-green-50/80 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40'
                    : 'border-[#DDBB99]/70 dark:border-[#6B3030]/60 text-[#C9A880] bg-white/50 dark:bg-[#2A1515]/50 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                }`}>
                {countdown === 0 ? '✨ 繼續冒險' : '再試一次'}
              </button>
            </div>
          )}

          {/* Accumulated story segments with typewriter on latest */}
          {storySegments.map((seg, i) => (
            <div key={i}>
              {i > 0 && <PageDivider/>}
              <p className="story-text text-[#3D2B1F] dark:text-[#F0D8CC] text-[14px] whitespace-pre-wrap">
                {i === animatingIdx ? seg.slice(0, animatedChars) : seg}
                {/* Blinking cursor while typing */}
                {i === animatingIdx && !showChoices && (
                  <span className="inline-block w-0.5 h-4 bg-[#C9A880] ml-0.5 align-middle animate-pulse"/>
                )}
              </p>
            </div>
          ))}

          {/* Loading dots while waiting for next AI response */}
          {loading && storySegments.length > 0 && (
            <div className="flex items-center gap-1.5 mt-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A880] dot-1"/>
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A880] dot-2"/>
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A880] dot-3"/>
            </div>
          )}

          {/* Rate limit notice — mid-game */}
          {rateLimit && storySegments.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[#DDBB99]/40 dark:bg-[#6B3030]/40"/>
                <span className="text-[9px] text-[#C9A880]">✦</span>
                <div className="h-px flex-1 bg-[#DDBB99]/40 dark:bg-[#6B3030]/40"/>
              </div>
              <div className={`flex items-start gap-2.5 border rounded-xl px-4 py-3 transition-colors duration-500 ${
                countdown === 0
                  ? 'bg-green-50/70 dark:bg-green-900/15 border-green-200/60 dark:border-green-800/40'
                  : 'bg-rose-50/70 dark:bg-rose-900/15 border-[#DDBB99]/50 dark:border-[#6B3030]/40'
              }`}>
                <span className="text-xl select-none flex-shrink-0">{countdown === 0 ? '✨' : '🌙'}</span>
                <div className="flex-1">
                  <p className="text-[12px] font-medium" style={{ fontFamily: "'Noto Serif TC', serif",
                    color: countdown === 0 ? '#52A55B' : '#8B4060' }}>
                    {countdown === 0 ? '魔法已恢復！' : '魔法暫時休憩中'}
                  </p>
                  {countdown > 0
                    ? <p className="text-[11px] text-[#9B6040] dark:text-[#C9A880] mt-0.5">
                        免費額度暫時用完，請等待{' '}
                        <span className="font-semibold tabular-nums text-[#8B4060] dark:text-rose-300 text-[13px]">
                          {formatWait(countdown)}
                        </span>
                      </p>
                    : <p className="text-[11px] text-[#52A55B] dark:text-green-400 mt-0.5">可以繼續選擇了！</p>
                  }
                </div>
              </div>
              <button
                onClick={() => setRateLimit(null)}
                className={`self-end px-3 py-1 rounded-full text-[10px] border transition-colors ${
                  countdown === 0
                    ? 'border-[#52A55B]/60 text-[#52A55B] bg-green-50/80 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40'
                    : 'border-[#DDBB99]/60 dark:border-[#6B3030]/50 text-[#C9A880] hover:text-[#9B6040] dark:hover:text-rose-300'
                }`}>
                {countdown === 0 ? '✨ 繼續冒險' : '我已等待，繼續冒險'}
              </button>
            </div>
          )}

          {/* Skip hint while typing */}
          {!showChoices && animatingIdx >= 0 && !loading && (
            <p className="text-[9px] text-[#C9A880]/50 mt-3 text-center select-none">點擊畫面可跳過文字動畫</p>
          )}

          <div ref={storyEndRef}/>
        </div>
      </div>

      {/* Choice area — always rendered when choices exist; dimmed during animation or loading */}
      {(hasChoices || storySegments.length > 0) && (
        <div className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-[#DDBB99]/40 dark:border-[#6B3030]/40">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-[#DDBB99]/45 dark:bg-[#6B3030]/50"/>
            <span className="text-[9px] text-[#C9A880]">✦ 你的選擇 ✦</span>
            <div className="h-px flex-1 bg-[#DDBB99]/45 dark:bg-[#6B3030]/50"/>
          </div>

          {/* Buttons: faded while loading or while typewriter is running */}
          <div className={`space-y-1.5 transition-opacity duration-500 ${
            loading ? 'opacity-35 pointer-events-none'
            : !showChoices ? 'opacity-40 pointer-events-none'
            : 'opacity-100'
          }`}>
            {hasChoices ? (
              <>
                {['A', 'B', 'C'].map(key => choices[key] && (
                  <button key={key}
                    onClick={() => sendChoice(`${key}. ${choices[key]}`)}
                    disabled={isDisabled}
                    className="choice-btn w-full text-left px-3 py-2 rounded-xl bg-white/50 dark:bg-[#2A1515]/50 border border-[#DDBB99]/70 dark:border-[#6B3030]/60 text-[13px] text-[#3D2B1F] dark:text-[#F0D8CC] shadow-sm disabled:cursor-not-allowed">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-[10px] mr-2.5 align-middle flex-shrink-0">{key}</span>
                    <span className="align-middle">{choices[key]}</span>
                  </button>
                ))}
                {!customMode ? (
                  <button onClick={() => !isDisabled && setCustomMode(true)} disabled={isDisabled}
                    className="choice-btn w-full text-left px-3 py-2 rounded-xl bg-white/50 dark:bg-[#2A1515]/50 border border-dashed border-[#DDBB99]/60 dark:border-[#6B3030]/50 text-[13px] text-[#3D2B1F] dark:text-[#F0D8CC] shadow-sm disabled:cursor-not-allowed">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-lg bg-pink-50 dark:bg-pink-900/30 text-[#C9A880] font-bold text-[10px] mr-2.5 align-middle flex-shrink-0 border border-[#DDBB99]/60 dark:border-[#6B3030]/60">D</span>
                    <span className="align-middle italic text-[#C9A880] dark:text-[#9B6040]">其他選擇⋯（自行輸入）</span>
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <input ref={inputRef} value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') sendChoice(input);
                        if (e.key === 'Escape') { setCustomMode(false); setInput(''); }
                      }}
                      placeholder="輸入你的行動… (Enter 送出，Esc 取消)"
                      className="chat-input flex-1 px-3 py-2 rounded-xl border border-[#DDBB99]/80 dark:border-[#6B3030]/60 bg-white/80 dark:bg-[#2A1515]/80 text-[13px] text-[#3D2B1F] dark:text-[#F0D8CC] placeholder-[#C9A880]/60"/>
                    <button onClick={() => sendChoice(input)} disabled={!input.trim() || isDisabled}
                      className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-medium disabled:opacity-40 transition-colors flex items-center gap-1">
                      <SendIcon/> 送出
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-1.5">
                <input ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendChoice(input); }}
                  placeholder="輸入你的回應…"
                  className="chat-input flex-1 px-3 py-2 rounded-xl border border-[#DDBB99]/80 dark:border-[#6B3030]/60 bg-white/80 dark:bg-[#2A1515]/80 text-[13px] text-[#3D2B1F] dark:text-[#F0D8CC] placeholder-[#C9A880]/60"/>
                <button onClick={() => sendChoice(input)} disabled={!input.trim() || isDisabled}
                  className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-medium disabled:opacity-40 transition-colors flex items-center gap-1">
                  <SendIcon/> 送出
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  /* ── Main open-book layout ── */
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen h-screen md:h-auto sakura-bg flex items-center justify-center md:p-6">

        {/* Open book container */}
        <div className="fade-in-up w-full md:max-w-[1024px] flex"
             style={{
               height: 'clamp(500px, 100vh, 768px)',
               boxShadow: '-14px 18px 55px rgba(0,0,0,0.35), 14px 18px 55px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.15)',
               borderRadius: '3px',
             }}>

          {/* LEFT PAGE — desktop only */}
          <div className="hidden md:block w-[280px] flex-shrink-0 book-page-left rounded-l-sm
                          bg-gradient-to-r from-[#FFF8F0] to-[#FFFDF5]
                          dark:from-[#2A1515] dark:to-[#2D1A1A]">
            {leftContent}
          </div>

          {/* SPINE — desktop only */}
          <div className="hidden md:flex w-[18px] flex-shrink-0 flex-col items-center justify-center"
               style={{ background: 'linear-gradient(to right, #7B3A1A, #9B4C22, #7B3A1A)' }}>
            <div className="w-px h-8 bg-yellow-600/30 rounded"/>
            <p className="text-[6px] text-yellow-600/35 rotate-90 tracking-[0.4em] whitespace-nowrap my-2">✦</p>
            <div className="w-px h-8 bg-yellow-600/30 rounded"/>
          </div>

          {/* RIGHT PAGE */}
          <div className="flex-1 min-w-0 book-page-right rounded-r-sm relative
                          bg-gradient-to-l from-[#FFF8F0] to-[#FFFDF5]
                          dark:from-[#2A1515] dark:to-[#2D1A1A]
                          md:rounded-l-none rounded-sm">
            {rightContent}

            {/* Mobile: info overlay */}
            {showInfo && (
              <div className="md:hidden absolute inset-0 z-20 rounded-sm overflow-hidden
                              bg-[#FFF8F0]/97 dark:bg-[#2A1515]/97"
                   style={{ backdropFilter: 'blur(4px)' }}>
                <button onClick={() => setShowInfo(false)}
                  className="absolute top-3 right-3 z-30 w-7 h-7 flex items-center justify-center rounded-lg
                             border border-[#DDBB99]/60 dark:border-[#6B3030]/60
                             text-[#9B6040] dark:text-rose-400 text-xs
                             hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                  ✕
                </button>
                <div className="h-full overflow-auto">{leftContent}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
