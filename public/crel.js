/**
 * Crel Analytics — lightweight tracking SDK (<6KB gzipped target)
 * MIT License — 100% open source
 *
 * Usage:
 * <script async src="https://your-app.vercel.app/crel.js" data-website-id="YOUR_TRACKING_ID"></script>
 * window.crel.track('signup', { plan: 'pro' });
 */
(function (global) {
  "use strict";

  var QUEUE_KEY = "_crel_queue";
  var VISITOR_KEY = "_crel_vid";
  var SESSION_KEY = "_crel_sid";
  var SESSION_TIMEOUT = 30 * 60 * 1000;
  var BATCH_INTERVAL = 3000;
  var MAX_RETRIES = 3;
  var ENDPOINT = "/api/collect";

  function scriptConfig() {
    var script = document.currentScript;
    if (!script) {
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf("crel.js") !== -1) {
          script = scripts[i];
          break;
        }
      }
    }
    return {
      websiteId: script && script.getAttribute("data-website-id"),
      host: script && script.getAttribute("data-host"),
      autoTrack: script ? script.getAttribute("data-auto-track") !== "false" : true,
      // Capture the script's own src so we can derive the host reliably —
      // document.currentScript is null for dynamically injected scripts (e.g. Next.js afterInteractive).
      src: (script && script.src) || "",
    };
  }

  function uuid() {
    if (global.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }

  function getVisitorId() {
    var id = storageGet(VISITOR_KEY);
    if (!id) {
      id = uuid();
      storageSet(VISITOR_KEY, id);
    }
    return id;
  }

  function getSessionId() {
    var raw = storageGet(SESSION_KEY);
    var now = Date.now();
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (now - parsed.t < SESSION_TIMEOUT) return parsed.id;
      } catch (e) {}
    }
    var sid = uuid();
    storageSet(SESSION_KEY, JSON.stringify({ id: sid, t: now }));
    return sid;
  }

  function touchSession() {
    var sid = getSessionId();
    storageSet(SESSION_KEY, JSON.stringify({ id: sid, t: Date.now() }));
    return sid;
  }

  function parseUtm() {
    var params = new URLSearchParams(global.location.search);
    return {
      source: params.get("utm_source") || undefined,
      medium: params.get("utm_medium") || undefined,
      campaign: params.get("utm_campaign") || undefined,
      term: params.get("utm_term") || undefined,
      content: params.get("utm_content") || undefined,
    };
  }

  function detectDevice() {
    var ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return "mobile";
    if (/Tablet|iPad/i.test(ua)) return "tablet";
    return "desktop";
  }

  function detectBrowser() {
    var ua = navigator.userAgent;
    var m;
    if ((m = ua.match(/Firefox\/(\d+)/))) return { name: "Firefox", version: m[1] };
    if ((m = ua.match(/Edg\/(\d+)/))) return { name: "Edge", version: m[1] };
    if ((m = ua.match(/Chrome\/(\d+)/))) return { name: "Chrome", version: m[1] };
    if ((m = ua.match(/Version\/(\d+).*Safari/))) return { name: "Safari", version: m[1] };
    return { name: "Other", version: "" };
  }

  function detectOs() {
    var ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return { name: "Windows", version: "" };
    if (/Mac OS X/i.test(ua)) return { name: "macOS", version: "" };
    if (/Android/i.test(ua)) return { name: "Android", version: "" };
    if (/iPhone|iPad/i.test(ua)) return { name: "iOS", version: "" };
    if (/Linux/i.test(ua)) return { name: "Linux", version: "" };
    return { name: "Other", version: "" };
  }

  function basePayload(type, extra) {
    var browser = detectBrowser();
    var os = detectOs();
    return Object.assign(
      {
        type: type,
        websiteId: config.websiteId,
        sessionId: touchSession(),
        visitorId: getVisitorId(),
        url: location.href,
        path: location.pathname + location.search,
        title: document.title,
        referrer: document.referrer || undefined,
        screen: screen.width + "x" + screen.height,
        language: navigator.language,
        device: detectDevice(),
        browser: browser.name,
        browserVersion: browser.version,
        os: os.name,
        osVersion: os.version,
        utm: parseUtm(),
      },
      extra || {}
    );
  }

  var config = scriptConfig();
  var queue = [];
  var flushing = false;
  var sessionStart = Date.now();
  // Derive the Crel server origin from the script tag's own src so this works
  // for dynamically injected scripts (Next.js afterInteractive, etc.) where
  // document.currentScript is null at evaluation time.
  var host = config.host || (function () {
    if (config.src) {
      try { return new URL(config.src).origin; } catch (e) {}
    }
    return "";
  })();

  function apiUrl() {
    return (host || "") + ENDPOINT;
  }

  function enqueue(item) {
    queue.push(item);
    scheduleFlush();
  }

  var flushTimer;
  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(function () {
      flushTimer = null;
      flush();
    }, BATCH_INTERVAL);
  }

  function sendWithRetry(body, retries) {
    retries = retries || 0;
    var json = JSON.stringify(body);

    if (navigator.sendBeacon && retries === 0) {
      try {
        var blob = new Blob([json], { type: "application/json" });
        if (navigator.sendBeacon(apiUrl(), blob)) return Promise.resolve();
      } catch (e) {}
    }

    return fetch(apiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
      keepalive: true,
      credentials: "omit",
    }).catch(function () {
      if (retries < MAX_RETRIES) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve(sendWithRetry(body, retries + 1));
          }, Math.pow(2, retries) * 500);
        });
      }
    });
  }

  function flush() {
    if (flushing || !queue.length || !config.websiteId) return;
    flushing = true;
    var batch = queue.splice(0, queue.length);
    sendWithRetry({ batch: batch }).finally(function () {
      flushing = false;
      if (queue.length) scheduleFlush();
    });
  }

  function pageview() {
    enqueue(basePayload("pageview"));
  }

  function track(name, properties) {
    enqueue(
      basePayload("event", {
        eventName: name,
        eventProperties: properties || {},
      })
    );
  }

  function heartbeat() {
    var duration = Math.floor((Date.now() - sessionStart) / 1000);
    enqueue(basePayload("heartbeat", { duration: duration }));
  }

  function initSpaTracking() {
    var pushState = history.pushState;
    var replaceState = history.replaceState;

    function onNav() {
      pageview();
    }

    history.pushState = function () {
      pushState.apply(history, arguments);
      onNav();
    };
    history.replaceState = function () {
      replaceState.apply(history, arguments);
      onNav();
    };
    global.addEventListener("popstate", onNav);
  }

  var crel = {
    pageview: pageview,
    track: track,
    flush: flush,
    getVisitorId: getVisitorId,
    getSessionId: getSessionId,
  };

  global.crel = crel;

  if (config.websiteId) {
    if (config.autoTrack) {
      pageview();
      initSpaTracking();
    }
    setInterval(heartbeat, 15000);
    global.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flush();
    });
    global.addEventListener("pagehide", flush);
  }

  var preQueue = global[QUEUE_KEY];
  if (preQueue && preQueue.length) {
    preQueue.forEach(function (args) {
      if (args[0] === "track") track(args[1], args[2]);
      if (args[0] === "pageview") pageview();
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
