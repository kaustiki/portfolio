const d = window.portfolioData;

const $  = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- hero ---------------- */
function renderHero() {
    const { info, contact } = d;
    $('#hero-location').textContent = info.location || '';
    $('#hero-name').textContent     = info.name;
    $('#hero-title').textContent    = info.title;
    $('#hero-subtitle').textContent = info.subtitle;
    $('#hero-tagline').textContent  = info.tagline || '';

    const photo = $('#hero-photo');
    if (photo && info.photo) { photo.src = info.photo; photo.alt = info.name; }

    const actions = [
        { label: 'Résumé',       href: info.resume,       primary: true, download: true },
        { label: 'Dissertation', href: info.dissertation, download: true },
        { label: 'GitHub',       href: contact.github,    ext: true },
        { label: 'LinkedIn',     href: contact.linkedin,  ext: true },
        { label: 'Email',        href: `mailto:${contact.email}` }
    ];

    const wrap = $('#hero-actions');
    actions.forEach((a) => {
        if (!a.href) return;
        const link = el('a', `btn${a.primary ? ' btn--primary' : ''}`, esc(a.label));
        link.href = a.href;
        if (a.ext)      { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        if (a.download) { link.target = '_blank'; link.rel = 'noopener'; }
        wrap.appendChild(link);
    });
}

/* ---------------- about ---------------- */
function renderAbout() {
    $('#about-summary').textContent = d.info.summary;

    const stats = $('#stats-grid');
    (d.stats || []).forEach((s) => {
        stats.appendChild(el('div', 'stat', `
            <div class="stat__value">${esc(s.value)}</div>
            <div class="stat__label">${esc(s.label)}</div>
            ${s.note ? `<div class="stat__note">${esc(s.note)}</div>` : ''}
        `));
    });

    const ul = $('#about-highlights');
    (d.highlights || []).forEach((h) => ul.appendChild(el('li', null, esc(h))));
}

/* ---------------- skills ---------------- */
function renderSkills() {
    const grid = $('#skills-grid');
    Object.entries(d.skills).forEach(([group, items]) => {
        grid.appendChild(el('div', 'skill-group', `
            <h3 class="skill-group__title">${esc(group)}</h3>
            <div class="skill-group__list">
                ${items.map((i) => `<span class="tag">${esc(i)}</span>`).join('')}
            </div>
        `));
    });
}

/* ---------------- experience ---------------- */
function renderExperience() {
    const tl = $('#experience-timeline');
    d.experience.forEach((job) => {
        tl.appendChild(el('div', `tl-item${job.current ? ' tl-item--current' : ''}`, `
            <div class="tl-head">
                <h3 class="tl-role">${esc(job.role)}</h3>
                ${job.current ? '<span class="tl-badge">Current</span>' : ''}
            </div>
            <p class="tl-org">${esc(job.company)}${job.location ? ` · ${esc(job.location)}` : ''}</p>
            <p class="tl-dates">${esc(job.dates)}</p>
            <ul class="tl-details">
                ${job.details.map((x) => `<li>${esc(x)}</li>`).join('')}
            </ul>
        `));
    });
}

/* ---------------- education ---------------- */
function renderEducation() {
    const tl = $('#education-timeline');
    d.education.forEach((e) => {
        const meta = e.cgpa ? `CGPA ${esc(e.cgpa)}` : (e.marks ? `Marks ${esc(e.marks)}` : '');
        tl.appendChild(el('div', 'tl-item', `
            <div class="tl-head"><h3 class="tl-role">${esc(e.degree)}</h3></div>
            <p class="tl-org">${esc(e.institution)}</p>
            <p class="tl-dates">${esc(e.dates)}</p>
            ${meta ? `<p class="tl-meta">${meta}</p>` : ''}
            ${e.board ? `<p class="tl-meta" style="color:var(--faint)">${esc(e.board)}</p>` : ''}
        `));
    });

    const grid = $('#credentials-grid');
    (d.certifications || []).forEach((c) => {
        grid.appendChild(el('div', 'card', `
            <h4 class="card__title">${esc(c.title)}</h4>
            <p class="card__meta">${esc(c.issuer)}</p>
            <p class="card__dates">${esc(c.dates)}</p>
        `));
    });
    (d.internships || []).forEach((i) => {
        grid.appendChild(el('div', 'card', `
            <h4 class="card__title">${esc(i.title)}</h4>
            <p class="card__meta">${esc(i.company)}</p>
            <p class="card__dates">${esc(i.dates)}</p>
        `));
    });
}

/* ---------------- projects ---------------- */
function projectCard(p) {
    const card = el('article', `project${p.featured ? ' project--featured' : ''}`);
    card.dataset.category = p.category || '';

    // Compact by default: the card shows identity + one-line pitch + stack.
    // Everything long (highlights, technical detail) lives behind the toggle.
    const hasMore = (p.highlights && p.highlights.length) || (p.detail && p.detail.length);
    const moreId  = `more-${p.id}`;
    const MAX_TAGS = 5;
    const tags = p.tech || [];
    const shown = tags.slice(0, MAX_TAGS);
    const rest  = tags.length - shown.length;

    const main = el('div', 'project__main', `
        <div class="project__top">
            ${p.category ? `<span class="project__cat">${esc(p.category)}</span>` : ''}
            ${p.featured ? '<span class="project__star">★</span>' : ''}
        </div>
        <h3 class="project__title">${esc(p.title)}</h3>
        <p class="project__meta">${esc([p.subtitle, p.dates].filter(Boolean).join(' · '))}</p>
        <p class="project__desc">${esc(p.description)}</p>
        <div class="project__tech">
            ${shown.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
            ${rest > 0 ? `<span class="tag tag--more">+${rest}</span>` : ''}
        </div>
    `);

    const actions = el('div', 'project__actions');
    main.appendChild(actions);
    card.appendChild(main);

    if (hasMore) {
        const btn = el('button', 'project__toggle',
            `<span class="project__toggle-icon">▸</span> Details`);
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', moreId);
        actions.appendChild(btn);

        const more = el('div', 'project__detail', `
            ${p.org ? `<p class="detail-org">${esc(p.org)}</p>` : ''}
            ${p.highlights ? `<ul class="project__highlights">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
            ${(p.detail || []).map((b) => `
                <div class="detail-block">
                    <h4 class="detail-block__head">${esc(b.heading)}</h4>
                    <p class="detail-block__body">${esc(b.body)}</p>
                </div>`).join('')}
            ${rest > 0 ? `<div class="project__tech project__tech--all">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
        `);
        more.id = moreId;

        btn.addEventListener('click', () => {
            const open = more.classList.toggle('is-open');
            btn.setAttribute('aria-expanded', String(open));
            btn.innerHTML = `<span class="project__toggle-icon">▸</span> ${open ? 'Less' : 'Details'}`;
        });

        card.appendChild(more);
    }

    (p.links || []).forEach((l) => {
        const a = el('a', 'project__toggle project__toggle--link', esc(l.label));
        a.href = l.href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        actions.appendChild(a);
    });

    return card;
}

function renderProjects() {
    const grid    = $('#projects-grid');
    const filters = $('#projects-filters');

    // Fixed category list from the data file — NOT one chip per tech tag.
    const used = new Set(d.projects.map((p) => p.category).filter(Boolean));
    const cats = (d.categories || ['All']).filter((c) => c === 'All' || used.has(c));

    const draw = (cat) => {
        grid.innerHTML = '';
        d.projects
            .filter((p) => cat === 'All' || p.category === cat)
            .forEach((p) => grid.appendChild(projectCard(p)));
        observeReveals(grid);
    };

    cats.forEach((cat, i) => {
        const b = el('button', `filter${i === 0 ? ' is-active' : ''}`, esc(cat));
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(i === 0));
        b.addEventListener('click', () => {
            filters.querySelectorAll('.filter').forEach((x) => {
                x.classList.remove('is-active');
                x.setAttribute('aria-selected', 'false');
            });
            b.classList.add('is-active');
            b.setAttribute('aria-selected', 'true');
            draw(cat);
        });
        filters.appendChild(b);
    });

    draw('All');
}

/* ---------------- fine arts ---------------- */
function renderFineArts() {
    const grid = $('#finearts-grid');
    Object.entries(d.finearts).forEach(([k, items]) => {
        grid.appendChild(el('div', 'card', `
            <h4 class="card__title">${esc(k)}</h4>
            <div class="card__list">${items.map((i) => `<span class="tag">${esc(i)}</span>`).join('')}</div>
        `));
    });
}

/* ---------------- contact ---------------- */
function renderContact() {
    const c = d.contact;
    const rows = [
        ['Email',    `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`],
        ['Phone',    `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a>`],
        ['GitHub',   `<a href="${esc(c.github)}" target="_blank" rel="noopener noreferrer">${esc(c.githubLabel)}</a>`],
        ['LinkedIn', `<a href="${esc(c.linkedin)}" target="_blank" rel="noopener noreferrer">${esc(c.linkedinLabel)}</a>`]
    ];

    $('#contact-content').innerHTML = `
        <p class="contact__lead">Open to conversations about AI/ML and agentic engineering work. The fastest way to reach me is email.</p>
        <ul class="contact__list">
            ${rows.map(([k, v]) => `
                <li class="contact__row">
                    <span class="contact__key">${k}</span>
                    <span class="contact__val">${v}</span>
                </li>`).join('')}
        </ul>`;
}

/* ---------------- nav ---------------- */
function initNav() {
    const nav      = $('#nav');
    const menu     = $('#nav-menu');
    const toggle   = $('#nav-toggle');
    const backdrop = $('#nav-backdrop');

    const setMenu = (open) => {
        menu.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        backdrop.hidden = !open;
        document.body.classList.toggle('is-locked', open);
    };

    toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    backdrop.addEventListener('click', () => setMenu(false));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    // close the drawer if we cross into desktop layout
    const mq = window.matchMedia('(min-width: 900px)');
    mq.addEventListener('change', (e) => { if (e.matches) setMenu(false); });

    addEventListener('scroll', () => {
        nav.classList.toggle('is-scrolled', window.scrollY > 8);
    }, { passive: true });

    // active-section highlighting
    const links = [...menu.querySelectorAll('a')];
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = `#${entry.target.id}`;
            links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    links.forEach((l) => {
        const sec = document.querySelector(l.getAttribute('href'));
        if (sec) spy.observe(sec);
    });
}

/* ---------------- reveal ---------------- */
let revealObserver;
function observeReveals(root = document) {
    if (!revealObserver) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    revealObserver.unobserve(e.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    }
    root.querySelectorAll('.project, .stat, .skill-group, .tl-item, .card')
        .forEach((n) => {
            if (n.classList.contains('is-visible')) return;
            n.classList.add('reveal');
            revealObserver.observe(n);
        });
}

/* ---------------- boot ---------------- */
function init() {
    if (!d) return;
    renderHero();
    renderAbout();
    renderSkills();
    renderExperience();
    renderProjects();
    renderEducation();
    renderFineArts();
    renderContact();
    initNav();
    observeReveals();
    $('#year').textContent = new Date().getFullYear();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
