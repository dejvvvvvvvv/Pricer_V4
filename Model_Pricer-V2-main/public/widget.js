/**
 * ModelPricer Widget Loader (Phase 2.4 + Shopify Integration)
 * - Finds containers with: data-modelpricer-widget="PUBLIC_ID" (or legacy data-widget)
 * - Injects an iframe that points to: /widget/embed/PUBLIC_ID
 * - Auto-resizes iframe height via postMessage from the iframe page
 * - Shopify cart integration: handles checkout URL redirects and cart data events
 *
 * Usage:
 *   <script src="https://YOUR-DOMAIN.COM/widget.js" async></script>
 *   <div data-modelpricer-widget="WID_XXXX"></div>
 *
 * Shopify Theme Usage:
 *   <div data-modelpricer-widget="WID_XXXX"
 *        data-shopify-domain="myshop.myshopify.com"
 *        data-shopify-token="shpat_xxx"></div>
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

  // ─── Event callback registries ───────────────────────────
  var shopifyCartCallbacks = [];
  var priceCalculatedCallbacks = [];
  var errorCallbacks = [];

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

    // Detect Shopify config from data attributes and send to iframe
    var shopifyDomain = container.getAttribute('data-shopify-domain');
    var shopifyToken = container.getAttribute('data-shopify-token');
    if (shopifyDomain && shopifyToken) {
      iframe.addEventListener('load', function () {
        try {
          iframe.contentWindow.postMessage({
            type: 'MODELPRICER_SHOPIFY_CONFIG',
            storefrontToken: shopifyToken,
            shopDomain: shopifyDomain,
          }, baseOrigin);
        } catch (e) {
          // Ignore cross-origin errors
        }
      });
    }

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

  // ─── URL validation for redirects ────────────────────────
  function isValidShopifyUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      var parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      // Must be a Shopify domain
      if (parsed.hostname.indexOf('.myshopify.com') !== -1) return true;
      if (parsed.hostname.indexOf('.shopify.com') !== -1) return true;
      // Custom domains: allow if HTTPS (URL came from Shopify API)
      return true;
    } catch (e) {
      return false;
    }
  }

  function onMessage(event) {
    var data = event && event.data;
    if (!data || typeof data !== 'object') return;

    // Basic origin check: accept only messages from the iframe origin (our baseOrigin)
    if (event.origin && baseOrigin && event.origin !== baseOrigin) {
      return;
    }

    var type = data.type;

    // ─── Existing: Widget height resize ──────────────────
    if (type === 'MODELPRICER_WIDGET_HEIGHT') {
      var publicId = String(data.publicId || '').trim();
      var height = safeParseInt(data.height, 0);

      if (!publicId || !height) return;

      // sanity limits
      height = Math.max(200, Math.min(5000, height));

      var iframes = document.querySelectorAll('iframe[data-modelpricer-public-id="' + publicId.replace(/"/g, '\\"') + '"]');
      for (var i = 0; i < iframes.length; i++) {
        iframes[i].style.height = String(height) + 'px';
      }
      return;
    }

    // ─── Shopify: Checkout URL redirect ──────────────────
    if (type === 'MODELPRICER_SHOPIFY_CHECKOUT_URL') {
      var checkoutUrl = data.checkoutUrl;
      if (!isValidShopifyUrl(checkoutUrl)) {
        console.warn('[ModelPricer] Invalid Shopify checkout URL, ignoring redirect');
        return;
      }

      // Dispatch custom event for parent page integration
      try {
        var evt = new CustomEvent('modelpricer:shopify:checkout', {
          detail: {
            publicWidgetId: data.publicWidgetId || '',
            checkoutUrl: checkoutUrl,
            cartId: data.cartId || '',
            lineCount: data.lineCount || 0,
          },
        });
        document.dispatchEvent(evt);
      } catch (e) {
        // CustomEvent not supported in old browsers
      }

      // Notify registered callbacks
      for (var ci = 0; ci < shopifyCartCallbacks.length; ci++) {
        try { shopifyCartCallbacks[ci](data); } catch (e) { /* ignore */ }
      }

      // Default behavior: redirect to checkout
      window.location.href = checkoutUrl;
      return;
    }

    // ─── Shopify: Cart data (no redirect) ────────────────
    if (type === 'MODELPRICER_ADD_TO_SHOPIFY_CART') {
      // Dispatch custom event
      try {
        var cartEvt = new CustomEvent('modelpricer:shopify:cart', {
          detail: {
            publicWidgetId: data.publicWidgetId || '',
            shopifyLines: data.shopifyLines || [],
            total: data.total || 0,
            currency: data.currency || 'CZK',
          },
        });
        document.dispatchEvent(cartEvt);
      } catch (e) {
        // CustomEvent not supported
      }

      // Notify registered callbacks
      for (var si = 0; si < shopifyCartCallbacks.length; si++) {
        try { shopifyCartCallbacks[si](data); } catch (e) { /* ignore */ }
      }
      return;
    }

    // ─── Price calculated event ──────────────────────────
    if (type === 'MODELPRICER_QUOTE_CREATED') {
      try {
        var priceEvt = new CustomEvent('modelpricer:price:calculated', {
          detail: {
            publicWidgetId: data.publicWidgetId || '',
            quote: data.quote || null,
          },
        });
        document.dispatchEvent(priceEvt);
      } catch (e) {
        // ignore
      }

      for (var pi = 0; pi < priceCalculatedCallbacks.length; pi++) {
        try { priceCalculatedCallbacks[pi](data); } catch (e) { /* ignore */ }
      }
      return;
    }
  }

  window.addEventListener('message', onMessage, false);

  window[GLOBAL_KEY] = {
    init: initAll,
    initOne: initOne,
    baseOrigin: baseOrigin,

    // ─── Public API for parent page integration ──────────
    onShopifyCart: function (callback) {
      if (typeof callback === 'function') shopifyCartCallbacks.push(callback);
    },
    onPriceCalculated: function (callback) {
      if (typeof callback === 'function') priceCalculatedCallbacks.push(callback);
    },
    onError: function (callback) {
      if (typeof callback === 'function') errorCallbacks.push(callback);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
