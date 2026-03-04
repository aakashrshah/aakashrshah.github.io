document.addEventListener('DOMContentLoaded', async () => {
  const tipsContainer = document.getElementById('tips-container');
  const searchInput = document.getElementById('alm-search');
  const ageContainer = document.getElementById('age-filters');
  const countEl = document.getElementById('tip-count');
  if (!tipsContainer) return;

  let tips = [];
  let activeAge = 'all';

  // Fetch tips
  try {
    const res = await fetch('tips.json');
    const data = await res.json();
    tips = data.tips || [];
  } catch (e) {
    tipsContainer.innerHTML = '<div class="no-tips">Could not load tips.</div>';
    return;
  }

  // Collect unique age ranges
  const ageRanges = new Set();
  tips.forEach(t => { if (t.age) ageRanges.add(t.age); });

  // Render age filter buttons
  if (ageContainer) {
    let html = '<button class="age-btn active" data-age="all">All Ages</button>';
    // Sort age ranges
    const sorted = [...ageRanges].sort((a, b) => {
      const aNum = parseInt(a.split('-')[0] || a.replace('+', ''));
      const bNum = parseInt(b.split('-')[0] || b.replace('+', ''));
      return aNum - bNum;
    });
    sorted.forEach(age => {
      html += `<button class="age-btn" data-age="${age}">${age}</button>`;
    });
    ageContainer.innerHTML = html;
    ageContainer.querySelectorAll('.age-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ageContainer.querySelectorAll('.age-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeAge = btn.dataset.age;
        render();
      });
    });
  }

  // Search
  if (searchInput) {
    searchInput.addEventListener('input', () => render());
  }

  function render() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const filtered = tips.filter(t => {
      const matchAge = activeAge === 'all' || t.age === activeAge;
      const matchSearch = !query ||
        t.title.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(query));
      return matchAge && matchSearch;
    });

    if (countEl) {
      countEl.textContent = `${filtered.length} tip${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      tipsContainer.innerHTML = '<div class="no-tips">No tips found for this filter.</div>';
      return;
    }

    tipsContainer.innerHTML = filtered.map((t, i) => {
      // Convert newlines in content to paragraphs
      const paragraphs = t.content.split('\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('');

      return `
        <div class="tip-card">
          <div class="tip-number">Tip #${tips.indexOf(t) + 1}</div>
          <h2 class="tip-title">${escapeHtml(t.title)}</h2>
          <div class="tip-meta">
            ${t.age ? `<span class="tip-age"><i class="fa-solid fa-calendar" style="font-size:.6rem"></i> Age ${t.age}</span>` : ''}
            ${(t.tags || []).map(tag => `<span class="tip-tag">${tag}</span>`).join('')}
          </div>
          <div class="tip-content">${paragraphs}</div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  render();
});
