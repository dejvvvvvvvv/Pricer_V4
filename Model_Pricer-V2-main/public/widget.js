/**
 * ModelPricer Widget Loader (Phase 2.4)
 * - Finds containers with: data-modelpricer-widget="PUBLIC_ID" (or legacy data-widget)
 * - Injects an iframe that points to: /widget/embed/PUBLIC_ID
 * - Auto-resizes iframe height via postMessage from the iframe page
 *
 * Usage:
 *   <script src="https://YOUR-DOMAIN.COM/widget.js" async></script>
 *   <div data-modelpricer-widget="WID_XXXX"></div>
 */
(function () {
  var GLOBAL_KEY = '__modelpricer_widget_loader__';

  if (window[GLOBAL_KEY] && window[GLOBAL_KEY].init) {
    // Prevent double-initialization if script loaded multiple times
    return;
  }

  function safeParseInt(v, fallback) {
    var n = parseInt(v, 10);
    return isFinite(n) ? n : fallback;
  }

  function findThisScriptEl() {
    // Most reliable:
    if (document.currentScript) return document.currentScript;

    // Fallback: find the last script that looks like widget.js
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i];
      var src = (s && s.getAttribute && s.getAttribute('src')) || '';
      if (!src) continue;
      if (src.indexOf('widget.js') !== -1) return s;
    }
    return null;
  }

  function resolveBaseOrigin() {
    var s = findThisScriptEl();
    var src = s && s.getAttribute ? (s.getAttribute('src') || '') : '';
    try {
      if (!src) return window.location.origin;
      var u = new URL(src, window.location.href);
      return u.origin;
    } catch (e) {
      return window.location.origin;
    }
  }

  var baseOrigin = resolveBaseOrigin();

  function resolveEmbedSrc(container, publicId) {
    var embedSrc = container.getAttribute('data-embed-src') || '';
    if (embedSrc) {
      try {
        // allow relative: "/widget/embed/..."
        if (embedSrc.charAt(0) === '/') return baseOrigin + embedSrc;
        return new URL(embedSrc, window.location.href).toString();
      } catch (e) {
        // ignore
      }
    }
    return baseOrigin + '/widget/embed/' + encodeURIComponent(publicId);
  }

  function createIframe(container, publicId) {
    // Allow re-init (replace)
    while (container.firstChild) container.removeChild(container.firstChild);

    var iframe = document.createElement('iframe');
    iframe.src = resolveEmbedSrc(container, publicId);
    iframe.setAttribute('title', '3D print calculator');
    iframe.setAttribute('loading', 'lazy');

    iframe.style.width = '100%';
    iframe.style.border = '0';

    var minH = safeParseInt(container.getAttribute('data-min-height'), 760);
    iframe.style.minHeight = String(Math.max(200, minH)) + 'px';

    // store publicId for auto-resize mapping
    iframe.setAttribute('data-modelpricer-public-id', publicId);

    container.appendChild(iframe);
    return iframe;
  }

  function getContainers() {
    // Prefer explicit attribute
    var a = document.querySelectorAll('[data-modelpricer-widget]');
    // Legacy support
    var b = document.querySelectorAll('[data-widget]');
    // Merge NodeLists into array (avoid duplicates)
    var out = [];
    for (var i = 0; i < a.length; i++) out.push(a[i]);
    for (var j = 0; j < b.length; j++) {
      if (out.indexOf(b[j]) === -1) out.push(b[j]);
    }
    return out;
  }

  function initOne(container) {
    if (!container || !container.getAttribute) return;

    var publicId = container.getAttribute('data-modelpricer-widget') || container.getAttribute('data-widget') || '';
    publicId = String(publicId || '').trim();
    if (!publicId) return;

    // Avoid re-injecting if already has iframe for same id
    var existing = container.querySelector('iframe[data-modelpricer-public-id]');
    if (existing && existing.getAttribute('data-modelpricer-public-id') === publicId) return;

    createIframe(container, publicId);
  }

  function initAll() {
    var containers = getContainers();
    for (var i = 0; i < containers.length; i++) initOne(containers[i]);
  }

  function onMessage(event) {
    var data = event && event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type !== 'MODELPRICER_WIDGET_HEIGHT') return;

    // Basic origin check: accept only messages from the iframe origin (our baseOrigin)
    // If you later serve embed from a different origin (CDN), you can relax this.
    if (event.origin && baseOrigin && event.origin !== baseOrigin) {
      return;
    }

    var publicId = String(data.publicId || '').trim();
    var height = safeParseInt(data.height, 0);

    if (!publicId || !height) return;

    // sanity limits
    height = Math.max(200, Math.min(5000, height));

    var iframes = document.querySelectorAll('iframe[data-modelpricer-public-id="' + publicId.replace(/"/g, '\\"') + '"]');
    for (var i = 0; i < iframes.length; i++) {
      iframes[i].style.height = String(height) + 'px';
    }
  }

  window.addEventListener('message', onMessage, false);

  window[GLOBAL_KEY] = {
    init: initAll,
    initOne: initOne,
    baseOrigin: baseOrigin,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
