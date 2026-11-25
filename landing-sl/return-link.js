(function () {
  'use strict';

  document.addEventListener('click', function (event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest('a[data-return]');
    if (!link || !document.referrer || history.length < 2) return;
    try {
      var previous = new URL(document.referrer);
      if (previous.origin !== location.origin || previous.pathname === location.pathname) return;
      event.preventDefault();
      history.back();
    } catch (error) {
      // The link's href remains the fallback for a direct visit.
    }
  });
})();
