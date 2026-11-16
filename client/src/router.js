(function (FC, $) {
  'use strict';

  const listeners = new Set();
  let currentState = (() => {
    try {
      return window.history.state?.fcState ?? null;
    } catch {
      return null;
    }
  })();
  let lastUrl = window.location.href;

  function normalizePathname(path) {
    if (!path) return '/';
    const withLeading = path.startsWith('/') ? path : `/${path}`;
    if (withLeading.length > 1 && withLeading.endsWith('/')) {
      return withLeading.slice(0, -1);
    }
    return withLeading;
  }

  function getLocation() {
    const rawHash = window.location.hash || '';
    const stripped = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
    const fragIdx = stripped.indexOf('#');
    const pathAndQuery = fragIdx >= 0 ? stripped.slice(0, fragIdx) : stripped;
    const hash = fragIdx >= 0 ? stripped.slice(fragIdx) : '';
    const qIdx = pathAndQuery.indexOf('?');
    const rawPath = qIdx >= 0 ? pathAndQuery.slice(0, qIdx) : pathAndQuery;
    const search = qIdx >= 0 ? pathAndQuery.slice(qIdx) : '';
    const pathname = normalizePathname(rawPath);
    const searchParams = new URLSearchParams(search);
    return {
      pathname,
      search,
      searchParams,
      hash,
      state: currentState,
    };
  }

  function toHashHref(to) {
    if (!to) return '#/';
    if (to.startsWith('#')) return to;
    return to.startsWith('/') ? `#${to}` : `#/${to}`;
  }

  function notifyRouteListeners() {
    const loc = getLocation();
    for (const listener of [...listeners]) {
      listener(loc);
    }
  }

  function navigate(to, { replace = false, state = null } = {}) {
    const targetHash = toHashHref(to);
    currentState = state ?? null;
    try {
      if (replace) {
        window.history.replaceState({ fcState: currentState }, '', targetHash);
      } else {
        window.history.pushState({ fcState: currentState }, '', targetHash);
      }
    } catch {
      if (replace) {
        const base = window.location.href.split('#')[0];
        window.location.replace(`${base}${targetHash}`);
      } else {
        window.location.hash = targetHash;
      }
    }
    lastUrl = window.location.href;
    notifyRouteListeners();
  }

  function setSearchParams(nextParams, { replace = false, state } = {}) {
    const loc = getLocation();
    const sp = nextParams instanceof URLSearchParams
      ? nextParams
      : new URLSearchParams(nextParams || {});
    const qs = sp.toString();
    const target = `${loc.pathname}${qs ? `?${qs}` : ''}${loc.hash || ''}`;
    navigate(target, { replace, state: state !== undefined ? state : loc.state });
  }

  function subscribeRouter(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function handleBrowserNavigation() {
    const href = window.location.href;
    let nextState = currentState;
    try {
      nextState = window.history.state?.fcState ?? null;
    } catch {
      nextState = null;
    }
    if (href === lastUrl && nextState === currentState) return;
    lastUrl = href;
    currentState = nextState;
    notifyRouteListeners();
  }

  window.addEventListener('popstate', handleBrowserNavigation);
  window.addEventListener('hashchange', handleBrowserNavigation);

  function createLink(to, content, { className = '', state = null, attrs = {}, css } = {}) {
    const $a = $('<a>').attr('href', toHashHref(to));
    if (className) $a.addClass(className);
    if (attrs && typeof attrs === 'object') {
      for (const [key, value] of Object.entries(attrs)) {
        if (value !== undefined && value !== null) {
          $a.attr(key, String(value));
        }
      }
    }
    if (css) $a.css(css);
    if (typeof content === 'string' || typeof content === 'number') {
      $a.text(String(content));
    } else if (content != null) {
      $a.append(content);
    }
    $a.on('click', (event) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }
      event.preventDefault();
      navigate(to, { state });
    });
    return $a;
  }

  function matchPath(pattern, pathname) {
    const patParts = normalizePathname(pattern).split('/');
    const pathParts = normalizePathname(pathname).split('/');
    if (patParts.length !== pathParts.length) return null;
    const params = {};
    for (let i = 0; i < patParts.length; i += 1) {
      const pat = patParts[i];
      const seg = pathParts[i];
      if (pat.startsWith(':')) {
        params[pat.slice(1)] = decodeURIComponent(seg);
      } else if (pat !== seg) {
        return null;
      }
    }
    return params;
  }

  Object.assign(FC, {
    getLocation,
    toHashHref,
    navigate,
    setSearchParams,
    subscribeRouter,
    createLink,
    matchPath,
  });
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
