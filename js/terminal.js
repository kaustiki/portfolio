/* Terminal — the caret is the browser's own (caret-color in CSS).
   The old build hid it with `caret-color: transparent` and drew a fake block
   after a `flex:1` input, so it always sat at the far right of the line. */

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

        this.registerCommands();
        this.bindEvents();
        this.renderChips();
        this.showWelcome();
    },

    registerCommands() {
        this.commands = {
            'help':                () => this.cmdHelp(),
            'whoami':              () => this.cmdWhoami(),
            'about':               () => this.cmdAbout(),
            'skills':              () => this.cmdSkills(),
            'experience':          () => this.cmdExperience(),
            'projects':            () => this.cmdProjects(),
            'education':           () => this.cmdEducation(),
            'certifications':      () => this.cmdCerts(),
            'finearts':            () => this.cmdFineArts(),
            'contact':             () => this.cmdContact(),
            'resume':              () => this.cmdResume(),
            'dissertation':        () => this.cmdDissertation(),
            'stats':               () => this.cmdStats(),
            'theme':               () => this.cmdTheme(),
            'history':             () => this.cmdHistory(),
            'clear':               () => this.cmdClear(),
            'ls':                  () => this.cmdLs(),
            'pwd':                 () => this.print('/home/akurati/portfolio'),
            'date':                () => this.print(new Date().toString()),
            'echo':                (a) => this.print(a.join(' ') || ''),
            'sudo':                () => this.print('Nice try. Permission denied.', 'term-err'),
            'exit':                () => this.print("There's no exit — just scroll.", 'term-muted')
        };

        // aliases so old muscle memory still works
        this.aliases = {
            'help()': 'help', '?': 'help', 'man': 'help',
            'df.info': 'whoami', 'info': 'whoami', 'who': 'whoami',
            'skills.head()': 'skills', 'experience.head()': 'experience',
            'projects.head()': 'projects', 'education.head()': 'education',
            'contact.head()': 'contact', 'finearts.head()': 'finearts',
            'theme.toggle()': 'theme', 'cls': 'clear',
            'cv': 'resume', 'thesis': 'dissertation', 'work': 'experience'
        };
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
        ['help', 'whoami', 'projects', 'skills', 'experience', 'resume', 'contact', 'theme', 'clear']
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
        const names = Object.keys(this.commands);
        const hits = names.filter((n) => n.startsWith(val));
        if (hits.length === 1) {
            this.inputEl.value = hits[0];
            this.moveCaretToEnd();
        } else if (hits.length > 1) {
            this.echoCommand(val);
            this.print(hits.join('  '), 'term-muted');
        }
    },

    submit() {
        const raw = this.inputEl.value.trim();
        this.inputEl.value = '';
        if (!raw) return;

        this.history.push(raw);
        if (this.history.length > this.maxHistory) this.history.shift();
        this.historyIndex = this.history.length;

        this.echoCommand(raw);
        this.execute(raw);
        this.scrollToBottom();
    },

    execute(raw) {
        const parts = raw.split(/\s+/);
        let name = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (this.aliases[name]) name = this.aliases[name];
        name = name.replace(/\(\)$/, '').replace(/\.head$/, '');

        const fn = this.commands[name];
        if (fn) {
            fn(args);
        } else {
            this.print(`command not found: ${raw}`, 'term-err');
            this.print("type 'help' to see what's available", 'term-muted');
        }
        this.print('');
    },

    /* ---------- output helpers ---------- */
    echoCommand(cmd) {
        this.print(`<span class="term-sep">&gt;&gt;&gt;</span> <span class="term-cmd">${this.esc(cmd)}</span>`, null, true);
    },

    print(text = '', cls = null, isHtml = false) {
        const line = document.createElement('div');
        line.className = `term-line${cls ? ' ' + cls : ''}`;
        if (isHtml) line.innerHTML = text;
        else line.textContent = text;
        this.outputEl.appendChild(line);
    },

    printHtml(html, cls = null) { this.print(html, cls, true); },

    heading(text) { this.printHtml(`<span class="term-head">${this.esc(text)}</span>`); },

    kv(key, value) {
        this.printHtml(`<span class="term-key">${this.esc(key)}</span><span class="term-muted"> · </span>${this.esc(value)}`);
    },

    esc(s) {
        return String(s).replace(/[&<>"']/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    scrollToBottom() {
        requestAnimationFrame(() => { this.bodyEl.scrollTop = this.bodyEl.scrollHeight; });
    },

    /* ---------- commands ---------- */
    showWelcome() {
        const { info } = this.data;
        this.printHtml(`<span class="term-muted">Python 3.12 · portfolio shell</span>`);
        this.printHtml(`<span class="term-cmd">&gt;&gt;&gt; import akurati as ak</span>`);
        this.print('');
        this.heading(info.name);
        this.printHtml(`<span class="term-muted">${this.esc(info.title)} — ${this.esc(info.subtitle)}</span>`);
        this.print('');
        this.printHtml(`<span class="term-muted">Type</span> <span class="term-cmd">help</span> <span class="term-muted">to begin, or tap a command below.</span>`);
        this.print('');
    },

    cmdHelp() {
        this.heading('Available commands');
        const rows = [
            ['whoami',         'name, role, current focus'],
            ['about',          'the short version'],
            ['skills',         'technical skills by area'],
            ['experience',     'work history'],
            ['projects',       'what I have built'],
            ['education',      'degrees and marks'],
            ['certifications', 'certifications and internships'],
            ['stats',          'a few numbers'],
            ['resume',         'open the résumé PDF'],
            ['dissertation',   'open the M.Tech dissertation'],
            ['finearts',       'life outside code'],
            ['contact',        'how to reach me'],
            ['theme',          'toggle light / dark'],
            ['clear',          'clear the screen']
        ];
        rows.forEach(([c, desc]) => {
            this.printHtml(`  <span class="term-cmd">${c.padEnd(16)}</span><span class="term-muted">${this.esc(desc)}</span>`);
        });
        this.print('');
        this.printHtml(`<span class="term-muted">Tab completes · ↑ ↓ recall history · Ctrl+L clears</span>`);
    },

    cmdWhoami() {
        const { info, contact } = this.data;
        this.heading(info.name);
        this.kv('role',     info.title);
        this.kv('focus',    info.subtitle);
        this.kv('location', info.location);
        this.kv('email',    contact.email);
        this.print('');
        this.print(info.tagline, 'term-muted');
    },

    cmdAbout() {
        this.heading('About');
        this.print(this.data.info.summary);
        this.print('');
        this.printHtml(`<span class="term-muted">${this.data.highlights.join(' · ')}</span>`);
    },

    cmdStats() {
        this.heading('Numbers');
        (this.data.stats || []).forEach((s) => {
            this.printHtml(`  <span class="term-head">${this.esc(s.value)}</span>  ${this.esc(s.label)}`);
            if (s.note) this.printHtml(`         <span class="term-muted">${this.esc(s.note)}</span>`);
        });
    },

    cmdSkills() {
        this.heading('Technical skills');
        Object.entries(this.data.skills).forEach(([group, items]) => {
            this.printHtml(`  <span class="term-key">${this.esc(group)}</span>`);
            this.printHtml(`    <span class="term-muted">${this.esc(items.join(', '))}</span>`);
        });
    },

    cmdExperience() {
        this.heading('Experience');
        this.data.experience.forEach((job) => {
            this.printHtml(`  <span class="term-head">${this.esc(job.role)}</span>${job.current ? ' <span class="term-cmd">[current]</span>' : ''}`);
            this.printHtml(`  <span class="term-key">${this.esc(job.company)}</span> <span class="term-muted">· ${this.esc(job.dates)}</span>`);
            job.details.slice(0, 3).forEach((x) => this.printHtml(`    <span class="term-muted">▸ ${this.esc(x)}</span>`));
            this.print('');
        });
    },

    cmdProjects() {
        this.heading('Projects');
        this.data.projects.forEach((p) => {
            this.printHtml(`  <span class="term-head">${this.esc(p.title)}</span>${p.featured ? ' <span class="term-cmd">★</span>' : ''}`);
            this.printHtml(`  <span class="term-muted">${this.esc(p.subtitle || '')} · ${this.esc(p.dates)}</span>`);
            if (p.highlights) {
                this.printHtml(`    <span class="term-muted">▸ ${this.esc(p.highlights[0])}</span>`);
            }
            this.printHtml(`    <span class="term-key">${this.esc((p.tech || []).slice(0, 6).join(' · '))}</span>`);
            this.print('');
        });
        this.printHtml(`<span class="term-muted">Full detail in the Projects section below.</span>`);
    },

    cmdEducation() {
        this.heading('Education');
        this.data.education.forEach((e) => {
            this.printHtml(`  <span class="term-head">${this.esc(e.degree)}</span>`);
            this.printHtml(`  <span class="term-key">${this.esc(e.institution)}</span> <span class="term-muted">· ${this.esc(e.dates)}</span>`);
            const meta = e.cgpa ? `CGPA ${e.cgpa}` : (e.marks ? `Marks ${e.marks}` : '');
            if (meta) this.printHtml(`    <span class="term-muted">${this.esc(meta)}</span>`);
            this.print('');
        });
    },

    cmdCerts() {
        this.heading('Certifications');
        this.data.certifications.forEach((c) => {
            this.printHtml(`  <span class="term-head">${this.esc(c.title)}</span>`);
            this.printHtml(`  <span class="term-muted">${this.esc(c.issuer)} · ${this.esc(c.dates)}</span>`);
        });
        this.print('');
        this.heading('Internships');
        this.data.internships.forEach((i) => {
            this.printHtml(`  <span class="term-head">${this.esc(i.title)}</span>`);
            this.printHtml(`  <span class="term-muted">${this.esc(i.company)} · ${this.esc(i.dates)}</span>`);
        });
    },

    cmdFineArts() {
        this.heading('Beyond code');
        Object.entries(this.data.finearts).forEach(([k, items]) => {
            this.printHtml(`  <span class="term-key">${this.esc(k)}</span> <span class="term-muted">· ${this.esc(items.join(', '))}</span>`);
        });
    },

    cmdContact() {
        const c = this.data.contact;
        this.heading('Contact');
        this.printHtml(`  <span class="term-key">email   </span> <a class="term-link" href="mailto:${this.esc(c.email)}">${this.esc(c.email)}</a>`);
        this.printHtml(`  <span class="term-key">phone   </span> ${this.esc(c.phone)}`);
        this.printHtml(`  <span class="term-key">github  </span> <a class="term-link" href="${this.esc(c.github)}" target="_blank" rel="noopener noreferrer">${this.esc(c.githubLabel)}</a>`);
        this.printHtml(`  <span class="term-key">linkedin</span> <a class="term-link" href="${this.esc(c.linkedin)}" target="_blank" rel="noopener noreferrer">${this.esc(c.linkedinLabel)}</a>`);
    },

    cmdResume() {
        const href = this.data.info.resume;
        this.print('Opening résumé…', 'term-muted');
        this.printHtml(`<a class="term-link" href="${this.esc(href)}" target="_blank" rel="noopener">${this.esc(href)}</a>`);
        window.open(href, '_blank', 'noopener');
    },

    cmdDissertation() {
        const href = this.data.info.dissertation;
        this.heading('Deep Learning Approach for Video Violence Detection');
        this.print('M.Tech dissertation · BITS Pilani · Feb 2026', 'term-muted');
        this.print('97.7% accuracy on the RLVS benchmark (prior SOTA: 91.03%).', 'term-muted');
        this.printHtml(`<a class="term-link" href="${this.esc(href)}" target="_blank" rel="noopener">open the PDF</a>`);
        window.open(href, '_blank', 'noopener');
    },

    cmdLs() {
        this.printHtml(`<span class="term-key">about  skills  experience  projects  education  contact</span>`);
        this.printHtml(`<span class="term-muted">resume.pdf  dissertation.pdf</span>`);
    },

    cmdTheme() {
        const root = document.documentElement;
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch { /* private mode */ }
        this.print(`theme → ${next}`, 'term-muted');
    },

    cmdHistory() {
        if (!this.history.length) { this.print('no history yet', 'term-muted'); return; }
        this.history.forEach((h, i) => {
            this.printHtml(`  <span class="term-muted">${String(i + 1).padStart(3)}</span>  ${this.esc(h)}`);
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
