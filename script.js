document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const data = new URLSearchParams(new FormData(form));

  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data.toString(),
    });

    if (res.ok) {
      btn.textContent = 'Sent! We will be in touch.';
      btn.style.background = 'var(--bg-card)';
      btn.style.color = 'var(--orange)';
      btn.style.border = '1px solid var(--orange)';
      btn.style.boxShadow = 'none';
      form.reset();
    } else {
      btn.textContent = 'Error — please email rafael.costa@kordex.org';
      btn.style.background = '#331111';
      btn.style.color = '#ff6666';
      btn.style.boxShadow = 'none';
    }
  } catch {
    btn.textContent = 'Error — please email rafael.costa@kordex.org';
    btn.style.background = '#331111';
    btn.style.color = '#ff6666';
    btn.style.boxShadow = 'none';
  }

  setTimeout(() => {
    btn.textContent = 'Request a Safety Sprint';
    btn.style.background = '';
    btn.style.color = '';
    btn.style.border = '';
    btn.style.boxShadow = '';
    btn.disabled = false;
  }, 5000);
});
