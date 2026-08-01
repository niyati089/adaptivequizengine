"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, Copy, Eye, MousePointer, Smartphone, FileText, Users, User, Activity } from "lucide-react";
import { getQuizProctoringEvents } from "@/services/quizService";
import { DancingSquares } from "@/components/shared/DancingSquares";

interface ProctoringDashboardProps {
  quizId: number;
  studentId?: number;
}

interface ProctoringEvent {
  id: number;
  event_type: string;
  event_data?: string;
  timestamp: string;
  attempt_id?: number;
  severity: string;
  confidence?: number;
}

interface StudentProctoringData {
  student_id: number;
  student_name: string;
  student_email: string;
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  events: ProctoringEvent[];
}

interface ProctoringData {
  quiz_id: number;
  quiz_title: string;
  max_warnings: number;
  students: StudentProctoringData[];
}

export function ProctoringDashboard({ quizId, studentId }: ProctoringDashboardProps) {
  const [data, setData] = useState<ProctoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProctoringData();
  }, [quizId, studentId]);

  const loadProctoringData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getQuizProctoringEvents(quizId, studentId);
      
      // Validate response structure
      if (!result || typeof result !== 'object') {
        throw new Error("Invalid response format from server");
      }
      
      if (!result.students || !Array.isArray(result.students)) {
        throw new Error("Invalid students data in response");
      }
      
      setData(result);
    } catch (e: any) {
      console.error("Failed to load proctoring data:", e);
      let errorMsg = "Failed to load proctoring data. Please try again.";
      
      if (e?.code === "ERR_NETWORK" || e?.message?.includes("Network Error") || e?.message?.includes("fetch")) {
        errorMsg = "Network error: Unable to connect to the backend server. Please ensure the backend is running on port 8000.";
      } else if (e?.response?.data?.detail) {
        errorMsg = e.response.data.detail;
      } else if (e?.message) {
        errorMsg = e.message;
      } else if (typeof e === 'string') {
        errorMsg = e;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "tab_switch":
        return <Eye size={16} />;
      case "copy":
        return <Copy size={16} />;
      case "paste":
        return <Copy size={16} />;
      case "context_menu":
        return <MousePointer size={16} />;
      case "window_blur":
        return <Eye size={16} />;
      case "no_face_detected":
        return <User size={16} />;
      case "multiple_people":
        return <Users size={16} />;
      case "phone_detected":
        return <Smartphone size={16} />;
      case "paper_detected":
        return <FileText size={16} />;
      case "looking_away":
        return <Activity size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      tab_switch: "Tab Switch",
      copy: "Copy Detected",
      paste: "Paste Detected",
      context_menu: "Context Menu",
      window_blur: "Window Blur",
      no_face_detected: "No Face Detected",
      multiple_people: "Multiple People",
      phone_detected: "Phone Detected",
      paper_detected: "Paper/Notes Detected",
      looking_away: "Looking Away"
    };
    return labels[eventType] || eventType;
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "tab_switch":
      case "window_blur":
      case "looking_away":
        return "var(--amber)";
      case "copy":
      case "paste":
      case "no_face_detected":
      case "phone_detected":
      case "paper_detected":
        return "var(--coral)";
      case "context_menu":
        return "var(--primary)";
      case "multiple_people":
        return "var(--coral)";
      default:
        return "var(--muted)";
    }
  };

  const getSeverityBadge = (severity: string) => {
    const classMap: Record<string, string> = {
      low: "badge-green",
      medium: "badge-amber",
      high: "badge-amber",
      critical: "badge-red"
    };
    return <span className={`badge ${classMap[severity] || "badge-blue"}`}>{severity}</span>;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "grid", placeItems: "center" }}>
        <DancingSquares size="md" label="Loading proctoring data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ background: "var(--pink-soft)", borderColor: "#ffb2b7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertTriangle size={16} color="var(--coral)" />
          <p style={{ color: "#92002a", margin: 0 }}>{error}</p>
        </div>
        <button 
          onClick={loadProctoringData}
          className="btn-primary"
          style={{
            marginTop: "0.75rem"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)", margin: 0, textAlign: "center" }}>
          No proctoring data available.
        </p>
      </div>
    );
  }

  if (data.students.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <AlertTriangle size={48} color="var(--muted)" style={{ marginBottom: "1rem" }} />
          <p style={{ color: "var(--ink)", margin: 0, fontSize: "1rem", fontWeight: 700 }}>
            No proctoring events recorded yet
          </p>
          <p style={{ color: "var(--muted)", margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
            Events will appear here once students begin taking the quiz with proctoring enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Header Card */}
      <div className="card">
        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--navy)" }}>
          Proctoring Report: {data.quiz_title}
        </h3>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
          Maximum warnings: <strong style={{ color: "var(--navy)" }}>{data.max_warnings}</strong> events per student
        </p>
      </div>

      {/* Overall Statistics Summary */}
      <div className="card">
        <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 1rem", color: "var(--navy)" }}>
          Overall Statistics
        </h4>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem"
        }}>
          {(() => {
            // Calculate total events by type across all students
            const totalEventsByType: Record<string, number> = {};
            const totalEventsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
            let totalStudents = data.students.length;
            let totalEvents = 0;
            let studentsExceeded = 0;

            data.students.forEach(student => {
              totalEvents += student.total_events;
              if (student.total_events > data.max_warnings) {
                studentsExceeded++;
              }

              // Sum event types
              Object.entries(student.events_by_type).forEach(([type, count]) => {
                totalEventsByType[type] = (totalEventsByType[type] || 0) + count;
              });

              // Sum severities
              totalEventsBySeverity.low += student.events_by_severity.low;
              totalEventsBySeverity.medium += student.events_by_severity.medium;
              totalEventsBySeverity.high += student.events_by_severity.high;
              totalEventsBySeverity.critical += student.events_by_severity.critical;
            });

            return (
              <>
                <div className="stat-card">
                  <div className="stat-number" style={{ color: "var(--primary)" }}>
                    {totalStudents}
                  </div>
                  <div className="stat-label">Total Students</div>
                </div>

                <div className="stat-card">
                  <div className="stat-number" style={{ color: "var(--coral)" }}>
                    {totalEvents}
                  </div>
                  <div className="stat-label">Total Events</div>
                </div>

                <div className="stat-card">
                  <div className="stat-number" style={{ color: studentsExceeded > 0 ? "var(--coral)" : "var(--green)" }}>
                    {studentsExceeded}
                  </div>
                  <div className="stat-label">Students Flagged</div>
                </div>

                <div className="stat-card">
                  <div className="stat-number" style={{ color: "var(--amber)" }}>
                    {Object.keys(totalEventsByType).length}
                  </div>
                  <div className="stat-label">Event Types</div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Event Type Breakdown */}
        <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--outline)" }}>
          <h5 style={{ 
            fontSize: "0.85rem", 
            fontWeight: 800, 
            textTransform: "uppercase",
            color: "var(--muted)",
            margin: "0 0 0.75rem",
            letterSpacing: "0.05em"
          }}>
            Event Breakdown
          </h5>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {(() => {
              const totalEventsByType: Record<string, number> = {};
              data.students.forEach(student => {
                Object.entries(student.events_by_type).forEach(([type, count]) => {
                  totalEventsByType[type] = (totalEventsByType[type] || 0) + count;
                });
              });

              return Object.entries(totalEventsByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="badge badge-blue">
                    {getEventIcon(type)}
                    {getEventLabel(type)}: {count}
                  </div>
                ));
            })()}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div style={{ marginTop: "1rem" }}>
          <h5 style={{ 
            fontSize: "0.85rem", 
            fontWeight: 800, 
            textTransform: "uppercase",
            color: "var(--muted)",
            margin: "0 0 0.75rem",
            letterSpacing: "0.05em"
          }}>
            Severity Breakdown
          </h5>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {(() => {
              const totalEventsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
              data.students.forEach(student => {
                totalEventsBySeverity.low += student.events_by_severity.low;
                totalEventsBySeverity.medium += student.events_by_severity.medium;
                totalEventsBySeverity.high += student.events_by_severity.high;
                totalEventsBySeverity.critical += student.events_by_severity.critical;
              });

              return (
                <>
                  {totalEventsBySeverity.low > 0 && (
                    <div className="badge badge-green">
                      <AlertTriangle size={12} />
                      Low: {totalEventsBySeverity.low}
                    </div>
                  )}
                  {totalEventsBySeverity.medium > 0 && (
                    <div className="badge badge-amber">
                      <AlertTriangle size={12} />
                      Medium: {totalEventsBySeverity.medium}
                    </div>
                  )}
                  {totalEventsBySeverity.high > 0 && (
                    <div className="badge badge-red">
                      <AlertTriangle size={12} />
                      High: {totalEventsBySeverity.high}
                    </div>
                  )}
                  {totalEventsBySeverity.critical > 0 && (
                    <div className="badge badge-red">
                      <AlertTriangle size={12} />
                      Critical: {totalEventsBySeverity.critical}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Student Details */}

      {data.students.map((student) => {
        const exceeded = student.total_events > data.max_warnings;
        const severityBreakdown = student.events_by_severity || { low: 0, medium: 0, high: 0, critical: 0 };
        
        return (
          <div 
            key={student.student_id} 
            className="card" 
            style={{ 
              background: exceeded ? "var(--pink-soft)" : "white",
              borderColor: exceeded ? "#ffb2b7" : "var(--outline)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--ink)" }}>
                  {student.student_name || "Unknown Student"}
                </h4>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                  {student.student_email || "No email"}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className={exceeded ? "badge badge-red" : "badge badge-blue"}>
                  <AlertTriangle size={14} />
                  {student.total_events} events
                </div>
                {exceeded && (
                  <div className="badge badge-red" style={{ 
                    marginTop: "0.5rem",
                    fontSize: "0.7rem"
                  }}>
                    Threshold Exceeded
                  </div>
                )}
              </div>
            </div>

            {/* Severity breakdown */}
            <div style={{ 
              display: "flex", 
              gap: "0.5rem", 
              flexWrap: "wrap",
              marginBottom: "1rem"
            }}>
              {severityBreakdown.low > 0 && (
                <div className="badge badge-green">
                  <AlertTriangle size={12} />
                  Low: {severityBreakdown.low}
                </div>
              )}
              {severityBreakdown.medium > 0 && (
                <div className="badge badge-amber">
                  <AlertTriangle size={12} />
                  Medium: {severityBreakdown.medium}
                </div>
              )}
              {severityBreakdown.high > 0 && (
                <div className="badge badge-red">
                  <AlertTriangle size={12} />
                  High: {severityBreakdown.high}
                </div>
              )}
              {severityBreakdown.critical > 0 && (
                <div className="badge badge-red">
                  <AlertTriangle size={12} />
                  Critical: {severityBreakdown.critical}
                </div>
              )}
            </div>

            {/* Event type summary */}
            <div style={{ 
              display: "flex", 
              gap: "0.5rem", 
              flexWrap: "wrap",
              marginBottom: "0"
            }}>
              {Object.entries(student.events_by_type).map(([type, count]) => (
                <div 
                  key={type}
                  className="badge badge-blue"
                >
                  {getEventIcon(type)}
                  {getEventLabel(type)}: {count}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
