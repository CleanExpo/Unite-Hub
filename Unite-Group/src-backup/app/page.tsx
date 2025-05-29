import Link from "next/link";

export default function Home() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)",
      color: "white"
    }}>
      {/* Navigation */}
      <nav style={{
        position: "fixed",
        width: "100%",
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(0,0,0,0.2)",
        zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "64px"
        }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Unite Group</h1>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/login" style={{
              color: "rgba(255,255,255,0.8)",
              textDecoration: "none",
              padding: "0.5rem 1rem"
            }}>Login</Link>
            <Link href="/register" style={{
              backgroundColor: "#9333ea",
              color: "white",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.5rem",
              textDecoration: "none"
            }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: "8rem", paddingBottom: "5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1rem" }}>
          <h1 style={{
            fontSize: "4rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            lineHeight: "1.1"
          }}>
            Project Management
            <span style={{
              display: "block",
              background: "linear-gradient(to right, #a855f7, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Reimagined</span>
          </h1>

          <p style={{
            fontSize: "1.25rem",
            color: "#d1d5db",
            maxWidth: "48rem",
            margin: "0 auto 3rem"
          }}>
            Unite Group brings teams together with intelligent workflows,
            real-time collaboration, and insights that drive results.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link href="/register" style={{
              background: "linear-gradient(to right, #9333ea, #ec4899)",
              color: "white",
              padding: "1rem 2rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: "600"
            }}>Start Free Trial</Link>
            <Link href="/demo" style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "white",
              padding: "1rem 2rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: "600",
              border: "1px solid rgba(255,255,255,0.2)"
            }}>Watch Demo</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
