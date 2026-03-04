/* Blog Editor - Rich text with Quill, export to HTML */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quill
  const quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Start writing your post...',
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean']
      ]
    }
  });

  const titleInput = document.getElementById('post-title');
  const tagsInput = document.getElementById('post-tags');
  const btnExport = document.getElementById('btn-export');
  const btnPreview = document.getElementById('btn-preview');
  const btnCopy = document.getElementById('btn-copy');
  const previewOverlay = document.getElementById('preview-overlay');
  const previewBody = document.getElementById('preview-body');
  const previewClose = document.getElementById('preview-close');

  function getSlug(title) {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);
  }

  function getTags() {
    return (tagsInput.value || '')
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
  }

  function getDate() {
    return new Date().toISOString().split('T')[0];
  }

  function generateHTML() {
    const title = titleInput.value || 'Untitled Post';
    const tags = getTags();
    const slug = getSlug(title);
    const date = getDate();
    const content = quill.root.innerHTML;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Aakash Shah</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="../css/blog.css">
</head>
<body>
  <!-- Navigation -->
  <nav class="blog-nav">
    <div class="blog-nav-inner">
      <a href="../../" class="blog-nav-logo">aakash<span>shah</span></a>
      <div class="blog-nav-links">
        <a href="../">All Posts</a>
        <a href="../../#about" class="hide-mobile">Portfolio</a>
        <a href="../write.html" class="btn-write">Write</a>
      </div>
    </div>
  </nav>

  <!-- Post Header -->
  <header class="post-header">
    <div class="post-date">${formatDate(date)}</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="post-tags-header">
      ${tags.map(t => `<span class="post-card-tag">${t}</span>`).join('\n      ')}
    </div>
  </header>

  <!-- Post Content -->
  <article class="post-content">
    ${content}
  </article>

  <!-- Lyket Like Button -->
  <div class="post-likes">
    <p>Did you enjoy this post?</p>
    <div data-lyket-type="like" data-lyket-id="${slug}" data-lyket-namespace="blog"></div>
  </div>

  <!-- Post Footer -->
  <div class="post-footer">
    <a href="../"><i class="fa-solid fa-arrow-left"></i> Back to all posts</a>
    <a href="../../#contact">Get in touch <i class="fa-solid fa-arrow-right"></i></a>
  </div>

  <!-- Footer -->
  <footer class="blog-footer">
    <p>Aakash Shah &bull; Austin, TX</p>
  </footer>

  <!-- Lyket Widget -->
  <script src="https://unpkg.com/@lyket/widget@latest/dist/lyket.js?apiKey=pt_da20c945582ef40db16e9684abef3b"></script>
</body>
</html>`;
  }

  function generateManifestEntry() {
    const title = titleInput.value || 'Untitled Post';
    const tags = getTags();
    const slug = getSlug(title);
    return JSON.stringify({
      id: slug,
      title: title,
      excerpt: quill.getText().substring(0, 200).trim() + '...',
      date: getDate(),
      tags: tags,
      author: 'Aakash Shah',
      file: slug + '.html'
    }, null, 2);
  }

  // Export HTML file
  btnExport.addEventListener('click', () => {
    const html = generateHTML();
    const title = titleInput.value || 'untitled';
    const slug = getSlug(title);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = slug + '.html';
    a.click();
    URL.revokeObjectURL(url);

    // Show manifest entry to copy
    const entry = generateManifestEntry();
    alert('File downloaded! Add this entry to blog/posts/posts.json:\n\n' + entry);
  });

  // Preview
  btnPreview.addEventListener('click', () => {
    previewBody.srcdoc = generateHTML();
    previewOverlay.classList.add('active');
  });

  previewClose.addEventListener('click', () => {
    previewOverlay.classList.remove('active');
  });

  previewOverlay.addEventListener('click', (e) => {
    if (e.target === previewOverlay) previewOverlay.classList.remove('active');
  });

  // Copy HTML
  btnCopy.addEventListener('click', () => {
    const html = generateHTML();
    navigator.clipboard.writeText(html).then(() => {
      btnCopy.textContent = 'Copied!';
      setTimeout(() => { btnCopy.textContent = 'Copy HTML'; }, 2000);
    });
  });

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
