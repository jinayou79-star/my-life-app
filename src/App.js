import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#fdf6ef",
  surface: "#fff9f4",
  card: "#ffffff",
  border: "#e8d8c8",
  accent: "#c17b3f",
  accentLight: "#d4935a",
  accentGlow: "rgba(193,123,63,0.12)",
  warm1: "#e8956d",
  warm2: "#d4735a",
  sage: "#7a9e7e",
  cream: "#f5e6d3",
  amber: "#d4935a",
  text: "#3d2b1a",
  sub: "#7a5c42",
  muted: "#b08060",
  tag: "#f5e6d3",
  shadow: "rgba(140,80,30,0.08)",
};

const TABS = [
  { id: "home", icon: "🏡", label: "홈" },
  { id: "calendar", icon: "🗓", label: "일정" },
  { id: "study", icon: "🧠", label: "학습" },
  { id: "timer", icon: "⏱", label: "타이머" },
  { id: "todo", icon: "✏️", label: "할일" },
  { id: "routine", icon: "🌿", label: "루틴" },
  { id: "stats", icon: "📊", label: "통계" },
  { id: "reading", icon: "📚", label: "독서" },
];

const REVIEW_INTERVALS = [
  { days: 1,  label: "1일 후",    emoji: "🌱" },
  { days: 3,  label: "3일 후",    emoji: "🌿" },
  { days: 7,  label: "7일 후",    emoji: "🌳" },
  { days: 15, label: "15일 후",   emoji: "🏆" },
];

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const SUBJECTS = ["수학", "영어", "과학", "국어", "역사", "기타"];

const today = new Date();
const dateStr = today.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
const todayKey = today.toISOString().slice(0, 10);

// ── POMODORO TIMER ─────────────────────────────────────────
function Timer({ sessions, setSessions }) {
  const MODES = [
    { label: "집중", duration: 25 * 60, color: C.accent, emoji: "🎯" },
    { label: "짧은 휴식", duration: 5 * 60, color: C.sage, emoji: "☕" },
    { label: "긴 휴식", duration: 15 * 60, color: C.warm1, emoji: "🛋️" },
  ];
  const [modeIdx, setModeIdx] = useState(0);
  const [left, setLeft] = useState(MODES[0].duration);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("업무");
  const [completed, setCompleted] = useState(0);
  const ref = useRef(null);

  const mode = MODES[modeIdx];
  const pct = 1 - left / mode.duration;
  const r = 90;
  const circ = 2 * Math.PI * r;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setLeft(l => {
          if (l <= 1) {
            clearInterval(ref.current);
            setRunning(false);
            if (modeIdx === 0) {
              setCompleted(c => c + 1);
              setSessions(prev => [...prev, {
                id: Date.now(), label, duration: mode.duration / 60,
                date: todayKey, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
              }]);
            }
            return 0;
          }
          return l - 1;
        });
      }, 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const switchMode = (i) => { setModeIdx(i); setLeft(MODES[i].duration); setRunning(false); };
  const reset = () => { setLeft(mode.duration); setRunning(false); };

  const LABELS = ["업무", "공부", "독서", "운동", "개인"];

  return (
    <div style={{ paddingBottom: 24 }}>
      <STitle>집중 타이머 ⏱</STitle>

      {/* mode selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {MODES.map((m, i) => (
          <button key={i} onClick={() => switchMode(i)} style={{
            flex: 1, padding: "10px 0", borderRadius: 14,
            border: `1.5px solid ${modeIdx === i ? m.color : C.border}`,
            background: modeIdx === i ? `${m.color}18` : C.card,
            color: modeIdx === i ? m.color : C.muted,
            cursor: "pointer", fontSize: 12, fontWeight: 700,
            boxShadow: modeIdx === i ? `0 2px 12px ${m.color}22` : "none",
          }}>{m.emoji} {m.label}</button>
        ))}
      </div>

      {/* circular timer */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <div style={{ position: "relative", width: 220, height: 220 }}>
          <svg width="220" height="220" style={{ position: "absolute", top: 0, left: 0 }}>
            <circle cx="110" cy="110" r={r} fill="none" stroke={C.cream} strokeWidth="10" />
            <circle cx="110" cy="110" r={r} fill="none"
              stroke={mode.color}
              strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              strokeLinecap="round"
              transform="rotate(-90 110 110)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: C.text, letterSpacing: -2, lineHeight: 1 }}>
              {mm}:{ss}
            </div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>{mode.emoji} {mode.label}</div>
            <div style={{ color: C.accent, fontSize: 12, marginTop: 4, fontWeight: 600 }}>
              🍅 {completed}회 완료
            </div>
          </div>
        </div>
      </div>

      {/* label selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {LABELS.map(l => (
          <button key={l} onClick={() => setLabel(l)} style={{
            padding: "7px 14px", borderRadius: 20,
            border: `1.5px solid ${label === l ? C.accent : C.border}`,
            background: label === l ? C.cream : C.card,
            color: label === l ? C.accent : C.muted,
            cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>{l}</button>
        ))}
      </div>

      {/* controls */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={reset} style={{
          width: 52, height: 52, borderRadius: "50%",
          border: `1.5px solid ${C.border}`, background: C.card,
          color: C.muted, cursor: "pointer", fontSize: 18,
          boxShadow: `0 2px 8px ${C.shadow}`,
        }}>↺</button>
        <button onClick={() => setRunning(r => !r)} style={{
          width: 120, height: 52, borderRadius: 26,
          border: "none",
          background: running
            ? `linear-gradient(135deg, ${C.warm1}, ${C.warm2})`
            : `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
          color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 800,
          boxShadow: `0 4px 20px ${C.accent}44`,
          letterSpacing: 1,
        }}>{running ? "⏸ 일시정지" : "▶ 시작"}</button>
      </div>

      {/* recent sessions */}
      {sessions.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ color: C.sub, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>오늘의 기록</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...sessions].reverse().slice(0, 5).map(s => (
              <div key={s.id} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", justifyContent: "space-between",
                boxShadow: `0 1px 6px ${C.shadow}`,
              }}>
                <span style={{ color: C.text, fontSize: 13 }}>🎯 {s.label}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Chip color={C.accent}>{s.duration}분</Chip>
                  <span style={{ color: C.muted, fontSize: 12 }}>{s.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── HOME ───────────────────────────────────────────────────
function Home({ todos, routines }) {
  const doneTodos = todos.filter(t => t.done).length;
  const doneRoutines = routines.filter(r => r.doneToday).length;

  const hour = today.getHours();
  const greeting = hour < 12 ? "좋은 아침이에요 ☀️" : hour < 18 ? "오후도 힘내요 🌤️" : "오늘 하루 수고했어요 🌙";

  const quotes = [
    "작은 습관이 큰 변화를 만들어요.",
    "오늘의 집중이 내일의 나를 만들어요.",
    "천천히, 하지만 꾸준히.",
    "루틴은 자유를 만드는 구조예요.",
  ];
  const quote = quotes[today.getDate() % quotes.length];

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* hero card */}
      <div style={{
        background: `linear-gradient(145deg, #f5e0c8 0%, #f0d4b8 100%)`,
        borderRadius: 24, padding: "28px 24px", marginBottom: 20,
        boxShadow: `0 4px 24px ${C.shadow}`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", bottom: -30, right: -20,
          fontSize: 90, opacity: 0.12, transform: "rotate(-10deg)",
        }}>🍵</div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{dateStr}</div>
        <div style={{ color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{greeting}</div>
        <div style={{ color: C.sub, fontSize: 13, fontStyle: "italic" }}>"{quote}"</div>
      </div>

      {/* 오늘의 할일 목록 */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "18px 20px",
        marginBottom: 14, boxShadow: `0 2px 12px ${C.shadow}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: C.text, fontSize: 15, fontWeight: 800 }}>✏️ 오늘의 할일</div>
          <Chip color={C.warm1}>{doneTodos}/{todos.length} 완료</Chip>
        </div>
        <ProgressBar value={todos.length ? doneTodos / todos.length : 0} color={C.warm1} />
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {todos.length === 0 && (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "12px 0" }}>할일 탭에서 추가해보세요!</div>
          )}
          {todos.map(t => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: t.done ? `${C.sage}10` : C.bg,
              border: `1px solid ${t.done ? C.sage + "44" : C.border}`,
              borderRadius: 12, padding: "10px 14px",
              opacity: t.done ? 0.7 : 1,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${t.done ? C.sage : C.border}`,
                background: t.done ? C.sage : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {t.done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{
                color: C.text, fontSize: 13, flex: 1,
                textDecoration: t.done ? "line-through" : "none",
              }}>{t.text}</span>
              <Chip color={{ 중요: C.warm2, 보통: C.amber, 여유: C.sage }[t.pri] || C.muted}>{t.pri}</Chip>
            </div>
          ))}
        </div>
      </div>

      {/* 루틴 달성 체크 */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "18px 20px",
        boxShadow: `0 2px 12px ${C.shadow}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: C.text, fontSize: 15, fontWeight: 800 }}>🌿 오늘의 루틴</div>
          <Chip color={C.sage}>{doneRoutines}/{routines.length} 달성</Chip>
        </div>
        <ProgressBar value={routines.length ? doneRoutines / routines.length : 0} color={C.sage} />
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {routines.length === 0 && (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "12px 0" }}>루틴 탭에서 추가해보세요!</div>
          )}
          {["아침","오전","점심","오후","저녁","밤"].map(time => {
            const group = routines.filter(r => r.time === time);
            if (!group.length) return null;
            const TCOLS = { 아침: "#f59e0b", 오전: "#60a5fa", 점심: "#34d399", 오후: "#a78bfa", 저녁: C.warm1, 밤: "#818cf8" };
            return (
              <div key={time}>
                <div style={{ color: TCOLS[time], fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 6, paddingLeft: 2 }}>{time.toUpperCase()}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {group.map(r => (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: r.doneToday ? `${TCOLS[time]}10` : C.bg,
                      border: `1px solid ${r.doneToday ? TCOLS[time] + "44" : C.border}`,
                      borderRadius: 12, padding: "10px 14px",
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${r.doneToday ? TCOLS[time] : C.border}`,
                        background: r.doneToday ? TCOLS[time] : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {r.doneToday && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{ color: C.text, fontSize: 13, flex: 1 }}>{r.text}</span>
                      {r.streak > 0 && <span style={{ color: "#f59e0b", fontSize: 11 }}>🔥{r.streak}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── TODO ──────────────────────────────────────────────────
function Todo({ todos, setTodos }) {
  const [input, setInput] = useState("");
  const [pri, setPri] = useState("보통");
  const PRIS = { 중요: C.warm2, 보통: C.amber, 여유: C.sage };

  const add = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input.trim(), done: false, pri }]);
    setInput("");
  };
  const toggle = id => setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = id => setTodos(todos.filter(t => t.id !== id));

  return (
    <div style={{ paddingBottom: 24 }}>
      <STitle>할일 목록 ✏️</STitle>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: `0 2px 12px ${C.shadow}` }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
          placeholder="할일을 입력하세요..."
          style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(PRIS).map(([p, col]) => (
            <button key={p} onClick={() => setPri(p)} style={{
              flex: 1, padding: "8px 0", borderRadius: 10,
              border: `1.5px solid ${pri === p ? col : C.border}`,
              background: pri === p ? `${col}18` : "transparent",
              color: pri === p ? col : C.muted, cursor: "pointer", fontSize: 12, fontWeight: 700,
            }}>{p}</button>
          ))}
          <button onClick={add} style={{
            flex: 2, padding: "8px 16px", borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}>추가 +</button>
        </div>
      </div>

      {todos.length === 0 && <Empty text="할일을 추가해보세요!" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {todos.map(t => (
          <div key={t.id} style={{
            background: C.card, borderRadius: 14, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
            border: `1px solid ${t.done ? C.border : PRIS[t.pri] + "55"}`,
            opacity: t.done ? 0.55 : 1,
            boxShadow: `0 1px 6px ${C.shadow}`,
            transition: "opacity 0.2s",
          }}>
            <button onClick={() => toggle(t.id)} style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              border: `2px solid ${t.done ? C.sage : C.border}`,
              background: t.done ? C.sage : "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>{t.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}</button>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontSize: 14, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</div>
              <Chip color={PRIS[t.pri]} style={{ marginTop: 5 }}>{t.pri}</Chip>
            </div>
            <button onClick={() => remove(t.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ROUTINE ────────────────────────────────────────────────
function Routine({ routines, setRoutines }) {
  const [input, setInput] = useState("");
  const [time, setTime] = useState("아침");
  const TIMES = ["아침", "오전", "점심", "오후", "저녁", "밤"];
  const TCOLS = { 아침: "#f59e0b", 오전: "#60a5fa", 점심: "#34d399", 오후: "#a78bfa", 저녁: C.warm1, 밤: "#818cf8" };

  const add = () => {
    if (!input.trim()) return;
    setRoutines([...routines, { id: Date.now(), text: input.trim(), time, doneToday: false, streak: 0 }]);
    setInput("");
  };
  const toggle = id => setRoutines(routines.map(r =>
    r.id === id ? { ...r, doneToday: !r.doneToday, streak: !r.doneToday ? r.streak + 1 : Math.max(0, r.streak - 1) } : r
  ));
  const remove = id => setRoutines(routines.filter(r => r.id !== id));

  const grouped = TIMES.reduce((a, t) => { a[t] = routines.filter(r => r.time === t); return a; }, {});

  return (
    <div style={{ paddingBottom: 24 }}>
      <STitle>루틴 관리 🌿</STitle>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: `0 2px 12px ${C.shadow}` }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
          placeholder="반복할 루틴을 입력하세요..."
          style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {TIMES.map(t => (
            <button key={t} onClick={() => setTime(t)} style={{
              padding: "6px 12px", borderRadius: 20,
              border: `1.5px solid ${time === t ? TCOLS[t] : C.border}`,
              background: time === t ? `${TCOLS[t]}18` : "transparent",
              color: time === t ? TCOLS[t] : C.muted,
              cursor: "pointer", fontSize: 12, fontWeight: 600,
            }}>{t}</button>
          ))}
        </div>
        <button onClick={add} style={{ width: "100%", padding: "10px", borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>루틴 추가 +</button>
      </div>

      {routines.length === 0 && <Empty text="매일 반복할 루틴을 만들어보세요!" />}
      {TIMES.map(t => grouped[t].length > 0 && (
        <div key={t} style={{ marginBottom: 18 }}>
          <div style={{ color: TCOLS[t], fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 8, paddingLeft: 4 }}>{t.toUpperCase()}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {grouped[t].map(r => (
              <div key={r.id} style={{
                background: C.card, border: `1px solid ${r.doneToday ? TCOLS[t] + "66" : C.border}`,
                borderRadius: 14, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: `0 1px 6px ${C.shadow}`,
              }}>
                <button onClick={() => toggle(r.id)} style={{
                  width: 28, height: 28, borderRadius: "50%",
                  border: `2px solid ${r.doneToday ? TCOLS[t] : C.border}`,
                  background: r.doneToday ? TCOLS[t] : "transparent",
                  cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>{r.doneToday && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}</button>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontSize: 14 }}>{r.text}</div>
                  {r.streak > 0 && <div style={{ color: C.amber, fontSize: 11, marginTop: 3 }}>🔥 {r.streak}일 연속</div>}
                </div>
                <button onClick={() => remove(r.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── STATS ──────────────────────────────────────────────────
function Stats({ todos, routines, sessions, readings }) {
  const todaySessions = sessions.filter(s => s.date === todayKey);
  const totalMin = sessions.reduce((a, b) => a + b.duration, 0);
  const todayMin = todaySessions.reduce((a, b) => a + b.duration, 0);

  // group sessions by label
  const byLabel = sessions.reduce((a, s) => {
    a[s.label] = (a[s.label] || 0) + s.duration;
    return a;
  }, {});
  const maxMin = Math.max(...Object.values(byLabel), 1);

  const LABEL_COLORS = { 업무: C.accent, 공부: "#60a5fa", 독서: C.warm1, 운동: C.sage, 개인: "#a78bfa" };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const weekData = weekDays.map(d => ({
    label: new Date(d).toLocaleDateString("ko-KR", { weekday: "short" }),
    min: sessions.filter(s => s.date === d).reduce((a, b) => a + b.duration, 0),
  }));
  const maxWeek = Math.max(...weekData.map(w => w.min), 1);

  return (
    <div style={{ paddingBottom: 24 }}>
      <STitle>통계 & 분석 📊</STitle>

      {/* summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "오늘 집중", value: `${todayMin}분`, sub: `${todaySessions.length}회`, icon: "🎯", color: C.accent },
          { label: "총 집중", value: `${Math.floor(totalMin / 60)}h`, sub: `${sessions.length}회`, icon: "📈", color: C.warm1 },
          { label: "할일 완료", value: `${todos.filter(t => t.done).length}개`, sub: `총 ${todos.length}개`, icon: "✅", color: C.sage },
          { label: "독서 시간", value: `${readings.reduce((a, b) => a + (b.minutes || 0), 0)}분`, sub: `${readings.length}권`, icon: "📚", color: C.amber },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px", boxShadow: `0 1px 8px ${C.shadow}` }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.value}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>{s.label}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* weekly bar chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px", marginBottom: 16, boxShadow: `0 1px 8px ${C.shadow}` }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📅 주간 집중 기록</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 100 }}>
          {weekData.map((w, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ color: C.muted, fontSize: 10 }}>{w.min > 0 ? `${w.min}m` : ""}</div>
              <div style={{
                width: "100%", borderRadius: "6px 6px 0 0",
                height: `${(w.min / maxWeek) * 70}px`,
                minHeight: w.min > 0 ? 4 : 0,
                background: i === 6
                  ? `linear-gradient(180deg, ${C.accentLight}, ${C.accent})`
                  : `linear-gradient(180deg, ${C.cream}, ${C.border})`,
                transition: "height 0.5s ease",
              }} />
              <div style={{ color: i === 6 ? C.accent : C.muted, fontSize: 10, fontWeight: i === 6 ? 700 : 400 }}>{w.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* by category */}
      {Object.keys(byLabel).length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px", marginBottom: 16, boxShadow: `0 1px 8px ${C.shadow}` }}>
          <div style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🎨 카테고리별 집중</div>
          {Object.entries(byLabel).sort((a, b) => b[1] - a[1]).map(([l, m]) => (
            <div key={l} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: C.text, fontSize: 13 }}>{l}</span>
                <span style={{ color: LABEL_COLORS[l] || C.accent, fontSize: 13, fontWeight: 700 }}>{m}분</span>
              </div>
              <ProgressBar value={m / maxMin} color={LABEL_COLORS[l] || C.accent} />
            </div>
          ))}
        </div>
      )}

      {/* routine streaks */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px", boxShadow: `0 1px 8px ${C.shadow}` }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🔥 루틴 연속 기록</div>
        {routines.filter(r => r.streak > 0).length === 0 && <Empty text="루틴을 완료하면 스트릭이 쌓여요!" />}
        {routines.filter(r => r.streak > 0).sort((a, b) => b.streak - a.streak).map(r => (
          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.text, fontSize: 13 }}>{r.text}</span>
            <Chip color={C.amber}>🔥 {r.streak}일</Chip>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── READING ────────────────────────────────────────────────
function Reading({ readings, setReadings }) {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("");
  const [page, setPage] = useState("");
  const [note, setNote] = useState("");

  const add = () => {
    if (!title.trim()) return;
    setReadings([...readings, { id: Date.now(), title, minutes: parseInt(minutes) || 0, page: parseInt(page) || 0, note, date: todayKey }]);
    setTitle(""); setMinutes(""); setPage(""); setNote("");
  };
  const remove = id => setReadings(readings.filter(r => r.id !== id));

  return (
    <div style={{ paddingBottom: 24 }}>
      <STitle>독서 기록 📚</STitle>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: `0 2px 12px ${C.shadow}` }}>
        {[
          { val: title, set: setTitle, ph: "책 제목", type: "text" },
          { val: page, set: setPage, ph: "현재 페이지", type: "number" },
          { val: minutes, set: setMinutes, ph: "읽은 시간 (분)", type: "number" },
        ].map((f, i) => (
          <input key={i} value={f.val} type={f.type} onChange={e => f.set(e.target.value)} placeholder={f.ph}
            style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
        ))}
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="기억하고 싶은 문장이나 생각..."
          style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "none", height: 72, marginBottom: 12 }} />
        <button onClick={add} style={{ width: "100%", padding: "10px", borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>기록 추가 +</button>
      </div>

      {readings.length === 0 && <Empty text="오늘 읽은 책을 기록해보세요!" />}
      {[...readings].reverse().map(r => (
        <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px", marginBottom: 10, boxShadow: `0 1px 6px ${C.shadow}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>📖 {r.title}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {r.minutes > 0 && <Chip color={C.accent}>{r.minutes}분</Chip>}
                {r.page > 0 && <Chip color={C.warm1}>p.{r.page}</Chip>}
                <Chip color={C.muted}>{r.date}</Chip>
              </div>
              {r.note && <div style={{ marginTop: 10, color: C.sub, fontSize: 13, fontStyle: "italic", borderLeft: `2px solid ${C.border}`, paddingLeft: 10 }}>"{r.note}"</div>}
            </div>
            <button onClick={() => remove(r.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CALENDAR ───────────────────────────────────────────────
function Calendar({ todos, routines, sessions, events, setEvents }) {
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [evtInput, setEvtInput] = useState("");
  const [evtImportant, setEvtImportant] = useState(false);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  const dateKey = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // dot summary per day
  const getDots = (key) => {
    const hasEvent = events.some(e => e.date === key);
    const hasImportant = events.some(e => e.date === key && e.important);
    const daySession = sessions.filter(s => s.date === key).length;
    return { hasEvent, hasImportant, daySession };
  };

  // selected day data
  const selEvents = events.filter(e => e.date === selectedDay).sort((a, b) => a.time > b.time ? 1 : -1);
  const selSessions = sessions.filter(s => s.date === selectedDay);
  const selFocusMin = selSessions.reduce((a, b) => a + b.duration, 0);
  const isToday = selectedDay === todayKey;

  const addEvent = () => {
    if (!evtInput.trim()) return;
    setEvents([...events, {
      id: Date.now(), title: evtInput.trim(),
      date: selectedDay, time: "09:00",
      important: evtImportant,
    }]);
    setEvtInput(""); setEvtImportant(false);
  };
  const removeEvent = (id) => setEvents(events.filter(e => e.id !== id));

  const selDateObj = new Date(selectedDay + "T00:00:00");
  const selLabel = selDateObj.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

  return (
    <div style={{ paddingBottom: 24 }}>
      <STitle>캘린더 🗓</STitle>

      {/* month navigator */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "16px 16px 12px",
        marginBottom: 14, boxShadow: `0 2px 12px ${C.shadow}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={prevMonth} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", color: C.muted, cursor: "pointer", fontSize: 14 }}>‹</button>
          <span style={{ color: C.text, fontSize: 16, fontWeight: 800 }}>
            {year}년 {month + 1}월
          </span>
          <button onClick={nextMonth} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", color: C.muted, cursor: "pointer", fontSize: 14 }}>›</button>
        </div>

        {/* weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
          {["일","월","화","수","목","금","토"].map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? C.warm2 : i === 6 ? "#60a5fa" : C.muted, padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const key = dateKey(d);
            const isSelected = key === selectedDay;
            const isTod = key === todayKey;
            const dots = getDots(key);
            const dow = new Date(year, month, d).getDay();

            return (
              <button key={d} onClick={() => setSelectedDay(key)} style={{
                aspectRatio: "1", borderRadius: 12,
                border: isSelected ? `2px solid ${C.accent}` : isTod ? `2px solid ${C.border}` : "2px solid transparent",
                background: isSelected ? C.cream : isTod ? `${C.accent}10` : "transparent",
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                position: "relative", padding: 0,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: isTod ? 800 : isSelected ? 700 : 400,
                  color: isSelected ? C.accent : isTod ? C.accent : dow === 0 ? C.warm2 : dow === 6 ? "#60a5fa" : C.text,
                }}>{d}</span>
                {/* dots */}
                <div style={{ display: "flex", gap: 2, marginTop: 1 }}>
                  {dots.hasImportant && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.warm2 }} />}
                  {dots.hasEvent && !dots.hasImportant && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent }} />}
                  {dots.daySession > 0 && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.sage }} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`, justifyContent: "center" }}>
          {[
            { color: C.warm2, label: "중요 일정" },
            { color: C.accent, label: "일정" },
            { color: C.sage, label: "집중 기록" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
              <span style={{ fontSize: 10, color: C.muted }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* selected day detail */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "18px",
        marginBottom: 14, boxShadow: `0 2px 12px ${C.shadow}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ color: C.text, fontSize: 15, fontWeight: 800 }}>{selLabel}</div>
            {isToday && <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>오늘</span>}
          </div>
          {selFocusMin > 0 && (
            <Chip color={C.sage}>⏱ {selFocusMin}분 집중</Chip>
          )}
        </div>

        {/* events for day */}
        {selEvents.length === 0 && evtInput === "" && (
          <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "10px 0" }}>일정이 없어요</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {selEvents.map(e => (
            <div key={e.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: e.important ? `${C.warm2}12` : C.bg,
              border: `1px solid ${e.important ? C.warm2 + "55" : C.border}`,
              borderRadius: 12, padding: "10px 14px",
              borderLeft: `3px solid ${e.important ? C.warm2 : C.accent}`,
            }}>
              <div style={{ fontSize: 16 }}>{e.important ? "⭐" : "📌"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                {e.time && <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>⏰ {e.time}</div>}
              </div>
              <button onClick={() => removeEvent(e.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>

        {/* add event */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={evtInput} onChange={e => setEvtInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addEvent()}
            placeholder="일정 추가..."
            style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, outline: "none" }} />
          <button onClick={() => setEvtImportant(v => !v)} style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            border: `1.5px solid ${evtImportant ? C.warm2 : C.border}`,
            background: evtImportant ? `${C.warm2}18` : "transparent",
            cursor: "pointer", fontSize: 16,
          }}>⭐</button>
          <button onClick={addEvent} style={{
            padding: "10px 14px", borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}>+</button>
        </div>
      </div>

      {/* routine status for selected day */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "18px",
        boxShadow: `0 2px 12px ${C.shadow}`,
      }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 800, marginBottom: 14 }}>
          🌿 루틴 현황 {!isToday && <span style={{ color: C.muted, fontSize: 11, fontWeight: 400 }}>(오늘만 체크 가능)</span>}
        </div>
        {routines.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "10px 0" }}>루틴 탭에서 루틴을 추가해보세요!</div>}

        {/* group by time */}
        {["아침","오전","점심","오후","저녁","밤"].map(t => {
          const group = routines.filter(r => r.time === t);
          if (!group.length) return null;
          const TCOLS = { 아침: "#f59e0b", 오전: "#60a5fa", 점심: "#34d399", 오후: "#a78bfa", 저녁: C.warm1, 밤: "#818cf8" };
          const doneCount = group.filter(r => r.doneToday).length;
          return (
            <div key={t} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: TCOLS[t], fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>{t.toUpperCase()}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{doneCount}/{group.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {group.map(r => (
                  <div key={r.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: r.doneToday ? `${TCOLS[t]}10` : C.bg,
                    border: `1px solid ${r.doneToday ? TCOLS[t] + "44" : C.border}`,
                    borderRadius: 10, padding: "9px 12px",
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: `2px solid ${r.doneToday ? TCOLS[t] : C.border}`,
                      background: r.doneToday ? TCOLS[t] : "transparent",
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {r.doneToday && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ color: r.doneToday ? C.text : C.sub, fontSize: 13, flex: 1 }}>{r.text}</span>
                    {r.streak > 0 && <span style={{ color: "#f59e0b", fontSize: 11 }}>🔥{r.streak}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* routine completion bar */}
        {routines.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: C.sub, fontSize: 12, fontWeight: 600 }}>전체 달성률</span>
              <span style={{ color: C.sage, fontSize: 12, fontWeight: 800 }}>
                {Math.round(routines.filter(r => r.doneToday).length / routines.length * 100)}%
              </span>
            </div>
            <ProgressBar value={routines.filter(r => r.doneToday).length / routines.length} color={C.sage} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── STUDY ──────────────────────────────────────────────────
function Study({ studyLogs, setStudyLogs }) {
  const [view, setView] = useState("list"); // "list" | "add" | "detail"
  const [detailId, setDetailId] = useState(null);
  const [filterSubj, setFilterSubj] = useState("전체");

  // add form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("수학");
  const [memo, setMemo] = useState("");
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [wantReview, setWantReview] = useState(true);
  const fileRef = useRef(null);

  // due-today reviews
  const dueToday = studyLogs.flatMap(log =>
    (log.reviews || [])
      .filter(r => r.dueDate <= todayKey && !r.done)
      .map(r => ({ ...r, logId: log.id, logTitle: log.title, logSubject: log.subject }))
  ).sort((a, b) => a.dueDate > b.dueDate ? 1 : -1);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageData(ev.target.result);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const addLog = () => {
    if (!title.trim()) return;
    const reviews = wantReview
      ? REVIEW_INTERVALS.map(iv => ({
          id: `${Date.now()}-${iv.days}`,
          days: iv.days,
          label: iv.label,
          emoji: iv.emoji,
          dueDate: addDays(todayKey, iv.days),
          done: false,
          doneDate: null,
        }))
      : [];
    setStudyLogs([...studyLogs, {
      id: Date.now(),
      title: title.trim(),
      subject,
      memo: memo.trim(),
      image: imageData,
      date: todayKey,
      reviews,
    }]);
    setTitle(""); setMemo(""); setImageData(null); setImagePreview(null); setWantReview(true);
    setView("list");
  };

  const toggleReview = (logId, reviewId) => {
    setStudyLogs(studyLogs.map(log => {
      if (log.id !== logId) return log;
      return {
        ...log,
        reviews: log.reviews.map(r =>
          r.id === reviewId
            ? { ...r, done: !r.done, doneDate: !r.done ? todayKey : null }
            : r
        ),
      };
    }));
  };

  const removeLog = (id) => {
    setStudyLogs(studyLogs.filter(l => l.id !== id));
    if (view === "detail") setView("list");
  };

  const filtered = filterSubj === "전체"
    ? studyLogs
    : studyLogs.filter(l => l.subject === filterSubj);

  const SCOLS = { 수학: "#60a5fa", 영어: "#34d399", 과학: "#a78bfa", 국어: "#e8956d", 역사: "#f59e0b", 기타: "#b08060" };

  // ── DETAIL VIEW ──
  if (view === "detail") {
    const log = studyLogs.find(l => l.id === detailId);
    if (!log) { setView("list"); return null; }
    const allDone = log.reviews.every(r => r.done);
    return (
      <div style={{ paddingBottom: 24 }}>
        <button onClick={() => setView("list")} style={{
          background: "transparent", border: "none", color: C.accent,
          cursor: "pointer", fontSize: 14, fontWeight: 700,
          marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 6,
        }}>← 목록으로</button>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", boxShadow: `0 2px 16px ${C.shadow}`, marginBottom: 16 }}>
          {log.image && (
            <img src={log.image} alt="학습 자료" style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
          )}
          <div style={{ padding: "18px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
              <Chip color={SCOLS[log.subject] || C.accent}>{log.subject}</Chip>
              <Chip color={C.muted}>{log.date}</Chip>
            </div>
            <div style={{ color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{log.title}</div>
            {log.memo && (
              <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.6, borderLeft: `3px solid ${C.border}`, paddingLeft: 12 }}>{log.memo}</div>
            )}
          </div>
        </div>

        {/* review schedule */}
        {log.reviews.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "18px", boxShadow: `0 2px 12px ${C.shadow}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ color: C.text, fontSize: 15, fontWeight: 800 }}>📅 복습 일정</div>
              {allDone && <Chip color={C.sage}>✓ 모두 완료!</Chip>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {log.reviews.map((r, i) => {
                const isOverdue = r.dueDate < todayKey && !r.done;
                const isDueToday = r.dueDate === todayKey && !r.done;
                return (
                  <div key={r.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: r.done ? `${C.sage}10` : isDueToday ? `${C.accent}10` : isOverdue ? `${C.warm2}10` : C.bg,
                    border: `1.5px solid ${r.done ? C.sage + "55" : isDueToday ? C.accent + "66" : isOverdue ? C.warm2 + "55" : C.border}`,
                    borderRadius: 14, padding: "14px 16px",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{r.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{r.label} 복습</span>
                        {isDueToday && <Chip color={C.accent}>오늘!</Chip>}
                        {isOverdue && <Chip color={C.warm2}>지남</Chip>}
                      </div>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                        {r.dueDate}
                        {r.done && r.doneDate && ` · 완료 ${r.doneDate}`}
                      </div>
                    </div>
                    <button onClick={() => toggleReview(log.id, r.id)} style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${r.done ? C.sage : C.border}`,
                      background: r.done ? C.sage : "transparent",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, transition: "all 0.2s",
                    }}>
                      {r.done ? <span style={{ color: "#fff", fontWeight: 900 }}>✓</span> : ""}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={() => removeLog(log.id)} style={{
          marginTop: 16, width: "100%", padding: "12px", borderRadius: 14,
          background: "transparent", border: `1.5px solid ${C.border}`,
          color: C.muted, cursor: "pointer", fontSize: 13,
        }}>🗑 삭제</button>
      </div>
    );
  }

  // ── ADD VIEW ──
  if (view === "add") {
    return (
      <div style={{ paddingBottom: 24 }}>
        <button onClick={() => setView("list")} style={{
          background: "transparent", border: "none", color: C.accent,
          cursor: "pointer", fontSize: 14, fontWeight: 700,
          marginBottom: 16, padding: 0,
        }}>← 취소</button>
        <STitle>학습 기록 추가 ✍️</STitle>

        {/* subject */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>과목</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setSubject(s)} style={{
                padding: "8px 16px", borderRadius: 20,
                border: `1.5px solid ${subject === s ? SCOLS[s] : C.border}`,
                background: subject === s ? `${SCOLS[s]}18` : C.card,
                color: subject === s ? SCOLS[s] : C.muted,
                cursor: "pointer", fontSize: 13, fontWeight: 700,
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* title */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>학습 제목</div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 이차방정식 풀이, 영단어 Unit 5..."
            style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* memo */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>메모 (핵심 내용, 헷갈린 점 등)</div>
          <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="오늘 배운 내용을 간단히 정리해보세요..."
            style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "none", height: 90 }} />
        </div>

        {/* image upload */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>학습 자료 이미지 (선택)</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
          {imagePreview ? (
            <div style={{ position: "relative" }}>
              <img src={imagePreview} alt="preview" style={{ width: "100%", borderRadius: 14, maxHeight: 200, objectFit: "cover", border: `1px solid ${C.border}` }} />
              <button onClick={() => { setImageData(null); setImagePreview(null); }} style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
                borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14,
              }}>×</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current.click()} style={{
              width: "100%", padding: "20px", borderRadius: 14,
              border: `2px dashed ${C.border}`, background: C.card,
              color: C.muted, cursor: "pointer", fontSize: 13,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 28 }}>📸</span>
              <span>탭해서 이미지 추가</span>
              <span style={{ fontSize: 11, color: C.border }}>노트 사진, 문제 풀이, 필기 등</span>
            </button>
          )}
        </div>

        {/* review toggle */}
        <div style={{
          background: wantReview ? `${C.accent}10` : C.card,
          border: `1.5px solid ${wantReview ? C.accent + "55" : C.border}`,
          borderRadius: 16, padding: "16px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: wantReview ? 12 : 0 }}>
            <div>
              <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>📅 복습 일정 자동 생성</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>에빙하우스 망각곡선 기반 간격 복습</div>
            </div>
            <button onClick={() => setWantReview(v => !v)} style={{
              width: 44, height: 26, borderRadius: 13,
              background: wantReview ? C.accent : C.border,
              border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, left: wantReview ? 21 : 3,
                transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>
          {wantReview && (
            <div style={{ display: "flex", gap: 6 }}>
              {REVIEW_INTERVALS.map(iv => (
                <div key={iv.days} style={{
                  flex: 1, textAlign: "center",
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "8px 4px",
                }}>
                  <div style={{ fontSize: 18 }}>{iv.emoji}</div>
                  <div style={{ color: C.text, fontSize: 11, fontWeight: 700, marginTop: 4 }}>{iv.label}</div>
                  <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{addDays(todayKey, iv.days)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={addLog} disabled={!title.trim()} style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: title.trim()
            ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`
            : C.border,
          border: "none", color: "#fff", cursor: title.trim() ? "pointer" : "default",
          fontSize: 15, fontWeight: 800, boxShadow: title.trim() ? `0 4px 16px ${C.accent}44` : "none",
        }}>학습 기록 저장 ✓</button>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <STitle style={{ marginBottom: 0 }}>학습 기록 🧠</STitle>
        <button onClick={() => setView("add")} style={{
          padding: "9px 16px", borderRadius: 20,
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
          border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
          boxShadow: `0 3px 12px ${C.accent}44`,
        }}>+ 기록 추가</button>
      </div>

      {/* 🔔 due reviews alert */}
      {dueToday.length > 0 && (
        <div style={{
          background: `${C.accent}14`,
          border: `1.5px solid ${C.accent}55`,
          borderRadius: 18, padding: "16px", marginBottom: 16,
        }}>
          <div style={{ color: C.accent, fontSize: 14, fontWeight: 800, marginBottom: 10 }}>
            🔔 오늘 복습할 내용 {dueToday.length}개
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dueToday.map(r => {
              const isOverdue = r.dueDate < todayKey;
              return (
                <div key={r.id} style={{
                  background: C.card, borderRadius: 12, padding: "12px 14px",
                  border: `1px solid ${isOverdue ? C.warm2 + "55" : C.border}`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{r.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{r.logTitle}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                      {SCOLS[r.logSubject] && <span style={{ color: SCOLS[r.logSubject], marginRight: 6 }}>●</span>}
                      {r.logSubject} · {r.label} {isOverdue ? `(${r.dueDate} 지남)` : "오늘"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setDetailId(r.logId); setView("detail"); }} style={{
                      padding: "6px 10px", borderRadius: 10, background: C.cream,
                      border: `1px solid ${C.border}`, color: C.accent,
                      cursor: "pointer", fontSize: 11, fontWeight: 700,
                    }}>보기</button>
                    <button onClick={() => toggleReview(r.logId, r.id)} style={{
                      padding: "6px 10px", borderRadius: 10,
                      background: `${C.sage}18`, border: `1px solid ${C.sage}55`,
                      color: C.sage, cursor: "pointer", fontSize: 11, fontWeight: 700,
                    }}>완료 ✓</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* subject filter */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
        {["전체", ...SUBJECTS].map(s => (
          <button key={s} onClick={() => setFilterSubj(s)} style={{
            padding: "7px 14px", borderRadius: 20, flexShrink: 0,
            border: `1.5px solid ${filterSubj === s ? (SCOLS[s] || C.accent) : C.border}`,
            background: filterSubj === s ? `${SCOLS[s] || C.accent}18` : C.card,
            color: filterSubj === s ? (SCOLS[s] || C.accent) : C.muted,
            cursor: "pointer", fontSize: 12, fontWeight: 700,
          }}>{s}</button>
        ))}
      </div>

      {/* log cards */}
      {filtered.length === 0 && <Empty text="학습 기록을 추가해보세요!" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[...filtered].reverse().map(log => {
          const pendingReviews = log.reviews.filter(r => !r.done && r.dueDate <= todayKey);
          const nextReview = log.reviews.find(r => !r.done && r.dueDate > todayKey);
          const allDone = log.reviews.length > 0 && log.reviews.every(r => r.done);
          return (
            <div key={log.id} onClick={() => { setDetailId(log.id); setView("detail"); }}
              style={{
                background: C.card, border: `1.5px solid ${pendingReviews.length > 0 ? C.accent + "55" : C.border}`,
                borderRadius: 18, overflow: "hidden", cursor: "pointer",
                boxShadow: `0 2px 12px ${C.shadow}`,
                transition: "transform 0.1s",
              }}>
              {log.image && (
                <img src={log.image} alt="" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
              )}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <Chip color={SCOLS[log.subject] || C.accent}>{log.subject}</Chip>
                  <Chip color={C.muted}>{log.date}</Chip>
                  {allDone && <Chip color={C.sage}>✓ 복습완료</Chip>}
                </div>
                <div style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{log.title}</div>
                {log.memo && <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{log.memo.slice(0, 60)}{log.memo.length > 60 ? "..." : ""}</div>}

                {/* review progress mini */}
                {log.reviews.length > 0 && (
                  <div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      {log.reviews.map(r => (
                        <div key={r.id} style={{
                          flex: 1, height: 4, borderRadius: 4,
                          background: r.done ? C.sage : r.dueDate <= todayKey ? C.accent : C.border,
                          transition: "background 0.3s",
                        }} />
                      ))}
                    </div>
                    <div style={{ color: C.muted, fontSize: 11 }}>
                      {pendingReviews.length > 0
                        ? `🔔 복습 ${pendingReviews.length}개 대기중`
                        : nextReview
                          ? `다음 복습: ${nextReview.label} (${nextReview.dueDate})`
                          : allDone ? "✨ 모든 복습 완료!" : ""}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SHARED ─────────────────────────────────────────────────
const STitle = ({ children }) => (
  <div style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 18, letterSpacing: -0.5 }}>{children}</div>
);
const Empty = ({ text }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontSize: 13 }}>
    <div style={{ fontSize: 32, marginBottom: 10 }}>🍵</div>{text}
  </div>
);
const Chip = ({ children, color }) => (
  <span style={{ display: "inline-block", fontSize: 11, color, background: `${color}1a`, padding: "3px 9px", borderRadius: 20, fontWeight: 700 }}>{children}</span>
);
const ProgressBar = ({ value, color }) => (
  <div style={{ background: C.cream, borderRadius: 8, height: 8, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(value * 100, 100)}%`, height: "100%", background: color, borderRadius: 8, transition: "width 0.5s ease" }} />
  </div>
);

// ── 로컬스토리지 헬퍼 ──────────────────────────────────────
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setAndSave = (newVal) => {
    setValue(prev => {
      const resolved = typeof newVal === "function" ? newVal(prev) : newVal;
      try { localStorage.setItem(key, JSON.stringify(resolved)); } catch {}
      return resolved;
    });
  };

  return [value, setAndSave];
}

// ── APP ────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");

  const [todos, setTodos] = useLocalStorage("ml_todos", [
    { id: 1, text: "오늘 일정 확인하기", done: true, pri: "중요" },
    { id: 2, text: "독서 30분", done: false, pri: "보통" },
    { id: 3, text: "운동 루틴 체크", done: false, pri: "여유" },
  ]);

  const [routines, setRoutines] = useLocalStorage("ml_routines", [
    { id: 1, text: "물 2L 마시기", time: "아침", doneToday: false, streak: 0 },
    { id: 2, text: "명상 10분", time: "아침", doneToday: false, streak: 0 },
    { id: 3, text: "산책 20분", time: "오후", doneToday: false, streak: 0 },
    { id: 4, text: "독서 30분", time: "저녁", doneToday: false, streak: 0 },
  ]);

  const [sessions, setSessions] = useLocalStorage("ml_sessions", []);

  const [readings, setReadings] = useLocalStorage("ml_readings", []);

  const [events, setEvents] = useLocalStorage("ml_events", []);

  const [studyLogs, setStudyLogs] = useLocalStorage("ml_studylogs", []);

  const views = {
    home: <Home todos={todos} routines={routines} />,
    calendar: <Calendar todos={todos} routines={routines} sessions={sessions} events={events} setEvents={setEvents} />,
    study: <Study studyLogs={studyLogs} setStudyLogs={setStudyLogs} />,
    timer: <Timer sessions={sessions} setSessions={setSessions} />,
    todo: <Todo todos={todos} setTodos={setTodos} />,
    routine: <Routine routines={routines} setRoutines={setRoutines} />,
    stats: <Stats todos={todos} routines={routines} sessions={sessions} readings={readings} />,
    reading: <Reading readings={readings} setReadings={setReadings} />,
  };

  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      fontFamily: "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      color: C.text, maxWidth: 430,
      margin: "0 auto", display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      {/* header */}
      <div style={{
        padding: "22px 20px 0",
        background: C.bg,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2 }}>MY LIFE</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
              {TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label}
            </div>
          </div>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 16,
            boxShadow: `0 4px 12px ${C.accent}44`,
          }}>J</div>
        </div>
      </div>

      {/* content */}
      <div style={{ flex: 1, padding: "12px 20px 100px", overflowY: "auto" }}>
        {views[tab]}
      </div>

      {/* bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        display: "flex", padding: "6px 0 18px",
        zIndex: 100,
        boxShadow: `0 -4px 20px ${C.shadow}`,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2,
            background: "transparent", border: "none",
            cursor: "pointer", padding: "4px 0",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 12,
              background: tab === t.id ? C.cream : "transparent",
              border: `1.5px solid ${tab === t.id ? C.border : "transparent"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, transition: "all 0.2s",
              boxShadow: tab === t.id ? `0 2px 8px ${C.shadow}` : "none",
            }}>{t.icon}</div>
            {tab === t.id && (
              <div style={{ fontSize: 9, fontWeight: 700, color: C.accent }}>{t.label}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
