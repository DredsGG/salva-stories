// aplica o tema salvo antes de desenhar o popup (evita piscar no tema errado)
try {
  const t = localStorage.getItem('salvaStoriesTheme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (_) {}
