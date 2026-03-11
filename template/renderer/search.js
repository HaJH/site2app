(function () {
  const searchbar = document.getElementById('searchbar');
  const searchInput = document.getElementById('search-input');
  const searchCount = document.getElementById('search-count');
  const btnPrev = document.getElementById('btn-search-prev');
  const btnNext = document.getElementById('btn-search-next');
  const btnClose = document.getElementById('btn-search-close');
  let lastQuery = '';

  function showSearchBar() {
    searchbar.classList.remove('hidden');
    searchInput.focus();
    searchInput.select();
    if (searchInput.value) {
      window.site2app.search.find(searchInput.value);
    }
    window.site2app.search.setVisible(true);
  }

  function hideSearchBar() {
    searchbar.classList.add('hidden');
    window.site2app.search.stop();
    searchCount.textContent = '';
    window.site2app.search.setVisible(false);
  }

  function toggleSearchBar() {
    if (searchbar.classList.contains('hidden')) {
      showSearchBar();
    } else {
      hideSearchBar();
    }
  }

  window.site2app.search.onToggle(() => toggleSearchBar());

  searchInput.addEventListener('input', () => {
    const query = searchInput.value;
    if (query !== lastQuery) {
      lastQuery = query;
      window.site2app.search.find(query);
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        window.site2app.search.findPrev();
      } else {
        window.site2app.search.findNext();
      }
    } else if (e.key === 'Escape') {
      hideSearchBar();
    }
  });

  btnPrev.addEventListener('click', () => window.site2app.search.findPrev());
  btnNext.addEventListener('click', () => window.site2app.search.findNext());
  btnClose.addEventListener('click', () => hideSearchBar());

  window.site2app.search.onResult((result) => {
    if (result.matches > 0) {
      searchCount.textContent = `${result.activeMatchOrdinal} / ${result.matches}`;
    } else {
      searchCount.textContent = searchInput.value ? 'No results' : '';
    }
  });
})();
