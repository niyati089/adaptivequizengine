"use client";

import { useProctoring } from "@/hooks/useProctoring";
import { useEffect, useState } from "react";
import { ProctoringPreview } from "@/components/proctoring/ProctoringPreview";

export default function TestProctoringPage() {
  const [enabled, setEnabled] = useState(false);
  const proctoring = useProctoring(enabled);

  useEffect(() => {
    if (enabled) {
      proctoring.start();
    } else {
      proctoring.stop();
    }
  }, [enabled]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1rem" }}>Proctoring System Test</h1>
      
      <button 
        onClick={() => setEnabled(!enabled)}
        style={{
          padding: "1rem 2rem",
          fontSize: "1rem",
          borderRadius: "0.5rem",
          border: "none",
          background: enabled ? "#dc2626" : "#059669",
          color: "white",
          cursor: "pointer",
          marginBottom: "2rem"
        }}
      >
        {enabled ? "Stop Camera" : "Start Camera"}
      </button>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div className="card">
          <h3>Status</h3>
          <p>Enabled: {enabled ? "Yes" : "No"}</p>
          <p>Ready: {proctoring.ready ? "Yes" : "No"}</p>
          <p>Error: {proctoring.error || "None"}</p>
        </div>

        <div className="card">
          <h3>Detection Results</h3>
          <p>Face Detected: {proctoring.detection.faceDetected ? "✅ Yes" : "❌ No"}</p>
          <p>Face Count: {proctoring.detection.faceCount}</p>
          <p>Multiple People: {proctoring.detection.multiplePeople ? "⚠️ Yes" : "No"}</p>
          <p>Looking Away: {proctoring.detection.lookingAway ? "⚠️ Yes" : "No"}</p>
          <p>Phone Detected: {proctoring.detection.phoneDetected ? "⚠️ Yes" : "No (not implemented)"}</p>
          <p>Paper Detected: {proctoring.detection.paperDetected ? "⚠️ Yes" : "No (not implemented)"}</p>
        </div>
      </div>

      {enabled && proctoring.stream && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Camera Preview</h3>
          <ProctoringPreview
            stream={proctoring.stream}
            status={{
              faceDetected: proctoring.detection.faceDetected,
              multiplePeople: proctoring.detection.multiplePeople,
              phoneDetected: proctoring.detection.phoneDetected,
              paperDetected: proctoring.detection.paperDetected,
              lookingAway: proctoring.detection.lookingAway,
              violations: [
                ...(proctoring.detection.multiplePeople ? ['Multiple people'] : []),
                ...(proctoring.detection.phoneDetected ? ['Phone'] : []),
                ...(proctoring.detection.paperDetected ? ['Paper'] : []),
                ...(proctoring.detection.lookingAway ? ['Looking away'] : []),
                ...(!proctoring.detection.faceDetected ? ['No face'] : [])
              ]
            }}
            onMinimize={() => {}}
            isMinimized={false}
          />
        </div>
      )}

      <div className="card" style={{ marginTop: "2rem", background: "#fef3c7" }}>
        <h3>Instructions</h3>
        <ol>
          <li>Click "Start Camera" and allow camera access</li>
          <li>Wait for "Ready: Yes" to appear</li>
          <li>Check browser console (F12) for detection logs</li>
          <li>Try these tests:
            <ul>
              <li>Cover your face - should detect "No face"</li>
              <li>Show 2 people - should detect "Multiple people"</li>
              <li>Look to the side - should detect "Looking away"</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
}
