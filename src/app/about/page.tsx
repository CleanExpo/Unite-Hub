import Link from 'next/link';

export default function About() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
        About Unite Group
      </h1>
      
      <p style={{ marginBottom: "1rem" }}>
        Unite Group is a comprehensive project management platform designed to help teams collaborate effectively.
      </p>
      
      <Link href="/" style={{ color: "#0070f3", textDecoration: "underline" }}>
        Back to Home
      </Link>
    </main>
  );
}