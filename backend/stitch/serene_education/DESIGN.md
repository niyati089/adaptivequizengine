---
name: Serene Education
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9da'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e5e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464c'
  inverse-surface: '#313031'
  inverse-on-surface: '#f3f0f1'
  outline: '#76777d'
  outline-variant: '#c6c6cc'
  surface-tint: '#585e6f'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#151b29'
  on-primary-container: '#7e8395'
  inverse-primary: '#c1c6d9'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#40000d'
  on-tertiary-container: '#f23d5c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde2f6'
  primary-fixed-dim: '#c1c6d9'
  on-primary-fixed: '#151b29'
  on-primary-fixed-variant: '#414756'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e5e2e3'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  gutter: 20px
  card-padding: 24px
  section-gap: 32px
---

## Brand & Style
This design system centers on a "comfy-minimalist" aesthetic, prioritizing psychological safety and clarity for learners. It avoids the clinical coldness of traditional EdTech by blending **Modern Corporate** reliability with **Glassmorphism** and soft, tactile elements. 

The atmosphere is approachable and premium, defined by high-breathability whitespace, a calming blue-grid background that evokes a digital "notebook," and soft-touch surfaces. It aims to reduce cognitive load through clear modularity and a soothing, pastel-informed hierarchy that signals progress without inducing stress.

## Colors
The palette is anchored by a deep charcoal-navy (`#121826`) used for structural navigation, creating a sophisticated "frame" for the content. The interface canvas is a very light gray with a soft-blue grid overlay to provide a sense of structure and scale.

Action and status colors are expressed through vibrant but desaturated pastels:
- **Primary Action/Nav**: Deep Navy.
- **Learning/Growth**: Soft Purples.
- **Tasks/Urgency**: Muted Pinks and Corals.
- **Insights/Success**: Pale Greens.
- **Surfaces**: Pure white cards are used exclusively for interactive content to pop against the textured background.

## Typography
The system utilizes **Geist** for its technical precision and modern, open letterforms. The hierarchy is "top-heavy," using significant weight contrast between titles and metadata to help users scan data-rich dashboards quickly. 

Headlines use tighter tracking to maintain a strong visual anchor, while body copy maintains generous line heights for maximum legibility during long reading sessions. Labels often utilize a slightly heavier weight to stand out within dense UI modules like tables or progress cards.

## Layout & Spacing
The layout follows a **Fluid Grid** model with high-density internal card padding and low-density external margins. 

- **Desktop**: A 12-column grid. Main dashboard content is typically split into an 8-column primary work area (Stats, Insights, Courses) and a 4-column secondary task sidebar (Homework, Schedule).
- **Tablets**: A 2-column stacked layout where the sidebar moves below the primary insights.
- **Mobile**: A single-column vertical flow with margins reduced to 16px.

Spacing relies on a strict 8px rhythm to ensure vertical alignment across different component types. Content modules are separated by large gaps (32px+) to maintain the "minimalist" feel.

## Elevation & Depth
This design system uses **Ambient Shadows** and **Tonal Layering** to create a soft, physical sense of depth.

1.  **Canvas Layer**: The grid-textured background serves as the base.
2.  **Surface Layer**: Pure white cards with a very soft, diffused shadow (`0 10px 30px rgba(0,0,0,0.04)`) and a 1px neutral-200 border for definition.
3.  **Active/Floating Layer**: For AI Insights or "Hero" components, use a subtle colored backdrop glow or a slightly higher elevation shadow to indicate importance.
4.  **Interactive Elements**: Buttons and tags use flat colors or low-contrast borders to avoid overwhelming the user, only increasing in "depth" (through slight shadow increases) on hover.

## Shapes
The shape language is defined by high-radius curves to evoke comfort and friendliness. 
- **Standard Cards**: 16px to 24px corner radius.
- **Interactive Elements**: Buttons and form fields follow a 12px radius.
- **System Tags/Badges**: Full pill-shape (circular ends) to distinguish them from structural elements.
- **Progress Indicators**: Circular rings and rounded-end bars to mirror the softness of the container shapes.

## Components

### Buttons & Inputs
- **Primary Button**: Deep Navy background, white text, 12px radius.
- **Secondary Button**: White background, 1px border, 12px radius.
- **Input Fields**: Soft gray background with a subtle border that glows primary color on focus.

### Cards & Containers
- **Dashboard Cards**: White, 24px radius, internal padding of 24px. Header sections within cards may use a light color-wash background (e.g., light pink for tasks) to categorize the content at a glance.

### Chips & Badges
- **Status Pills**: Pill-shaped with a background color matching the category (e.g., blue for "Speaking," orange for "Vocabulary") and a slightly darker text version of the same hue for legibility.

### Progress Elements
- **Rings**: Use a 4px stroke weight with a soft-rounded terminal.
- **Activity Bars**: Vertical bars with fully rounded tops, utilizing gradient or tonal shifts to show intensity.

### Navigation Bar
- A high-contrast Navy bar at the top with a pill-shaped "Active" state for the current menu item. The active state should be a bright white or a very light pastel to maximize contrast against the dark background.