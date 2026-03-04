/* Blog listing - search & tag filtering */
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('blog-grid');
  const searchInput = document.getElementById('blog-search');
  const tagContainer = document.getElementById('tag-filters');
  if (!grid) return;

  let posts = [];
  let activeTag = 'all';

  // Fetch posts manifest
  try {
    const res = await fetch('posts/posts.json');
    const data = await res.json();
    posts = data.posts || [];
  } catch (e) {
    grid.innerHTML = '<div class="no-results">Could not load posts.</div>';
    return;
  }

  // Collect unique tags
  const allTags = new Set();
  posts.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));

  // Render tag buttons
  if (tagContainer) {
    let html = '<button class="tag-btn active" data-tag="all">All</button>';
    allTags.forEach(tag => {
      html += `<button class="tag-btn" data-tag="${tag}">${tag}</button>`;
    });
    tagContainer.innerHTML = html;
    tagContainer.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tagContainer.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTag = btn.dataset.tag;
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
    const filtered = posts.filter(p => {
      const matchTag = activeTag === 'all' || (p.tags || []).includes(activeTag);
      const matchSearch = !query ||
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        (p.tags || []).some(t => t.toLowerCase().includes(query));
      return matchTag && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="no-results">No posts found.</div>';
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <article class="post-card">
        <div class="post-card-body">
          <div class="post-card-date">${formatDate(p.date)}</div>
          <h2 class="post-card-title"><a href="posts/${p.file}">${escapeHtml(p.title)}</a></h2>
          <p class="post-card-excerpt">${escapeHtml(p.excerpt)}</p>
          <div class="post-card-tags">
            ${(p.tags || []).map(t => `<span class="post-card-tag">${t}</span>`).join('')}
          </div>
          <a href="posts/${p.file}" class="post-card-read">Read more <i class="fa-solid fa-arrow-right" style="font-size:.75rem"></i></a>
        </div>
      </article>
    `).join('');
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  render();
});
