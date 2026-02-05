const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  autoFirstPage: false,
  bufferPages: true,
  info: {
    Title: 'AI Credit News - Brand Guide',
    Author: 'AI Credit News',
    Subject: 'Brand Identity Guidelines',
  }
});

const output = fs.createWriteStream(path.join(__dirname, 'BRAND-GUIDE.pdf'));
doc.pipe(output);

// ─── Color constants ──────────────────────────────
const NAVY = '#1e3a8a';
const NAVY_DARK = '#1e2f5c';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const TEXT = '#1f2937';
const TEXT_LIGHT = '#6b7280';
const TEXT_MUTED = '#9ca3af';
const BG = '#f9fafb';
const BORDER = '#e5e7eb';
const WHITE = '#ffffff';
const PW = 595.28;
const PH = 841.89;
const ML = 60;
const PAGE_WIDTH = PW - 120;

// ─── Helpers ──────────────────────────────────────
function swatch(x, y, color, label, hex, usage) {
  doc.save();
  doc.roundedRect(x, y, 44, 44, 6).fill(color);
  doc.restore();
  doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT).text(label, x + 54, y + 2, { width: 170 });
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_LIGHT).text(hex, x + 54, y + 15);
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_MUTED).text(usage, x + 54, y + 28, { width: 170 });
}

function section(text) {
  doc.moveDown(0.8);
  doc.fontSize(20).font('Helvetica-Bold').fillColor(NAVY).text(text);
  const y = doc.y + 4;
  doc.save().moveTo(ML, y).lineTo(ML + PAGE_WIDTH, y).lineWidth(2).strokeColor(TEAL).stroke().restore();
  doc.moveDown(0.6);
}

function sub(text) {
  doc.moveDown(0.4);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(NAVY_DARK).text(text);
  doc.moveDown(0.2);
}

function subTight(text) {
  doc.moveDown(0.15);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(NAVY_DARK).text(text);
  doc.moveDown(0.1);
}

function body(text) {
  doc.fontSize(10).font('Helvetica').fillColor(TEXT).text(text, { lineGap: 3 });
}

function bull(text) {
  doc.fontSize(10).font('Helvetica').fillColor(TEXT).text(`  \u2022  ${text}`, { lineGap: 2 });
}

function trow(cells, bold) {
  const y = doc.y;
  const f = bold ? 'Helvetica-Bold' : 'Helvetica';
  const c = bold ? NAVY : TEXT;
  const cw = [120, 80, 130, PAGE_WIDTH - 330];
  cells.forEach((cell, i) => {
    let x = ML;
    for (let j = 0; j < i; j++) x += cw[j];
    doc.fontSize(9).font(f).fillColor(c).text(cell, x, y, { width: cw[i] });
  });
  doc.y = y + 17;
  if (bold) {
    doc.save().moveTo(ML, doc.y).lineTo(ML + PAGE_WIDTH, doc.y).lineWidth(0.5).strokeColor(BORDER).stroke().restore();
    doc.y += 4;
  }
}

// Helper to place text at the bottom of a full-page background without triggering a page break.
// Uses the 'height' option to constrain text within remaining page space.
function bottomText(text, x, y, opts) {
  const remainingHeight = 20; // just enough for one line
  doc.text(text, x, y, { ...opts, height: remainingHeight });
}

// ═══════════════════════════════════════════════════
// PAGE 1 — COVER
// ═══════════════════════════════════════════════════
doc.addPage({ margin: 0 });

doc.rect(0, 0, PW, PH).fill(NAVY);
doc.rect(0, PH - 62, PW, 62).fill(TEAL);

// AI Badge
doc.roundedRect(258, 260, 80, 80, 16).fill(WHITE);
doc.fontSize(38).font('Helvetica-Bold').fillColor(NAVY).text('AI', 258, 282, { width: 80, align: 'center' });

// Title
doc.fontSize(42).font('Helvetica-Bold').fillColor(WHITE).text('AI Credit News', 0, 380, { width: PW, align: 'center' });
doc.fontSize(14).font('Helvetica').fillColor('#94a3b8').text('Brand Identity Guide', 0, 435, { width: PW, align: 'center' });
doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Version 1.0  \u2022  February 2026', 0, 460, { width: PW, align: 'center' });

// Bottom URL — use bottomText to avoid cursor overflow
doc.fontSize(11).font('Helvetica').fillColor(TEAL_LIGHT);
bottomText('aicreditnews.com', 0, PH - 48, { width: PW, align: 'center' });


// ═══════════════════════════════════════════════════
// PAGE 2 — BRAND OVERVIEW + LOGO
// ═══════════════════════════════════════════════════
doc.addPage();

section('Brand Overview');
body('AI Credit News is a professional, trustworthy source for AI-powered insights in credit and financial services. The brand conveys authority, clarity, and innovation.');
doc.moveDown(0.4);

sub('Brand Personality');
bull('Professional but accessible (not academic)');
bull('Informative and factual (not sensational)');
bull('Forward-looking (focused on innovation and trends)');
bull('Concise (we respect the reader\'s time)');

doc.moveDown(0.3);
sub('Target Audience');
bull('Financial services professionals');
bull('Credit industry decision-makers');
bull('AI/ML practitioners in fintech');
bull('Banking technology leaders');

section('Logo');
body('The logo combines three elements: the AI badge, the serif wordmark, and a teal accent. Together they communicate the fusion of technology and editorial authority.');
doc.moveDown(0.4);

// Logo demos
const logoY = doc.y;
const halfW = PAGE_WIDTH / 2 - 10;

// Primary (light bg)
doc.roundedRect(ML, logoY, halfW, 90, 8).fill(BG);
doc.roundedRect(ML + 18, logoY + 20, 46, 46, 8).fill(NAVY);
doc.fontSize(20).font('Helvetica-Bold').fillColor(WHITE).text('AI', ML + 18, logoY + 32, { width: 46, align: 'center' });
doc.fontSize(16).font('Helvetica-Bold').fillColor(NAVY).text('Credit', ML + 74, logoY + 26);
doc.fontSize(16).font('Helvetica-Bold').fillColor(NAVY).text('News', ML + 74, logoY + 46);
doc.roundedRect(ML + 132, logoY + 28, 3, 24, 1.5).fill(TEAL);
doc.fontSize(7).font('Helvetica').fillColor(TEXT_MUTED).text('Primary \u2014 light backgrounds', ML, logoY + 94, { width: halfW, align: 'center' });

// Inverted (dark bg)
const rx = ML + halfW + 20;
doc.roundedRect(rx, logoY, halfW, 90, 8).fill(NAVY);
doc.roundedRect(rx + 18, logoY + 20, 46, 46, 8).fill(WHITE);
doc.fontSize(20).font('Helvetica-Bold').fillColor(NAVY).text('AI', rx + 18, logoY + 32, { width: 46, align: 'center' });
doc.fontSize(16).font('Helvetica-Bold').fillColor(WHITE).text('Credit', rx + 74, logoY + 26);
doc.fontSize(16).font('Helvetica-Bold').fillColor(WHITE).text('News', rx + 74, logoY + 46);
doc.roundedRect(rx + 132, logoY + 28, 3, 24, 1.5).fill(TEAL_LIGHT);
doc.fontSize(7).font('Helvetica').fillColor(TEXT_MUTED).text('Inverted \u2014 dark backgrounds', rx, logoY + 94, { width: halfW, align: 'center' });

doc.y = logoY + 115;

sub('Logo Elements');
bull('AI Badge: Rounded navy rectangle with bold "AI" text \u2014 represents the technology core');
bull('Credit News: Merriweather serif wordmark \u2014 represents editorial authority');
bull('Teal Accent Bar: Vertical separator \u2014 represents innovation and the AI-finance connection');

sub('Usage Rules');
bull('Maintain clear space equal to the badge height around all sides');
bull('Minimum size: 140px wide (full logo), 16px (icon only)');
bull('Never distort, rotate, or change the logo colors');
bull('Never place the primary logo on busy backgrounds');


// ═══════════════════════════════════════════════════
// PAGE 3 — FAVICON + COLORS
// ═══════════════════════════════════════════════════
doc.addPage();

section('Favicon & App Icons');
body('The favicon is a compact version of the logo, showing only the "AI" badge with a teal accent dot. It\'s optimized for small sizes across all platforms.');
doc.moveDown(0.4);

const favY = doc.y;
const iconSizes = [
  { sz: 56, label: 'Browser Tab', dimLabel: '64\u00d764' },
  { sz: 42, label: 'Bookmarks', dimLabel: '48\u00d748' },
  { sz: 28, label: 'Standard', dimLabel: '32\u00d732' },
  { sz: 16, label: 'Minimum', dimLabel: '16\u00d716' },
];
let ix = ML;
iconSizes.forEach(({ sz, label, dimLabel }) => {
  const ds = Math.max(sz, 16);
  const oy = favY + (56 - ds) / 2;
  doc.roundedRect(ix, oy, ds, ds, ds * 0.19).fill(NAVY);
  doc.fontSize(ds * 0.45).font('Helvetica-Bold').fillColor(WHITE).text('AI', ix, oy + ds * 0.22, { width: ds, align: 'center' });
  const dr = ds * 0.11;
  doc.circle(ix + ds - dr * 0.5, oy + dr * 0.5, dr).fill(TEAL);
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_MUTED).text(dimLabel, ix - 5, favY + 64, { width: ds + 10, align: 'center' });
  doc.fontSize(7).font('Helvetica').fillColor(TEXT_MUTED).text(label, ix - 10, favY + 74, { width: ds + 20, align: 'center' });
  ix += ds + 45;
});
doc.y = favY + 95;

sub('Platform Assets');
const assets = [
  ['favicon.svg', 'Scalable', 'Chrome, Firefox, Edge'],
  ['favicon-32x32.png', '32\u00d732', 'Standard browser fallback'],
  ['favicon-16x16.png', '16\u00d716', 'Small browser tabs'],
  ['apple-touch-icon.png', '180\u00d7180', 'iOS home screen'],
  ['android-chrome-192x192.png', '192\u00d7192', 'Android home screen'],
  ['android-chrome-512x512.png', '512\u00d7512', 'Android splash / PWA'],
  ['og-image.png', '1200\u00d7630', 'Social media link previews'],
];

const aHdrY = doc.y;
doc.fontSize(9).font('Helvetica-Bold').fillColor(NAVY)
  .text('File', ML, aHdrY, { width: 200 })
  .text('Size', 260, aHdrY, { width: 100 })
  .text('Usage', 360, aHdrY, { width: PAGE_WIDTH - 300 });
doc.y = aHdrY + 15;
doc.save().moveTo(ML, doc.y).lineTo(ML + PAGE_WIDTH, doc.y).lineWidth(0.5).strokeColor(BORDER).stroke().restore();
doc.y += 5;
assets.forEach(([file, size, usage]) => {
  const ry = doc.y;
  doc.fontSize(9).font('Helvetica').fillColor(TEXT)
    .text(file, ML, ry, { width: 200 })
    .text(size, 260, ry, { width: 100 })
    .text(usage, 360, ry, { width: PAGE_WIDTH - 300 });
  doc.y = ry + 15;
});

// COLOR PALETTE
section('Color Palette');

sub('Primary Colors');
let cy = doc.y;
swatch(ML, cy, NAVY, 'Navy Blue', '#1e3a8a', 'Logo, headings, primary buttons');
swatch(ML + PAGE_WIDTH / 2, cy, TEAL, 'Teal', '#0d9488', 'CTAs, accent, category tags');
cy += 55;
swatch(ML, cy, NAVY_DARK, 'Navy Dark', '#1e2f5c', 'Hover states, gradient end');
swatch(ML + PAGE_WIDTH / 2, cy, TEAL_LIGHT, 'Teal Light', '#14b8a6', 'Hover accents, highlights');
doc.y = cy + 60;

sub('Neutral Colors');
cy = doc.y;
swatch(ML, cy, BG, 'Background', '#f9fafb', 'Page background');
swatch(ML + PAGE_WIDTH / 2, cy, WHITE, 'Surface', '#ffffff', 'Cards, panels');
cy += 55;
swatch(ML, cy, TEXT, 'Text', '#1f2937', 'Body text, headings');
swatch(ML + PAGE_WIDTH / 2, cy, TEXT_LIGHT, 'Text Light', '#6b7280', 'Secondary text');
cy += 55;
swatch(ML, cy, TEXT_MUTED, 'Text Muted', '#9ca3af', 'Placeholders, tertiary');
swatch(ML + PAGE_WIDTH / 2, cy, BORDER, 'Border', '#e5e7eb', 'Dividers, card borders');
doc.y = cy + 55;


// ═══════════════════════════════════════════════════
// PAGE 4 — TYPOGRAPHY + COMPONENTS
// ═══════════════════════════════════════════════════
doc.addPage();

section('Typography');
body('The type system pairs a serif headline font with a sans-serif body font, balancing editorial gravitas with modern readability.');
doc.moveDown(0.3);

sub('Merriweather \u2014 Headlines');
body('Used for all headings (H1\u2013H4). Conveys editorial authority and trustworthiness. Loaded from Google Fonts with weights 400 and 700. Fallback: Georgia, serif.');
doc.moveDown(0.3);

doc.fontSize(26).font('Times-Bold').fillColor(NAVY).text('AI in Credit & Banking', ML);
doc.fontSize(9).font('Helvetica').fillColor(TEXT_MUTED).text('Merriweather Bold, 2.5rem (H1)', ML);
doc.moveDown(0.4);

sub('Inter \u2014 Body & UI');
body('Used for body text, navigation, buttons, metadata, and all UI elements. Clean and highly readable. Loaded from Google Fonts with weights 400\u2013700. Fallback: -apple-system, BlinkMacSystemFont, Roboto, sans-serif.');
doc.moveDown(0.3);

doc.fontSize(15).font('Helvetica').fillColor(TEXT).text('The quick brown fox jumps over the lazy dog.', ML);
doc.fontSize(9).font('Helvetica').fillColor(TEXT_MUTED).text('Inter Regular, 1rem (body)', ML);
doc.moveDown(0.5);

sub('Type Scale');
trow(['Element', 'Size', 'Weight', 'Font'], true);
trow(['H1', '2.5rem (40px)', '700 Bold', 'Merriweather']);
trow(['H2', '1.875rem (30px)', '700 Bold', 'Merriweather']);
trow(['H3', '1.5rem (24px)', '700 Bold', 'Merriweather']);
trow(['H4', '1.25rem (20px)', '700 Bold', 'Merriweather']);
trow(['Body', '1rem (16px)', '400 Regular', 'Inter']);
trow(['Small', '0.9rem (14.4px)', '400 Regular', 'Inter']);
trow(['Caption', '0.8rem (12.8px)', '400\u2013500', 'Inter']);
trow(['Tag/Label', '0.75rem (12px)', '500\u2013600', 'Inter']);

section('Component Patterns');

subTight('Buttons');
const btnY = doc.y;
doc.roundedRect(ML, btnY, 140, 32, 8).fill(NAVY);
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHITE).text('Primary Action', ML, btnY + 8, { width: 140, align: 'center' });
doc.roundedRect(ML + 160, btnY, 140, 32, 8).fill(TEAL);
doc.fontSize(11).font('Helvetica-Bold').fillColor(WHITE).text('CTA / Accent', ML + 160, btnY + 8, { width: 140, align: 'center' });
doc.y = btnY + 38;
// Reset x and width after button text to prevent narrow wrapping
doc.fontSize(10).font('Helvetica').fillColor(TEXT);
doc.text('  \u2022  Primary: Navy bg, white text, 8px radius · CTA: Teal bg, white text, 8px radius', ML, doc.y, { width: PAGE_WIDTH, lineGap: 2 });
doc.text('  \u2022  Hover: Slight darkening + subtle lift (translateY -1px)', ML, doc.y, { width: PAGE_WIDTH, lineGap: 2 });

subTight('Cards');
doc.fontSize(10).font('Helvetica').fillColor(TEXT);
doc.text('  \u2022  White background, 12px radius, subtle shadow · Hover: lift + enhanced shadow', ML, doc.y, { width: PAGE_WIDTH, lineGap: 2 });

subTight('Category Tags & Border Radius');
doc.fontSize(10).font('Helvetica').fillColor(TEXT);
doc.text('  \u2022  Tags: Teal bg, white text, 4px radius, uppercase, 0.75rem, 600 weight', ML, doc.y, { width: PAGE_WIDTH, lineGap: 2 });
doc.text('  \u2022  Standard radius: 8px (buttons, inputs) · Large radius: 12px (panels, featured cards)', ML, doc.y, { width: PAGE_WIDTH, lineGap: 2 });


// ═══════════════════════════════════════════════════
// PAGE 5 — EMAIL + GRADIENT + SPACING
// ═══════════════════════════════════════════════════
doc.addPage();

section('Email Template');
body('Email templates follow the same brand identity with slight color adjustments for maximum email client compatibility.');
doc.moveDown(0.4);

const ey = doc.y;
const ew = PAGE_WIDTH;

// Email header
doc.roundedRect(ML, ey, ew, 55, 8).fill(NAVY);
doc.rect(ML, ey + 27, ew, 28).fill(NAVY);
doc.fontSize(17).font('Helvetica-Bold').fillColor(WHITE).text('AI Credit News', ML, ey + 10, { width: ew, align: 'center' });
doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text('Weekly Digest \u2014 Monday, February 3, 2026', ML, ey + 34, { width: ew, align: 'center' });

// Email body area
doc.rect(ML, ey + 55, ew, 100).fill(WHITE);
doc.fontSize(10).font('Helvetica').fillColor(TEXT).text('Email body: max-width 600px, white background,', ML + 20, ey + 68);
doc.text('system font stack (no Google Fonts in email).', ML + 20, ey + 82);
doc.fontSize(9).font('Helvetica').fillColor(TEXT_LIGHT)
  .text('Header gradient: #1a365d \u2192 #2c7a7b', ML + 20, ey + 105)
  .text('Body padding: 30px', ML + 20, ey + 118)
  .text('Footer: centered, #718096, 12px', ML + 20, ey + 131);

// Footer
doc.roundedRect(ML, ey + 155, ew, 28, 8).fill(BG);
doc.rect(ML, ey + 155, ew, 14).fill(BG);
doc.fontSize(8).font('Helvetica').fillColor(TEXT_MUTED).text('Unsubscribe', ML, ey + 163, { width: ew, align: 'center' });

doc.y = ey + 195;

sub('Email Color Note');
body('Email templates use slightly different hex values (#1a365d / #2c7a7b) for better rendering across email clients. These are close approximations of the primary brand colors.');

section('Gradients');
body('The brand uses a single primary gradient for hero sections, subscribe widgets, and email headers.');
doc.moveDown(0.4);

const gy = doc.y;
for (let i = 0; i < 100; i++) {
  const t = i / 100;
  const r = Math.round(30 * (1 - t) + 30 * t);
  const g = Math.round(58 * (1 - t) + 47 * t);
  const b = Math.round(138 * (1 - t) + 92 * t);
  const col = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  doc.rect(ML + (PAGE_WIDTH * i / 100), gy, PAGE_WIDTH / 100 + 1, 45).fill(col);
}
doc.roundedRect(ML, gy, PAGE_WIDTH, 45, 8).stroke(BORDER);
doc.fontSize(9).font('Helvetica-Bold').fillColor(WHITE).text('#1e3a8a', ML + 10, gy + 16);
doc.fontSize(9).font('Helvetica-Bold').fillColor(WHITE).text('#1e2f5c', ML + PAGE_WIDTH - 55, gy + 16);
doc.y = gy + 55;
doc.fontSize(10).font('Helvetica').fillColor(TEXT).text('CSS: linear-gradient(135deg, #1e3a8a 0%, #1e2f5c 100%)', ML, doc.y, { width: PAGE_WIDTH });

doc.moveDown(0.6);
sub('Spacing Tokens');
trow(['Token', 'Value', 'CSS Variable', 'Usage'], true);
trow(['Radius', '8px', '--radius', 'Buttons, inputs, cards']);
trow(['Radius Large', '12px', '--radius-lg', 'Panels, featured cards']);
trow(['Container', '1200px', 'max-width', 'Main content area']);
trow(['Reading', '800px', 'max-width', 'Article/editorial pages']);


// ═══════════════════════════════════════════════════
// BACK COVER
// ═══════════════════════════════════════════════════
doc.addPage({ margin: 0 });

doc.rect(0, 0, PW, PH).fill(NAVY);
doc.rect(0, PH - 62, PW, 62).fill(TEAL);

doc.roundedRect(268, 340, 60, 60, 12).fill(WHITE);
doc.fontSize(28).font('Helvetica-Bold').fillColor(NAVY).text('AI', 268, 356, { width: 60, align: 'center' });
doc.fontSize(28).font('Helvetica-Bold').fillColor(WHITE).text('AI Credit News', 0, 430, { width: PW, align: 'center' });
doc.fontSize(11).font('Helvetica').fillColor('#94a3b8').text('aicreditnews.com', 0, 470, { width: PW, align: 'center' });

// Bottom text — use bottomText to avoid cursor overflow creating an extra blank page
doc.fontSize(9).font('Helvetica').fillColor('#64748b');
bottomText('Brand Guide v1.0 \u2014 February 2026', 0, PH - 48, { width: PW, align: 'center' });

// ─── Done ─────────────────────────────────────────
doc.end();
output.on('finish', () => console.log('Brand guide PDF created: BRAND-GUIDE.pdf'));
