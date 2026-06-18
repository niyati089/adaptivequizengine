import React from 'react';
import Link from 'next/link';

const footerLinks = {
  Platform: [
    { label: 'Adaptive Quiz', href: '/quiz' },
    { label: 'Learner Dashboard', href: '/dashboard' },
    { label: 'Educator Analytics', href: '/educator' },
    { label: 'Analytics', href: '/analytics' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

export const Footer: React.FC = () => (
  <footer style={{ background: '#111827', color: '#D1D5DB', paddingTop: '4rem', paddingBottom: '2rem' }}>
    <div className="container" style={{ padding: '0 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        {/* Brand */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: '2rem', height: '2rem', background: '#7C3AED', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.875rem' }}>A</span>
            </div>
            <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              AdaptiveTutor
            </span>
          </div>
          <p style={{ fontSize: '0.9375rem', color: '#9CA3AF', lineHeight: 1.7, maxWidth: '22rem' }}>
            AI-powered adaptive learning platform using IRT, Socratic tutoring, spaced repetition, and misconception detection.
          </p>
        </div>

        {/* Link groups */}
        {Object.entries(footerLinks).map(([group, links]) => (
          <div key={group}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F9FAFB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              {group}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {links.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="footer-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="divider" style={{ borderColor: '#1F2937' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          © {new Date().getFullYear()} AdaptiveTutor. All rights reserved.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          Built for learners, by learners.
        </p>
      </div>
    </div>
  </footer>
);
