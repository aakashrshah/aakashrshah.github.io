/* Dashboard — Oil Price Widget
 * Data is fetched from /dashboard/data/oil-prices.json
 * That file is updated every 6 hours by the GitHub Actions workflow.
 * No API keys are ever sent from the browser.
 */

(function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────

  function avg(arr) {
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  function stddev(arr) {
    const mean = avg(arr);
    const variance = avg(arr.map(v => (v - mean) ** 2));
    return Math.sqrt(variance);
  }

  function pct(a, b) {
    return ((a - b) / b) * 100;
  }

  function fmt(n, decimals = 2) {
    return n.toFixed(decimals);
  }

  function fmtChange(n) {
    const sign = n >= 0 ? '+' : '';
    return `${sign}${fmt(n)}%`;
  }

  function changeClass(n) {
    if (Math.abs(n) < 0.1) return 'flat';
    return n > 0 ? 'up' : 'down';
  }

  function changeIcon(n) {
    if (Math.abs(n) < 0.1) return '→';
    return n > 0 ? '↑' : '↓';
  }

  // ── Parse & sort data ──────────────────────────────────────────────────────

  function parseData(raw) {
    const items = (raw.data || [])
      .filter(d => d.value && d.value !== '.' && !isNaN(parseFloat(d.value)))
      .map(d => ({ date: d.date, price: parseFloat(d.value) }))
      .sort((a, b) => a.date.localeCompare(b.date));  // oldest → newest
    return items;
  }

  // ── Sparkline SVG ──────────────────────────────────────────────────────────

  function buildSparkline(prices, positive) {
    const W = 1000, H = 100;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const pad = 4;

    const pts = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * W;
      const y = H - pad - ((p - min) / range) * (H - pad * 2);
      return [x, y];
    });

    const pathD = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0]},${pt[1]}`).join(' ');
    const fillD = `${pathD} L${W},${H} L0,${H} Z`;
    const color = positive ? '#10b981' : '#f43f5e';
    const gradId = `sg_${Math.random().toString(36).slice(2)}`;

    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${fillD}" fill="url(#${gradId})"/>
      <path d="${pathD}" stroke="${color}" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }

  // ── Compute insights ───────────────────────────────────────────────────────

  function computeInsights(items) {
    const prices = items.map(d => d.price);
    const current = prices[prices.length - 1];
    const prev1 = prices[prices.length - 2] ?? current;

    // Daily log returns for volatility
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }

    const ma7  = avg(prices.slice(-7));
    const ma30 = avg(prices.slice(-30));

    // Annualized historical volatility (21-day window)
    const vol21 = returns.slice(-21);
    const annualVol = stddev(vol21) * Math.sqrt(252) * 100;

    // 52-week range (up to 252 trading days)
    const yearPrices = prices.slice(-252);
    const low52  = Math.min(...yearPrices);
    const high52 = Math.max(...yearPrices);
    const rangePos = ((current - low52) / (high52 - low52)) * 100;

    // Changes
    const chg1d  = pct(current, prev1);
    const chg7d  = prices.length >= 7  ? pct(current, prices[prices.length - 7])  : null;
    const chg30d = prices.length >= 30 ? pct(current, prices[prices.length - 30]) : null;

    // MA signals
    const vsMa7  = pct(current, ma7);
    const vsMa30 = pct(current, ma30);
    const trendSignal = current > ma7 && current > ma30 ? 'bullish'
      : current < ma7 && current < ma30 ? 'bearish' : 'neutral';

    // Volatility signal
    const volSignal = annualVol > 40 ? 'caution' : annualVol > 25 ? 'neutral' : 'bullish';
    const volLabel  = annualVol > 40 ? 'High — market uncertain'
      : annualVol > 25 ? 'Moderate — typical range'
      : 'Low — stable conditions';

    // Price zone
    let zone = 'normal';
    if (current < 45)  zone = 'distress';
    else if (current < 60) zone = 'low';
    else if (current > 90) zone = 'high';

    return {
      current, prev1, ma7, ma30,
      annualVol, low52, high52, rangePos,
      chg1d, chg7d, chg30d,
      vsMa7, vsMa30, trendSignal,
      volSignal, volLabel,
      zone,
      sparkPrices: prices.slice(-30),
    };
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function changePill(val, label) {
    if (val === null) return '';
    const cls = changeClass(val);
    const icon = changeIcon(val);
    return `<span class="price-change ${cls}">
      ${icon} ${fmtChange(val)} <span class="price-change-label">${label}</span>
    </span>`;
  }

  function signalBadge(signal, label) {
    return `<span class="signal ${signal}">${label}</span>`;
  }

  function rangeBar(pos, low, high) {
    const safePos = Math.max(0, Math.min(100, pos));
    return `
      <div class="range-bar-wrap">
        <div class="range-bar-track">
          <div class="range-bar-fill" style="width:${safePos}%"></div>
          <div class="range-bar-thumb" style="left:${safePos}%"></div>
        </div>
        <div class="range-bar-labels">
          <span>$${fmt(low)} 52W low</span>
          <span>$${fmt(high)} 52W high</span>
        </div>
      </div>`;
  }

  function contextBar(price) {
    const zones = [
      { key: 'distress', label: 'Distress', range: '< $45', min: 0,  max: 45,  cls: 'zone-distress', desc: 'Below OPEC break-even' },
      { key: 'low',      label: 'Low',      range: '$45–60', min: 45, max: 60,  cls: 'zone-low',      desc: 'Below most shale break-even' },
      { key: 'normal',   label: 'Balanced', range: '$60–90', min: 60, max: 90,  cls: 'zone-normal',   desc: 'Comfortable for producers & consumers' },
      { key: 'high',     label: 'Costly',   range: '$90+',   min: 90, max: Infinity, cls: 'zone-high', desc: 'Inflationary pressure on economy' },
    ];
    return zones.map(z => {
      const active = price >= z.min && price < z.max;
      return `<div class="context-zone ${z.cls}${active ? ' active-zone' : ''}">
        <span class="zone-label">${z.label}</span>
        <span class="zone-range">${z.range}</span>
        ${active ? '<span class="context-zone-pointer">▲ now</span>' : ''}
      </div>`;
    }).join('');
  }

  // ── Render oil widget ──────────────────────────────────────────────────────

  function renderOilWidget(wtiData, brentData, updatedAt) {
    const wtiItems   = parseData(wtiData);
    const brentItems = parseData(brentData);

    if (wtiItems.length < 2) {
      document.getElementById('oil-widget-body').innerHTML =
        '<div class="dash-error">No price data available yet. The GitHub Actions workflow will populate this on its first run.</div>';
      return;
    }

    const wti   = computeInsights(wtiItems);
    const brent = computeInsights(brentItems);
    const spread = brent.current - wti.current;
    const spreadTrend = spread > 3 ? 'Unusual premium — global supply tight'
      : spread < 1 ? 'Near parity — North American demand strong'
      : 'Normal spread — typical market conditions';

    const isUp = wti.chg1d >= 0;

    document.getElementById('oil-widget-body').innerHTML = `
      <!-- Price row -->
      <div class="oil-prices-row">
        <div class="oil-price-block">
          <div class="oil-price-label">WTI Crude <span style="opacity:.5">/ barrel</span></div>
          <div class="oil-price-value"><span>$</span>${fmt(wti.current)}</div>
          <div class="oil-price-changes">
            ${changePill(wti.chg1d, '1D')}
            ${changePill(wti.chg7d, '7D')}
            ${changePill(wti.chg30d, '30D')}
          </div>
        </div>
        <div class="oil-price-block">
          <div class="oil-price-label">Brent Crude <span style="opacity:.5">/ barrel</span></div>
          <div class="oil-price-value"><span>$</span>${fmt(brent.current)}</div>
          <div class="oil-price-changes">
            ${changePill(brent.chg1d, '1D')}
            ${changePill(brent.chg7d, '7D')}
            ${changePill(brent.chg30d, '30D')}
          </div>
        </div>
      </div>

      <!-- Sparkline: WTI 30-day -->
      <div style="margin-bottom:6px">
        <span style="font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted)">WTI — 30-day price history</span>
      </div>
      <div class="sparkline-container">
        ${buildSparkline(wti.sparkPrices, isUp)}
      </div>
      <div class="sparkline-labels">
        <span>${wtiItems[Math.max(0, wtiItems.length - 30)].date}</span>
        <span>${wtiItems[wtiItems.length - 1].date}</span>
      </div>

      <!-- Price context zones -->
      <div class="insights-title" style="margin-top:28px">Price context</div>
      <div class="context-bar">${contextBar(wti.current)}</div>

      <!-- Insights grid -->
      <div class="insights-title" style="margin-top:24px">Mathematical insights</div>
      <div class="insights-grid">

        <!-- 7-day MA -->
        <div class="insight-card">
          <div class="insight-card-label"><i class="fa-solid fa-chart-line"></i> 7-Day MA</div>
          <div class="insight-card-value">$${fmt(wti.ma7)}</div>
          <div class="insight-card-sub">
            WTI is <strong>${fmtChange(wti.vsMa7)}</strong> vs 7D average.<br>
            ${wti.current > wti.ma7
              ? 'Trading <strong>above</strong> near-term average — short-term momentum is <strong>positive</strong>.'
              : 'Trading <strong>below</strong> near-term average — short-term pressure is <strong>bearish</strong>.'}
          </div>
          ${signalBadge(wti.current > wti.ma7 ? 'bullish' : 'bearish', wti.current > wti.ma7 ? '↑ Above MA7' : '↓ Below MA7')}
        </div>

        <!-- 30-day MA -->
        <div class="insight-card">
          <div class="insight-card-label"><i class="fa-solid fa-wave-square"></i> 30-Day MA</div>
          <div class="insight-card-value">$${fmt(wti.ma30)}</div>
          <div class="insight-card-sub">
            WTI is <strong>${fmtChange(wti.vsMa30)}</strong> vs 30D average.<br>
            ${wti.current > wti.ma30
              ? 'Above medium-term trend — <strong>bullish</strong> structure intact.'
              : 'Below medium-term trend — potential <strong>trend reversal</strong> to watch.'}
          </div>
          ${signalBadge(wti.current > wti.ma30 ? 'bullish' : 'bearish', wti.current > wti.ma30 ? '↑ Above MA30' : '↓ Below MA30')}
        </div>

        <!-- Annualized Volatility -->
        <div class="insight-card">
          <div class="insight-card-label"><i class="fa-solid fa-bolt"></i> Hist. Volatility</div>
          <div class="insight-card-value">${fmt(wti.annualVol)}%</div>
          <div class="insight-card-sub">
            Annualized (21-day window).<br>
            <strong>${wti.volLabel}</strong><br>
            High vol = wider gas price swings, hedging becomes expensive.
          </div>
          ${signalBadge(wti.volSignal, wti.volSignal === 'caution' ? '⚠ High vol' : wti.volSignal === 'neutral' ? '— Moderate' : '✓ Stable')}
        </div>

        <!-- 52-week range -->
        <div class="insight-card">
          <div class="insight-card-label"><i class="fa-solid fa-arrows-left-right"></i> 52-Week Range</div>
          <div class="insight-card-value">${fmt(wti.rangePos, 0)}th %ile</div>
          <div class="insight-card-sub">
            ${rangeBar(wti.rangePos, wti.low52, wti.high52)}
            ${wti.rangePos > 75 ? 'Near annual highs — expect resistance.'
              : wti.rangePos < 25 ? 'Near annual lows — watch for a bounce.'
              : 'Mid-range — no extreme positioning signal.'}
          </div>
        </div>

        <!-- WTI–Brent Spread -->
        <div class="insight-card">
          <div class="insight-card-label"><i class="fa-solid fa-code-compare"></i> WTI–Brent Spread</div>
          <div class="insight-card-value">
            <span class="spread-value ${spread >= 0 ? 'negative' : 'positive'}">
              ${spread >= 0 ? '-' : '+'}$${fmt(Math.abs(spread))}
            </span>
          </div>
          <div class="insight-card-sub">
            Brent trades at a <strong>$${fmt(Math.abs(spread))}/bbl ${spread > 0 ? 'premium' : 'discount'}</strong> to WTI.<br>
            ${spreadTrend}
          </div>
        </div>

        <!-- Overall Trend Signal -->
        <div class="insight-card">
          <div class="insight-card-label"><i class="fa-solid fa-compass"></i> Trend Signal</div>
          <div class="insight-card-value" style="text-transform:capitalize">${wti.trendSignal}</div>
          <div class="insight-card-sub">
            Based on price vs MA7 &amp; MA30.<br>
            ${wti.trendSignal === 'bullish'
              ? 'Price is <strong>above both</strong> moving averages — bulls in control.'
              : wti.trendSignal === 'bearish'
              ? 'Price is <strong>below both</strong> moving averages — bears in control.'
              : 'Price is <strong>mixed</strong> relative to MAs — wait for confirmation.'}
          </div>
          ${signalBadge(wti.trendSignal, wti.trendSignal === 'bullish' ? '↑ Bullish' : wti.trendSignal === 'bearish' ? '↓ Bearish' : '→ Mixed')}
        </div>

      </div>

      <!-- What it means for consumers -->
      <div class="insights-title" style="margin-top:24px">What this means</div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--radius-md);padding:18px 20px;font-size:.85rem;color:var(--text-secondary);line-height:1.8">
        <p>
          At <strong style="color:var(--text-primary)">$${fmt(wti.current)}/bbl</strong>, WTI crude translates to roughly
          <strong style="color:var(--text-primary)">$${fmt(wti.current / 42 * 1.3, 2)}/gal</strong> at the refinery gate
          (before taxes, refining, and retail margins — typical US pump price adds $1.00–$1.50).
          ${wti.current < 60
            ? ' At this level, many US shale producers operate near or below break-even, which can suppress new drilling and eventually tighten supply.'
            : wti.current > 90
            ? ' At this elevated level, consumers face inflationary pressure on fuel, transportation, and manufactured goods — central banks watch energy closely.'
            : ' This is generally a balanced range: OPEC members remain profitable, US shale producers can invest, and consumers aren\'t squeezed.'}
        </p>
      </div>
    `;
  }

  // ── Main ───────────────────────────────────────────────────────────────────

  async function init() {
    const updatedEl = document.getElementById('last-updated');

    try {
      const res = await fetch('data/oil-prices.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (updatedEl && json.updated_at) {
        const d = new Date(json.updated_at);
        updatedEl.textContent = `Data as of ${d.toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
        })}`;
      }

      renderOilWidget(json.wti, json.brent, json.updated_at);
    } catch (err) {
      console.error('Dashboard: failed to load oil-prices.json', err);
      const body = document.getElementById('oil-widget-body');
      if (body) {
        body.innerHTML = `<div class="dash-error">
          Could not load price data. Make sure the GitHub Actions workflow has run at least once
          and the file <code>dashboard/data/oil-prices.json</code> exists in the repo.
          <br><br>
          <a href="https://github.com/aakashrshah/aakashrshah.github.io/actions" target="_blank">View workflow runs →</a>
        </div>`;
      }
    }
  }

  // ── Market switcher ────────────────────────────────────────────────────────

  const MARKETS = [
    { name: 'Crude Oil',    icon: 'fa-oil-well'  },
    { name: 'Natural Gas',  icon: 'fa-fire-flame-curved' },
  ];

  function initMarketSwitcher() {
    const track   = document.getElementById('market-track');
    const wrapper = document.getElementById('market-wrapper');
    const btnPrev = document.getElementById('market-prev');
    const btnNext = document.getElementById('market-next');
    const navName = document.getElementById('market-nav-name');
    const navIcon = document.getElementById('market-nav-icon');
    const navCtr  = document.getElementById('market-nav-counter');
    if (!track || !btnPrev || !btnNext) return;

    const slides = track.querySelectorAll('.market-slide');
    let current = 0;

    function setWrapperHeight(idx) {
      // Size wrapper to active slide so page height adjusts naturally
      wrapper.style.height = slides[idx].scrollHeight + 'px';
    }

    function goTo(idx) {
      if (idx < 0 || idx >= slides.length) return;
      current = idx;
      track.style.transform = `translateX(-${idx * 100}%)`;
      setWrapperHeight(idx);

      // Update nav label
      const m = MARKETS[idx] || MARKETS[0];
      navName.textContent = m.name;
      navIcon.className   = 'fa-solid ' + m.icon;
      navCtr.textContent  = `${idx + 1} / ${slides.length}`;

      // Disable arrows at boundaries
      btnPrev.disabled = idx === 0;
      btnNext.disabled = idx === slides.length - 1;

      // Scroll back to top when switching markets
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    btnPrev.addEventListener('click', () => goTo(current - 1));
    btnNext.addEventListener('click', () => goTo(current + 1));

    // Swipe support
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
    });

    // Initialise height for slide 0; re-measure after data loads
    setWrapperHeight(0);
    // Re-measure once layout settles (fonts, images)
    window.addEventListener('load', () => setWrapperHeight(current));
    return { refresh: () => setWrapperHeight(current) };
  }

  window.addEventListener('DOMContentLoaded', () => {
    const switcher = initMarketSwitcher();
    init().then(() => switcher && switcher.refresh()).catch(() => {});
  });
})();
