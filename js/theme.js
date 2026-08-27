const root = document.documentElement;

function stored() {
    try { return localStorage.getItem('theme'); } catch { return null; }
}

function apply(theme) {
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d0d0f' : '#ffffff');
}

// initial: saved choice, else the OS preference
const saved = stored();
apply(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

// follow the OS only while the user has made no explicit choice
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!stored()) apply(e.matches ? 'dark' : 'light');
});

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        apply(next);
        try { localStorage.setItem('theme', next); } catch { /* private mode */ }
    });
});
