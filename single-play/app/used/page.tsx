// Shown when a one-time link has already been used (or is missing / invalid).
export default function Used() {
  return (
    <main className="home">
      <div className="homeCard">
        <div style={{ fontSize: 56, textAlign: "center" }}>🔒</div>
        <h1 className="homeTitle" style={{ marginTop: 8 }}>यह लिंक इस्तेमाल हो चुका है</h1>
        <p style={{ marginTop: 10, fontSize: 17, color: "#0a3d57", textAlign: "center", maxWidth: 320 }}>
          यह खेल का लिंक पहले ही खोला जा चुका है।
          <br />
          <span style={{ fontSize: 14, color: "#5a7a88" }}>
            This game link has already been used. Please ask for a new link to play again.
          </span>
        </p>
      </div>
    </main>
  );
}
