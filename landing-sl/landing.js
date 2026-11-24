(function () {
  'use strict';

  var form = document.getElementById('lead-form');
  var status = document.getElementById('form-status');
  var endpoints = ['/api/contact', '/.netlify/functions/contact'];

  async function submitLead(payload) {
    var lastError = new Error('No contact endpoint available');
    for (var endpoint of endpoints) {
      try {
        var response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'same-origin'
        });
        if (response.status === 404) continue;
        var result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || 'Contact request failed');
        return result;
      } catch (error) {
        lastError = error;
        if (endpoint === endpoints[endpoints.length - 1]) throw lastError;
      }
    }
    throw lastError;
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
