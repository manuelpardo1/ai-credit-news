# AI Credit News - Brand Guide

## Brand Identity

**AI Credit News** is a professional, trustworthy source for AI-powered insights in credit and financial services. The brand conveys authority, clarity, and innovation.

---

## Logo

### Primary Logo
`/public/images/logo.svg` - Navy badge with serif text. Use on light backgrounds.

### Inverted Logo
`/public/images/logo-white.svg` - White badge with white text. Use on dark/colored backgrounds.

### Favicon
`/public/favicon.svg` - Compact "AI" badge with teal accent dot. Used in browser tabs.

### Logo Construction
- **AI Badge**: Rounded rectangle with "AI" text centered. Represents the AI technology core.
- **Credit News**: Merriweather serif typography. Represents editorial authority.
- **Teal Accent**: Vertical bar or dot. Represents innovation and the connection between AI and finance.

### Clear Space
Maintain a minimum clear space equal to the height of the "AI" badge around all sides of the logo.

### Minimum Size
- Full logo: 140px wide minimum
- Favicon/icon: 16px minimum

---

## Color Palette

### Primary Colors

| Color | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Navy Blue | `#1e3a8a` | `--primary` | Logo, headings, primary buttons, header gradient |
| Navy Dark | `#1e2f5c` | `--primary-dark` | Hover states, gradient endpoint |
| Teal | `#0d9488` | `--accent` | CTAs, links, category tags, accent elements |
| Teal Light | `#14b8a6` | `--accent-light` | Hover states, secondary accents |

### Neutral Colors

| Color | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Background | `#f9fafb` | `--background` | Page background |
| Surface | `#ffffff` | `--surface` | Cards, panels |
| Text | `#1f2937` | `--text` | Body text, headings |
| Text Light | `#6b7280` | `--text-light` | Secondary text, metadata |
| Text Muted | `#9ca3af` | `--text-muted` | Tertiary text, placeholders |
| Border | `#e5e7eb` | `--border` | Dividers, card borders |

### Gradient
Primary gradient: `linear-gradient(135deg, #1e3a8a 0%, #1e2f5c 100%)`
Used in: hero section, subscribe widget, email headers.

---

## Typography

### Font Families

- **Headlines**: Merriweather (serif) - Conveys editorial authority and trustworthiness
- **Body & UI**: Inter (sans-serif) - Clean, modern, highly readable

### Font Fallbacks
- Merriweather: Georgia, serif
- Inter: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

### Scale

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Merriweather | 2.5rem (40px) | 700 |
| H2 | Merriweather | 1.875rem (30px) | 700 |
| H3 | Merriweather | 1.5rem (24px) | 700 |
| H4 | Merriweather | 1.25rem (20px) | 700 |
| Body | Inter | 1rem (16px) | 400 |
| Small | Inter | 0.9rem (14.4px) | 400 |
| Caption | Inter | 0.8rem (12.8px) | 400-500 |

---

## Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| Border Radius | 8px | Buttons, inputs, cards |
| Border Radius Large | 12px | Panels, featured cards |
| Container Max Width | 1200px | Main content area |
| Content Max Width | 800px | Article/editorial reading |

---

## Component Patterns

### Buttons
- **Primary**: Navy background (`--primary`), white text, 8px radius
- **Accent/CTA**: Teal background (`--accent`), white text, 8px radius
- **Hover**: Slight darkening + subtle lift (`translateY(-1px)`)

### Cards
- White background, 12px radius, subtle shadow
- Hover: slight lift (`translateY(-2px)`) + enhanced shadow

### Category Tags
- Teal background, white text, 4px radius, uppercase, small font

### Subscribe Widget
- Navy gradient background, white text
- Teal accent button

---

## Email Template Style

### Header
- Navy-to-teal gradient: `linear-gradient(135deg, #1a365d 0%, #2c7a7b 100%)`
- White text, centered
- Note: Email uses slightly different shades (#1a365d / #2c7a7b) for compatibility

### Body
- White background, max-width 600px
- System font stack (no Google Fonts in email)
- 30px padding

### Footer
- Centered, #718096 text, 12px font size
- Unsubscribe link

---

## Tone of Voice

- **Professional** but accessible (not academic)
- **Informative** and factual (not sensational)
- **Forward-looking** (focused on innovation and trends)
- **Concise** (respect the reader's time)

---

## File Reference

| Asset | Path | Size |
|-------|------|------|
| Logo (dark bg) | `/public/images/logo.svg` | Scalable |
| Logo (light bg) | `/public/images/logo-white.svg` | Scalable |
| Favicon SVG | `/public/favicon.svg` | Scalable |
| Favicon 32x32 | `/public/favicon-32x32.png` | 32x32 |
| Favicon 16x16 | `/public/favicon-16x16.png` | 16x16 |
| Apple Touch Icon | `/public/apple-touch-icon.png` | 180x180 |
| Android Chrome 192 | `/public/android-chrome-192x192.png` | 192x192 |
| Android Chrome 512 | `/public/android-chrome-512x512.png` | 512x512 |
| OG Image | `/public/images/og-image.png` | 1200x630 |
| Web Manifest | `/public/site.webmanifest` | - |
