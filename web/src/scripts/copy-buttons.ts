document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    const status = button.querySelector<HTMLElement>('.home-copy-status');
    const original = button.getAttribute('aria-label') || 'Copy';
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(button.dataset.copy || '');
      button.dataset.copyState = 'copied';
      button.setAttribute('aria-label', 'Copied');
      button.title = 'Copied';
      if (status) status.textContent = 'Copied to clipboard';
    } catch {
      button.dataset.copyState = 'error';
      button.setAttribute('aria-label', `${original}: try again`);
      button.title = 'Could not copy. Try again.';
      if (status) status.textContent = 'Could not copy. Try again.';
    }
    setTimeout(() => {
      delete button.dataset.copyState;
      button.setAttribute('aria-label', original);
      button.title = original;
      if (status) status.textContent = '';
      button.disabled = button.dataset.copyInvalid === 'true';
    }, 1400);
  });
});
