"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/quiz", label: "Quiz", roles: ["student"] },
  { href: "/classes", label: "Classes" },
  { href: "/dashboard", label: "Dashboard", roles: ["student"] },
  { href: "/educator", label: "Educator", roles: ["teacher"] },
  { href: "/analytics", label: "Analytics" },
];

const isActive = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  const base = href.split("#")[0];
  return base !== "/" && pathname.startsWith(base);
};

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { user, logout } = useAuth();

  // Refs so the scroll handler never has to re-subscribe or re-render
  // just to read the latest values (this was the source of the jitter/glitch).
  const lastScrollY = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const HIDE_THRESHOLD = 80; // don't start hiding until we're past the top area
    const DELTA = 8; // ignore tiny sub-pixel scroll jitter

    const update = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      // Always show the island near the top of the page.
      if (currentY < HIDE_THRESHOLD) {
        setHidden(false);
      } else if (Math.abs(diff) > DELTA) {
        // Scrolling down -> hide, scrolling up -> reveal.
        setHidden(diff > 0);
      }

      lastScrollY.current = currentY;
      tickingRef.current = false;
    };

    const handleScroll = () => {
      // Batch scroll reads/writes into a single animation frame so we
      // aren't calling setState on every fired scroll event.
      if (!tickingRef.current) {
        tickingRef.current = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Always show the menu (and never hide the bar) while the mobile
  // dropdown is open, so it can't disappear out from under an open menu.
  useEffect(() => {
    if (mobileOpen) setHidden(false);
  }, [mobileOpen]);

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AT";
  const visibleLinks = navLinks.filter((link) => !link.roles || (user && link.roles.includes(user.role)));

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: "var(--z-fixed)",
        display: "flex",
        justifyContent: "center",
        padding: "var(--space-4)",
        pointerEvents: hidden ? "none" : "auto",
        transform: hidden ? "translateY(-130%)" : "translateY(0)",
        opacity: hidden ? 0 : 1,
        transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
      }}
    >
      <div
        style={{
          width: "min(calc(100% - var(--space-8)), 72rem)",
          padding: "var(--space-3) var(--space-5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-6)",
          borderRadius: "var(--radius-full)",
          background: "rgba(18, 24, 38, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Link
          href="/"
          aria-label="AdaptiveTutor home"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "2px"
          }}
        >
          <span style={{
            fontSize: "1.5rem",
            fontWeight: "900",
            background: "linear-gradient(to right, #6366f1, #a855f7, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.05em",
          }}>
            Adaptive
          </span>
          <span style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#f8fafc",
            letterSpacing: "-0.02em",
          }}>
            Tutor
          </span>
          <span style={{ color: '#ec4899', fontSize: '1.5rem', fontWeight: '900' }}>.</span>
        </Link>

        <nav className="hidden md:flex" style={{ alignItems: "center", justifyContent: "center", gap: "clamp(var(--space-4), 2.5vw, var(--space-6))", flex: 1 }}>
          {visibleLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-semibold)",
                  textDecoration: "none",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-lg)",
                  color: active ? "#c4b5fd" : "rgba(255, 255, 255, 0.6)",
                  background: active ? "rgba(167, 139, 250, 0.16)" : "transparent",
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#f1f5f9";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
          {user ? (
            <div className="hidden sm:flex" style={{ alignItems: "center", gap: "var(--space-3)" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-full)",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#f1f5f9",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-bold)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
              title={`${user.name} (${user.role})`}
              >
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-full)",
                  background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
                  color: "#f8fafc",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-black)"
                }}>
                  {initials}
                </span>
                <span className="hidden lg:inline">{user.name?.split(" ")[0]}</span>
                <span style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "var(--text-xs)",
                  textTransform: "capitalize",
                  fontWeight: "var(--font-medium)"
                }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.7)",
                  width: "2.6rem",
                  height: "2.6rem",
                  borderRadius: "var(--radius-full)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                  e.currentTarget.style.color = "#f87171";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex" style={{ alignItems: "center", gap: "var(--space-3)" }}>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-3) var(--space-5)",
                  borderRadius: "var(--radius-full)",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  color: "#f8fafc",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-extrabold)",
                  textDecoration: "none",
                  boxShadow: "0 4px 15px rgba(139, 92, 246, 0.35)",
                  transition: "all var(--transition-fast)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.35)";
                }}
              >
                Sign In
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden"
            style={{
              padding: "var(--space-2)",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "var(--radius-lg)",
              color: "#f1f5f9",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            aria-label="Toggle menu"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: "var(--space-4)",
          right: "var(--space-4)",
          background: "rgba(18, 24, 38, 0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          marginTop: "var(--space-2)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}>
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-lg)",
                textDecoration: "none",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-bold)",
                color: isActive(pathname, link.href) ? "#f8fafc" : "rgba(255, 255, 255, 0.75)",
                background: isActive(pathname, link.href) ? "rgba(139, 92, 246, 0.35)" : "rgba(255, 255, 255, 0.06)",
                transition: "all var(--transition-fast)",
              }}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              style={{
                marginTop: "var(--space-2)",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "rgba(255, 255, 255, 0.75)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-bold)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                justifyContent: "center",
                transition: "all var(--transition-fast)",
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                marginTop: "var(--space-2)",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                color: "#f8fafc",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-extrabold)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                justifyContent: "center",
                boxShadow: "0 4px 15px rgba(107, 56, 212, 0.3)",
                transition: "all var(--transition-fast)",
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
};