// Internationalization (i18n) for AI Credit News
// Supports English (en) and Spanish (es)

const translations = {
  en: {
    // Navigation
    home: 'Home',
    about: 'About',
    all: 'All',
    search: 'Search',
    searchPlaceholder: 'Search articles...',

    // Categories
    creditScoring: 'Credit Scoring',
    fraudDetection: 'Fraud Detection',
    creditRisk: 'Credit Risk',
    incomeEmployment: 'Income & Employment',
    regulatoryCompliance: 'Regulatory & Compliance',
    lendingAutomation: 'Lending Automation',

    // Home page
    heroTitle: 'AI Insights for',
    heroTitleHighlight: 'Credit & Finance',
    heroSubtitle: 'Curated news on AI in credit scoring, lending, fraud detection, and banking.',
    latestArticles: 'Latest Articles',
    viewAll: 'View All Articles',

    // Sidebar
    newsletter: 'Newsletter',
    newsletterText: 'Get weekly AI credit insights delivered to your inbox.',
    subscribe: 'Subscribe',
    emailPlaceholder: 'your@email.com',
    latestEditorial: 'Latest Editorial',
    readMore: 'Read more',

    // Article
    minuteRead: 'min read',
    relatedArticles: 'Related Articles',

    // Footer
    footerTagline: 'AI-powered insights for credit & financial services',
    footerCopyright: 'AI Credit News. All rights reserved.',

    // Dates
    today: 'Today',
    yesterday: 'Yesterday'
  },
  es: {
    // Navigation
    home: 'Inicio',
    about: 'Acerca',
    all: 'Todos',
    search: 'Buscar',
    searchPlaceholder: 'Buscar articulos...',

    // Categories
    creditScoring: 'Scoring Crediticio',
    fraudDetection: 'Deteccion de Fraude',
    creditRisk: 'Riesgo de Credito',
    incomeEmployment: 'Ingresos y Empleo',
    regulatoryCompliance: 'Regulacion y Cumplimiento',
    lendingAutomation: 'Automatizacion de Prestamos',

    // Home page
    heroTitle: 'Perspectivas de IA para',
    heroTitleHighlight: 'Credito y Finanzas',
    heroSubtitle: 'Noticias curadas sobre IA en scoring crediticio, prestamos, deteccion de fraude y banca.',
    latestArticles: 'Ultimos Articulos',
    viewAll: 'Ver Todos los Articulos',

    // Sidebar
    newsletter: 'Boletin',
    newsletterText: 'Recibe perspectivas semanales de IA crediticia en tu correo.',
    subscribe: 'Suscribirse',
    emailPlaceholder: 'tu@correo.com',
    latestEditorial: 'Ultimo Editorial',
    readMore: 'Leer mas',

    // Article
    minuteRead: 'min de lectura',
    relatedArticles: 'Articulos Relacionados',

    // Footer
    footerTagline: 'Perspectivas de IA para servicios crediticios y financieros',
    footerCopyright: 'AI Credit News. Todos los derechos reservados.',

    // Dates
    today: 'Hoy',
    yesterday: 'Ayer'
  }
};

// Get current language from localStorage or default to English
function getCurrentLanguage() {
  return localStorage.getItem('lang') || 'en';
}

// Set language
function setLanguage(lang) {
  localStorage.setItem('lang', lang);
  updateUI(lang);
}

// Toggle between English and Spanish
function toggleLanguage() {
  const currentLang = getCurrentLanguage();
  const newLang = currentLang === 'en' ? 'es' : 'en';
  setLanguage(newLang);
}

// Get translation for a key
function t(key) {
  const lang = getCurrentLanguage();
  return translations[lang][key] || translations['en'][key] || key;
}

// Update UI elements with translations
function updateUI(lang) {
  // Update flag and code
  const langFlag = document.getElementById('langFlag');
  const langCode = document.getElementById('langCode');

  if (langFlag) {
    langFlag.textContent = lang === 'en' ? '🇺🇸' : '🇨🇴';
  }
  if (langCode) {
    langCode.textContent = lang.toUpperCase();
  }

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Update elements with data-en and data-es attributes
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = lang === 'en' ? el.dataset.en : el.dataset.es;
    if (text) {
      el.textContent = text;
    }
  });

  // Update elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translation = t(key);
    if (translation) {
      el.textContent = translation;
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const translation = t(key);
    if (translation) {
      el.placeholder = translation;
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const lang = getCurrentLanguage();
  updateUI(lang);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translations, getCurrentLanguage, setLanguage, toggleLanguage, t };
}
