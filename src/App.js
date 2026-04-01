import { useState, useEffect, useRef, useCallback } from "react";

// ── 색상 ────────────────────────────────────────────────────
const C = {
  bg: "#faf6f1", surface: "#fff9f4", card: "#ffffff",
  border: "#e8d8c4", accent: "#b5651d", accentL: "#c8773a",
  warm: "#e8956d", sage: "#6b9e78", amber: "#c9882a",
  red: "#d4574a", blue: "#5b8fc9", purple: "#8b6bbf",
  text: "#2d1f0e", sub: "#6b4c2a", muted: "#a07850",
  cream: "#f5e6d0", shadow: "rgba(120,70,20,0.08)",
  cardHover: "#fffdf9",
};

// ── 유틸 ────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const dt = new Date(d + "T00:00:00"); dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
const fmtSec = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const REVIEW_DAYS = [1, 3, 7, 15];

// ── localStorage hook ───────────────────────────────────────
function usePersist(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; }
    catch { return def; }
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

// ── SHARED UI ───────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: "16px 18px",
    boxShadow: `0 2px 12px ${C.shadow}`,
    ...(onClick ? { cursor: "pointer" } : {}), ...style,
  }}>{children}</div>
);

const Btn = ({ children, onClick, color = C.accent, outline, small, style = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "7px 14px" : "11px 20px",
    borderRadius: small ? 20 : 14,
    border: outline ? `1.5px solid ${color}` : "none",
    background: disabled ? C.border : outline ? "transparent" : `linear-gradient(135deg, ${color}, ${color}cc)`,
    color: outline ? color : "#fff",
    fontSize: small ? 12 : 14, fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    boxShadow: (!outline && !disabled) ? `0 3px 12px ${color}44` : "none",
    transition: "all 0.15s", ...style,
  }}>{children}</button>
);

const Chip = ({ children, color }) => (
  <span style={{
    display: "inline-block", fontSize: 11, color,
    background: `${color}18`, padding: "3px 9px",
    borderRadius: 20, fontWeight: 700,
  }}>{children}</span>
);

const Input = ({ value, onChange, placeholder, type = "text", style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
    style={{
      width: "100%", background: C.bg, border: `1.5px solid ${C.border}`,
      borderRadius: 12, padding: "11px 14px", color: C.text,
      fontSize: 14, outline: "none", boxSizing: "border-box", ...style,
    }} />
);

const Toggle = ({ value, onChange }) => (
  <button onClick={() => onChange(!value)} style={{
    width: 44, height: 26, borderRadius: 13,
    background: value ? C.accent : C.border,
    border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
  }}>
    <div style={{
      width: 20, height: 20, borderRadius: "50%", background: "#fff",
      position: "absolute", top: 3, left: value ? 21 : 3,
      transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    }} />
  </button>
);

const ProgressBar = ({ value, color = C.accent, height = 8 }) => (
  <div style={{ background: C.cream, borderRadius: height, height, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(Math.max(value * 100, 0), 100)}%`, height: "100%",
      background: color, borderRadius: height, transition: "width 0.5s ease",
    }} />
  </div>
);

const SectionTitle = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <div style={{ color: C.text, fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>{children}</div>
    {action}
  </div>
);

// ── 홈 ─────────────────────────────────────────────────────
function HomeTab({ routines, events, todos, setTodos, onTabChange, routineLogs, setRoutineLogs }) {
  const tk = todayKey();
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "새벽에도 열심히네요 🌙" : hour < 12 ? "좋은 아침이에요 ☀️" : hour < 18 ? "오후도 파이팅 🌤️" : "오늘 하루 수고했어요 🌙";

  // 주간 일정
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + i);
    return d.toISOString().slice(0, 10);
  });
  const todayEvents = events.filter(e => e.date === tk).sort((a, b) => a.time > b.time ? 1 : -1);

  // 오늘 복습 알람
  const dueReviews = routineLogs.flatMap(log =>
    (log.reviews || [])
      .filter(r => r.dueDate <= tk && !r.done)
      .map(r => ({ ...r, logId: log.id, logTitle: log.title, routineId: log.routineId }))
  );

  // 루틴 오늘 수행여부
  const todayDone = (rId) => routineLogs.some(l => l.routineId === rId && l.date === tk && l.timerDone);

  const completeReview = (logId, reviewId) => {
    setRoutineLogs(prev => prev.map(log =>
      log.id !== logId ? log : {
        ...log,
        reviews: log.reviews.map(r => r.id === reviewId ? { ...r, done: true, doneDate: tk } : r)
      }
    ));
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 인사 */}
      <div style={{
        background: "linear-gradient(145deg, #f5dfc4, #eddbb0)",
        borderRadius: 24, padding: "24px 22px", marginBottom: 16,
        boxShadow: `0 4px 20px ${C.shadow}`, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", bottom: -20, right: -10, fontSize: 80, opacity: 0.1 }}>🍵</div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>
          {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </div>
        <div style={{ color: C.text, fontSize: 20, fontWeight: 800 }}>{greeting}</div>
      </div>

      {/* 오늘 복습 알람 */}
      {dueReviews.length > 0 && (
        <Card style={{ marginBottom: 14, border: `1.5px solid ${C.amber}55`, background: `${C.amber}08` }}>
          <div style={{ color: C.amber, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
            🔔 오늘 복습할 항목 {dueReviews.length}개
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dueReviews.map(r => {
              const routine = routines.find(rt => rt.id === r.routineId);
              const isOverdue = r.dueDate < tk;
              return (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: C.card, borderRadius: 12, padding: "10px 14px",
                  border: `1px solid ${isOverdue ? C.red + "44" : C.border}`,
                }}>
                  <span style={{ fontSize: 18 }}>{routine?.icon || "📌"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{r.logTitle}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                      {routine?.name} · {r.label} {isOverdue ? `(${r.dueDate} 지남)` : "오늘"}
                    </div>
                  </div>
                  <Btn small color={C.sage} onClick={() => completeReview(r.logId, r.id)}>완료 ✓</Btn>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 주간 캘린더 */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>📅 이번 주</div>
        <div style={{ display: "flex", gap: 4 }}>
          {weekDays.map(d => {
            const hasEvent = events.some(e => e.date === d);
            const isToday = d === tk;
            const dayNum = new Date(d + "T00:00").getDate();
            const dayName = new Date(d + "T00:00").toLocaleDateString("ko-KR", { weekday: "short" });
            return (
              <div key={d} onClick={() => onTabChange("calendar")} style={{
                flex: 1, textAlign: "center", cursor: "pointer",
                background: isToday ? C.accent : "transparent",
                borderRadius: 12, padding: "8px 0",
              }}>
                <div style={{ fontSize: 10, color: isToday ? "#fff" : C.muted, marginBottom: 4 }}>{dayName}</div>
                <div style={{ fontSize: 15, fontWeight: isToday ? 800 : 400, color: isToday ? "#fff" : C.text }}>{dayNum}</div>
                {hasEvent && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isToday ? "#fff" : C.accent, margin: "4px auto 0" }} />}
              </div>
            );
          })}
        </div>
        {todayEvents.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            {todayEvents.slice(0, 3).map(e => (
              <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <div style={{ width: 3, height: 28, borderRadius: 3, background: e.important ? C.red : C.accent, flexShrink: 0 }} />
                <div>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>{e.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 할일 */}
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle action={<Btn small outline color={C.accent} onClick={() => onTabChange("calendar")}>+ 추가</Btn>}>
          ✏️ 오늘의 할일
        </SectionTitle>
        <ProgressBar value={todos.filter(t => t.done && t.date === tk).length / Math.max(todos.filter(t => t.date === tk).length, 1)} color={C.warm} />
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
          {todos.filter(t => t.date === tk).length === 0 && (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "8px 0" }}>오늘 할일이 없어요</div>
          )}
          {todos.filter(t => t.date === tk).map(t => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0", opacity: t.done ? 0.55 : 1,
            }}>
              <button onClick={() => setTodos(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                border: `2px solid ${t.done ? C.sage : C.border}`,
                background: t.done ? C.sage : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {t.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
              </button>
              <span style={{ color: C.text, fontSize: 13, flex: 1, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
              {t.important && <span style={{ fontSize: 12 }}>⭐</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* 루틴 수행 현황 */}
      {routines.length > 0 && (
        <Card>
          <SectionTitle>🌿 오늘의 루틴</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {routines.map(r => {
              const done = todayDone(r.id);
              return (
                <div key={r.id} onClick={() => onTabChange(`routine_${r.id}`)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: done ? `${C.sage}12` : C.bg,
                  border: `1px solid ${done ? C.sage + "55" : C.border}`,
                  borderRadius: 12, padding: "11px 14px", cursor: "pointer",
                }}>
                  <span style={{ fontSize: 20 }}>{r.icon || "📌"}</span>
                  <span style={{ flex: 1, color: C.text, fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    border: `2px solid ${done ? C.sage : C.border}`,
                    background: done ? C.sage : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11,
                  }}>
                    {done && <span style={{ color: "#fff", fontWeight: 900 }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── 일정 ────────────────────────────────────────────────────
function CalendarTab({ events, setEvents, todos, setTodos }) {
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [sel, setSel] = useState(todayKey());
  const [evtTitle, setEvtTitle] = useState("");
  const [evtTime, setEvtTime] = useState("09:00");
  const [evtImportant, setEvtImportant] = useState(false);
  const [todoText, setTodoText] = useState("");
  const [todoImportant, setTodoImportant] = useState(false);

  const y = month.getFullYear(), m = month.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const tk = todayKey();

  const selEvents = events.filter(e => e.date === sel).sort((a, b) => a.time > b.time ? 1 : -1);
  const selTodos = todos.filter(t => t.date === sel);

  const addEvent = () => {
    if (!evtTitle.trim()) return;
    setEvents(prev => [...prev, { id: Date.now(), title: evtTitle.trim(), date: sel, time: evtTime, important: evtImportant }]);
    setEvtTitle(""); setEvtImportant(false);
  };
  const addTodo = () => {
    if (!todoText.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text: todoText.trim(), date: sel, done: false, important: todoImportant }]);
    setTodoText(""); setTodoImportant(false);
  };

  const dKey = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div style={{ paddingBottom: 24 }}>
      <SectionTitle>📅 일정</SectionTitle>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => setMonth(new Date(y, m - 1, 1))} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", color: C.muted, cursor: "pointer" }}>‹</button>
          <span style={{ color: C.text, fontSize: 16, fontWeight: 800 }}>{y}년 {m + 1}월</span>
          <button onClick={() => setMonth(new Date(y, m + 1, 1))} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", color: C.muted, cursor: "pointer" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
          {["일","월","화","수","목","금","토"].map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? C.red : i === 6 ? C.blue : C.muted, padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1, key = dKey(d);
            const isSel = key === sel, isToday = key === tk;
            const hasEvent = events.some(e => e.date === key);
            const hasTodo = todos.some(t => t.date === key);
            const dow = new Date(y, m, d).getDay();
            return (
              <button key={d} onClick={() => setSel(key)} style={{
                aspectRatio: "1", borderRadius: 10,
                border: isSel ? `2px solid ${C.accent}` : isToday ? `2px solid ${C.amber}` : "2px solid transparent",
                background: isSel ? C.cream : "transparent",
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 400, color: isSel ? C.accent : dow === 0 ? C.red : dow === 6 ? C.blue : C.text }}>{d}</span>
                <div style={{ display: "flex", gap: 2, marginTop: 1 }}>
                  {hasEvent && <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.accent }} />}
                  {hasTodo && <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.sage }} />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 선택한 날 */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 800, marginBottom: 14 }}>
          {fmtDate(sel)} {sel === tk && <Chip color={C.accent}>오늘</Chip>}
        </div>

        {/* 일정 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📌 일정</div>
          {selEvents.map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "8px 12px", background: C.bg, borderRadius: 10, borderLeft: `3px solid ${e.important ? C.red : C.accent}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{e.important ? "⭐ " : ""}{e.title}</div>
                <div style={{ color: C.muted, fontSize: 11 }}>{e.time}</div>
              </div>
              <button onClick={() => setEvents(prev => prev.filter(x => x.id !== e.id))} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Input value={evtTitle} onChange={setEvtTitle} placeholder="일정 추가..." style={{ flex: 1 }} />
            <input type="time" value={evtTime} onChange={e => setEvtTime(e.target.value)} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "0 10px", color: C.text, fontSize: 13, outline: "none", width: 90 }} />
            <button onClick={() => setEvtImportant(v => !v)} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${evtImportant ? C.red : C.border}`, background: evtImportant ? `${C.red}18` : "transparent", cursor: "pointer", fontSize: 16 }}>⭐</button>
            <Btn onClick={addEvent} style={{ padding: "0 14px", height: 38 }}>+</Btn>
          </div>
        </div>

        {/* 할일 */}
        <div>
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>✏️ 할일</div>
          {selTodos.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "8px 12px", background: C.bg, borderRadius: 10, opacity: t.done ? 0.6 : 1 }}>
              <button onClick={() => setTodos(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${t.done ? C.sage : C.border}`, background: t.done ? C.sage : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {t.done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
              </button>
              <span style={{ flex: 1, color: C.text, fontSize: 13, textDecoration: t.done ? "line-through" : "none" }}>{t.important ? "⭐ " : ""}{t.text}</span>
              <button onClick={() => setTodos(prev => prev.filter(x => x.id !== t.id))} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Input value={todoText} onChange={setTodoText} placeholder="할일 추가..." style={{ flex: 1 }} />
            <button onClick={() => setTodoImportant(v => !v)} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${todoImportant ? C.red : C.border}`, background: todoImportant ? `${C.red}18` : "transparent", cursor: "pointer", fontSize: 16 }}>⭐</button>
            <Btn onClick={addTodo} style={{ padding: "0 14px", height: 38 }}>+</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── 루틴 탭 ─────────────────────────────────────────────────
function RoutineTab({ routine, routineLogs, setRoutineLogs }) {
  const tk = todayKey();
  const [view, setView] = useState("list"); // list | add | detail
  const [detailId, setDetailId] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // Add form
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [image, setImage] = useState(null);
  const [wantReview, setWantReview] = useState(false);
  const fileRef = useRef(null);

  const todayLog = routineLogs.find(l => l.routineId === routine.id && l.date === tk);

  // Timer
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const startTimer = () => { setElapsed(0); setRunning(true); };
  const stopTimer = () => {
    setRunning(false);
    const secs = elapsed;
    setRoutineLogs(prev => {
      const existing = prev.find(l => l.routineId === routine.id && l.date === tk);
      if (existing) {
        return prev.map(l => l.routineId === routine.id && l.date === tk
          ? { ...l, totalSec: (l.totalSec || 0) + secs, timerDone: true, sessions: [...(l.sessions || []), { sec: secs, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }] }
          : l
        );
      }
      return [...prev, { id: Date.now(), routineId: routine.id, date: tk, totalSec: secs, timerDone: true, sessions: [{ sec: secs, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }], entries: [] }];
    });
    setElapsed(0);
  };

  const addEntry = () => {
    if (!title.trim()) return;
    const reviews = wantReview ? REVIEW_DAYS.map(d => ({
      id: `${Date.now()}-${d}`, days: d, label: `${d}일 후`,
      dueDate: addDays(tk, d), done: false, doneDate: null,
    })) : [];
    const entry = { id: Date.now(), title: title.trim(), memo, image, date: tk, reviews };
    setRoutineLogs(prev => {
      const existing = prev.find(l => l.routineId === routine.id && l.date === tk);
      if (existing) return prev.map(l => l.routineId === routine.id && l.date === tk ? { ...l, entries: [...(l.entries || []), entry] } : l);
      return [...prev, { id: Date.now() + 1, routineId: routine.id, date: tk, totalSec: 0, timerDone: false, sessions: [], entries: [entry] }];
    });
    setTitle(""); setMemo(""); setImage(null); setWantReview(false); setView("list");
  };

  // All entries for this routine
  const allEntries = routineLogs.filter(l => l.routineId === routine.id).flatMap(l => (l.entries || []).map(e => ({ ...e, logId: l.id })));

  if (view === "detail") {
    const entry = allEntries.find(e => e.id === detailId);
    if (!entry) { setView("list"); return null; }
    return (
      <div style={{ paddingBottom: 24 }}>
        <button onClick={() => setView("list")} style={{ background: "transparent", border: "none", color: C.accent, cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 16, padding: 0 }}>← 목록으로</button>
        <Card style={{ marginBottom: 14 }}>
          {entry.image && <img src={entry.image} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: "14px 14px 0 0", display: "block", marginBottom: 14 }} />}
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{fmtDate(entry.date)}</div>
          <div style={{ color: C.text, fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{entry.title}</div>
          {entry.memo && <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.6, borderLeft: `3px solid ${C.border}`, paddingLeft: 12 }}>{entry.memo}</div>}
        </Card>
        {entry.reviews.length > 0 && (
          <Card>
            <div style={{ color: C.text, fontSize: 14, fontWeight: 800, marginBottom: 14 }}>📅 복습 일정</div>
            {entry.reviews.map(r => {
              const isOverdue = r.dueDate < todayKey() && !r.done;
              const isToday = r.dueDate === todayKey() && !r.done;
              return (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 12, marginBottom: 10,
                  background: r.done ? `${C.sage}10` : isToday ? `${C.accent}10` : isOverdue ? `${C.red}08` : C.bg,
                  border: `1.5px solid ${r.done ? C.sage + "55" : isToday ? C.accent + "55" : isOverdue ? C.red + "44" : C.border}`,
                  borderRadius: 14, padding: "12px 14px",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{r.label} 복습</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                      {r.dueDate}{r.done && r.doneDate ? ` · 완료 ${r.doneDate}` : ""}
                      {isToday && " · 오늘!"}{isOverdue && " · 지남"}
                    </div>
                  </div>
                  <button onClick={() => {
                    setRoutineLogs(prev => prev.map(log => ({
                      ...log,
                      entries: (log.entries || []).map(en => en.id !== entry.id ? en : {
                        ...en, reviews: en.reviews.map(rv => rv.id !== r.id ? rv : { ...rv, done: !rv.done, doneDate: !rv.done ? todayKey() : null })
                      })
                    })));
                  }} style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${r.done ? C.sage : C.border}`,
                    background: r.done ? C.sage : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {r.done && <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>✓</span>}
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
        <button onClick={() => setView("list")} style={{ background: "transparent", border: "none", color: C.accent, cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 16, padding: 0 }}>← 취소</button>
        <SectionTitle>기록 추가 ✍️</SectionTitle>
        <Card>
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>제목</div>
          <Input value={title} onChange={setTitle} placeholder={`${routine.name} 내용 입력...`} style={{ marginBottom: 12 }} />
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>메모</div>
          <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="핵심 내용, 느낀 점..."
            style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "none", height: 80, marginBottom: 12 }} />
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>이미지 (선택)</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => {
            const file = e.target.files[0]; if (!file) return;
            const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(file);
          }} style={{ display: "none" }} />
          {image ? (
            <div style={{ position: "relative", marginBottom: 12 }}>
              <img src={image} alt="" style={{ width: "100%", borderRadius: 12, maxHeight: 180, objectFit: "cover" }} />
              <button onClick={() => setImage(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 26, height: 26, cursor: "pointer" }}>×</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current.click()} style={{ width: "100%", padding: 16, borderRadius: 12, border: `2px dashed ${C.border}`, background: C.bg, color: C.muted, cursor: "pointer", marginBottom: 12, fontSize: 13 }}>
              📸 이미지 추가
            </button>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>📅 복습 알람 설정</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>1일·3일·7일·15일 후 자동 알람</div>
            </div>
            <Toggle value={wantReview} onChange={setWantReview} />
          </div>
          <Btn onClick={addEntry} disabled={!title.trim()} style={{ width: "100%" }}>저장 ✓</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 타이머 */}
      <Card style={{ marginBottom: 14, textAlign: "center" }}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>⏱ 오늘 기록</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: C.text, letterSpacing: -2, marginBottom: 4 }}>{fmtSec(elapsed)}</div>
        {todayLog && todayLog.totalSec > 0 && (
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>누적 {fmtSec(todayLog.totalSec)}</div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {!running ? (
            <Btn onClick={startTimer} color={C.sage}>▶ 시작</Btn>
          ) : (
            <Btn onClick={stopTimer} color={C.warm}>⏹ 정지 & 저장</Btn>
          )}
          {running && <Btn onClick={() => { setRunning(false); setElapsed(0); }} outline color={C.muted} small>취소</Btn>}
        </div>
      </Card>

      {/* 기록 목록 */}
      <SectionTitle action={<Btn small onClick={() => setView("add")}>+ 기록 추가</Btn>}>
        {routine.icon} {routine.name} 기록
      </SectionTitle>

      {allEntries.length === 0 && (
        <Card><div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>아직 기록이 없어요<br />기록을 추가해보세요! 📝</div></Card>
      )}

      {[...allEntries].reverse().map(entry => {
        const pending = (entry.reviews || []).filter(r => !r.done && r.dueDate <= todayKey()).length;
        const allDone = entry.reviews?.length > 0 && entry.reviews.every(r => r.done);
        return (
          <Card key={entry.id} style={{ marginBottom: 10 }} onClick={() => { setDetailId(entry.id); setView("detail"); }}>
            {entry.image && <img src={entry.image} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: "14px 14px 0 0", display: "block", marginBottom: 12, marginLeft: -18, marginTop: -16, width: "calc(100% + 36px)" }} />}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <Chip color={C.accent}>{entry.date}</Chip>
              {allDone && <Chip color={C.sage}>✓ 복습완료</Chip>}
              {pending > 0 && <Chip color={C.amber}>🔔 복습 {pending}개</Chip>}
            </div>
            <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{entry.title}</div>
            {entry.memo && <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{entry.memo.slice(0, 50)}{entry.memo.length > 50 ? "..." : ""}</div>}
            {(entry.reviews || []).length > 0 && (
              <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                {entry.reviews.map(r => (
                  <div key={r.id} style={{ flex: 1, height: 4, borderRadius: 4, background: r.done ? C.sage : r.dueDate <= todayKey() ? C.amber : C.border }} />
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── 통계 ────────────────────────────────────────────────────
function StatsTab({ routines, routineLogs }) {
  const [period, setPeriod] = useState("week");
  const tk = todayKey();

  const getRange = () => {
    const end = new Date(tk + "T00:00:00");
    const start = new Date(tk + "T00:00:00");
    if (period === "week") start.setDate(start.getDate() - 6);
    else start.setDate(start.getDate() - 29);
    return { start: start.toISOString().slice(0, 10), end: tk };
  };

  const { start, end } = getRange();
  const inRange = (d) => d >= start && d <= end;

  const getStats = (routine) => {
    const logs = routineLogs.filter(l => l.routineId === routine.id && inRange(l.date));
    const count = logs.filter(l => l.timerDone).length;
    const totalSec = logs.reduce((a, b) => a + (b.totalSec || 0), 0);
    const reviewCount = logs.flatMap(l => (l.entries || []).flatMap(e => (e.reviews || []).filter(r => r.done))).length;

    // 연속 기록 (오늘 기준)
    let streak = 0;
    const d = new Date(tk + "T00:00:00");
    while (true) {
      const k = d.toISOString().slice(0, 10);
      if (routineLogs.some(l => l.routineId === routine.id && l.date === k && l.timerDone)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }

    return { count, totalSec, reviewCount, streak };
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      <SectionTitle>📊 통계</SectionTitle>

      {/* 기간 선택 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["week", "주간"], ["month", "월간"]].map(([k, l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{
            flex: 1, padding: "10px 0", borderRadius: 14,
            border: `1.5px solid ${period === k ? C.accent : C.border}`,
            background: period === k ? C.cream : C.card,
            color: period === k ? C.accent : C.muted,
            cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}>{l}</button>
        ))}
      </div>

      {routines.length === 0 ? (
        <Card><div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "30px 0" }}>설정에서 루틴을 먼저 추가해주세요!</div></Card>
      ) : (
        <Card style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["루틴", "횟수", "총시간", "연속", "복습"].map(h => (
                  <th key={h} style={{ padding: "8px 6px", color: C.sub, fontWeight: 700, textAlign: "center", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routines.map((r, i) => {
                const { count, totalSec, reviewCount, streak } = getStats(r);
                const hrs = Math.floor(totalSec / 3600);
                const mins = Math.floor((totalSec % 3600) / 60);
                const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                return (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : "transparent" }}>
                    <td style={{ padding: "12px 6px", color: C.text, fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{r.icon}</span><span>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "center" }}>
                      <span style={{ color: count > 0 ? C.accent : C.muted, fontWeight: count > 0 ? 700 : 400 }}>{count}회</span>
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "center" }}>
                      <span style={{ color: totalSec > 0 ? C.blue : C.muted, fontWeight: totalSec > 0 ? 700 : 400 }}>{totalSec > 0 ? timeStr : "-"}</span>
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "center" }}>
                      <span style={{ color: streak > 0 ? C.amber : C.muted, fontWeight: streak > 0 ? 700 : 400 }}>
                        {streak > 0 ? `🔥${streak}일` : "-"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "center" }}>
                      <span style={{ color: reviewCount > 0 ? C.sage : C.muted, fontWeight: reviewCount > 0 ? 700 : 400 }}>{reviewCount > 0 ? `${reviewCount}회` : "-"}</span>
                    </td>
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

// ── 설정 ────────────────────────────────────────────────────
function SettingsTab({ routines, setRoutines, todos, setTodos, events, setEvents, routineLogs, setRoutineLogs }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📌");
  const ICONS = ["📌","📚","✏️","🏃","🎵","💪","🧘","🎨","💻","🌿","⚽","🍎","📖","🔬","🎯"];

  const addRoutine = () => {
    if (!name.trim()) return;
    setRoutines(prev => [...prev, { id: Date.now(), name: name.trim(), icon, createdAt: todayKey() }]);
    setName(""); setIcon("📌");
  };
  const removeRoutine = (id) => {
    if (!window.confirm("이 루틴을 삭제할까요? 관련 기록도 모두 삭제됩니다.")) return;
    setRoutines(prev => prev.filter(r => r.id !== id));
    setRoutineLogs(prev => prev.filter(l => l.routineId !== id));
  };

  // 백업
  const exportData = () => {
    const data = { routines, todos, events, routineLogs, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `mylife-backup-${todayKey()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.routines) setRoutines(data.routines);
        if (data.todos) setTodos(data.todos);
        if (data.events) setEvents(data.events);
        if (data.routineLogs) setRoutineLogs(data.routineLogs);
        alert("✅ 백업 복원 완료!");
      } catch { alert("❌ 파일 형식이 맞지 않아요."); }
    };
    r.readAsText(file);
  };
  const importRef = useRef(null);

  return (
    <div style={{ paddingBottom: 24 }}>
      <SectionTitle>⚙️ 설정</SectionTitle>

      {/* 루틴 추가 */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 800, marginBottom: 14 }}>🌿 루틴 관리</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)} style={{
              width: 36, height: 36, borderRadius: 10, fontSize: 18,
              border: `2px solid ${icon === ic ? C.accent : C.border}`,
              background: icon === ic ? C.cream : "transparent", cursor: "pointer",
            }}>{ic}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input value={name} onChange={setName} placeholder="루틴 이름 입력..." style={{ flex: 1 }} />
          <Btn onClick={addRoutine} disabled={!name.trim()}>추가 +</Btn>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {routines.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "12px 0" }}>아직 루틴이 없어요</div>}
          {routines.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 20 }}>{r.icon}</span>
              <span style={{ flex: 1, color: C.text, fontSize: 14, fontWeight: 600 }}>{r.name}</span>
              <button onClick={() => removeRoutine(r.id)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", color: C.red, cursor: "pointer", fontSize: 12 }}>삭제</button>
            </div>
          ))}
        </div>
      </Card>

      {/* 백업 */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 800, marginBottom: 14 }}>💾 데이터 백업</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
          모든 데이터를 JSON 파일로 저장하거나 불러올 수 있어요. 폰 교체 시 유용해요!
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={exportData} style={{ flex: 1 }}>📤 내보내기</Btn>
          <input ref={importRef} type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
          <Btn onClick={() => importRef.current.click()} outline color={C.accent} style={{ flex: 1 }}>📥 가져오기</Btn>
        </div>
      </Card>

      {/* 데이터 초기화 */}
      <Card>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>🗑 데이터 초기화</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>⚠️ 모든 데이터가 삭제돼요. 먼저 백업하세요!</div>
        <Btn outline color={C.red} onClick={() => {
          if (window.confirm("정말 모든 데이터를 삭제할까요?")) {
            setRoutines([]); setTodos([]); setEvents([]); setRoutineLogs([]);
          }
        }} style={{ width: "100%" }}>전체 초기화</Btn>
      </Card>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────
export default function App() {
  const [routines, setRoutines] = usePersist("ml2_routines", []);
  const [todos, setTodos] = usePersist("ml2_todos", []);
  const [events, setEvents] = usePersist("ml2_events", []);
  const [routineLogs, setRoutineLogs] = usePersist("ml2_routineLogs", []);
  const [activeTab, setActiveTab] = useState("home");

  // 동적 탭 구성
  const FIXED_TABS = [
    { id: "home", icon: "🏡", label: "홈" },
    { id: "calendar", icon: "📅", label: "일정" },
  ];
  const ROUTINE_TABS = routines.map(r => ({ id: `routine_${r.id}`, icon: r.icon, label: r.name, routineId: r.id }));
  const END_TABS = [
    { id: "stats", icon: "📊", label: "통계" },
    { id: "settings", icon: "⚙️", label: "설정" },
  ];
  const ALL_TABS = [...FIXED_TABS, ...ROUTINE_TABS, ...END_TABS];

  // 탭이 삭제되면 홈으로
  useEffect(() => {
    if (!ALL_TABS.find(t => t.id === activeTab)) setActiveTab("home");
  }, [routines]);

  const renderContent = () => {
    if (activeTab === "home") return <HomeTab routines={routines} events={events} todos={todos} setTodos={setTodos} onTabChange={setActiveTab} routineLogs={routineLogs} setRoutineLogs={setRoutineLogs} />;
    if (activeTab === "calendar") return <CalendarTab events={events} setEvents={setEvents} todos={todos} setTodos={setTodos} />;
    if (activeTab === "stats") return <StatsTab routines={routines} routineLogs={routineLogs} />;
    if (activeTab === "settings") return <SettingsTab routines={routines} setRoutines={setRoutines} todos={todos} setTodos={setTodos} events={events} setEvents={setEvents} routineLogs={routineLogs} setRoutineLogs={setRoutineLogs} />;
    const routineTab = ROUTINE_TABS.find(t => t.id === activeTab);
    if (routineTab) {
      const routine = routines.find(r => r.id === routineTab.routineId);
      if (routine) return <RoutineTab routine={routine} routineLogs={routineLogs} setRoutineLogs={setRoutineLogs} />;
    }
    return null;
  };

  const currentTab = ALL_TABS.find(t => t.id === activeTab);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Pretendard','Noto Sans KR','Apple SD Gothic Neo',sans-serif", color: C.text, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <div style={{ padding: "20px 20px 0", background: C.bg, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, fontWeight: 700 }}>MY LIFE</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
              {currentTab?.icon} {currentTab?.label}
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.accentL})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, boxShadow: `0 3px 10px ${C.accent}44` }}>J</div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, padding: "12px 20px 90px", overflowY: "auto" }}>
        {renderContent()}
      </div>

      {/* 하단 네비 - 스크롤 가능 */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.surface, borderTop: `1px solid ${C.border}`, zIndex: 100, boxShadow: `0 -3px 16px ${C.shadow}` }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "6px 4px 16px", scrollbarWidth: "none" }}>
          {ALL_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flexShrink: 0, minWidth: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: activeTab === t.id ? C.cream : "transparent", border: `1.5px solid ${activeTab === t.id ? C.border : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: activeTab === t.id ? `0 2px 8px ${C.shadow}` : "none" }}>{t.icon}</div>
              {activeTab === t.id && <div style={{ fontSize: 9, fontWeight: 700, color: C.accent, maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
