// ... (상단 색상 C, 유틸, 공통 UI 컴포넌트들은 기존과 동일)

// ── 루틴 탭 (수정됨: reviewDays 추가) ──────────────────────────
function RoutineTab({ routine, routineLogs, setRoutineLogs, reviewDays }) {
  const tk = todayKey();
  const [view, setView] = useState("list");
  const [detailId, setDetailId] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [image, setImage] = useState(null);
  const [wantReview, setWantReview] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const stopTimer = () => {
    setRunning(false);
    const secs = elapsed;
    setRoutineLogs(prev => {
      const existing = prev.find(l => l.routineId === routine.id && l.date === tk);
      if (existing) {
        return prev.map(l => l.routineId === routine.id && l.date === tk
          ? { ...l, totalSec: (l.totalSec || 0) + secs, timerDone: true, sessions: [...(l.sessions || []), { sec: secs, time: new Date().toLocaleTimeString() }] }
          : l
        );
      }
      return [...prev, { id: Date.now(), routineId: routine.id, date: tk, totalSec: secs, timerDone: true, sessions: [{ sec: secs, time: new Date().toLocaleTimeString() }], entries: [] }];
    });
    setElapsed(0);
  };

  const addEntry = () => {
    if (!title.trim()) return;
    // 중요: 부모에게 받은 reviewDays를 사용함
    const reviews = wantReview ? reviewDays.map(d => ({
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

  const allEntries = routineLogs.filter(l => l.routineId === routine.id).flatMap(l => (l.entries || []).map(e => ({ ...e, logId: l.id })));

  // ... (상세보기 view === "detail" 로직 및 "add" 로직은 이전과 동일)

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 타이머 및 목록 렌더링 (이전 답변 코드 참고) */}
      <SectionTitle action={<Btn small onClick={() => setView("add")}>+ 기록 추가</Btn>}>
        {routine.icon} {routine.name}
      </SectionTitle>
      {/* 목록 맵핑 로직... */}
    </div>
  );
}

// ── 설정 탭 (완성본) ─────────────────────────────────────────
function SettingsTab({ reviewDays, setReviewDays, allData, setAllData }) {
  const [tempDays, setTempDays] = useState(reviewDays.join(", "));

  const saveDays = () => {
    const nextDays = tempDays.split(",").map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d > 0);
    setReviewDays(nextDays.sort((a, b) => a - b));
    alert("복습 주기가 저장되었습니다!");
  };

  const exportData = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "routine_backup.json";
    link.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (confirm("기존 데이터를 덮어씌울까요?")) {
          setAllData(imported);
          alert("복구 완료!");
          window.location.reload();
        }
      } catch { alert("파일 형식이 잘못되었습니다."); }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <SectionTitle>⚙️ 설정</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>복습 주기 (일 단위)</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input value={tempDays} onChange={setTempDays} />
          <Btn onClick={saveDays} small>변경</Btn>
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>데이터 관리</div>
        <Btn onClick={exportData} outline style={{ width: "100%", marginBottom: 8 }}>📤 내보내기</Btn>
        <div style={{ position: "relative" }}>
          <Btn outline color={C.sage} style={{ width: "100%" }}>📥 가져오기</Btn>
          <input type="file" onChange={importData} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0 }} />
        </div>
      </Card>
    </div>
  );
}

// ── 하단 탭 버튼 컴포넌트 (누락 주의!) ──────────────────────────
const TabBtn = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", flex: 1 }}>
    <span style={{ fontSize: 20, filter: active ? "none" : "grayscale(1) opacity(0.5)" }}>{icon}</span>
    <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.accent : C.muted }}>{label}</span>
  </button>
);