/* Neural-network background. Canvas-based, DPR-aware, and deliberately cheap:
   it pauses when the tab is hidden and drops to a static single frame for
   users who prefer reduced motion or are on a small screen. */

const canvas = document.getElementById('neural-bg');
if (canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, nodes = [], raf = null, running = true;

    const density = () => {
        const area = window.innerWidth * window.innerHeight;
        // fewer nodes on phones — this runs behind everything, it should cost nothing
        return Math.round(Math.min(58, Math.max(18, area / 26000)));
    };

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width  = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        seed();
    }

    function seed() {
        const n = density();
        nodes = Array.from({ length: n }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            r: Math.random() * 1.4 + 0.9
        }));
    }

    function colors() {
        const dark = document.documentElement.dataset.theme === 'dark';
        return dark
            ? { dot: 'rgba(200,200,215,0.55)', line: 'rgba(160,160,185,' }
            : { dot: 'rgba(90,90,110,0.42)',   line: 'rgba(110,110,135,' };
    }

    function draw() {
        const { dot, line } = colors();
        ctx.clearRect(0, 0, w, h);
        const linkDist = w < 600 ? 110 : 150;

        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);
                if (dist < linkDist) {
                    ctx.strokeStyle = line + (0.16 * (1 - dist / linkDist)).toFixed(3) + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
            ctx.fillStyle = dot;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function step() {
        nodes.forEach((n) => {
            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > w) n.vx *= -1;
            if (n.y < 0 || n.y > h) n.vy *= -1;
        });
        draw();
        raf = requestAnimationFrame(step);
    }

    function start() {
        if (reduced) { draw(); return; }
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
    }

    function stop() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resize(); if (running && !reduced) start(); else draw(); }, 180);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) start(); else stop();
    });

    // repaint on theme change so line colours track the palette
    new MutationObserver(() => draw())
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    resize();
    start();
}
