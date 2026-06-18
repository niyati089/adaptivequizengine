"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/educator', label: 'Educator' },
  { href: '/analytics', label: 'Analytics' },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #E5E7EB',
      height: '4rem',
    }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{ width: '2rem', height: '2rem', background: '#7C3AED', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={16} color="white" />
          </div>
          <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            Adaptive<span style={{ color: '#7C3AED' }}>Tutor</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden md:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none',
                padding: '0.4rem 0.75rem', borderRadius: '8px',
                color: pathname === link.href ? '#7C3AED' : '#4B5563',
                background: pathname === link.href ? '#EDE9FE' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/quiz" className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem', borderRadius: '8px' }}>
            Start Learning
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none', padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }}
            className="md:hidden flex"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '4rem', left: 0, right: 0,
          background: 'white', borderBottom: '1px solid #E5E7EB',
          padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
        }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              style={{
                padding: '0.75rem 1rem', borderRadius: '8px', textDecoration: 'none',
                fontSize: '0.9375rem', fontWeight: 500,
                color: pathname === link.href ? '#7C3AED' : '#374151',
                background: pathname === link.href ? '#EDE9FE' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
