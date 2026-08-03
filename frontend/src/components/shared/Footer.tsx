import React from "react";
import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Quiz", href: "/quiz" },
    { label: "Challenges", href: "/#challenges" },
    { label: "Classes", href: "/classes" },
    { label: "Analytics", href: "/analytics" },
  ],
  Educators: [
    { label: "Hub", href: "/educator" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export const Footer: React.FC = () => (
  <footer style={{ background: "rgba(255,255,255,0.72)", borderTop: "1px solid var(--outline)", padding: "3rem 1.5rem 2rem" }}>
    <div style={{ width: "min(100%, 80rem)", margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
        <div style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.8rem", background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
              A
            </div>
            <span style={{ color: "var(--ink)", fontSize: "1.2rem", fontWeight: 850 }}>AdaptiveTutor</span>
          </div>
          <p style={{ maxWidth: "24rem", lineHeight: 1.7, color: "var(--muted)", margin: 0 }}>
            The future of personalized learning, powered by adaptive quizzes, Socratic support, and mastery analytics.
          </p>
        </div>

        {Object.entries(footerLinks).map(([group, links]) => (
          <div key={group}>
            <h4 style={{ fontSize: "0.78rem", fontWeight: 850, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "1rem" }}>
              {group}
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="footer-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.25rem", borderTop: "1px solid rgba(198,198,204,0.55)", flexWrap: "wrap", gap: "1rem" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
          © {new Date().getFullYear()} AdaptiveTutor. All rights reserved.
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
          Calm learning, measurable progress.
        </p>
      </div>
    </div>
  </footer>
);
