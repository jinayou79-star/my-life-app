export default function DailyRoutineApp() {
  const [activeTab, setActiveTab] = usePersist("activeTab", "home");
  const [reviewDays, setReviewDays] = usePersist("reviewDays", [1, 3, 7, 15]);
  
  // 데이터 통합 관리 (백업용)
  const [routines, setRoutines] = usePersist("routines", [
    { id: 1, name: "영어 뉴스 번역", icon: "📰", color: C.accent },
    { id: 2, name: "주식 시장 분석", icon: "📈", color: C.sage }
  ]);
  const [events, setEvents] = usePersist("events", []);
  const [todos, setTodos] = usePersist("todos", []);
  const [routineLogs, setRoutineLogs] = usePersist("routineLogs", []);

  // 모든 데이터를 하나로 묶음
  const allData = { routines, events, todos, routineLogs, reviewDays };
  const setAllData = (data) => {
    if (data.routines) setRoutines(data.routines);
    if (data.events) setEvents(data.events);
    if (data.todos) setTodos(data.todos);
    if (data.routineLogs) setRoutineLogs(data.routineLogs);
    if (data.reviewDays) setReviewDays(data.reviewDays);
  };

  const renderContent = () => {
    if (activeTab === "home") return <HomeTab routines={routines} events={events} todos={todos} setTodos={setTodos} routineLogs={routineLogs} setRoutineLogs={setRoutineLogs} onTabChange={setActiveTab} />;
    if (activeTab === "calendar") return <CalendarTab events={events} setEvents={setEvents} todos={todos} setTodos={setTodos} />;
    if (activeTab === "settings") return <SettingsTab reviewDays={reviewDays} setReviewDays={setReviewDays} allData={allData} setAllData={setAllData} />;
    
    if (activeTab.startsWith("routine_")) {
      const rId = parseInt(activeTab.split("_")[1]);
      const routine = routines.find(r => r.id === rId);
      // RoutineTab에 현재 설정된 reviewDays 전달
      return <RoutineTab routine={routine} routineLogs={routineLogs} setRoutineLogs={setRoutineLogs} reviewDays={reviewDays} />;
    }
    return null;
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "sans-serif" }}>
      <div style={{ padding: "16px 16px 80px 16px" }}>
        {renderContent()}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, height: 65, background: "#fff", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 100 }}>
        <TabBtn active={activeTab === "home"} onClick={() => setActiveTab("home")} label="홈" icon="🏠" />
        <TabBtn active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} label="일정" icon="📅" />
        <TabBtn active={activeTab === "settings"} onClick={() => setActiveTab("settings")} label="설정" icon="⚙️" />
      </div>
    </div>
  );
}