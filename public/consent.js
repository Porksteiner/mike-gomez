/*
  The Sauce — consent gate (no dependencies, ~3 KB).

  Nothing third-party runs until the visitor clicks Accept.

  Mark anything that loads a third party:

  1. Scripts (analytics, pixels, widgets):
       <script type="text/plain" data-consent src="https://..."></script>
     It stays inert until Accept, then runs in place.

  2. Embeds (Calendly, newsletter forms, YouTube, Maps):
       <div data-consent-embed data-service="Calendly">
         <template> ...the real embed markup, scripts included... </template>
         ...placeholder shown before consent: a short note, a
            <button data-consent-accept> and a direct link fallback...
       </div>
     On Accept the placeholder is swapped for the template content.

  3. A "Cookie settings" link anywhere: <a href="#" data-consent-open>…</a>

  Load this file with: <script src="/consent.js" defer
     data-services="Calendly (booking)" data-privacy="/privacy"></script>

  The banner only appears on pages that have something to gate.
  Choice is kept in localStorage (strictly necessary, no cookie set).
  Analytics added later: window.siteConsent.onAccept(fn).
*/
(function () {
  var KEY = 'site-consent-v1';
  var me = document.currentScript;
  var services = (me && me.dataset.services) || 'third-party services';
  var privacy = me && me.dataset.privacy;
  var listeners = [];
  var activated = false;
  var banner;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function revive(old) {
    var s = document.createElement('script');
    for (var i = 0; i < old.attributes.length; i++) {
      var a = old.attributes[i];
      if (a.name === 'type' || a.name === 'data-consent') continue;
      s.setAttribute(a.name, a.value);
    }
    if (old.dataset.type) s.type = old.dataset.type;
    s.text = old.text;
    old.parentNode.replaceChild(s, old);
  }

  function activate() {
    if (activated) return;
    activated = true;
    document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(revive);
    document.querySelectorAll('[data-consent-embed]').forEach(function (box) {
      var tpl = box.querySelector('template');
      if (!tpl) return;
      var frag = tpl.content.cloneNode(true);
      box.innerHTML = '';
      box.appendChild(frag);
      box.removeAttribute('data-consent-pending');
      box.querySelectorAll('script').forEach(function (o) {
        var s = document.createElement('script');
        for (var i = 0; i < o.attributes.length; i++) s.setAttribute(o.attributes[i].name, o.attributes[i].value);
        s.text = o.text;
        o.parentNode.replaceChild(s, o);
      });
    });
    listeners.forEach(function (fn) { try { fn(); } catch (e) {} });
  }

  function hide() { if (banner) { banner.hidden = true; } }

  function decide(v) {
    var prev = read();
    write(v);
    hide();
    if (v === 'accepted') activate();
    // Withdrawing consent: reload so already-loaded third parties are gone.
    else if (prev === 'accepted' && activated) location.reload();
  }

  function build() {
    banner = document.createElement('div');
    banner.className = 'consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie choices');
    banner.hidden = true;
    banner.innerHTML =
      '<p class="consent__text">This site uses ' + services +
      ', which can set cookies. Nothing from them loads unless you accept.' +
      (privacy ? ' <a href="' + privacy + '">Privacy policy</a>' : '') + '</p>' +
      '<div class="consent__actions">' +
      '<button type="button" class="consent__btn" data-v="rejected">Reject</button>' +
      '<button type="button" class="consent__btn" data-v="accepted">Accept</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-v');
      if (v) decide(v);
    });
    document.body.appendChild(banner);
  }

  function open() {
    if (!banner) build();
    banner.hidden = false;
    var b = banner.querySelector('[data-v="accepted"]');
    if (b) b.focus({ preventScroll: true });
  }

  function hasGated() {
    return !!document.querySelector('script[type="text/plain"][data-consent], [data-consent-embed]');
  }

  function init() {
    document.querySelectorAll('[data-consent-embed]').forEach(function (b) { b.setAttribute('data-consent-pending', ''); });
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-consent-open], [data-consent-accept]');
      if (!t) return;
      e.preventDefault();
      if (t.hasAttribute('data-consent-accept')) decide('accepted');
      else open();
    });
    var v = read();
    if (v === 'accepted') activate();
    else if (!v && hasGated()) open();
  }

  window.siteConsent = {
    granted: function () { return read() === 'accepted'; },
    onAccept: function (fn) { if (activated) fn(); else listeners.push(fn); },
    open: open
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
