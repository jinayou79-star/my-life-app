import React, { useState, useEffect, useRef, useCallback } from "react";

// ── 1. 색상 및 스타일 설정 ──────────────────────────────────
const C = {
  bg: "#faf6f1", surface: "#fff9f4", card: "#ffffff",
  border: "#e8d8c4", accent: "#b5651d", accentL: "#c8773a",
  warm: "#e8956d", sage: "#6b9e78", amber: "#c9882a",
  red: "#d4574a", blue: "#5b8fc9", purple: "#8b6bbf",
  text: "#2d1f0e", sub: "#6b4c2a", muted: "#a07850",
  cream: "#f5e6d0", shadow: "rgba(120,70,20,0.08)",
};

// ── 2. 유틸리티 함수 ────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const dt = new Date(d + "T00:00:00"); 
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

// ── 3. 커스텀 훅 (데이터 저장) ───────────────────────────────
function usePersist(key, def) {
  const [val, setVal] = useState(() => {
    if (typeof window === "undefined") return def;
    try { 
      const s = localStorage.getItem(key); 
      return s ? JSON.parse(s) : def; 
    } catch { return def; }
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

// ── 4. 공통 UI 컴포넌트 ──────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "16px 18px", boxShadow: `0 2px 12px ${C.shadow}`, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, color = C.accent, outline, small, style = {} }) => (
  <button onClick={onClick} style={{ padding: small ? "7px 14px" : "11px 20px", borderRadius: small ? 20 : 14, border: outline ? `1.5px solid ${color}` : "none", background: outline ? "transparent" : color, color: outline ? color : "#fff", fontSize: small ? 12 : 14, fontWeight: 700, cursor: "pointer", ...style }}>{children}</button>
);

const Input = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
);

const SectionTitle = ({ children }) => (
  <div style={{ color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 16 }}>{children}</div>
);

const TabBtn = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", flex: 1 }}>
    <span style={{ fontSize: 20, opacity: active ? 1 : 0.4 }}>{icon}</span>
    <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.accent : C.muted }}>{label}</span>
  </button>
);

// ── 5. 설정 탭 (데이터 백업 및 주기 수정) ───────────────────────
function SettingsTab({ reviewDays, setReviewDays, allData, setAllData }) {
  const [tempDays, setTempDays] = useState(reviewDays.join(", "));

  const exportData = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "my_life_backup.json"; a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (window.confirm("데이터를 복원하시겠습니까? 현재 데이터가 덮어씌워집니다.")) {
          setAllData(data);
          window.location.reload();
        }
      } catch { alert("잘못된 파일 형식입니다."); }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <SectionTitle>⚙️ 설정</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 14 }}>📅 복습 주기 설정</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input value={tempDays} onChange={setTempDays} />
          <Btn small onClick={() => {
            const next = tempDays.split(",").map(d => parseInt(d.trim())).filter(d => !isNaN(d));
            setReviewDays(next);
            alert("저장되었습니다!");
          }}>저장</Btn>
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>💾 데이터 백업</div>
        <Btn onClick={exportData} outline style={{ width: "100%", marginBottom: 8 }}>📤 내보내기 (.json)</Btn>
        <div style={{ position: "relative" }}>
          <Btn outline color={C.sage} style={{ width: "100%" }}>📥 가져오기</Btn>
          <input type="file" accept=".json" onChange={importData} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0 }} />
        </div>
      </Card>
    </div>
  );
}

// ── 6. 메인 앱 (최하단에 export default 확인) ──────────────────
export default function DailyRoutineApp() {
  const [activeTab, setActiveTab] = usePersist("activeTab", "home");
  const [reviewDays, setReviewDays] = usePersist("reviewDays", [1, 3, 7, 15]);
  const [routines, setRoutines] = usePersist("routines", [{ id: 1, name: "영어 공부", icon: "📖" }]);
  const [events, setEvents] = usePersist("events", []);
  const [todos, setTodos] = usePersist("todos", []);
  const [routineLogs, setRoutineLogs] = usePersist("routineLogs", []);

  const allData = { routines, events, todos, routineLogs, reviewDays };
  const setAllData = (d) => {
    if (d.routines) setRoutines(d.routines);
    if (d.events) setEvents(d.events);
    if (d.todos) setTodos(d.todos);
    if (d.routineLogs) setRoutineLogs(d.routineLogs);
    if (d.reviewDays) setReviewDays(d.reviewDays);
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, position: "relative" }}>
      <div style={{ padding: "20px 16px 100px 16px" }}>
        {activeTab === "home" && <SectionTitle>🏠 홈 화면</SectionTitle>}
        {activeTab === "settings" && (
          <SettingsTab 
            reviewDays={reviewDays} 
            setReviewDays={setReviewDays} 
            allData={allData} 
            setAllData={setAllData} 
          />
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, height: 70, background: "#fff", display: "flex", alignItems: "center", borderTop: `1px solid ${C.border}`, zIndex: 1000 }}>
        <TabBtn active={activeTab === "home"} onClick={() => setActiveTab("home")} label="홈" icon="🏠" />
        <TabBtn active={activeTab === "settings"} onClick={() => setActiveTab("settings")} label="설정" icon="⚙️" />
      </div>
    </div>
  );
}