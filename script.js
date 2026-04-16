document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));

  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      btn.textContent = 'Sent! We will be in touch.';
      btn.style.background = '#1a1a1a';
      btn.style.color = '#00d4aa';
      btn.style.border = '1px solid #00d4aa';
      form.reset();
    } else {
      btn.textContent = 'Error — please email contact@kordex.org';
      btn.style.background = '#331111';
      btn.style.color = '#ff6666';
    }
  } catch {
    btn.textContent = 'Error — please email contact@kordex.org';
    btn.style.background = '#331111';
    btn.style.color = '#ff6666';
  }

  setTimeout(() => {
    btn.textContent = 'Request a Safety Sprint';
    btn.style.background = '';
    btn.style.color = '';
    btn.style.border = '';
    btn.disabled = false;
  }, 5000);
});
