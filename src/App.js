import React, { useState, useCallback, useEffect, useRef } from "react";

// ── 1. 디자인 시스템 ──────────────────────────────────
const C = {
  bg: "#faf6f1", card: "#ffffff", border: "#e8d8c4",
  accent: "#b5651d", sage: "#6b9e78", text: "#2d1f0e",
  muted: "#a07850", shadow: "rgba(120,70,20,0.08)", red: "#d4574a"
};

// ── 2. 유틸리티 ────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};
const fmtSec = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// ── 3. 저장 훅 ──────────────────────────────────────────
function usePersist(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; }
    catch { return def; }
  });
  const set = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);
  return [val, set];
}

// ── 4. UI 컴포넌트 ──────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "16px 18px", boxShadow: `0 2px 12px ${C.shadow}`, marginBottom: 16, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, color = C.accent, outline, small, style = {} }) => (
  <button onClick={onClick} style={{ padding: small ? "6px 12px" : "12px 20px", borderRadius: 12, border: outline ? `1.5px solid ${color}` : "none", background: outline ? "transparent" : color, color: outline ? color : "#fff", fontSize: small ? 12 : 14, fontWeight: 700, cursor: "pointer", ...style }}>{children}</button>
);

// ── 5. 루틴 상세 탭 (타이머 & 기록) ───────────────────────
function RoutineTab({ routine, routineLogs, setRoutineLogs, reviewDays, onBack }) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [title, setTitle] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const handleSave = () => {
    if (!title.trim()) return alert("내용을 입력하세요!");
    const tk = todayKey();
    const newEntry = {
      id: Date.now(),
      title,
      time: fmtSec(elapsed),
      reviews: reviewDays.map(d => ({ date: addDays(tk, d), done: false }))
    };
    
    setRoutineLogs(prev => {
      const existing = prev.find(l => l.routineId === routine.id && l.date === tk);
      if (existing) return prev.map(l => l.routineId === routine.id && l.date === tk ? { ...l, entries: [...l.entries, newEntry] } : l);
      return [...prev, { routineId: routine.id, date: tk, entries: [newEntry] }];
    });
    
    setTitle(""); setElapsed(0); setIsRunning(false);
    alert("기록되었습니다!");
  };

  return (
    <div>
      <Btn onClick={onBack} outline small style={{ marginBottom: 12 }}>← 뒤로가기</Btn>
      <Card>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{routine.icon} {routine.name}</div>
        <div style={{ fontSize: 40, fontWeight: 800, textAlign: "center", margin: "20px 0", color: isRunning ? C.sage : C.text }}>{fmtSec(elapsed)}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => setIsRunning(!isRunning)} color={isRunning ? C.red : C.sage} style={{ flex: 1 }}>{isRunning ? "정지" : "시작"}</Btn>
          <Btn onClick={() => setElapsed(0)} outline style={{ flex: 1 }}>초기화</Btn>
        </div>
      </Card>
      
      <Card>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="오늘 공부한 핵심 내용..." style={{ width: "100%", border: "none", borderBottom: `2px solid ${C.border}`, padding: 8, outline: "none", marginBottom: 12 }} />
        <Btn onClick={handleSave} style={{ width: "100%" }}>오늘의 공부 완료 기록</Btn>
      </Card>
    </div>
  );
}

// ── 6. 설정 탭 ──────────────────────────────────────────
function SettingsTab({ reviewDays, setReviewDays, allData, setAllData }) {
  const [tempDays, setTempDays] = useState(reviewDays.join(", "));
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>⚙️ 설정</div>
      <Card>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>📅 복습 주기 (일 단위)</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={tempDays} onChange={e => setTempDays(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1.5px solid ${C.border}` }} />
          <Btn onClick={() => setReviewDays(tempDays.split(",").map(Number))} small>저장</Btn>
        </div>
      </Card>
      <Card>
        <Btn onClick={() => {
          const blob = new Blob([JSON.stringify(allData)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "backup.json"; a.click();
        }} outline style={{ width: "100%", marginBottom: 8 }}>📤 내보내기</Btn>
        <input type="file" onChange={e => {
          const reader = new FileReader();
          reader.onload = (ev) => { setAllData(JSON.parse(ev.target.result)); window.location.reload(); };
          reader.readAsText(e.target.files[0]);
        }} />
      </Card>
    </div>
  );
}

// ── 7. 메인 앱 ──────────────────────────────────────────
export default function DailyRoutineApp() {
  const [activeTab, setActiveTab] = usePersist("activeTab", "home");
  const [reviewDays, setReviewDays] = usePersist("reviewDays", [1, 3, 7, 15]);
  const [routines] = usePersist("routines", [
    { id: 1, name: "영어 뉴스 번역", icon: "📰" },
    { id: 2, name: "주식 시장 분석", icon: "📈" }
  ]);
  const [routineLogs, setRoutineLogs] = usePersist("routineLogs", []);

  const [selectedRoutine, setSelectedRoutine] = useState(null);

  const allData = { reviewDays, routineLogs };
  const setAllData = (d) => { setReviewDays(d.reviewDays); setRoutineLogs(d.routineLogs); };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, padding: "20px 16px 80px" }}>
      {selectedRoutine ? (
        <RoutineTab routine={selectedRoutine} routineLogs={routineLogs} setRoutineLogs={setRoutineLogs} reviewDays={reviewDays} onBack={() => setSelectedRoutine(null)} />
      ) : activeTab === "home" ? (
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>🏠 오늘의 루틴</div>
          {routines.map(r => (
            <Card key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div onClick={() => setSelectedRoutine(r)} style={{ flex: 1 }}>
                <span style={{ fontSize: 20, marginRight: 10 }}>{r.icon}</span>
                <span style={{ fontWeight: 700 }}>{r.name}</span>
              </div>
              <Btn onClick={() => setSelectedRoutine(r)} small>기록하기</Btn>
            </Card>
          ))}
        </div>
      ) : (
        <SettingsTab reviewDays={reviewDays} setReviewDays={setReviewDays} allData={allData} setAllData={setAllData} />
      )}

      {/* 하단 네비게이션 */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, height: 65, background: "#fff", display: "flex", borderTop: `1px solid ${C.border}` }}>
        <button onClick={() => {setActiveTab("home"); setSelectedRoutine(null);}} style={{ flex: 1, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ fontSize: 20, opacity: activeTab === "home" ? 1 : 0.3 }}>🏠</div>
          <div style={{ fontSize: 10, color: activeTab === "home" ? C.accent : C.muted }}>홈</div>
        </button>
        <button onClick={() => {setActiveTab("settings"); setSelectedRoutine(null);}} style={{ flex: 1, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ fontSize: 20, opacity: activeTab === "settings" ? 1 : 0.3 }}>⚙️</div>
          <div style={{ fontSize: 10, color: activeTab === "settings" ? C.accent : C.muted }}>설정</div>
        </button>
      </div>
    </div>
  );
}