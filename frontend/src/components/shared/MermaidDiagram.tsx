"use client";

import React, { useEffect, useId, useState } from "react";

interface MermaidDiagramProps {
  syntax: string | null | undefined;
}

// Mermaid must only ever be initialized once per page, and only on the
// client (it touches `document`/`window`), so this is guarded module-level
// state plus a dynamic import inside useEffect.
let mermaidInitPromise: Promise<typeof import("mermaid").default> | null = null;

function getMermaid() {
  if (!mermaidInitPromise) {
    mermaidInitPromise = import("mermaid").then((mod) => {
      const mermaid = mod.default;
      mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
      return mermaid;
    });
  }
  return mermaidInitPromise;
}

export function MermaidDiagram({ syntax }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    if (!syntax) {
      setSvg(null);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    getMermaid()
      .then((mermaid) => mermaid.render(`mermaid-${reactId}-${Date.now()}`, syntax))
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) setSvg(renderedSvg);
      })
      .catch((e) => {
        console.warn("Failed to render Mermaid diagram:", e);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [syntax, reactId]);

  if (!syntax) return null;

  if (error) {
    return (
      <div style={{ padding: "0.75rem", background: "var(--pink-soft)", border: "1px solid #ffb2b7", borderRadius: "0.75rem", color: "#92002a", fontSize: "0.85rem", fontWeight: 650 }}>
        Diagram unavailable for this explanation.
      </div>
    );
  }

  if (loading || !svg) {
    return (
      <div style={{ padding: "0.75rem", color: "var(--muted)", fontSize: "0.85rem", fontWeight: 650 }}>
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        background: "var(--surface-low)",
        borderRadius: "0.75rem",
        padding: "0.85rem",
        border: "1px dashed var(--outline)",
        overflowX: "auto",
      }}
      // Mermaid's render() output is trusted SVG markup produced from
      // backend-sanitized, mermaid-parsed syntax -- this is the standard
      // integration pattern for mermaid.js in React.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
