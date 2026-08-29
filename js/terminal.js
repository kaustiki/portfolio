/* Terminal — a small pandas-flavoured shell over the portfolio data.

   One object, `df`, and a flat set of commands on it: df.info(), df.projects,
   df.experience. `df.` is optional, and trailing () are forgiven, so info(),
   df.info and df.info() all work.

   Output alignment lives in CSS (.term-row / .term-entry / .term-group) rather
   than in padded strings — a space-padded table breaks apart on a phone, a
   flex row wraps its value in its own column and stays lined up.

   The caret is the browser's own (caret-color in CSS). */

const Terminal = {
    history: [],
    historyIndex: -1,
    maxHistory: 50,

    init() {
        this.outputEl = document.getElementById('terminal-output');
        this.inputEl  = document.getElementById('terminal-input');
        this.bodyEl   = document.getElementById('terminal-body');
        this.chipsEl  = document.getElementById('terminal-chips');
        this.data     = window.portfolioData;
        if (!this.outputEl || !this.inputEl || !this.data) return;

        this.buildSpec();
        this.bindEvents();
        this.renderChips();
        this.showWelcome();
    },

    /* One table drives the commands, the help listing and tab completion. */
    buildSpec() {
        this.spec = [
            ['info()',         'profile summary',            () => this.cmdInfo()],
            ['about()',        'the short version',          () => this.cmdAbout()],
            ['projects',       'what I have built',          () => this.cmdProjects()],
            ['experience',     'work history',               () => this.cmdExperience()],
            ['skills',         'technical skills',           () => this.cmdSkills()],
            ['education',      'degrees and marks',          () => this.cmdEducation()],
            ['certifications', 'certifications & internships', () => this.cmdCerts()],
            ['stats',          'a few numbers',              () => this.cmdStats()],
            ['finearts',       'life outside code',          () => this.cmdFineArts()],
            ['contact',        'how to reach me',            () => this.cmdContact()],
            ['resume()',       'open the résumé PDF',        () => this.cmdResume()],
            ['dissertation()', 'open the dissertation PDF',  () => this.cmdDissertation()],
            ['theme()',        'toggle light / dark',        () => this.cmdTheme()]
        ];

        this.commands = {};
        this.spec.forEach(([label, , fn]) => { this.commands[label.replace('()', '')] = fn; });

        // available without the df. prefix
        this.commands.help    = () => this.cmdHelp();
        this.commands.clear   = () => this.cmdClear();
        this.commands.history = () => this.cmdHistory();
    },

    bindEvents() {
        this.inputEl.addEventListener('keydown', (e) => this.handleKeydown(e));

        // tapping anywhere in the body focuses the input (but keep text selectable)
        this.bodyEl.addEventListener('click', () => {
            if (!window.getSelection().toString()) this.inputEl.focus();
        });
    },

    renderChips() {
        if (!this.chipsEl) return;
        ['help()', 'df.info()', 'df.projects', 'df.experience', 'df.skills',
         'df.education', 'df.contact', 'df.resume()', 'df.theme()', 'clear()']
            .forEach((cmd) => {
                const b = document.createElement('button');
                b.className = 'term-chip';
                b.type = 'button';
                b.textContent = cmd;
                b.addEventListener('click', () => {
                    this.inputEl.value = cmd;
                    this.submit();
                });
                this.chipsEl.appendChild(b);
            });
    },

    handleKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.submit();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.inputEl.value = this.history[this.historyIndex];
                this.moveCaretToEnd();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.inputEl.value = this.history[this.historyIndex];
            } else {
                this.historyIndex = this.history.length;
                this.inputEl.value = '';
            }
            this.moveCaretToEnd();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.complete();
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            this.cmdClear();
        }
    },

    moveCaretToEnd() {
        const v = this.inputEl.value;
        requestAnimationFrame(() => this.inputEl.setSelectionRange(v.length, v.length));
    },

    complete() {
        const val = this.inputEl.value.trim().toLowerCase();
        if (!val) return;

        const pool = this.spec.map(([label]) => `df.${label}`).concat(['help()', 'clear()']);
        const hits = pool.filter((n) => n.toLowerCase().startsWith(val) ||
                                        n.replace('df.', '').toLowerCase().startsWith(val));
        if (hits.length === 1) {
            this.inputEl.value = hits[0];
            this.moveCaretToEnd();
        } else if (hits.length > 1) {
            this.echo(this.inputEl.value.trim());
            this.line(hits.join('  '), 'term-muted');
            this.blank();
            this.scrollToBottom();
        }
    },

    submit() {
        const raw = this.inputEl.value.trim();
        this.inputEl.value = '';
        if (!raw) return;

        this.history.push(raw);
        if (this.history.length > this.maxHistory) this.history.shift();
        this.historyIndex = this.history.length;

        this.echo(raw);
        this.execute(raw);
        this.blank();
        this.scrollToBottom();
    },

    execute(raw) {
        // df. is optional and trailing () are forgiven
        const name = raw.trim()
            .replace(/^df\s*\.\s*/i, '')
            .replace(/\(\s*\)$/, '')
            .trim();

        if (!name) return;
        if (/^df$/i.test(name)) {
            return this.line(`<portfolio.Profile: ${this.data.info.name}>`, 'term-cmd');
        }

        const fn = this.commands[name.toLowerCase()];
        if (fn) return fn();

        this.line(`NameError: name '${this.esc(name)}' is not defined`, 'term-err', true);
        this.hint('type', 'help()', 'to see what is available');
    },

    /* ---------- output primitives ---------- */
    el(tag, cls, html) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html !== undefined) n.innerHTML = html;
        return n;
    },

    line(text, cls = null, isHtml = false) {
        const n = this.el('div', `term-line${cls ? ` ${cls}` : ''}`);
        if (isHtml) n.innerHTML = text;
        else n.textContent = text;
        this.outputEl.appendChild(n);
    },

    html(markup, cls = null) { this.line(markup, cls, true); },

    blank() { this.line(''); },

    count(n, one = 'entry', many = 'entries') {
        return `${n} ${n === 1 ? one : many}`;
    },

    heading(text, count) {
        const meta = count === undefined ? ''
            : `<span class="term-muted"> · ${this.esc(count)}</span>`;
        this.html(`<span class="term-head">${this.esc(text)}</span>${meta}`);
        this.blank();
    },

    /* key on the left, value in its own wrapping column */
    row(key, value, mod = '') {
        const n = this.el('div', `term-line term-row${mod}`);
        n.appendChild(this.el('div', 'term-row__k term-key', this.esc(key)));
        n.appendChild(this.el('div', 'term-row__v', value));
        this.outputEl.appendChild(n);
    },

    /* a titled entry — the ▸ hangs in the gutter, wrapped lines stay aligned */
    entry(title, subs, badge = '') {
        const n = this.el('div', 'term-line term-entry');
        n.appendChild(this.el('div', 'term-entry__t',
            `<span class="term-muted">▸ </span><span class="term-head">${this.esc(title)}</span>${badge}`));
        subs.filter(Boolean).forEach((s) => n.appendChild(this.el('div', 'term-entry__s', s)));
        this.outputEl.appendChild(n);
    },

    group(name, items) {
        const n = this.el('div', 'term-line term-group');
        n.appendChild(this.el('div', 'term-group__k', `<span class="term-key">${this.esc(name)}</span>`));
        n.appendChild(this.el('div', 'term-group__v term-muted', this.esc(items.join(' · '))));
        this.outputEl.appendChild(n);
    },

    hint(before, code, after) {
        this.html(
            `<span class="term-muted">${this.esc(before)} </span>` +
            `<span class="term-cmd">${this.esc(code)}</span>` +
            `<span class="term-muted"> ${this.esc(after)}</span>`
        );
    },

    echo(cmd) {
        this.html(`<span class="term-sep">&gt;&gt;&gt;</span> <span class="term-cmd">${this.esc(cmd)}</span>`);
    },

    esc(s) {
        return String(s).replace(/[&<>"']/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    link(href, label, external = true) {
        const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a class="term-link" href="${this.esc(href)}"${rel}>${this.esc(label)}</a>`;
    },

    scrollToBottom() {
        requestAnimationFrame(() => { this.bodyEl.scrollTop = this.bodyEl.scrollHeight; });
    },

    /* ---------- commands ---------- */
    showWelcome() {
        const { info } = this.data;
        this.line('Python 3.12 · pandas 2.2', 'term-muted');
        this.blank();
        this.echo('import portfolio as df');
        this.blank();
        this.html(`<span class="term-head">${this.esc(info.name)}</span>`);
        this.html(`<span class="term-muted">${this.esc(info.title)} · ${this.esc(info.subtitle)}</span>`);
        this.blank();
        this.hint('type', 'help()', 'to list commands, or tap one below');
        this.blank();
    },

    cmdHelp() {
        this.heading('Commands');
        this.spec.forEach(([label, desc]) => {
            this.row(`df.${label}`, `<span class="term-muted">${this.esc(desc)}</span>`, ' term-row--help');
        });
        this.row('help()', '<span class="term-muted">this list</span>', ' term-row--help');
        this.row('clear()', '<span class="term-muted">clear the screen</span>', ' term-row--help');
        this.blank();
        this.line('df. is optional · Tab completes · ↑ ↓ history · Ctrl+L clears', 'term-muted');
    },

    cmdInfo() {
        const { info, contact } = this.data;
        this.line("<class 'portfolio.Profile'>", 'term-muted');
        this.blank();
        this.row('name',     `<span class="term-head">${this.esc(info.name)}</span>`);
        this.row('role',     this.esc(info.title));
        this.row('focus',    this.esc(info.subtitle));
        this.row('location', this.esc(info.location));
        this.row('email',    this.link(`mailto:${contact.email}`, contact.email, false));
        this.blank();
        this.row('projects',   `<span class="term-muted">${this.data.projects.length} entries</span>`);
        this.row('experience', `<span class="term-muted">${this.data.experience.length} entries</span>`);
        this.row('education',  `<span class="term-muted">${this.data.education.length} entries</span>`);
        this.row('skills',     `<span class="term-muted">${Object.keys(this.data.skills).length} groups</span>`);
        if (info.tagline) {
            this.blank();
            this.line(info.tagline, 'term-muted');
        }
    },

    cmdAbout() {
        this.heading('About');
        this.html(this.esc(this.data.info.summary), 'term-indent');
        this.blank();
        this.html(`<span class="term-muted">${this.esc(this.data.highlights.join(' · '))}</span>`, 'term-indent');
    },

    cmdProjects() {
        const list = this.data.projects;
        this.heading('Projects', this.count(list.length));
        list.forEach((p) => {
            this.entry(p.title, [
                `<span class="term-muted">${this.esc([p.subtitle, p.dates].filter(Boolean).join(' · '))}</span>`,
                (p.tech || []).length
                    ? `<span class="term-key">${this.esc(p.tech.slice(0, 5).join(' · '))}</span>`
                    : ''
            ], p.featured ? ' <span class="term-cmd">★</span>' : '');
        });
        this.line('Full detail in the Projects section below.', 'term-muted');
    },

    cmdExperience() {
        const list = this.data.experience;
        this.heading('Experience', this.count(list.length));
        list.forEach((job) => {
            this.entry(job.role, [
                `<span class="term-key">${this.esc(job.company)}</span>` +
                `<span class="term-muted"> · ${this.esc(job.dates)}</span>`,
                ...job.details.slice(0, 2).map((d) => `<span class="term-muted">${this.esc(d)}</span>`)
            ], job.current ? ' <span class="term-cmd">[current]</span>' : '');
        });
    },

    cmdSkills() {
        const groups = Object.entries(this.data.skills);
        this.heading('Skills', this.count(groups.length, 'group', 'groups'));
        groups.forEach(([name, items]) => this.group(name, items));
    },

    cmdEducation() {
        const list = this.data.education;
        this.heading('Education', this.count(list.length));
        list.forEach((e) => {
            const marks = e.cgpa ? `CGPA ${e.cgpa}` : (e.marks ? `Marks ${e.marks}` : '');
            this.entry(e.degree, [
                `<span class="term-key">${this.esc(e.institution)}</span>` +
                `<span class="term-muted"> · ${this.esc(e.dates)}${marks ? ` · ${this.esc(marks)}` : ''}</span>`
            ]);
        });
    },

    cmdCerts() {
        const certs = this.data.certifications || [];
        const interns = this.data.internships || [];

        this.heading('Certifications', this.count(certs.length));
        certs.forEach((c) => this.entry(c.title, [
            `<span class="term-muted">${this.esc(c.issuer)} · ${this.esc(c.dates)}</span>`
        ]));

        this.blank();
        this.heading('Internships', this.count(interns.length));
        interns.forEach((i) => this.entry(i.title, [
            `<span class="term-muted">${this.esc(i.company)} · ${this.esc(i.dates)}</span>`
        ]));
    },

    cmdStats() {
        this.heading('Stats');
        (this.data.stats || []).forEach((s) => {
            this.row(s.value,
                this.esc(s.label) +
                (s.note ? `<div class="term-muted">${this.esc(s.note)}</div>` : ''),
                ' term-row--stat');
        });
    },

    cmdFineArts() {
        this.heading('Beyond code');
        Object.entries(this.data.finearts).forEach(([name, items]) => this.group(name, items));
    },

    cmdContact() {
        const c = this.data.contact;
        this.heading('Contact');
        this.row('email',    this.link(`mailto:${c.email}`, c.email, false));
        this.row('phone',    this.esc(c.phone));
        this.row('github',   this.link(c.github, c.githubLabel));
        this.row('linkedin', this.link(c.linkedin, c.linkedinLabel));
    },

    cmdResume() {
        const href = this.data.info.resume;
        this.line('Opening résumé…', 'term-muted');
        this.html(this.link(href, href), 'term-indent');
        window.open(href, '_blank', 'noopener');
    },

    cmdDissertation() {
        const href = this.data.info.dissertation;
        this.heading('Deep Learning Approach for Video Violence Detection');
        this.html(`<span class="term-muted">M.Tech dissertation · BITS Pilani · Feb 2026</span>`, 'term-indent');
        this.html(`<span class="term-muted">97.7% on the RLVS benchmark (prior SOTA: 91.03%).</span>`, 'term-indent');
        this.html(this.link(href, 'open the PDF'), 'term-indent');
        window.open(href, '_blank', 'noopener');
    },

    cmdTheme() {
        const root = document.documentElement;
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch { /* private mode */ }
        this.line(`theme → ${next}`, 'term-muted');
    },

    cmdHistory() {
        if (!this.history.length) return this.line('[]', 'term-muted');
        this.history.forEach((h, i) => {
            this.row(String(i + 1), this.esc(h), ' term-row--stat');
        });
    },

    cmdClear() {
        this.outputEl.innerHTML = '';
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Terminal.init());
} else {
    Terminal.init();
}
