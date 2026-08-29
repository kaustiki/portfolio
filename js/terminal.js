/* Terminal — a small Python REPL over the portfolio data.

   The namespace holds one object, `ak`, and everything is reached through it:
   attributes (ak.name), collections (ak.projects), methods (ak.whoami()).
   Subscripting works the way Python's does — ak.projects[0], ak.projects[:2],
   ak.skills['Backend & APIs'] — and unknown names fail the way Python fails,
   with NameError / AttributeError / IndexError / KeyError rather than
   "command not found".

   The caret is the browser's own (caret-color in CSS). */

const Terminal = {
    history: [],
    historyIndex: -1,
    maxHistory: 50,

    // things people type out of shell habit — answered with a nudge, not a shell
    shellWords: [
        'ls', 'pwd', 'cd', 'cat', 'sudo', 'echo', 'man', 'grep', 'rm', 'mv', 'cp',
        'mkdir', 'touch', 'vim', 'vi', 'nano', 'ssh', 'curl', 'wget', 'git', 'npm',
        'ps', 'top', 'chmod', 'df', 'du', 'which', 'whoami', 'uname', 'kill'
    ],

    init() {
        this.outputEl = document.getElementById('terminal-output');
        this.inputEl  = document.getElementById('terminal-input');
        this.bodyEl   = document.getElementById('terminal-body');
        this.chipsEl  = document.getElementById('terminal-chips');
        this.data     = window.portfolioData;
        if (!this.outputEl || !this.inputEl || !this.data) return;

        this.buildNamespace();
        this.bindEvents();
        this.renderChips();
        this.showWelcome();
    },

    /* ---------- namespace ---------- */
    buildNamespace() {
        const d = this.data;

        this.members = {
            name:     { type: 'str', get: () => d.info.name },
            role:     { type: 'str', get: () => d.info.title },
            focus:    { type: 'str', get: () => d.info.subtitle },
            location: { type: 'str', get: () => d.info.location },
            email:    { type: 'str', get: () => d.contact.email },
            summary:  { type: 'str', get: () => d.info.summary },
            tagline:  { type: 'str', get: () => d.info.tagline || '' },

            skills: {
                type: 'dict',
                keys: () => Object.keys(d.skills),
                get:  (k) => d.skills[k],
                show: () => this.showSkills(),
                item: (k, v) => {
                    this.printHtml(`  <span class="term-key">${this.esc(k)}</span>`);
                    this.printHtml(`    <span class="term-muted">${this.esc(this.reprList(v))}</span>`);
                }
            },

            experience: {
                type: 'list',
                items: () => d.experience,
                show: () => this.showExperience(),
                item: (job) => this.showJob(job, true),
                brief: (job) => this.showJob(job, false)
            },

            projects: {
                type: 'list',
                items: () => d.projects,
                show: () => this.showProjects(),
                item: (p) => this.showProject(p),
                brief: (p, i) => this.showProjectLine(p, i)
            },

            education: {
                type: 'list',
                items: () => d.education,
                show: () => this.showEducation(),
                item: (e) => this.showDegree(e)
            },

            certifications: {
                type: 'list',
                items: () => d.certifications || [],
                show: () => this.showCerts(),
                item: (c) => {
                    this.printHtml(`  <span class="term-head">${this.esc(c.title)}</span>`);
                    this.printHtml(`  <span class="term-muted">${this.esc(c.issuer)} · ${this.esc(c.dates)}</span>`);
                }
            },

            internships: {
                type: 'list',
                items: () => d.internships || [],
                show: () => this.showInternships(),
                item: (i) => {
                    this.printHtml(`  <span class="term-head">${this.esc(i.title)}</span>`);
                    this.printHtml(`  <span class="term-muted">${this.esc(i.company)} · ${this.esc(i.dates)}</span>`);
                }
            },

            stats: {
                type: 'list',
                items: () => d.stats || [],
                show: () => this.showStats(),
                item: (s) => {
                    this.printHtml(`  <span class="term-head">${this.esc(s.value)}</span>  ${this.esc(s.label)}`);
                    if (s.note) this.printHtml(`         <span class="term-muted">${this.esc(s.note)}</span>`);
                }
            },

            highlights: {
                type: 'list',
                items: () => d.highlights || [],
                show: () => this.printHtml(`<span class="term-muted">${this.esc(this.reprList(d.highlights || []))}</span>`),
                item: (h) => this.print(`'${h}'`, 'term-cmd')
            },

            finearts: {
                type: 'dict',
                keys: () => Object.keys(d.finearts),
                get:  (k) => d.finearts[k],
                show: () => this.showFineArts(),
                item: (k, v) => {
                    this.printHtml(`  <span class="term-key">${this.esc(k)}</span>`);
                    this.printHtml(`    <span class="term-muted">${this.esc(this.reprList(v))}</span>`);
                }
            },

            contact: {
                type: 'dict',
                keys: () => ['email', 'phone', 'github', 'linkedin'],
                get:  (k) => d.contact[k],
                show: () => this.showContact(),
                item: (k, v) => this.printHtml(`  <span class="term-key">${this.esc(k)}</span> <span class="term-muted">·</span> ${this.esc(v)}`)
            },

            whoami:       { type: 'method', call: () => this.showWhoami() },
            about:        { type: 'method', call: () => this.showAbout() },
            resume:       { type: 'method', call: () => this.openResume() },
            dissertation: { type: 'method', call: () => this.openDissertation() },
            theme:        { type: 'method', call: () => this.toggleTheme() }
        };

        this.builtins = {
            help:    (a) => this.biHelp(a),
            dir:     (a) => this.biDir(a),
            print:   (a) => this.biPrint(a),
            len:     (a) => this.biLen(a),
            type:    (a) => this.biType(a),
            repr:    (a) => this.biRepr(a),
            clear:   () => this.cmdClear(),
            history: () => this.showHistory(),
            exit:    () => this.print("There's no exit — just scroll.", 'term-muted'),
            quit:    () => this.print("There's no exit — just scroll.", 'term-muted')
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
        ['help()', 'ak.whoami()', 'ak.projects', 'ak.skills', 'ak.experience',
         'ak.resume()', 'ak.contact', 'ak.theme()', 'clear()']
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
        const val = this.inputEl.value.trim();
        if (!val) return;

        const dotted = val.match(/^ak\s*\.\s*(\w*)$/);
        const pool = dotted
            ? Object.keys(this.members).map((n) => `ak.${n}`)
            : Object.keys(this.builtins).map((n) => `${n}()`).concat(['ak', 'ak.']);

        const hits = pool.filter((n) => n.toLowerCase().startsWith(val.toLowerCase()));
        if (hits.length === 1) {
            const name = hits[0].replace(/^ak\./, '');
            const m = this.members[name];
            this.inputEl.value = m && m.type === 'method' ? `${hits[0]}()` : hits[0];
            this.moveCaretToEnd();
        } else if (hits.length > 1) {
            this.echoCommand(val);
            this.print(hits.join('  '), 'term-muted');
            this.print('');
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

        this.echoCommand(raw);
        this.execute(raw);
        this.scrollToBottom();
    },

    /* ---------- evaluation ---------- */
    execute(src) {
        const s = src.trim();
        if (!s) return;

        if (this.unbalanced(s)) {
            this.pyError('SyntaxError', "'(' was never closed");
            this.print('');
            return;
        }

        let m;

        // import akurati as ak / import this / import <anything else>
        if (/^(import|from)\s/.test(s)) {
            this.handleImport(s);
            this.print('');
            return;
        }

        // builtin call — help(), dir(ak), len(ak.projects), print('hi')
        m = s.match(/^([A-Za-z_]\w*)\s*\(([\s\S]*)\)$/);
        if (m && this.builtins[m[1]]) {
            this.builtins[m[1]](m[2].trim());
            this.print('');
            return;
        }

        // subscript — ak.projects[0], ak.projects[:2], ak.skills['Backend & APIs']
        m = s.match(/^ak\s*\.\s*([A-Za-z_]\w*)\s*\[([\s\S]+)\]$/);
        if (m) {
            this.subscript(m[1], m[2].trim());
            this.print('');
            return;
        }

        // attribute access — ak.projects, ak.whoami()
        m = s.match(/^ak\s*\.\s*([A-Za-z_]\w*)\s*(\(\s*\))?$/);
        if (m) {
            this.attribute(m[1], Boolean(m[2]));
            this.print('');
            return;
        }

        // the object itself
        if (s === 'ak') {
            this.print(this.akRepr(), 'term-cmd');
            this.print('');
            return;
        }

        // literals and arithmetic — '3 * 7', "'hello'"
        const v = this.evalValue(s);
        if (v.ok) {
            this.print(v.repr, 'term-cmd');
            this.print('');
            return;
        }

        // a bare name
        m = s.match(/^([A-Za-z_]\w*)$/);
        if (m) {
            this.nameError(m[1]);
            this.print('');
            return;
        }

        // shell habits: `ls -la`, `sudo rm -rf /` — not valid Python
        const head = s.split(/\s+/)[0].toLowerCase();
        this.pyError('SyntaxError', 'invalid syntax');
        if (this.shellWords.includes(head)) this.hintShell();
        this.print('');
    },

    // paren/bracket balance, ignoring anything inside quotes
    unbalanced(s) {
        let depth = 0, quote = null;
        for (const ch of s) {
            if (quote) { if (ch === quote) quote = null; continue; }
            if (ch === "'" || ch === '"') quote = ch;
            else if (ch === '(' || ch === '[') depth++;
            else if (ch === ')' || ch === ']') depth--;
            if (depth < 0) return false;   // a stray closer is invalid syntax, not EOF
        }
        return depth > 0;
    },

    attribute(name, called) {
        const m = this.members[name];
        if (!m) return this.attrError(name);

        if (m.type === 'method') {
            if (!called) {
                this.print(`<bound method Engineer.${name} of ${this.akRepr()}>`, 'term-cmd');
                this.printHtml(`<span class="term-muted">hint: call it — </span><span class="term-cmd">ak.${this.esc(name)}()</span>`);
                return;
            }
            return m.call();
        }

        if (m.type === 'str') {
            const v = m.get();
            return this.print(called ? v : `'${v}'`, 'term-cmd');
        }

        // list / dict — rendered rather than dumped, called or not
        return m.show();
    },

    subscript(name, key) {
        const m = this.members[name];
        if (!m) return this.attrError(name);

        if (m.type === 'method') {
            return this.pyError('TypeError', "'method' object is not subscriptable");
        }

        if (m.type === 'str') {
            const s = m.get();
            const i = this.parseIndex(key, s.length);
            if (i === null) return this.pyError('TypeError', 'string indices must be integers');
            if (i < 0) return this.pyError('IndexError', 'string index out of range');
            return this.print(`'${s[i]}'`, 'term-cmd');
        }

        if (m.type === 'dict') {
            const lit = this.stringLiteral(key);
            if (lit === null) return this.pyError('TypeError', 'unhashable or non-string key');
            const val = m.get(lit);
            if (val === undefined) return this.pyError('KeyError', `'${lit}'`);
            return m.item(lit, val);
        }

        // list
        const items = m.items();

        const slice = key.match(/^(-?\d*)\s*:\s*(-?\d*)$/);
        if (slice) {
            const start = slice[1] === '' ? 0 : this.norm(Number(slice[1]), items.length);
            const stop  = slice[2] === '' ? items.length : this.norm(Number(slice[2]), items.length);
            const part  = items.slice(Math.max(0, start), Math.max(0, stop));
            if (!part.length) return this.print('[]', 'term-muted');
            const render = m.brief || m.item;
            part.forEach((it, n) => { render(it, Math.max(0, start) + n); this.print(''); });
            this.printHtml(`<span class="term-muted">One entry in full: </span><span class="term-cmd">ak.${this.esc(name)}[${Math.max(0, start)}]</span>`);
            return;
        }

        const i = this.parseIndex(key, items.length);
        if (i === null) return this.pyError('TypeError', 'list indices must be integers or slices');
        if (i < 0 || i >= items.length) return this.pyError('IndexError', 'list index out of range');
        return m.item(items[i]);
    },

    // Python-style index: negatives count from the end. null if not an integer.
    parseIndex(key, len) {
        if (!/^-?\d+$/.test(key)) return null;
        const raw = Number(key);
        return raw < 0 ? len + raw : raw;
    },

    norm(n, len) { return n < 0 ? len + n : n; },

    stringLiteral(s) {
        const m = s.match(/^'([^']*)'$/) || s.match(/^"([^"]*)"$/);
        return m ? m[1] : null;
    },

    /* Evaluates the small subset of expressions worth supporting:
       string literals, integer arithmetic, len(), and scalar attributes. */
    evalValue(expr) {
        const s = expr.trim();

        const lit = this.stringLiteral(s);
        if (lit !== null) return { ok: true, value: lit, repr: `'${lit}'` };

        let m = s.match(/^ak\s*\.\s*([A-Za-z_]\w*)$/);
        if (m) {
            const mem = this.members[m[1]];
            if (mem && mem.type === 'str') {
                const v = mem.get();
                return { ok: true, value: v, repr: `'${v}'` };
            }
            if (mem && (mem.type === 'list' || mem.type === 'dict')) {
                return { ok: false, kind: mem.type, name: m[1] };
            }
            return { ok: false };
        }

        m = s.match(/^len\s*\(([\s\S]+)\)$/);
        if (m) {
            const n = this.lengthOf(m[1].trim());
            return n === null ? { ok: false } : { ok: true, value: n, repr: String(n) };
        }

        // arithmetic only — the character class is the whole guard
        if (/^[\d\s+\-*/%().]+$/.test(s) && /\d/.test(s)) {
            try {
                const r = Function(`"use strict";return (${s})`)();
                if (typeof r === 'number' && Number.isFinite(r)) {
                    return { ok: true, value: r, repr: String(r) };
                }
            } catch { /* falls through to invalid syntax */ }
        }

        return { ok: false };
    },

    lengthOf(arg) {
        const lit = this.stringLiteral(arg);
        if (lit !== null) return lit.length;

        const m = arg.match(/^ak\s*\.\s*([A-Za-z_]\w*)$/);
        if (!m) return null;
        const mem = this.members[m[1]];
        if (!mem) return null;
        if (mem.type === 'list') return mem.items().length;
        if (mem.type === 'dict') return mem.keys().length;
        if (mem.type === 'str')  return mem.get().length;
        return null;
    },

    /* ---------- builtins ---------- */
    biHelp(arg) {
        if (arg) return this.showClassHelp();

        this.heading('Help on the portfolio namespace');
        this.print('');
        this.printHtml(`<span class="term-muted">One object is in scope:</span> <span class="term-cmd">ak</span> <span class="term-muted">— ${this.esc(this.data.info.name)}</span>`);
        this.print('');

        this.printHtml(`  <span class="term-key">attributes</span>`);
        [
            ['ak.name',           'full name'],
            ['ak.role',           'current role'],
            ['ak.focus',          'what the work is about'],
            ['ak.location',       'where I am'],
            ['ak.email',          'how to reach me'],
            ['ak.summary',        'the long version'],
            ['ak.skills',         'dict — technical skills by area'],
            ['ak.experience',     'list — work history'],
            ['ak.projects',       'list — what I have built'],
            ['ak.education',      'list — degrees and marks'],
            ['ak.certifications', 'list — certifications'],
            ['ak.internships',    'list — internships'],
            ['ak.stats',          'list — a few numbers'],
            ['ak.finearts',       'dict — life outside code'],
            ['ak.contact',        'dict — every way to reach me']
        ].forEach(([c, desc]) => this.helpRow(c, desc));

        this.print('');
        this.printHtml(`  <span class="term-key">methods</span>`);
        [
            ['ak.whoami()',       'name, role, current focus'],
            ['ak.about()',        'the short version'],
            ['ak.resume()',       'open the résumé PDF'],
            ['ak.dissertation()', 'open the M.Tech dissertation'],
            ['ak.theme()',        'toggle light / dark']
        ].forEach(([c, desc]) => this.helpRow(c, desc));

        this.print('');
        this.printHtml(`  <span class="term-key">builtins</span>`);
        [
            ['help()',  'this page — help(ak) for the class'],
            ['dir(ak)', 'every attribute on ak'],
            ['len(x)',  'length of a list, dict or string'],
            ['type(x)', 'the type of an expression'],
            ['print(x)', 'print a value'],
            ['clear()', 'clear the screen']
        ].forEach(([c, desc]) => this.helpRow(c, desc));

        this.print('');
        this.printHtml(`<span class="term-muted">Subscripting works: </span><span class="term-cmd">ak.projects[0]</span><span class="term-muted">, </span><span class="term-cmd">ak.projects[:2]</span><span class="term-muted">, </span><span class="term-cmd">ak.skills['Backend &amp; APIs']</span>`);
        this.printHtml(`<span class="term-muted">Tab completes · ↑ ↓ recall history · Ctrl+L clears</span>`);
    },

    helpRow(cmd, desc) {
        this.printHtml(`    <span class="term-cmd">${this.esc(cmd.padEnd(20))}</span><span class="term-muted">${this.esc(desc)}</span>`);
    },

    showClassHelp() {
        const { info } = this.data;
        this.heading('Help on class Engineer in module akurati:');
        this.print('');
        this.print('class Engineer(builtins.object)');
        this.printHtml(` |  <span class="term-muted">${this.esc(info.name)} — ${this.esc(info.title)}.</span>`);
        this.printHtml(` |  <span class="term-muted">${this.esc(info.subtitle)}</span>`);
        this.print(' |');
        this.print(' |  Methods defined here:');
        ['whoami()', 'about()', 'resume()', 'dissertation()', 'theme()']
            .forEach((m) => this.printHtml(` |    <span class="term-cmd">${this.esc(m)}</span>`));
        this.print(' |');
        this.print(' |  Data attributes:');
        this.printHtml(` |    <span class="term-muted">${this.esc(this.dataAttrs().join(', '))}</span>`);
        this.print('');
        this.printHtml(`<span class="term-muted">Full list: </span><span class="term-cmd">dir(ak)</span>`);
    },

    dataAttrs() {
        return Object.keys(this.members).filter((k) => this.members[k].type !== 'method');
    },

    biDir(arg) {
        if (arg && arg !== 'ak') {
            const v = this.evalValue(arg);
            if (!v.ok && !v.kind) return this.nameError(arg.replace(/\W.*$/, ''));
        }
        const names = Object.keys(this.members).sort();
        this.print(this.reprList(names), 'term-cmd');
        this.print('');
        this.printHtml(`<span class="term-muted">Methods take parentheses: </span><span class="term-cmd">${this.esc(this.methodNames().map((n) => `ak.${n}()`).join(', '))}</span>`);
    },

    methodNames() {
        return Object.keys(this.members).filter((k) => this.members[k].type === 'method');
    },

    biPrint(arg) {
        if (!arg) return this.print('');
        const v = this.evalValue(arg);
        if (v.ok) return this.print(String(v.value));
        if (v.kind) {
            this.printHtml(`<span class="term-muted">${this.esc(arg)} is a ${v.kind} — showing it:</span>`);
            return this.members[v.name].show();
        }
        const bare = arg.match(/^([A-Za-z_]\w*)$/);
        if (bare) return this.nameError(bare[1]);
        return this.pyError('SyntaxError', 'invalid syntax');
    },

    biLen(arg) {
        const n = this.lengthOf(arg);
        if (n === null) {
            const m = arg.match(/^ak\s*\.\s*([A-Za-z_]\w*)$/);
            if (m && !this.members[m[1]]) return this.attrError(m[1]);
            return this.pyError('TypeError', 'object of this type has no len()');
        }
        this.print(String(n), 'term-cmd');
    },

    biType(arg) {
        if (!arg || arg === 'ak') return this.print("<class 'akurati.Engineer'>", 'term-cmd');

        const lit = this.stringLiteral(arg);
        if (lit !== null) return this.print("<class 'str'>", 'term-cmd');

        const m = arg.match(/^ak\s*\.\s*([A-Za-z_]\w*)$/);
        if (m) {
            const mem = this.members[m[1]];
            if (!mem) return this.attrError(m[1]);
            const py = { str: 'str', list: 'list', dict: 'dict', method: 'method' }[mem.type];
            return this.print(`<class '${py}'>`, 'term-cmd');
        }

        const v = this.evalValue(arg);
        if (v.ok) return this.print(`<class '${typeof v.value === 'number' ? 'int' : 'str'}'>`, 'term-cmd');
        return this.pyError('SyntaxError', 'invalid syntax');
    },

    biRepr(arg) {
        if (!arg || arg === 'ak') return this.print(`"${this.akRepr()}"`, 'term-cmd');
        const v = this.evalValue(arg);
        if (v.ok) return this.print(v.repr, 'term-cmd');
        return this.pyError('SyntaxError', 'invalid syntax');
    },

    handleImport(s) {
        let m = s.match(/^import\s+([\w.]+)(?:\s+as\s+(\w+))?$/);
        const mod = m ? m[1] : (s.match(/^from\s+([\w.]+)\s+import\s+/) || [])[1];

        if (mod === 'akurati') {
            const alias = (m && m[2]) || 'ak';
            return this.printHtml(`<span class="term-muted"># already imported — ${this.esc(alias)} is in scope</span>`);
        }
        if (mod === 'this') {
            this.print('The Zen of Python, by Tim Peters', 'term-muted');
            this.print('');
            ['Simple is better than complex.',
             'Readability counts.',
             'Errors should never pass silently.',
             'If the implementation is hard to explain, it is a bad idea.']
                .forEach((l) => this.print(l));
            return;
        }
        if (mod === 'antigravity') {
            return this.print('You are already flying. Scroll down.', 'term-muted');
        }
        this.pyError('ModuleNotFoundError', `No module named '${mod || s}'`);
        this.printHtml(`<span class="term-muted">only </span><span class="term-cmd">akurati</span><span class="term-muted"> ships in this build</span>`);
    },

    /* ---------- errors ---------- */
    pyError(kind, msg) {
        this.print('Traceback (most recent call last):', 'term-muted');
        this.print('  File "<stdin>", line 1, in <module>', 'term-muted');
        this.printHtml(`<span class="term-err">${this.esc(kind)}: ${this.esc(msg)}</span>`);
    },

    nameError(name) {
        this.pyError('NameError', `name '${name}' is not defined`);
        if (this.members[name]) {
            this.printHtml(`<span class="term-muted">hint: it lives on ak — try </span><span class="term-cmd">ak.${this.esc(name)}${this.members[name].type === 'method' ? '()' : ''}</span>`);
        } else if (this.shellWords.includes(name.toLowerCase())) {
            this.hintShell();
        } else {
            this.printHtml(`<span class="term-muted">try </span><span class="term-cmd">help()</span><span class="term-muted"> or </span><span class="term-cmd">dir(ak)</span>`);
        }
    },

    attrError(name) {
        this.pyError('AttributeError', `'Engineer' object has no attribute '${name}'`);
        this.printHtml(`<span class="term-muted">try </span><span class="term-cmd">dir(ak)</span>`);
    },

    hintShell() {
        this.printHtml(`<span class="term-muted">this is a Python REPL, not a shell — try </span><span class="term-cmd">dir(ak)</span>`);
    },

    /* ---------- output helpers ---------- */
    echoCommand(cmd) {
        this.printHtml(`<span class="term-sep">&gt;&gt;&gt;</span> <span class="term-cmd">${this.esc(cmd)}</span>`);
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

    reprList(items) { return `[${items.map((s) => `'${s}'`).join(', ')}]`; },

    akRepr() {
        const { info } = this.data;
        return `<Engineer '${info.name}' — ${info.title}>`;
    },

    esc(s) {
        return String(s).replace(/[&<>"']/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    scrollToBottom() {
        requestAnimationFrame(() => { this.bodyEl.scrollTop = this.bodyEl.scrollHeight; });
    },

    /* ---------- renderers ---------- */
    showWelcome() {
        const { info } = this.data;
        this.printHtml(`<span class="term-muted">Python 3.12.3 (portfolio build) — type </span><span class="term-cmd">help()</span><span class="term-muted"> or </span><span class="term-cmd">dir(ak)</span>`);
        this.print('');
        this.echoCommand('import akurati as ak');
        this.echoCommand('ak');
        this.print(this.akRepr(), 'term-cmd');
        this.print('');
        this.heading(info.name);
        this.printHtml(`<span class="term-muted">${this.esc(info.subtitle)}</span>`);
        this.print('');
        this.printHtml(`<span class="term-muted">Everything hangs off </span><span class="term-cmd">ak</span><span class="term-muted"> — or tap a command below.</span>`);
        this.print('');
    },

    showWhoami() {
        const { info, contact } = this.data;
        this.heading(info.name);
        this.kv('role',     info.title);
        this.kv('focus',    info.subtitle);
        this.kv('location', info.location);
        this.kv('email',    contact.email);
        this.print('');
        if (info.quote) {
            this.printHtml(`  <span class="term-muted">“${this.esc(info.quote.text)}”</span>`);
            this.printHtml(`  <span class="term-muted" style="opacity:.7">— ${this.esc(info.quote.author)}</span>`);
        } else if (info.tagline) {
            this.print(info.tagline, 'term-muted');
        }
    },

    showAbout() {
        this.heading('About');
        this.print(this.data.info.summary);
        this.print('');
        this.printHtml(`<span class="term-muted">${this.esc(this.data.highlights.join(' · '))}</span>`);
    },

    showStats() {
        this.heading('Numbers');
        (this.data.stats || []).forEach((s) => this.members.stats.item(s));
    },

    showSkills() {
        this.heading('Technical skills');
        Object.entries(this.data.skills).forEach(([group, items]) => this.members.skills.item(group, items));
    },

    showExperience() {
        this.heading('Experience');
        this.data.experience.forEach((job) => { this.showJob(job, false); this.print(''); });
        this.printHtml(`<span class="term-muted">One entry in full: </span><span class="term-cmd">ak.experience[0]</span>`);
    },

    showJob(job, full) {
        this.printHtml(`  <span class="term-head">${this.esc(job.role)}</span>${job.current ? ' <span class="term-cmd">[current]</span>' : ''}`);
        this.printHtml(`  <span class="term-key">${this.esc(job.company)}</span> <span class="term-muted">· ${this.esc(job.dates)}</span>`);
        const details = full ? job.details : job.details.slice(0, 3);
        details.forEach((x) => this.printHtml(`    <span class="term-muted">▸ ${this.esc(x)}</span>`));
    },

    showProjects() {
        this.heading('Projects');
        this.data.projects.forEach((p, i) => { this.showProjectLine(p, i); this.print(''); });
        this.printHtml(`<span class="term-muted">One project in full: </span><span class="term-cmd">ak.projects[0]</span>`);
    },

    showProjectLine(p, i) {
        const idx = typeof i === 'number' ? `<span class="term-muted">[${i}]</span> ` : '';
        this.printHtml(`  ${idx}<span class="term-head">${this.esc(p.title)}</span>${p.featured ? ' <span class="term-cmd">★</span>' : ''}`);
        this.printHtml(`      <span class="term-muted">${this.esc(p.subtitle || '')} · ${this.esc(p.dates)}</span>`);
        this.printHtml(`      <span class="term-key">${this.esc((p.tech || []).slice(0, 6).join(' · '))}</span>`);
    },

    showProject(p) {
        this.heading(p.title);
        this.printHtml(`<span class="term-muted">${this.esc(p.subtitle || '')}${p.org ? ` · ${this.esc(p.org)}` : ''} · ${this.esc(p.dates)}</span>`);
        this.print('');
        this.print(p.description);
        if (p.highlights && p.highlights.length) {
            this.print('');
            p.highlights.forEach((h) => this.printHtml(`  <span class="term-muted">▸ ${this.esc(h)}</span>`));
        }
        if (p.tech && p.tech.length) {
            this.print('');
            this.printHtml(`  <span class="term-key">${this.esc(p.tech.join(' · '))}</span>`);
        }
        (p.links || []).forEach((l) => {
            this.printHtml(`  <a class="term-link" href="${this.esc(l.href)}" target="_blank" rel="noopener noreferrer">${this.esc(l.label)}</a>`);
        });
    },

    showEducation() {
        this.heading('Education');
        this.data.education.forEach((e) => { this.showDegree(e); this.print(''); });
    },

    showDegree(e) {
        this.printHtml(`  <span class="term-head">${this.esc(e.degree)}</span>`);
        this.printHtml(`  <span class="term-key">${this.esc(e.institution)}</span> <span class="term-muted">· ${this.esc(e.dates)}</span>`);
        const meta = e.cgpa ? `CGPA ${e.cgpa}` : (e.marks ? `Marks ${e.marks}` : '');
        if (meta) this.printHtml(`    <span class="term-muted">${this.esc(meta)}</span>`);
    },

    showCerts() {
        this.heading('Certifications');
        (this.data.certifications || []).forEach((c) => { this.members.certifications.item(c); this.print(''); });
    },

    showInternships() {
        this.heading('Internships');
        (this.data.internships || []).forEach((i) => { this.members.internships.item(i); this.print(''); });
    },

    showFineArts() {
        this.heading('Beyond code');
        Object.entries(this.data.finearts).forEach(([k, v]) => this.members.finearts.item(k, v));
    },

    showContact() {
        const c = this.data.contact;
        this.heading('Contact');
        this.printHtml(`  <span class="term-key">email   </span> <a class="term-link" href="mailto:${this.esc(c.email)}">${this.esc(c.email)}</a>`);
        this.printHtml(`  <span class="term-key">phone   </span> ${this.esc(c.phone)}`);
        this.printHtml(`  <span class="term-key">github  </span> <a class="term-link" href="${this.esc(c.github)}" target="_blank" rel="noopener noreferrer">${this.esc(c.githubLabel)}</a>`);
        this.printHtml(`  <span class="term-key">linkedin</span> <a class="term-link" href="${this.esc(c.linkedin)}" target="_blank" rel="noopener noreferrer">${this.esc(c.linkedinLabel)}</a>`);
    },

    openResume() {
        const href = this.data.info.resume;
        this.print('Opening résumé…', 'term-muted');
        this.printHtml(`<a class="term-link" href="${this.esc(href)}" target="_blank" rel="noopener">${this.esc(href)}</a>`);
        window.open(href, '_blank', 'noopener');
    },

    openDissertation() {
        const href = this.data.info.dissertation;
        this.heading('Deep Learning Approach for Video Violence Detection');
        this.print('M.Tech dissertation · BITS Pilani · Feb 2026', 'term-muted');
        this.print('97.7% accuracy on the RLVS benchmark (prior SOTA: 91.03%).', 'term-muted');
        this.printHtml(`<a class="term-link" href="${this.esc(href)}" target="_blank" rel="noopener">open the PDF</a>`);
        window.open(href, '_blank', 'noopener');
    },

    toggleTheme() {
        const root = document.documentElement;
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch { /* private mode */ }
        this.print(`theme → ${next}`, 'term-muted');
    },

    showHistory() {
        if (!this.history.length) { this.print('[]', 'term-muted'); return; }
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
