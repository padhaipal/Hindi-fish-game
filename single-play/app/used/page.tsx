// Shown when a one-time link has already been used (or is missing / invalid).
export default function Used() {
  return (
    <main className="home">
      <div className="homeCard">
        <div style={{ fontSize: 56, textAlign: "center" }}>🔒</div>
        <h1 className="homeTitle" style={{ marginTop: 8 }}>यह लिंक इस्तेमाल हो चुका है</h1>
        <p style={{ marginTop: 10, fontSize: 17, color: "#0a3d57", textAlign: "center", maxWidth: 340 }}>
          एक और खेल पाने के लिए चैटबॉट का 10 मिनट और इस्तेमाल करें।
          <br />
          <span style={{ fontSize: 14, color: "#5a7a88" }}>
            Please use the chatbot for another 10 minutes to get the link for another game.
          </span>
        </p>
      </div>
    </main>
  );
}
