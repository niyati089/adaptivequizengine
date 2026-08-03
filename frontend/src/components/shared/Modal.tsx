import React from 'react';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: React.ReactNode;
 size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
 isOpen,
 onClose,
 title,
 children,
 size = 'md',
}) => {
 if (!isOpen) return null;

 const sizeStyles: Record<string, React.CSSProperties> = {
 sm: { maxWidth: '24rem' },
 md: { maxWidth: '32rem' },
 lg: { maxWidth: '48rem' },
 };

 const backdropStyles: React.CSSProperties = {
 position: 'fixed',
 top: 0,
 left: 0,
 right: 0,
 bottom: 0,
 background: 'rgba(0, 0, 0, 0.6)',
 display: 'grid',
 placeItems: 'center',
 zIndex: 'var(--z-modal-backdrop)',
 animation: 'fadeIn 0.2s ease-in',
 };

 const modalStyles: React.CSSProperties = {
 background: 'var(--surface)',
 borderRadius: 'var(--radius-2xl)',
 padding: 'var(--space-8)',
 width: '90%',
 boxShadow: 'var(--shadow-2xl)',
 animation: 'slideUp 0.3s ease-out',
 ...sizeStyles[size],
 };

 const headerStyles: React.CSSProperties = {
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: 'var(--space-6)',
 };

 const titleStyles: React.CSSProperties = {
 fontSize: 'var(--text-xl)',
 fontWeight: 'var(--font-extrabold)',
 color: 'var(--ink)',
 margin: 0,
 };

 const closeButtonStyles: React.CSSProperties = {
 background: 'var(--surface-low)',
 border: 'none',
 borderRadius: 'var(--radius-full)',
 width: '2rem',
 height: '2rem',
 display: 'grid',
 placeItems: 'center',
 cursor: 'pointer',
 color: 'var(--muted)',
 transition: 'background var(--transition-fast), color var(--transition-fast)',
 };

 return (
 <div style={backdropStyles} onClick={onClose}>
 <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
 {title && (
 <div style={headerStyles}>
 <h2 style={titleStyles}>{title}</h2>
 <button
 style={closeButtonStyles}
 onClick={onClose}
 onMouseEnter={(e) => {
 e.currentTarget.style.background = 'var(--surface-high)';
 e.currentTarget.style.color = 'var(--ink)';
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.background = 'var(--surface-low)';
 e.currentTarget.style.color = 'var(--muted)';
 }}
 >
 
 </button>
 </div>
 )}
 {children}
 </div>
 </div>
 );
};
