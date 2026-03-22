export function SplashScreen({ error }: { error?: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        fontFamily: "system-ui, sans-serif",
        gap: "24px",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "linear-gradient(135deg, #00ff87, #00c853)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          boxShadow: "0 0 40px rgba(0,255,135,0.3)",
        }}
      >
        💪
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
          FitForge<span style={{ color: "#00ff87" }}>.ai</span>
        </div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
          {error ? "A apărut o eroare" : "Se încarcă..."}
        </div>
      </div>

      {!error && (
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #1a1a1a",
            borderTop: "3px solid #00ff87",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      )}

      {error && (
        <div
          style={{
            maxWidth: 320,
            padding: "16px 20px",
            background: "#1a0505",
            border: "1px solid #ff4444",
            borderRadius: 12,
            color: "#ff8888",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {error}
          <br />
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              padding: "8px 16px",
              background: "#00ff87",
              color: "#000",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Reîncarcă pagina
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
