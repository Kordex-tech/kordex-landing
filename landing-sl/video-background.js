(function () {
  'use strict';

  var video = document.querySelector('.page-video');
  if (!video || !window.matchMedia) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function syncVideo() {
    if (reducedMotion.matches || (navigator.connection && navigator.connection.saveData)) {
      video.pause();
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
      return;
    }
    if (!video.hasAttribute('src')) video.src = video.dataset.src;
    var playback = video.play();
    if (playback && playback.catch) playback.catch(function () {});
  }

  syncVideo();
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncVideo);
})();
