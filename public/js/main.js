// AI Credit News - Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Add smooth transitions for card hovers
  const cards = document.querySelectorAll('.article-card, .category-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

  // Search form enhancement
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('.search-input');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', function(e) {
      if (!searchInput.value.trim()) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // Add reading time estimates (rough calculation)
  const articleContent = document.querySelector('.article-content');
  if (articleContent) {
    const text = articleContent.innerText;
    const wordCount = text.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    const meta = document.querySelector('.article-meta');
    if (meta && readingTime > 0) {
      const readingTimeSpan = document.createElement('span');
      readingTimeSpan.innerHTML = `<strong>Reading time:</strong> ${readingTime} min`;
      meta.appendChild(readingTimeSpan);
    }
  }

  console.log('AI Credit News loaded');
});
