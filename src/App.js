import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  bg: "#f8f8f8", surface: "#ffffff", card: "#ffffff",
  border: "#e4e4e4", border2: "#d0d0d0",
  accent: "#111111", accentMid: "#444444",
  muted: "#888888", faint: "#f2f2f2", placeholder: "#bbbbbb",
  red: "#e03e3e", green: "#2e7d52", blue: "#2b5fa6", amber: "#b07d1a",
  shadow: "rgba(0,0,0,0.06)",
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const dt = new Date(d + "T00:00:00"); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
const fmtSec = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const REVIEW_DAYS = [1, 3, 7, 15];

function usePersist(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; }
  });
  const set = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, set];
}

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", boxShadow: `0 1px 6px ${C.shadow}`, ...(onClick ? { cursor: "pointer" } : {}), ...style }}>{children}</div>
);
const Btn = ({ children, onClick, variant = "fill", small, style = {}, disabled, color }) => {
  const bg = disabled ? C.border : variant === "fill" ? (color || C.accent) : "transparent";
  const cl = disabled ? C.muted : variant === "fill" ? "#fff" : (color || C.accent);
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: small ? "6px 14px" : "10px 20px", borderRadius: small ? 20 : 10, border: variant === "outline" ? `1.5px solid ${color || C.accent}` : "none", background: bg, color: cl, fontSize: small ? 12 : 13, fontWeight: 700, cursor: disabled ? "default" : "pointer", ...style }}>{children}</button>
  );
};
const Chip = ({ children, color = C.accent }) => (
  <span style={{ display: "inline-block", fontSize: 11, color, background: `${color}14`, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{children}</span>
);
const Input = ({ value, onChange, placeholder, type = "text", style = {}, onKeyDown }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} onKeyDown={onKeyDown}
    style={{ width: "100%", background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 13px", color: C.accent, fontSize: 14, outline: "none", boxSizing: "border-box", ...style }} />
);
const Toggle = ({ value, onChange, label }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    {label && <span style={{ color: C.accentMid, fontSize: 13, fontWeight: 600 }}>{label}</span>}
    <button onClick={() => onChange(!value)} style={{ width: 42, height: 24, borderRadius: 12, background: value ? C.accent : C.border2, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 21 : 3, transition: "left 0.2s" }} />
    </button>
  </div>
);
const ProgressBar = ({ value, height = 6 }) => (
  <div style={{ background: C.faint, borderRadius: height, height, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(Math.max(value * 100, 0), 100)}%`, height: "100%", background: C.accent, borderRadius: height, transition: "width 0.5s ease" }} />
  </div>
);
const Divider = () => <div style={{ height: 1, background: C.border, margin: "14px 0" }} />;
const STitle = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <div style={{ color: C.accent, fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>{children}</div>
    {action}
  </div>
);

// ── 홈 ──────────────────────────────────────────────────────
function HomeTab({ routines, events, todos, setTodos, onTabChange, routineLogs, setRoutineLogs }) {
  const tk = todayKey();
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "새벽도 파이팅이에요" : hour < 12 ? "좋은 아침이에요" : hour < 18 ? "오후도 잘 보내고 있나요" : "오늘 하루 수고했어요";

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + i);
    return d.toISOString().slice(0, 10);
  });
  const todayEvents = events.filter(e => e.date === tk).sort((a, b) => a.time > b.time ? 1 : -1);
  const todayTodos = todos.filter(t => t.date === tk);
  const doneTodos = todayTodos.filter(t => t.done).length;

  const dueReviews = routineLogs.flatMap(log =>
    (log.entries || []).flatMap(entry =>
      (entry.reviews || []).filter(r => r.dueDate <= tk && !r.done)
        .map(r => ({ ...r, entryId: entry.id, logId: log.id, entryTitle: entry.title, routineId: log.routineId }))
    )
  );

  const todayDone = (rId) => routineLogs.some(l => l.routineId === rId && l.date === tk && l.timerDone);

  const completeReview = (logId, entryId, reviewId) => {
    setRoutineLogs(prev => prev.map(log => log.id !== logId ? log : {
      ...log, entries: (log.entries || []).map(en => en.id !== entryId ? en : {
        ...en, reviews: en.reviews.map(r => r.id === reviewId ? { ...r, done: true, doneDate: tk } : r)
      })
    }));
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</div>
        <div style={{ color: C.accent, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{greeting}</div>
      </div>

      {dueReviews.length > 0 && (
        <Card style={{ marginBottom: 14, border: `1.5px solid ${C.accent}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ color: C.accent, fontSize: 13, fontWeight: 800 }}>오늘의 복습</div>
            <Chip>{dueReviews.length}건</Chip>
          </div>
          {dueReviews.map(r => {
            const routine = routines.find(rt => rt.id === r.routineId);
            const isOverdue = r.dueDate < tk;
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.faint, borderRadius: 10, marginBottom: 6, border: `1px solid ${isOverdue ? C.red + "44" : C.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>{r.entryTitle}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{routine?.name || ""} · {r.label}{isOverdue ? ` (${r.dueDate} 지남)` : " · 오늘"}</div>
                </div>
                <Btn small onClick={() => completeReview(r.logId, r.entryId, r.id)}>완료 ✓</Btn>
              </div>
            );
          })}
        </Card>
      )}

      <Card style={{ marginBottom: 14 }}>
        <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>이번 주</div>
        <div style={{ display: "flex", gap: 3 }}>
          {weekDays.map(d => {
            const isToday = d === tk;
            const hasEvent = events.some(e => e.date === d);
            return (
              <div key={d} onClick={() => onTabChange("calendar")} style={{ flex: 1, textAlign: "center", cursor: "pointer", background: isToday ? C.accent : "transparent", borderRadius: 10, padding: "8px 0" }}>
                <div style={{ fontSize: 10, color: isToday ? "#fff" : C.muted, marginBottom: 4 }}>{new Date(d + "T00:00").toLocaleDateString("ko-KR", { weekday: "short" })}</div>
                <div style={{ fontSize: 14, fontWeight: isToday ? 800 : 400, color: isToday ? "#fff" : C.accent }}>{new Date(d + "T00:00").getDate()}</div>
                {hasEvent && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isToday ? "#fff" : C.accent, margin: "4px auto 0" }} />}
              </div>
            );
          })}
        </div>
        {todayEvents.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            {todayEvents.slice(0, 3).map(e => (
              <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                <div style={{ width: 2, height: 26, borderRadius: 2, background: e.important ? C.red : C.accentMid, flexShrink: 0 }} />
                <div><div style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>{e.important ? "★ " : ""}{e.title}</div><div style={{ color: C.muted, fontSize: 11 }}>{e.time}</div></div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: C.accent, fontSize: 13, fontWeight: 700 }}>오늘의 할일</div>
          <span style={{ color: C.muted, fontSize: 12 }}>{doneTodos}/{todayTodos.length}</span>
        </div>
        {todayTodos.length > 0 && <ProgressBar value={doneTodos / todayTodos.length} />}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {todayTodos.length === 0 && <div style={{ color: C.placeholder, fontSize: 13, textAlign: "center", padding: "6px 0" }}>일정 탭에서 추가해보세요</div>}
          {todayTodos.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: t.done ? 0.5 : 1 }}>
              <button onClick={() => setTodos(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${t.done ? C.accent : C.border2}`, background: t.done ? C.accent : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
              </button>
              <span style={{ color: C.accent, fontSize: 13, flex: 1, textDecoration: t.done ? "line-through" : "none" }}>{t.important ? "★ " : ""}{t.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {routines.length > 0 && (
        <Card>
          <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>오늘의 루틴</div>
          {routines.map(r => {
            const done = todayDone(r.id);
            return (
              <div key={r.id} onClick={() => onTabChange(`routine_${r.id}`)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", cursor: "pointer", background: done ? C.faint : "transparent", borderRadius: 10, border: `1px solid ${done ? C.border2 : C.border}`, marginBottom: 6 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                <span style={{ flex: 1, color: C.accent, fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${done ? C.accent : C.border2}`, background: done ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ── 일정 ──────────────────────────────────────────────────
function CalendarTab({ events, setEvents, todos, setTodos }) {
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [sel, setSel] = useState(todayKey());
  const [evtTitle, setEvtTitle] = useState(""); const [evtTime, setEvtTime] = useState("09:00"); const [evtImp, setEvtImp] = useState(false);
  const [todoText, setTodoText] = useState(""); const [todoImp, setTodoImp] = useState(false);
  const tk = todayKey(); const y = month.getFullYear(), m = month.getMonth();
  const firstDay = new Date(y, m, 1).getDay(); const daysInMonth = new Date(y, m + 1, 0).getDate();
  const dKey = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div style={{ paddingBottom: 24 }}>
      <STitle>일정</STitle>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => setMonth(new Date(y, m - 1, 1))} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 11px", color: C.accentMid, cursor: "pointer" }}>‹</button>
          <span style={{ color: C.accent, fontSize: 15, fontWeight: 800 }}>{y}년 {m + 1}월</span>
          <button onClick={() => setMonth(new Date(y, m + 1, 1))} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 11px", color: C.accentMid, cursor: "pointer" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
          {["일","월","화","수","목","금","토"].map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: i === 0 ? C.red : i === 6 ? C.blue : C.muted, padding: "3px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1, key = dKey(d); const isSel = key === sel, isToday = key === tk;
            const dow = new Date(y, m, d).getDay();
            return (
              <button key={d} onClick={() => setSel(key)} style={{ aspectRatio: "1", borderRadius: 8, border: isSel ? `2px solid ${C.accent}` : isToday ? `2px solid ${C.border2}` : "2px solid transparent", background: isSel ? C.accent : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isSel ? "#fff" : dow === 0 ? C.red : dow === 6 ? C.blue : C.accent }}>{d}</span>
                <div style={{ display: "flex", gap: 2 }}>
                  {events.some(e => e.date === key) && <div style={{ width: 3, height: 3, borderRadius: "50%", background: isSel ? "#fff" : C.accent }} />}
                  {todos.some(t => t.date === key) && <div style={{ width: 3, height: 3, borderRadius: "50%", background: isSel ? "#fff" : C.muted }} />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{ color: C.accent, fontSize: 14, fontWeight: 800, marginBottom: 14 }}>{fmtDate(sel)} {sel === tk && <Chip>오늘</Chip>}</div>
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>일정</div>
        {events.filter(e => e.date === sel).length === 0 && <div style={{ color: C.placeholder, fontSize: 13, marginBottom: 8 }}>없음</div>}
        {events.filter(e => e.date === sel).sort((a, b) => a.time > b.time ? 1 : -1).map(e => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "8px 10px", background: C.faint, borderRadius: 8, borderLeft: `2px solid ${e.important ? C.red : C.accentMid}` }}>
            <div style={{ flex: 1 }}><div style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>{e.important ? "★ " : ""}{e.title}</div><div style={{ color: C.muted, fontSize: 11 }}>{e.time}</div></div>
            <button onClick={() => setEvents(prev => prev.filter(x => x.id !== e.id))} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <Input value={evtTitle} onChange={setEvtTitle} placeholder="일정 추가..." style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && evtTitle.trim() && (setEvents(prev => [...prev, { id: Date.now(), title: evtTitle.trim(), date: sel, time: evtTime, important: evtImp }]), setEvtTitle(""), setEvtImp(false))} />
          <input type="time" value={evtTime} onChange={e => setEvtTime(e.target.value)} style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 8px", color: C.accent, fontSize: 12, outline: "none", width: 85 }} />
          <button onClick={() => setEvtImp(v => !v)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${evtImp ? C.red : C.border}`, background: evtImp ? `${C.red}14` : C.faint, cursor: "pointer" }}>★</button>
          <Btn onClick={() => { if (!evtTitle.trim()) return; setEvents(prev => [...prev, { id: Date.now(), title: evtTitle.trim(), date: sel, time: evtTime, important: evtImp }]); setEvtTitle(""); setEvtImp(false); }} style={{ height: 36, padding: "0 12px" }}>+</Btn>
        </div>
        <Divider />
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>할일</div>
        {todos.filter(t => t.date === sel).length === 0 && <div style={{ color: C.placeholder, fontSize: 13, marginBottom: 8 }}>없음</div>}
        {todos.filter(t => t.date === sel).map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, opacity: t.done ? 0.55 : 1 }}>
            <button onClick={() => setTodos(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${t.done ? C.accent : C.border2}`, background: t.done ? C.accent : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {t.done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
            </button>
            <span style={{ flex: 1, color: C.accent, fontSize: 13, textDecoration: t.done ? "line-through" : "none" }}>{t.important ? "★ " : ""}{t.text}</span>
            <button onClick={() => setTodos(prev => prev.filter(x => x.id !== t.id))} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6 }}>
          <Input value={todoText} onChange={setTodoText} placeholder="할일 추가..." style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && todoText.trim() && (setTodos(prev => [...prev, { id: Date.now(), text: todoText.trim(), date: sel, done: false, important: todoImp }]), setTodoText(""), setTodoImp(false))} />
          <button onClick={() => setTodoImp(v => !v)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${todoImp ? C.red : C.border}`, background: todoImp ? `${C.red}14` : C.faint, cursor: "pointer" }}>★</button>
          <Btn onClick={() => { if (!todoText.trim()) return; setTodos(prev => [...prev, { id: Date.now(), text: todoText.trim(), date: sel, done: false, important: todoImp }]); setTodoText(""); setTodoImp(false); }} style={{ height: 36, padding: "0 12px" }}>+</Btn>
        </div>
      </Card>
    </div>
  );
}

// ── 루틴 탭 ─────────────────────────────────────────────────
function RoutineTab({ routine, routineLogs, setRoutineLogs }) {
  const tk = todayKey();
  const [view, setView] = useState("list");
  const [detailId, setDetailId] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const fileRef = useRef(null);
  const [fTitle, setFTitle] = useState(""); const [fMemo, setFMemo] = useState(""); const [fImage, setFImage] = useState(null); const [fReview, setFReview] = useState(false);

  const hasTimer = true;
  const hasImage = (routine.fields || []).includes("image");
  const hasMemo = (routine.fields || []).includes("memo");
  const hasReview = (routine.fields || []).includes("review");

  useEffect(() => {
    if (running) { timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const todayLog = routineLogs.find(l => l.routineId === routine.id && l.date === tk);

  const stopTimer = () => {
    setRunning(false); const secs = elapsed;
    setRoutineLogs(prev => {
      const ex = prev.find(l => l.routineId === routine.id && l.date === tk);
      if (ex) return prev.map(l => l.routineId === routine.id && l.date === tk ? { ...l, totalSec: (l.totalSec || 0) + secs, timerDone: true, sessions: [...(l.sessions || []), { sec: secs, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }] } : l);
      return [...prev, { id: Date.now(), routineId: routine.id, date: tk, totalSec: secs, timerDone: true, sessions: [{ sec: secs, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }], entries: [] }];
    });
    setElapsed(0);
  };

  const addEntry = () => {
    if (!fTitle.trim()) return;
    const reviews = (hasReview && fReview) ? REVIEW_DAYS.map(d => ({ id: `${Date.now()}-${d}`, days: d, label: `${d}일 후`, dueDate: addDays(tk, d), done: false, doneDate: null })) : [];
    const entry = { id: Date.now(), title: fTitle.trim(), memo: fMemo, image: fImage, date: tk, reviews };
    setRoutineLogs(prev => {
      const ex = prev.find(l => l.routineId === routine.id && l.date === tk);
      if (ex) return prev.map(l => l.routineId === routine.id && l.date === tk ? { ...l, entries: [...(l.entries || []), entry] } : l);
      return [...prev, { id: Date.now() + 1, routineId: routine.id, date: tk, totalSec: 0, timerDone: false, sessions: [], entries: [entry] }];
    });
    setFTitle(""); setFMemo(""); setFImage(null); setFReview(false); setView("list");
  };

  const allEntries = routineLogs.filter(l => l.routineId === routine.id).flatMap(l => (l.entries || []).map(e => ({ ...e, logId: l.id })));

  if (view === "detail") {
    const entry = allEntries.find(e => e.id === detailId);
    if (!entry) { setView("list"); return null; }
    return (
      <div style={{ paddingBottom: 24 }}>
        <button onClick={() => setView("list")} style={{ background: "transparent", border: "none", color: C.accentMid, cursor: "pointer", fontSize: 13, fontWeight: 700, marginBottom: 16, padding: 0 }}>← 목록으로</button>
        <Card style={{ marginBottom: 14 }}>
          {entry.image && <img src={entry.image} alt="" style={{ width: "calc(100% + 36px)", marginLeft: -18, marginTop: -16, maxHeight: 220, objectFit: "cover", display: "block", borderRadius: "12px 12px 0 0", marginBottom: 14 }} />}
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{fmtDate(entry.date)}</div>
          <div style={{ color: C.accent, fontSize: 16, fontWeight: 800, marginBottom: entry.memo ? 10 : 0 }}>{entry.title}</div>
          {entry.memo && <div style={{ color: C.accentMid, fontSize: 13, lineHeight: 1.7, borderLeft: `2px solid ${C.border2}`, paddingLeft: 12 }}>{entry.memo}</div>}
        </Card>
        {(entry.reviews || []).length > 0 && (
          <Card>
            <div style={{ color: C.accent, fontSize: 13, fontWeight: 800, marginBottom: 14 }}>복습 일정</div>
            {entry.reviews.map(r => {
              const isOverdue = r.dueDate < todayKey() && !r.done, isToday = r.dueDate === todayKey() && !r.done;
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, padding: "11px 14px", borderRadius: 10, background: r.done ? C.faint : isToday ? `${C.accent}08` : "transparent", border: `1px solid ${r.done ? C.border : isToday ? C.accentMid : isOverdue ? C.red + "55" : C.border}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>{r.label} 복습</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{r.dueDate}{r.done && r.doneDate ? ` · 완료 ${r.doneDate}` : ""}{isToday ? " · 오늘" : ""}{isOverdue ? " · 지남" : ""}</div>
                  </div>
                  <button onClick={() => {
                    setRoutineLogs(prev => prev.map(log => ({ ...log, entries: (log.entries || []).map(en => en.id !== entry.id ? en : { ...en, reviews: en.reviews.map(rv => rv.id !== r.id ? rv : { ...rv, done: !rv.done, doneDate: !rv.done ? todayKey() : null }) }) })));
                  }} style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${r.done ? C.accent : C.border2}`, background: r.done ? C.accent : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {r.done && <span style={{ color: "#fff", fontWeight: 900, fontSize: 11 }}>✓</span>}
                  </button>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    );
  }

  if (view === "add") {
    return (
      <div style={{ paddingBottom: 24 }}>
        <button onClick={() => setView("list")} style={{ background: "transparent", border: "none", color: C.accentMid, cursor: "pointer", fontSize: 13, fontWeight: 700, marginBottom: 16, padding: 0 }}>← 취소</button>
        <STitle>기록 추가</STitle>
        <Card>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>제목 *</div>
          <Input value={fTitle} onChange={setFTitle} placeholder={`${routine.name} 내용...`} style={{ marginBottom: 14 }} />
          {hasMemo && (<><div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>메모</div><textarea value={fMemo} onChange={e => setFMemo(e.target.value)} placeholder="핵심 내용, 느낀 점..." style={{ width: "100%", background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 13px", color: C.accent, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "none", height: 80, marginBottom: 14 }} /></>)}
          {hasImage && (
            <>
              <input ref={fileRef} type="file" accept="image/*" onChange={e => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = ev => setFImage(ev.target.result); r.readAsDataURL(file); }} style={{ display: "none" }} />
              {fImage ? (
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <img src={fImage} alt="" style={{ width: "100%", borderRadius: 10, maxHeight: 180, objectFit: "cover", border: `1px solid ${C.border}` }} />
                  <button onClick={() => setFImage(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", borderRadius: "50%", width: 26, height: 26, cursor: "pointer" }}>×</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current.click()} style={{ width: "100%", padding: 14, borderRadius: 10, border: `1.5px dashed ${C.border2}`, background: C.faint, color: C.muted, cursor: "pointer", marginBottom: 14, fontSize: 13 }}>+ 이미지 첨부</button>
              )}
            </>
          )}
          {hasReview && <div style={{ padding: "12px 0", borderTop: `1px solid ${C.border}`, marginBottom: 14 }}><Toggle value={fReview} onChange={setFReview} label="복습 알람 (1일·3일·7일·15일 후)" /></div>}
          <Btn onClick={addEntry} disabled={!fTitle.trim()} style={{ width: "100%" }}>저장</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {hasTimer && (
        <Card style={{ marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: C.accent, letterSpacing: -2, marginBottom: 6 }}>{fmtSec(elapsed)}</div>
          {todayLog?.totalSec > 0 && <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>오늘 누적 {fmtSec(todayLog.totalSec)}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {!running ? <Btn onClick={() => { setElapsed(0); setRunning(true); }}>▶ 시작</Btn> : <Btn onClick={stopTimer}>■ 정지 · 저장</Btn>}
            {running && <Btn variant="outline" onClick={() => { setRunning(false); setElapsed(0); }}>취소</Btn>}
          </div>
        </Card>
      )}
      <STitle action={<Btn small onClick={() => setView("add")}>+ 추가</Btn>}>{routine.icon} {routine.name}</STitle>
      {allEntries.length === 0 && <Card><div style={{ color: C.placeholder, fontSize: 13, textAlign: "center", padding: "20px 0" }}>아직 기록이 없어요</div></Card>}
      {[...allEntries].reverse().map(entry => {
        const pending = (entry.reviews || []).filter(r => !r.done && r.dueDate <= todayKey()).length;
        const allDone = entry.reviews?.length > 0 && entry.reviews.every(r => r.done);
        return (
          <Card key={entry.id} style={{ marginBottom: 10 }} onClick={() => { setDetailId(entry.id); setView("detail"); }}>
            {entry.image && <img src={entry.image} alt="" style={{ width: "calc(100% + 36px)", marginLeft: -18, marginTop: -16, height: 110, objectFit: "cover", display: "block", borderRadius: "12px 12px 0 0", marginBottom: 12 }} />}
            <div style={{ display: "flex", gap: 5, marginBottom: 7, flexWrap: "wrap" }}>
              <Chip color={C.accentMid}>{entry.date}</Chip>
              {allDone && <Chip color={C.green}>복습완료</Chip>}
              {pending > 0 && <Chip color={C.amber}>복습 {pending}건</Chip>}
            </div>
            <div style={{ color: C.accent, fontSize: 14, fontWeight: 700 }}>{entry.title}</div>
            {entry.memo && <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{entry.memo.slice(0, 55)}{entry.memo.length > 55 ? "…" : ""}</div>}
            {(entry.reviews || []).length > 0 && (
              <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                {entry.reviews.map(r => <div key={r.id} style={{ flex: 1, height: 3, borderRadius: 3, background: r.done ? C.accent : r.dueDate <= todayKey() ? C.amber : C.border }} />)}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── 통계 ─────────────────────────────────────────────────
function StatsTab({ routines, routineLogs }) {
  const [period, setPeriod] = useState("week");
  const tk = todayKey();
  const getStart = () => { const d = new Date(tk + "T00:00:00"); d.setDate(d.getDate() - (period === "week" ? 6 : 29)); return d.toISOString().slice(0, 10); };
  const start = getStart();
  const inRange = (d) => d >= start && d <= tk;

  const getStats = (r) => {
    const logs = routineLogs.filter(l => l.routineId === r.id && inRange(l.date));
    const count = logs.filter(l => l.timerDone).length;
    const totalSec = logs.reduce((a, b) => a + (b.totalSec || 0), 0);
    const reviewCount = logs.flatMap(l => (l.entries || []).flatMap(e => (e.reviews || []).filter(rv => rv.done))).length;
    let streak = 0; const d = new Date(tk + "T00:00:00");
    while (true) { const k = d.toISOString().slice(0, 10); if (routineLogs.some(l => l.routineId === r.id && l.date === k && l.timerDone)) { streak++; d.setDate(d.getDate() - 1); } else break; }
    return { count, totalSec, reviewCount, streak };
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(tk + "T00:00:00"); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10); });

  return (
    <div style={{ paddingBottom: 24 }}>
      <STitle>통계</STitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["week","주간"],["month","월간"]].map(([k,l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1.5px solid ${period === k ? C.accent : C.border}`, background: period === k ? C.accent : C.card, color: period === k ? "#fff" : C.muted, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{l}</button>
        ))}
      </div>
      {period === "week" && routines.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>주간 달성률</div>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
            {weekDays.map(d => {
              const done = routines.filter(r => routineLogs.some(l => l.routineId === r.id && l.date === d && l.timerDone)).length;
              const ratio = routines.length ? done / routines.length : 0;
              return (
                <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, color: C.muted }}>{ratio > 0 ? `${Math.round(ratio * 100)}%` : ""}</div>
                  <div style={{ width: "100%", borderRadius: "3px 3px 0 0", height: `${Math.max(ratio * 60, ratio > 0 ? 4 : 0)}px`, background: d === tk ? C.accent : C.border2 }} />
                  <div style={{ fontSize: 10, color: d === tk ? C.accent : C.muted, fontWeight: d === tk ? 700 : 400 }}>{new Date(d + "T00:00").toLocaleDateString("ko-KR", { weekday: "short" })}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      {routines.length === 0 ? (
        <Card><div style={{ color: C.placeholder, fontSize: 13, textAlign: "center", padding: "30px 0" }}>설정에서 루틴을 먼저 추가해주세요</div></Card>
      ) : (
        <Card style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.accent}` }}>
                {["루틴","횟수","시간","연속","복습"].map(h => <th key={h} style={{ padding: "8px 5px", color: C.accent, fontWeight: 700, textAlign: "center", fontSize: 12 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {routines.map((r, i) => {
                const { count, totalSec, reviewCount, streak } = getStats(r);
                const hrs = Math.floor(totalSec / 3600), mins = Math.floor((totalSec % 3600) / 60);
                const timeStr = hrs > 0 ? `${hrs}h${mins}m` : mins > 0 ? `${mins}m` : "-";
                return (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.faint }}>
                    <td style={{ padding: "11px 5px" }}><div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 15 }}>{r.icon}</span><span style={{ color: C.accent, fontWeight: 600, fontSize: 12 }}>{r.name}</span></div></td>
                    <td style={{ padding: "11px 5px", textAlign: "center", color: count > 0 ? C.accent : C.placeholder, fontWeight: count > 0 ? 700 : 400 }}>{count > 0 ? `${count}회` : "-"}</td>
                    <td style={{ padding: "11px 5px", textAlign: "center", color: totalSec > 0 ? C.accentMid : C.placeholder, fontWeight: totalSec > 0 ? 600 : 400 }}>{timeStr}</td>
                    <td style={{ padding: "11px 5px", textAlign: "center", color: streak > 0 ? C.accent : C.placeholder, fontWeight: streak > 0 ? 700 : 400 }}>{streak > 0 ? `${streak}일` : "-"}</td>
                    <td style={{ padding: "11px 5px", textAlign: "center", color: reviewCount > 0 ? C.accentMid : C.placeholder, fontWeight: reviewCount > 0 ? 600 : 400 }}>{reviewCount > 0 ? `${reviewCount}회` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ── 설정 ─────────────────────────────────────────────────
function SettingsTab({ routines, setRoutines, todos, setTodos, events, setEvents, routineLogs, setRoutineLogs }) {
  const [name, setName] = useState(""); const [icon, setIcon] = useState("📌"); const [fields, setFields] = useState(["image","memo","review"]);
  const importRef = useRef(null);
  const ICONS = ["📌","📚","✏️","🏃","🎵","💪","🧘","🎨","💻","🌿","⚽","🍎","📖","🔬","🎯","🧠","🎤","🏊","🚴","🍳"];
  const FIELD_OPTIONS = [{ id: "image", label: "📸 이미지" }, { id: "memo", label: "📝 메모" }, { id: "review", label: "🔔 복습 알람" }];
  const toggleField = (f) => setFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ routines, todos, events, routineLogs, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `mylife-${todayKey()}.json`; a.click();
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      <STitle>설정</STitle>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>루틴 추가</div>
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>아이콘</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {ICONS.map(ic => <button key={ic} onClick={() => setIcon(ic)} style={{ width: 34, height: 34, borderRadius: 8, fontSize: 17, border: `1.5px solid ${icon === ic ? C.accent : C.border}`, background: icon === ic ? C.faint : "transparent", cursor: "pointer" }}>{ic}</button>)}
        </div>
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>이름</div>
        <Input value={name} onChange={setName} placeholder="루틴 이름..." style={{ marginBottom: 14 }} />
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>기록 항목</div>
        <div style={{ padding: "10px 12px", background: C.faint, borderRadius: 10, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.accentMid, fontSize: 13, fontWeight: 600 }}>⏱ 타이머</span>
          <span style={{ fontSize: 11, color: C.muted, background: C.border, padding: "2px 8px", borderRadius: 20 }}>항상 켜짐</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {FIELD_OPTIONS.map(f => <Toggle key={f.id} value={fields.includes(f.id)} onChange={() => toggleField(f.id)} label={f.label} />)}
        </div>
        <Btn onClick={() => { if (!name.trim()) return; setRoutines(prev => [...prev, { id: Date.now(), name: name.trim(), icon, fields: ["timer", ...fields], createdAt: todayKey() }]); setName(""); setIcon("📌"); setFields(["image","memo","review"]); }} disabled={!name.trim()} style={{ width: "100%" }}>루틴 추가 +</Btn>
      </Card>

      {routines.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>루틴 목록</div>
          {routines.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.faint, borderRadius: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>⏱ 타이머 · {(r.fields || []).filter(f => f !== "timer").map(f => ({ image: "📸 이미지", memo: "📝 메모", review: "🔔 복습알람" })[f]).filter(Boolean).join(" · ") || "기본"}</div>
              </div>
              <button onClick={() => { if (!window.confirm("삭제할까요?")) return; setRoutines(prev => prev.filter(x => x.id !== r.id)); setRoutineLogs(prev => prev.filter(l => l.routineId !== r.id)); }} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 9px", color: C.red, cursor: "pointer", fontSize: 12 }}>삭제</button>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginBottom: 14 }}>
        <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>데이터 백업</div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>JSON 파일로 저장하거나 복원할 수 있어요</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={exportData} style={{ flex: 1 }}>내보내기</Btn>
          <input ref={importRef} type="file" accept=".json" onChange={e => {
            const file = e.target.files[0]; if (!file) return;
            const r = new FileReader(); r.onload = ev => {
              try { const d = JSON.parse(ev.target.result); if (d.routines) setRoutines(d.routines); if (d.todos) setTodos(d.todos); if (d.events) setEvents(d.events); if (d.routineLogs) setRoutineLogs(d.routineLogs); alert("복원 완료"); } catch { alert("파일 오류"); }
            }; r.readAsText(file); e.target.value = "";
          }} style={{ display: "none" }} />
          <Btn variant="outline" onClick={() => importRef.current.click()} style={{ flex: 1 }}>가져오기</Btn>
        </div>
      </Card>

      <Card>
        <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>데이터 초기화</div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>모든 데이터가 삭제됩니다. 백업을 먼저 하세요.</div>
        <Btn variant="outline" color={C.red} onClick={() => { if (window.confirm("정말 삭제할까요?")) { setRoutines([]); setTodos([]); setEvents([]); setRoutineLogs([]); } }} style={{ width: "100%" }}>전체 초기화</Btn>
      </Card>
    </div>
  );
}

// ── APP ──────────────────────────────────────────────────
export default function App() {
  const [routines, setRoutines] = usePersist("ml3_routines", []);
  const [todos, setTodos] = usePersist("ml3_todos", []);
  const [events, setEvents] = usePersist("ml3_events", []);
  const [routineLogs, setRoutineLogs] = usePersist("ml3_routineLogs", []);
  const [activeTab, setActiveTab] = useState("home");

  const FIXED = [{ id: "home", icon: "○", label: "홈" }, { id: "calendar", icon: "□", label: "일정" }];
  const ROUTINE_TABS = routines.map(r => ({ id: `routine_${r.id}`, icon: r.icon, label: r.name, routineId: r.id }));
  const END = [{ id: "stats", icon: "≡", label: "통계" }, { id: "settings", icon: "◎", label: "설정" }];
  const ALL_TABS = [...FIXED, ...ROUTINE_TABS, ...END];

  useEffect(() => {
    if (!ALL_TABS.find(t => t.id === activeTab)) setActiveTab("home");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines]);

  const renderContent = () => {
    if (activeTab === "home") return <HomeTab routines={routines} events={events} todos={todos} setTodos={setTodos} onTabChange={setActiveTab} routineLogs={routineLogs} setRoutineLogs={setRoutineLogs} />;
    if (activeTab === "calendar") return <CalendarTab events={events} setEvents={setEvents} todos={todos} setTodos={setTodos} />;
    if (activeTab === "stats") return <StatsTab routines={routines} routineLogs={routineLogs} />;
    if (activeTab === "settings") return <SettingsTab routines={routines} setRoutines={setRoutines} todos={todos} setTodos={setTodos} events={events} setEvents={setEvents} routineLogs={routineLogs} setRoutineLogs={setRoutineLogs} />;
    const rt = ROUTINE_TABS.find(t => t.id === activeTab);
    if (rt) { const routine = routines.find(r => r.id === rt.routineId); if (routine) return <RoutineTab routine={routine} routineLogs={routineLogs} setRoutineLogs={setRoutineLogs} />; }
    return null;
  };

  const cur = ALL_TABS.find(t => t.id === activeTab);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Pretendard','Noto Sans KR','Apple SD Gothic Neo',sans-serif", color: C.accent, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 14px", background: C.surface, position: "sticky", top: 0, zIndex: 10, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, fontWeight: 700, marginBottom: 2 }}>MY LIFE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.accent, letterSpacing: -0.5 }}>{cur?.label}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>J</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 20px 88px", overflowY: "auto" }}>{renderContent()}</div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.surface, borderTop: `1px solid ${C.border}`, zIndex: 100 }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "8px 4px 18px", scrollbarWidth: "none" }}>
          {ALL_TABS.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flexShrink: 0, minWidth: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "4px 4px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isActive ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isActive ? 13 : 18, color: isActive ? "#fff" : C.muted, fontWeight: 700, transition: "all 0.15s" }}>
                  {isActive ? t.label.slice(0, 2) : t.icon}
                </div>
                {!isActive && <div style={{ fontSize: 9, color: C.muted }}>{t.label.slice(0, 4)}</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
