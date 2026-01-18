import Simulator from "./Simulator";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6EEDB",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont"
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#2F6B3F",
          color: "white",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}
      >
        <img
          src="/mitra-avatar.jpeg"
          alt="Mitra"
          style={{ height: "48px", width: "48px", borderRadius: "50%" }}
        />
        <div>
          <h2 style={{ margin: 0 }}>MITRA</h2>
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
            Your Finance Buddy
          </p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
        <Simulator />
      </div>
    </div>
  );
}

export default App;