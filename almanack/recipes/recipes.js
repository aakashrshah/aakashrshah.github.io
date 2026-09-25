document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('recipes-container');
  const searchInput = document.getElementById('rec-search');
  const catContainer = document.getElementById('category-filters');
  const countEl = document.getElementById('recipe-count');
  if (!container) return;

  let recipes = [];
  let activeCat = 'all';

  // Fetch recipes
  try {
    const res = await fetch('recipes.json');
    const data = await res.json();
    recipes = data.recipes || [];
  } catch (e) {
    container.innerHTML = '<div class="no-tips">Could not load recipes.</div>';
    return;
  }

  // Render category filter buttons
  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))].sort();
  if (catContainer && categories.length) {
    catContainer.innerHTML = '<button class="age-btn active" data-cat="all">All</button>' +
      categories.map(c => `<button class="age-btn" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
    catContainer.querySelectorAll('.age-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        catContainer.querySelectorAll('.age-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.dataset.cat;
        render();
      });
    });
  }

  if (searchInput) searchInput.addEventListener('input', () => render());

  // Expand/collapse
  container.addEventListener('click', e => {
    const btn = e.target.closest('.rec-toggle');
    if (!btn) return;
    const card = btn.closest('.rec-card');
    const open = card.classList.toggle('open');
    btn.innerHTML = `${open ? 'Hide recipe' : 'View recipe'} <i class="fa-solid fa-chevron-down"></i>`;
    if (open && card.id) history.replaceState(null, '', '#' + card.id);
  });

  function searchText(r) {
    const parts = [r.title, r.description, r.category, ...(r.tags || [])];
    (r.components || []).forEach(c => parts.push(c.name, ...(c.ingredients || [])));
    return parts.filter(Boolean).join(' ').toLowerCase();
  }

  function render() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const filtered = recipes.filter(r =>
      (activeCat === 'all' || r.category === activeCat) &&
      (!query || searchText(r).includes(query))
    );

    if (countEl) countEl.textContent = `${filtered.length} recipe${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      container.innerHTML = '<div class="no-tips">No recipes found.</div>';
      return;
    }

    // Auto-open a recipe linked via #id, or the only result
    const hash = decodeURIComponent(location.hash.slice(1));
    container.innerHTML = filtered.map(r => {
      const open = filtered.length === 1 || r.id === hash;
      return renderCard(r, open);
    }).join('');
  }

  function renderCard(r, open) {
    const facts = [
      r.time && `<span><i class="fa-regular fa-clock"></i>${escapeHtml(r.time)}</span>`,
      r.serves && `<span><i class="fa-solid fa-utensils"></i>Serves ${escapeHtml(r.serves)}</span>`,
      r.components && r.components.length > 1 && `<span><i class="fa-solid fa-layer-group"></i>${r.components.length} parts</span>`
    ].filter(Boolean).join('');

    const components = (r.components || []).map(c => `
      <div class="rec-component">
        ${c.name && r.components.length > 1 ? `<h3>${escapeHtml(c.name)}</h3>` : ''}
        <div class="rec-cols">
          <div>
            <div class="rec-label">Ingredients</div>
            <ul class="rec-ingredients">
              ${(c.ingredients || []).map(i => `<li><label><input type="checkbox"><span>${escapeHtml(i)}</span></label></li>`).join('')}
            </ul>
          </div>
          <div>
            <div class="rec-label">Method</div>
            <ol class="rec-steps">
              ${(c.steps || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
            </ol>
          </div>
        </div>
      </div>`).join('');

    const serving = r.serving ? `<div class="rec-extra"><strong>To serve:</strong> ${escapeHtml(r.serving)}</div>` : '';
    const notes = (r.notes && r.notes.length)
      ? `<div class="rec-extra"><strong>Notes</strong><ul>${r.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul></div>`
      : '';

    return `
      <div class="tip-card rec-card${open ? ' open' : ''}" id="${escapeHtml(r.id || '')}">
        <div class="tip-number">Recipe #${recipes.indexOf(r) + 1}${r.category ? ' &middot; ' + escapeHtml(r.category) : ''}</div>
        <h2 class="tip-title">${escapeHtml(r.title)}</h2>
        <div class="tip-meta">
          ${(r.tags || []).map(t => `<span class="tip-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        ${r.description ? `<p class="rec-desc">${escapeHtml(r.description)}</p>` : ''}
        ${facts ? `<div class="rec-facts">${facts}</div>` : ''}
        <button class="rec-toggle">${open ? 'Hide recipe' : 'View recipe'} <i class="fa-solid fa-chevron-down"></i></button>
        <div class="rec-body">${components}${serving}${notes}</div>
      </div>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  render();
});
