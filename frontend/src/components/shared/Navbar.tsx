"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  // Dynamic Navigation Links based on role
  const getNavLinks = () => {
    const baseLinks = [{ href: '/', label: 'Home' }];
    
    if (!user) {
      return baseLinks;
    }
    
    if (user.role === 'student') {
      return [
        ...baseLinks,
        { href: '/quiz', label: 'Quiz' },
        { href: '/dashboard', label: 'Learner Dashboard' },
      ];
    }
    
    if (user.role === 'teacher') {
      return [
        ...baseLinks,
        { href: '/educator', label: 'Educator Panel' },
        { href: '/analytics', label: 'Analytics' },
      ];
    }
    
    return baseLinks;
  };

  const navLinks = getNavLinks();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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

        {/* CTA & User Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isLoading && (
            <>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  {/* User Avatar & Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="hidden sm:flex">
                    <div style={{
                      width: '2rem', height: '2rem',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                      color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8125rem', fontWeight: 700,
                    }}>
                      {getInitials(user.name)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827', lineHeight: 1.1 }}>
                        {user.name}
                      </span>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 600,
                        color: user.role === 'teacher' ? '#EC4899' : '#06B6D4',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}>
                        {user.role === 'teacher' ? 'Educator' : 'Student'}
                      </span>
                    </div>
                  </div>

                  {/* Logout Action */}
                  <button
                    onClick={logout}
                    style={{
                      background: 'none', border: '1px solid #E5E7EB',
                      borderRadius: '8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.375rem', padding: '0.4rem 0.75rem',
                      color: '#4B5563', fontSize: '0.8125rem', fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#EF4444';
                      e.currentTarget.style.borderColor = '#FCA5A5';
                      e.currentTarget.style.backgroundColor = '#FEF2F2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#4B5563';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Link
                    href="/login"
                    style={{
                      fontSize: '0.875rem', fontWeight: 600,
                      color: '#4B5563', textDecoration: 'none',
                      padding: '0.5rem 1rem', borderRadius: '8px',
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    style={{
                      fontSize: '0.875rem', fontWeight: 700,
                      color: 'white', textDecoration: 'none',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                      padding: '0.5rem 1.25rem', borderRadius: '8px',
                      boxShadow: '0 4px 10px rgba(124, 58, 237, 0.15)',
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </>
          )}

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
          {user && (
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                margin: '0.5rem 1rem 0', padding: '0.75rem 1rem',
                border: 'none', background: 'none', width: 'calc(100% - 2rem)',
                textAlign: 'left', cursor: 'pointer', fontSize: '0.9375rem',
                fontWeight: 600, color: '#EF4444',
              }}
            >
              <LogOut size={16} />
              <span>Log out ({user.name})</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};

