# Design System Documentation

## Overview
This design system provides a single source of truth for visual consistency across the AdaptiveTutor application. All styling should use CSS custom properties (CSS variables) defined in `globals.css` and the shared components in `src/components/shared/`.

## Color System

### Brand Colors
- `--primary`: #6b38d4 (Primary purple - main brand color)
- `--primary-hover`: #8455ef (Primary hover state)
- `--primary-soft`: #e9ddff (Primary background variant)
- `--primary-light`: #a78bfa (Light primary)

### Semantic Colors
- `--success`: #059669 (Success/green)
- `--success-soft`: #dcfce7 (Success background)
- `--warning`: #d97706 (Warning/amber)
- `--warning-soft`: #fef3c7 (Warning background)
- `--error`: #dc2626 (Error/red)
- `--error-soft`: #fee2e2 (Error background)
- `--info`: #0284c7 (Info/blue)
- `--info-soft`: #e0f2fe (Info background)

### Neutral Colors
- `--background`: #fcf8fa (Page background)
- `--surface`: #ffffff (Card/surface background)
- `--surface-low`: #f6f3f4 (Low emphasis surface)
- `--surface-mid`: #f0edee (Mid emphasis surface)
- `--surface-high`: #e5e2e3 (High emphasis surface)

### Text Colors
- `--ink`: #1b1b1d (Primary text)
- `--ink-secondary`: #374151 (Secondary text)
- `--muted`: #6b7280 (Muted text)
- `--muted-light`: #9ca3af (Light muted text)
- `--outline`: #d1d5db (Border/outline)

### Special Colors
- `--navy`: #121826 (Dark navy for buttons/navigation)
- `--coral`: #f23d5c (Coral accent)
- `--pink-soft`: #ffdadb (Pink background)
- `--blue-soft`: #dde2f6 (Blue background)
- `--amber`: #facc15 (Amber accent)

## Typography Scale

### Font Family
- `--font-family`: "Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

### Font Sizes
- `--text-xs`: 0.75rem (12px)
- `--text-sm`: 0.875rem (14px)
- `--text-base`: 1rem (16px)
- `--text-lg`: 1.125rem (18px)
- `--text-xl`: 1.25rem (20px)
- `--text-2xl`: 1.5rem (24px)
- `--text-3xl`: 1.875rem (30px)
- `--text-4xl`: 2.25rem (36px)
- `--text-5xl`: 3rem (48px)

### Heading Sizes (Responsive)
- `--heading-xs`: clamp(1rem, 2vw, 1.25rem)
- `--heading-sm`: clamp(1.25rem, 3vw, 1.75rem)
- `--heading-md`: clamp(1.5rem, 4vw, 2.5rem)
- `--heading-lg`: clamp(2rem, 5vw, 3.5rem)
- `--heading-xl`: clamp(2.5rem, 6vw, 4.5rem)
- `--heading-2xl`: clamp(3rem, 7vw, 5.8rem)

### Font Weights
- `--font-normal`: 400
- `--font-medium`: 500
- `--font-semibold`: 600
- `--font-bold`: 700
- `--font-extrabold`: 800
- `--font-black`: 900

### Line Heights
- `--leading-tight`: 1.1
- `--leading-snug`: 1.25
- `--leading-normal`: 1.5
- `--leading-relaxed`: 1.75
- `--heading-leading`: 1.08

## Spacing Scale

- `--space-0`: 0
- `--space-1`: 0.25rem (4px)
- `--space-2`: 0.5rem (8px)
- `--space-3`: 0.75rem (12px)
- `--space-4`: 1rem (16px)
- `--space-5`: 1.25rem (20px)
- `--space-6`: 1.5rem (24px)
- `--space-8`: 2rem (32px)
- `--space-10`: 2.5rem (40px)
- `--space-12`: 3rem (48px)
- `--space-16`: 4rem (64px)
- `--space-20`: 5rem (80px)

## Border Radius

- `--radius-none`: 0
- `--radius-sm`: 0.375rem (6px)
- `--radius-md`: 0.5rem (8px)
- `--radius-lg`: 0.75rem (12px)
- `--radius-xl`: 1rem (16px)
- `--radius-2xl`: 1.5rem (24px)
- `--radius-full`: 999px

## Shadows

- `--shadow-sm`: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- `--shadow-md`: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
- `--shadow-lg`: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
- `--shadow-xl`: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
- `--shadow-2xl`: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
- `--shadow-glass`: 0 8px 32px 0 rgba(31, 38, 135, 0.07)
- `--shadow-soft`: 0 10px 40px -10px rgba(0, 0, 0, 0.08)
- `--shadow-nav`: 0 18px 36px rgba(0, 0, 0, 0.24)

## Icon Sizes

- `--icon-xs`: 14px
- `--icon-sm`: 16px
- `--icon-md`: 18px
- `--icon-lg`: 20px
- `--icon-xl`: 24px
- `--icon-2xl`: 32px
- `--icon-3xl`: 48px

## Transitions

- `--transition-fast`: 150ms ease
- `--transition-base`: 200ms ease
- `--transition-slow`: 300ms ease

## Z-Index Scale

- `--z-dropdown`: 100
- `--z-sticky`: 200
- `--z-fixed`: 300
- `--z-modal-backdrop`: 400
- `--z-modal`: 500
- `--z-popover`: 600
- `--z-tooltip`: 700

## Shared Components

### Button (`src/components/shared/Button.tsx`)
```tsx
<Button variant="primary" size="md" fullWidth={false}>
  Button Text
</Button>
```
- Variants: `primary`, `secondary`, `outline`
- Sizes: `sm`, `md`, `lg`
- Props: `fullWidth`, `icon`

### Input (`src/components/shared/Input.tsx`)
```tsx
<Input label="Email" icon={<Mail />} error={errorText} fullWidth />
```
- Props: `label`, `icon`, `error`, `fullWidth`

### Badge (`src/components/shared/Badge.tsx`)
```tsx
<Badge variant="purple" icon={<Sparkles />}>Text</Badge>
```
- Variants: `purple`, `green`, `amber`, `red`, `blue`

### Modal (`src/components/shared/Modal.tsx`)
```tsx
<Modal isOpen={show} onClose={() => setShow(false)} title="Title" size="md">
  Content
</Modal>
```
- Sizes: `sm`, `md`, `lg`

### LoadingState (`src/components/shared/LoadingState.tsx`)
```tsx
<LoadingState message="Loading..." size="md" inline={false} />
```

### EmptyState (`src/components/shared/EmptyState.tsx`)
```tsx
<EmptyState 
  icon={BookOpen} 
  title="No Data" 
  description="Description text"
  action={{ label: "Action", onClick: handler }}
/>
```

### ErrorState (`src/components/shared/ErrorState.tsx`)
```tsx
<ErrorState message="Error message" onRetry={retryHandler} variant="error" />
```
- Variants: `warning`, `error`

## Usage Guidelines

### DO:
- Use CSS custom properties for all colors, spacing, typography
- Use shared components instead of creating inline-styled elements
- Follow the spacing scale (use `--space-4` instead of `1rem`)
- Use appropriate font weights from the scale
- Use semantic colors (success, warning, error) for status indicators

### DON'T:
- Use hardcoded hex values (e.g., `#6b38d4`)
- Use arbitrary spacing values (e.g., `0.625rem`)
- Create inline styles for common patterns
- Mix color systems (use either CSS variables or Tailwind, not both)
- Use font weights outside the defined scale

## Responsive Breakpoints

- Mobile: `max-width: 720px` (defined in globals.css)
- Tablet: Use Tailwind's `md:` breakpoint
- Desktop: Default styles

Apply mobile-specific styles in the `@media (max-width: 720px)` block in globals.css.

## Component Styling Rules

1. **Cards**: Use `.card` class from globals.css, or GlassCard component
2. **Buttons**: Use Button component or `.neo-btn` classes
3. **Inputs**: Use Input component
4. **Badges**: Use Badge component or `.badge` classes
5. **Loading**: Use LoadingState component
6. **Empty States**: Use EmptyState component
7. **Error States**: Use ErrorState component
8. **Modals**: Use Modal component

## Migration Notes

When refactoring existing code:
1. Replace hardcoded colors with CSS variables
2. Replace arbitrary spacing with spacing scale
3. Replace inline-styled components with shared components
4. Ensure consistent font sizes and weights
5. Use semantic colors for status indicators
6. Maintain existing functionality - this is a visual pass only
