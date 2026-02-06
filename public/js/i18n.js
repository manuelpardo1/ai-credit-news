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
    admin: 'Admin',

    // Categories
    creditScoring: 'Credit Scoring',
    fraudDetection: 'Fraud Detection',
    creditRisk: 'Credit Risk',
    incomeEmployment: 'Income & Employment',
    regulatoryCompliance: 'Regulatory & Compliance',
    lendingAutomation: 'Lending Automation',
    categories: 'Categories',
    browseByCategory: 'Browse by Category',

    // Home page
    heroTitle: 'AI Insights for',
    heroTitleHighlight: 'Credit & Finance',
    heroSubtitle: 'Curated news on AI in credit scoring, lending, fraud detection, and banking.',
    latestArticles: 'Latest Articles',
    viewAll: 'View All Articles',
    featuredEditorial: 'Featured Editorial',
    noArticles: 'No articles found.',

    // Sidebar
    newsletter: 'Newsletter',
    newsletterText: 'Get weekly AI credit insights delivered to your inbox.',
    subscribe: 'Subscribe',
    emailPlaceholder: 'your@email.com',
    latestEditorial: 'Latest Editorial',
    readMore: 'Read more',
    popularTags: 'Popular Tags',

    // Article page
    minuteRead: 'min read',
    relatedArticles: 'Related Articles',
    backToHome: 'Back to Home',
    shareArticle: 'Share this article',
    source: 'Source',
    publishedOn: 'Published on',
    difficulty: 'Difficulty',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    readOriginal: 'Read Original Article',
    tags: 'Tags',

    // All articles page
    allArticles: 'All Articles',
    filterBy: 'Filter by',
    sortBy: 'Sort by',
    newest: 'Newest',
    oldest: 'Oldest',
    mostRelevant: 'Most Relevant',
    articlesFound: 'articles found',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    noResults: 'No articles match your criteria.',

    // Category page
    articlesIn: 'Articles in',
    browseArticles: 'Browse articles',

    // Search page
    searchResults: 'Search Results',
    searchFor: 'Search for',
    resultsFor: 'results for',
    noResultsFor: 'No results found for',
    tryDifferent: 'Try different keywords or browse categories.',

    // About page
    aboutTitle: 'About AI Credit News',
    aboutMission: 'Our Mission',
    aboutMissionText: 'AI Credit News provides curated, high-quality news and analysis on the intersection of artificial intelligence and credit/financial services.',
    aboutWhatWeCover: 'What We Cover',
    aboutCoverage: 'We focus on AI applications in credit scoring, fraud detection, risk management, lending automation, and regulatory compliance.',
    aboutPoweredBy: 'Powered by AI',
    aboutPoweredByText: 'Our content curation uses Claude AI to analyze and categorize articles, ensuring relevance and quality.',
    aboutContact: 'Contact',
    aboutEmail: 'Email us at',

    // Editorial page
    weeklyEditorial: 'Weekly Editorial',
    editorialBy: 'Editorial by',
    publishedWeek: 'Week of',
    allEditorials: 'All Editorials',
    previousEditorials: 'Previous Editorials',

    // Subscribe
    subscribeTitle: 'Subscribe to AI Credit News',
    subscribeText: 'Get the latest AI credit insights delivered to your inbox weekly.',
    yourEmail: 'Your email',
    yourName: 'Your name (optional)',
    subscribeButton: 'Subscribe Now',
    subscribeSuccess: 'Successfully subscribed!',
    subscribeError: 'Subscription failed. Please try again.',
    alreadySubscribed: 'This email is already subscribed.',
    unsubscribe: 'Unsubscribe',
    unsubscribeConfirm: 'Are you sure you want to unsubscribe?',
    unsubscribeSuccess: 'You have been unsubscribed.',

    // Footer
    footerTagline: 'AI-powered insights for credit & financial services',
    footerCopyright: 'AI Credit News. All rights reserved.',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Service',
    footerContact: 'Contact',
    madeWith: 'Made with',
    builtWith: 'Built with Claude AI',

    // Dates
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',

    // Difficulty badges
    difficultyBeginner: 'Beginner',
    difficultyIntermediate: 'Intermediate',
    difficultyAdvanced: 'Advanced',

    // Error pages
    notFound: 'Page Not Found',
    notFoundText: 'The page you are looking for does not exist.',
    serverError: 'Server Error',
    serverErrorText: 'Something went wrong. Please try again later.',
    goHome: 'Go to Homepage',

    // Loading states
    loading: 'Loading...',
    loadMore: 'Load More'
  },
  es: {
    // Navigation
    home: 'Inicio',
    about: 'Nosotros',
    all: 'Todos',
    search: 'Buscar',
    searchPlaceholder: 'Buscar artículos...',
    admin: 'Admin',

    // Categories
    creditScoring: 'Scoring Crediticio',
    fraudDetection: 'Detección de Fraude',
    creditRisk: 'Riesgo de Crédito',
    incomeEmployment: 'Ingresos y Empleo',
    regulatoryCompliance: 'Regulación y Cumplimiento',
    lendingAutomation: 'Automatización de Préstamos',
    categories: 'Categorías',
    browseByCategory: 'Explorar por Categoría',

    // Home page
    heroTitle: 'Perspectivas de IA para',
    heroTitleHighlight: 'Crédito y Finanzas',
    heroSubtitle: 'Noticias seleccionadas sobre IA en scoring crediticio, préstamos, detección de fraude y banca.',
    latestArticles: 'Últimos Artículos',
    viewAll: 'Ver Todos los Artículos',
    featuredEditorial: 'Editorial Destacado',
    noArticles: 'No se encontraron artículos.',

    // Sidebar
    newsletter: 'Boletín',
    newsletterText: 'Recibe perspectivas semanales de IA crediticia en tu correo.',
    subscribe: 'Suscribirse',
    emailPlaceholder: 'tu@correo.com',
    latestEditorial: 'Último Editorial',
    readMore: 'Leer más',
    popularTags: 'Etiquetas Populares',

    // Article page
    minuteRead: 'min de lectura',
    relatedArticles: 'Artículos Relacionados',
    backToHome: 'Volver al Inicio',
    shareArticle: 'Compartir este artículo',
    source: 'Fuente',
    publishedOn: 'Publicado el',
    difficulty: 'Dificultad',
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    readOriginal: 'Leer Artículo Original',
    tags: 'Etiquetas',

    // All articles page
    allArticles: 'Todos los Artículos',
    filterBy: 'Filtrar por',
    sortBy: 'Ordenar por',
    newest: 'Más recientes',
    oldest: 'Más antiguos',
    mostRelevant: 'Más relevantes',
    articlesFound: 'artículos encontrados',
    page: 'Página',
    of: 'de',
    previous: 'Anterior',
    next: 'Siguiente',
    noResults: 'No hay artículos que coincidan con tu búsqueda.',

    // Category page
    articlesIn: 'Artículos en',
    browseArticles: 'Explorar artículos',

    // Search page
    searchResults: 'Resultados de Búsqueda',
    searchFor: 'Buscar',
    resultsFor: 'resultados para',
    noResultsFor: 'No se encontraron resultados para',
    tryDifferent: 'Intenta con otras palabras clave o explora las categorías.',

    // About page
    aboutTitle: 'Acerca de AI Credit News',
    aboutMission: 'Nuestra Misión',
    aboutMissionText: 'AI Credit News proporciona noticias y análisis seleccionados y de alta calidad sobre la intersección de la inteligencia artificial y los servicios crediticios/financieros.',
    aboutWhatWeCover: 'Qué Cubrimos',
    aboutCoverage: 'Nos enfocamos en aplicaciones de IA en scoring crediticio, detección de fraude, gestión de riesgos, automatización de préstamos y cumplimiento regulatorio.',
    aboutPoweredBy: 'Impulsado por IA',
    aboutPoweredByText: 'Nuestra curación de contenido utiliza Claude AI para analizar y categorizar artículos, asegurando relevancia y calidad.',
    aboutContact: 'Contacto',
    aboutEmail: 'Escríbenos a',

    // Editorial page
    weeklyEditorial: 'Editorial Semanal',
    editorialBy: 'Editorial por',
    publishedWeek: 'Semana del',
    allEditorials: 'Todos los Editoriales',
    previousEditorials: 'Editoriales Anteriores',

    // Subscribe
    subscribeTitle: 'Suscríbete a AI Credit News',
    subscribeText: 'Recibe las últimas perspectivas de IA crediticia en tu correo semanalmente.',
    yourEmail: 'Tu correo',
    yourName: 'Tu nombre (opcional)',
    subscribeButton: 'Suscribirse Ahora',
    subscribeSuccess: '¡Suscripción exitosa!',
    subscribeError: 'Error en la suscripción. Intenta de nuevo.',
    alreadySubscribed: 'Este correo ya está suscrito.',
    unsubscribe: 'Cancelar suscripción',
    unsubscribeConfirm: '¿Estás seguro de que deseas cancelar tu suscripción?',
    unsubscribeSuccess: 'Has cancelado tu suscripción.',

    // Footer
    footerTagline: 'Perspectivas de IA para servicios crediticios y financieros',
    footerCopyright: 'AI Credit News. Todos los derechos reservados.',
    footerPrivacy: 'Política de Privacidad',
    footerTerms: 'Términos de Servicio',
    footerContact: 'Contacto',
    madeWith: 'Hecho con',
    builtWith: 'Construido con Claude AI',

    // Dates
    today: 'Hoy',
    yesterday: 'Ayer',
    daysAgo: 'días atrás',

    // Difficulty badges
    difficultyBeginner: 'Principiante',
    difficultyIntermediate: 'Intermedio',
    difficultyAdvanced: 'Avanzado',

    // Error pages
    notFound: 'Página No Encontrada',
    notFoundText: 'La página que buscas no existe.',
    serverError: 'Error del Servidor',
    serverErrorText: 'Algo salió mal. Por favor intenta más tarde.',
    goHome: 'Ir al Inicio',

    // Loading states
    loading: 'Cargando...',
    loadMore: 'Cargar Más'
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

// Category slug to translation key mapping
const categoryKeys = {
  'credit-scoring': 'creditScoring',
  'fraud-detection': 'fraudDetection',
  'credit-risk': 'creditRisk',
  'income-employment': 'incomeEmployment',
  'regulatory-compliance': 'regulatoryCompliance',
  'lending-automation': 'lendingAutomation'
};

// Difficulty level translations
const difficultyKeys = {
  'beginner': 'difficultyBeginner',
  'intermediate': 'difficultyIntermediate',
  'advanced': 'difficultyAdvanced'
};

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

  // Update category links
  document.querySelectorAll('[data-category]').forEach(el => {
    const slug = el.dataset.category;
    const key = categoryKeys[slug];
    if (key) {
      const translation = t(key);
      if (translation) {
        el.textContent = translation;
      }
    }
  });

  // Update difficulty badges
  document.querySelectorAll('[data-difficulty]').forEach(el => {
    const level = el.dataset.difficulty;
    const key = difficultyKeys[level];
    if (key) {
      const translation = t(key);
      if (translation) {
        el.textContent = translation;
      }
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
