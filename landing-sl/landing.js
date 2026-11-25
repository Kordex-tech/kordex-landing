(function () {
  'use strict';

  var form = document.getElementById('lead-form');
  var status = document.getElementById('form-status');
  async function submitLead(payload) {
    var response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });
    var result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Contact request failed');
    return result;
  }

  if (form && status) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var button = form.querySelector('button[type=submit]');
      button.disabled = true;
      status.textContent = 'Pošiljanje …';
      status.classList.remove('error');
      try {
        var payload = Object.fromEntries(new FormData(form).entries());
        payload.page_url = window.location.href;
        payload.referrer = document.referrer || '';
        await submitLead(payload);
        form.reset();
        status.textContent = 'Poslano. Kmalu vas kontaktiramo.';
      } catch (error) {
        status.textContent = 'Pošiljanje ni uspelo. Pišite na enquiries@kordex.org.';
        status.classList.add('error');
      } finally {
        button.disabled = false;
      }
    });
  }

})();
