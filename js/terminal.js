/* Terminal — a pandas/IPython notebook session over the portfolio data.

   Three objects are in scope:
     df     a DataFrame-shaped view of the portfolio — df.info(), df.head(),
            df.shape, df.describe(), df['skills'], df.projects[0], df.query(...)
     model  the career as a fitted estimator — model.summary(), model.evaluate()
     rag    a retriever over the same data — rag.query('fastapi')

   Cells are numbered the way IPython numbers them: the input prompt is
   In [n], and an expression that returns a value echoes as Out[n]. Calls that
   only print (df.info(), df.head()) produce no Out line, same as the real thing.

   Unknown names fail like Python — NameError, AttributeError, KeyError — so the
   errors teach the API instead of dead-ending.

   The caret is the browser's own (caret-color in CSS). */

const Terminal = {
    history: [],
    historyIndex: -1,
    maxHistory: 50,
    cell: 1,

    // typed out of shell habit — answered with a nudge, not a shell
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
        this.promptEl = document.getElementById('terminal-prompt');
        this.data     = window.portfolioData;
        if (!this.outputEl || !this.inputEl || !this.data) return;

        this.buildNamespace();
        this.bindEvents();
        this.renderChips();
        this.showWelcome();
        this.syncPrompt();
    },

    /* ---------- namespace ---------- */
    buildNamespace() {
        const d = this.data;

        // the columns of df, in the order info() reports them
        this.columns = [
            ['name',           'str',   () => 1],
            ['role',           'str',   () => 1],
            ['focus',          'str',   () => 1],
            ['location',       'str',   () => 1],
            ['email',          'str',   () => 1],
            ['summary',        'str',   () => 1],
            ['skills',         'dict',  () => Object.keys(d.skills).length],
            ['experience',     'frame', () => d.experience.length],
            ['projects',       'frame', () => d.projects.length],
            ['education',      'frame', () => d.education.length],
            ['certifications', 'frame', () => (d.certifications || []).length],
            ['internships',    'frame', () => (d.internships || []).length],
            ['stats',          'frame', () => (d.stats || []).length],
            ['highlights',     'list',  () => (d.highlights || []).length],
            ['finearts',       'dict',  () => Object.keys(d.finearts).length],
            ['contact',        'dict',  () => 4]
        ];

        const strCol  = (get) => ({ type: 'value', get, repr: () => `'${get()}'`, str: true });
        const frameCol = (items, opts) => ({ type: 'frame', items, ...opts });

        this.dfMembers = {
            /* --- scalar columns --- */
            name:     strCol(() => d.info.name),
            role:     strCol(() => d.info.title),
            focus:    strCol(() => d.info.subtitle),
            location: strCol(() => d.info.location),
            email:    strCol(() => d.contact.email),
            summary:  strCol(() => d.info.summary),
            tagline:  strCol(() => d.info.tagline || ''),

            /* --- frame columns --- */
            projects: frameCol(() => d.projects, {
                show:  () => { this.projectTable(this.pairs(d.projects)); this.tip('df.projects[0]', 'one row in full'); },
                row:   (p, i) => this.showProject(p, i),
                slice: (rows, start) => this.projectTable(this.pairs(rows, start))
            }),
            experience: frameCol(() => d.experience, {
                show:  () => { this.data.experience.forEach((j, i) => { this.showJob(j, i, false); this.print(''); });
                               this.tip('df.experience[0]', 'one role in full'); },
                row:   (j, i) => this.showJob(j, i, true),
                brief: (j, i) => this.showJob(j, i, false)
            }),
            education: frameCol(() => d.education, {
                show:  () => { this.data.education.forEach((e, i) => { this.showDegree(e, i); this.print(''); }); },
                row:   (e, i) => this.showDegree(e, i)
            }),
            certifications: frameCol(() => d.certifications || [], {
                show:  () => (d.certifications || []).forEach((c, i) => { this.showCert(c, i); this.print(''); }),
                row:   (c, i) => this.showCert(c, i)
            }),
            internships: frameCol(() => d.internships || [], {
                show:  () => (d.internships || []).forEach((c, i) => { this.showInternship(c, i); this.print(''); }),
                row:   (c, i) => this.showInternship(c, i)
            }),
            stats: frameCol(() => d.stats || [], {
                show:  () => (d.stats || []).forEach((s, i) => this.showStat(s, i)),
                row:   (s, i) => this.showStat(s, i)
            }),

            /* --- list / dict columns --- */
            highlights: {
                type: 'list',
                items: () => d.highlights || [],
                show:  () => this.out(this.reprList(d.highlights || []))
            },
            skills: {
                type: 'dict',
                keys: () => Object.keys(d.skills),
                get:  (k) => d.skills[k],
                show: () => Object.entries(d.skills).forEach(([g, v]) => this.showGroup(g, v)),
                item: (k, v) => this.showGroup(k, v)
            },
            finearts: {
                type: 'dict',
                keys: () => Object.keys(d.finearts),
                get:  (k) => d.finearts[k],
                show: () => Object.entries(d.finearts).forEach(([g, v]) => this.showGroup(g, v)),
                item: (k, v) => this.showGroup(k, v)
            },
            contact: {
                type: 'dict',
                keys: () => ['email', 'phone', 'github', 'linkedin'],
                get:  (k) => d.contact[k],
                show: () => this.showContact(),
                item: (k, v) => this.printHtml(`  <span class="term-key">${this.esc(k)}</span> <span class="term-muted">·</span> ${this.esc(v)}`)
            },

            /* --- DataFrame attributes --- */
            shape:   { type: 'value', repr: () => `(${d.projects.length}, ${this.columns.length})` },
            size:    { type: 'value', repr: () => String(d.projects.length * this.columns.length) },
            columns: { type: 'value', repr: () => `Index(${this.reprList(this.columns.map((c) => c[0]))}, dtype='object')` },
            index:   { type: 'value', repr: () => `RangeIndex(start=0, stop=${d.projects.length}, step=1)` },
            empty:   { type: 'value', repr: () => 'False' },

            /* --- DataFrame methods --- */
            info:         { type: 'method', call: () => this.dfInfo() },
            head:         { type: 'method', call: (a) => this.dfHead(a, 'head') },
            tail:         { type: 'method', call: (a) => this.dfHead(a, 'tail') },
            describe:     { type: 'method', call: () => this.dfDescribe() },
            dtypes:       { type: 'view',   show: () => this.dfDtypes() },
            sample:       { type: 'method', call: () => this.dfSample() },
            query:        { type: 'method', call: (a) => this.dfQuery(a) },
            groupby:      { type: 'method', call: (a) => this.dfGroupby(a) },
            value_counts: { type: 'method', call: (a) => this.dfValueCounts(a) },
            keys:         { type: 'method', call: () => this.out(this.reprList(this.columns.map((c) => c[0]))) },
            to_dict:      { type: 'method', call: () => this.dfToDict() },
            resume:       { type: 'method', call: () => this.openResume() },
            dissertation: { type: 'method', call: () => this.openDissertation() },
            theme:        { type: 'method', call: () => this.toggleTheme() },

            /* --- indexers --- */
            iloc: { type: 'indexer', kind: 'iloc' },
            loc:  { type: 'indexer', kind: 'loc' }
        };

        this.modelMembers = {
            summary:  { type: 'method', call: () => this.modelSummary() },
            evaluate: { type: 'method', call: () => this.modelEvaluate() },
            predict:  { type: 'method', call: (a) => this.modelPredict(a) },
            fit:      { type: 'method', call: (a) => this.modelFit(a) },
            params:   { type: 'value', repr: () => String(this.paramCount()) },
            layers:   { type: 'value', repr: () => this.reprList(this.layers().map((l) => l.name)) },
            metrics:  { type: 'value', repr: () => "['accuracy', 'cgpa', 'shipped']" }
        };

        this.ragMembers = {
            query: { type: 'method', call: (a) => this.ragQuery(a) },
            index: { type: 'value', repr: () => `<VectorStore: ${this.corpus().length} chunks, dim=1536, metric='cosine'>` },
            k:     { type: 'value', repr: () => '3' }
        };

        this.objects = {
            df:    { cls: 'DataFrame', members: this.dfMembers,
                     repr: () => `<akurati.Portfolio [${d.projects.length} rows x ${this.columns.length} columns]>` },
            model: { cls: 'Engineer', members: this.modelMembers,
                     repr: () => `<Engineer(name='${d.info.name}', role='${d.info.title}', fitted=True)>` },
            rag:   { cls: 'Retriever', members: this.ragMembers,
                     repr: () => `<Retriever(store=Chroma, k=3, embed='text-embedding-3-small')>` },
            pd:    { cls: 'module', members: { __version__: { type: 'value', repr: () => "'2.2.2'" } },
                     repr: () => "<module 'pandas'>" }
        };

        this.builtins = {
            help:    (a) => this.biHelp(a),
            dir:     (a) => this.biDir(a),
            len:     (a) => this.biLen(a),
            type:    (a) => this.biType(a),
            print:   (a) => this.biPrint(a),
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
        ['df.info()', 'df.head()', 'df.skills', 'df.experience', 'df.projects[0]',
         'df.describe()', 'model.summary()', "rag.query('rag')", 'df.contact', 'clear()']
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

        const dotted = val.match(/^(\w+)\s*\.\s*\w*$/);
        let pool;
        if (dotted && this.objects[dotted[1]]) {
            pool = Object.keys(this.objects[dotted[1]].members).map((n) => `${dotted[1]}.${n}`);
        } else {
            pool = Object.keys(this.objects).concat(Object.keys(this.builtins).map((n) => `${n}()`));
        }

        const hits = pool.filter((n) => n.toLowerCase().startsWith(val.toLowerCase()));
        if (hits.length === 1) {
            const [obj, name] = hits[0].split('.');
            const mem = name && this.objects[obj] ? this.objects[obj].members[name] : null;
            this.inputEl.value = mem && mem.type === 'method' ? `${hits[0]}()` : hits[0];
            this.moveCaretToEnd();
        } else if (hits.length > 1) {
            this.echoCommand(val);
            this.print(hits.join('  '), 'term-muted');
            this.print('');
            this.nextCell();
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
        this.print('');
        this.nextCell();
        this.scrollToBottom();
    },

    nextCell() {
        this.cell++;
        this.syncPrompt();
    },

    syncPrompt() {
        if (this.promptEl) this.promptEl.textContent = `In [${this.cell}]:`;
    },

    /* ---------- evaluation ---------- */
    execute(src) {
        const s = src.trim();
        if (!s) return;

        if (/^(import|from)\s/.test(s)) return this.handleImport(s);

        // builtin call — help(), dir(df), len(df.projects)
        const b = s.match(/^([A-Za-z_]\w*)\s*\(([\s\S]*)\)$/);
        if (b && this.builtins[b[1]] && this.closes(s, b[1].length)) {
            return this.builtins[b[1]](b[2].trim());
        }

        const chain = this.parseChain(s);
        if (chain) return this.resolveChain(chain, s);

        // literals and arithmetic — "3 * 7", "'hello'"
        const v = this.evalValue(s);
        if (v.ok) return this.out(v.repr);

        if (/[([]/.test(s) && this.unbalanced(s)) {
            return this.pyError('SyntaxError', "'(' was never closed");
        }

        const head = s.split(/\s+/)[0].toLowerCase();
        this.pyError('SyntaxError', 'invalid syntax');
        if (this.shellWords.includes(head)) this.hintShell();
    },

    // does the '(' at `from` close at the very end of s?
    closes(s, from) {
        const i = s.indexOf('(', from);
        return i >= 0 && this.matchBracket(s.slice(i), '(', ')') === s.length - i - 1;
    },

    /* Parses `base(.name)*(...)?[...]?` — the only shapes this REPL supports. */
    parseChain(s) {
        const m = s.match(/^([A-Za-z_]\w*)/);
        if (!m) return null;

        const chain = { base: m[1], path: [], call: null, index: null };
        let rest = s.slice(m[1].length).trim();

        while (rest) {
            if (rest[0] === '.') {
                const n = rest.slice(1).match(/^\s*([A-Za-z_]\w*)/);
                if (!n) return null;
                chain.path.push(n[1]);
                rest = rest.slice(1 + n[0].length).trim();
            } else if (rest[0] === '(') {
                const close = this.matchBracket(rest, '(', ')');
                if (close < 0) return null;
                chain.call = rest.slice(1, close).trim();
                rest = rest.slice(close + 1).trim();
            } else if (rest[0] === '[') {
                const close = this.matchBracket(rest, '[', ']');
                if (close < 0) return null;
                chain.index = rest.slice(1, close).trim();
                rest = rest.slice(close + 1).trim();
            } else {
                return null;
            }
        }
        return chain;
    },

    // index of the bracket closing the one at position 0, or -1
    matchBracket(s, open, close) {
        let depth = 0, quote = null;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (quote) { if (ch === quote) quote = null; continue; }
            if (ch === "'" || ch === '"') { quote = ch; continue; }
            if (ch === open) depth++;
            else if (ch === close) { depth--; if (depth === 0) return i; }
        }
        return -1;
    },

    unbalanced(s) {
        let depth = 0, quote = null;
        for (const ch of s) {
            if (quote) { if (ch === quote) quote = null; continue; }
            if (ch === "'" || ch === '"') quote = ch;
            else if (ch === '(' || ch === '[') depth++;
            else if (ch === ')' || ch === ']') depth--;
            if (depth < 0) return false;
        }
        return depth > 0;
    },

    resolveChain(c, src) {
        const obj = this.objects[c.base];
        if (!obj) return this.nameError(c.base, src);

        if (!c.path.length) {
            if (c.index !== null) return this.frameKey(obj, c.index);
            if (c.call !== null) return this.pyError('TypeError', `'${obj.cls}' object is not callable`);
            return this.out(obj.repr());
        }
        if (c.path.length > 1) {
            return this.attrError(obj, c.path[1], c.path[0]);
        }

        const name = c.path[0];
        const mem = obj.members[name];
        if (!mem) return this.attrError(obj, name, c.base);

        if (mem.type === 'view') return mem.show();

        if (mem.type === 'indexer') {
            if (c.index === null) {
                return this.out(`<pandas.core.indexing._${mem.kind.toUpperCase()}Indexer object>`);
            }
            return mem.kind === 'loc' ? this.frameKey(obj, c.index) : this.ilocRow(c.index);
        }

        if (mem.type === 'method') {
            if (c.call === null) {
                this.out(`<bound method ${obj.cls}.${name} of ${obj.repr()}>`);
                return this.tip(`${c.base}.${name}()`, 'call it');
            }
            return mem.call(c.call);
        }

        if (mem.type === 'value') {
            if (c.index !== null && mem.str) return this.strIndex(mem.get(), c.index);
            if (c.index !== null) return this.pyError('TypeError', 'object is not subscriptable');
            return this.out(mem.repr());
        }

        if (mem.type === 'dict') {
            if (c.index === null) return mem.show();
            const key = this.stringLiteral(c.index);
            if (key === null) return this.pyError('TypeError', 'dict key must be a string');
            const val = mem.get(key);
            if (val === undefined) return this.pyError('KeyError', `'${key}'`);
            return mem.item(key, val);
        }

        if (mem.type === 'list') {
            if (c.index === null) return mem.show();
            const items = mem.items();
            const i = this.parseIndex(c.index, items.length);
            if (i === null) return this.pyError('TypeError', 'list indices must be integers');
            if (i < 0 || i >= items.length) return this.pyError('IndexError', 'list index out of range');
            return this.out(`'${items[i]}'`);
        }

        // frame column
        if (c.index === null) return mem.show();
        return this.frameRow(mem, c.index, name);
    },

    frameRow(mem, key, name) {
        const items = mem.items();

        const slice = key.match(/^(-?\d*)\s*:\s*(-?\d*)$/);
        if (slice) {
            const start = slice[1] === '' ? 0 : this.norm(Number(slice[1]), items.length);
            const stop  = slice[2] === '' ? items.length : this.norm(Number(slice[2]), items.length);
            const part  = items.slice(Math.max(0, start), Math.max(0, stop));
            if (!part.length) return this.print('Empty DataFrame', 'term-muted');
            const from = Math.max(0, start);
            if (mem.slice) {
                mem.slice(part, from);
            } else {
                const render = mem.brief || mem.row;
                part.forEach((it, n) => { render(it, from + n); this.print(''); });
            }
            return this.tip(`df.${name}[${from}]`, 'one row in full');
        }

        const i = this.parseIndex(key, items.length);
        if (i === null) return this.pyError('TypeError', 'positional indexers must be integers or slices');
        if (i < 0 || i >= items.length) return this.pyError('IndexError', 'index out of bounds');
        return mem.row(items[i], i);
    },

    // df['skills'] and df.loc['skills']
    frameKey(obj, key) {
        const name = this.stringLiteral(key);
        if (name === null) {
            const i = this.parseIndex(key, 0);
            if (i !== null) {
                this.pyError('KeyError', key);
                return this.tip('df.iloc[0]', 'positional lookup goes through iloc');
            }
            return this.pyError('TypeError', 'column key must be a string');
        }
        const mem = obj.members[name];
        if (!mem || mem.type === 'method' || mem.type === 'indexer') {
            this.pyError('KeyError', `'${name}'`);
            return this.tip('df.columns', 'the column list');
        }
        if (mem.type === 'value') return this.out(mem.repr());
        return mem.show();
    },

    // df.iloc[n] — positional row of the projects frame
    ilocRow(key) {
        return this.frameRow(this.dfMembers.projects, key, 'projects');
    },

    strIndex(s, key) {
        const i = this.parseIndex(key, s.length);
        if (i === null) return this.pyError('TypeError', 'string indices must be integers');
        if (i < 0 || i >= s.length) return this.pyError('IndexError', 'string index out of range');
        return this.out(`'${s[i]}'`);
    },

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

    evalValue(expr) {
        const s = expr.trim();

        const lit = this.stringLiteral(s);
        if (lit !== null) return { ok: true, value: lit, repr: `'${lit}'` };

        const chain = this.parseChain(s);
        if (chain && chain.call === null && chain.index === null && chain.path.length === 1) {
            const obj = this.objects[chain.base];
            const mem = obj && obj.members[chain.path[0]];
            if (mem && mem.type === 'value') {
                return { ok: true, value: mem.get ? mem.get() : mem.repr(), repr: mem.repr() };
            }
            if (mem) return { ok: false, mem, name: `${chain.base}.${chain.path[0]}` };
        }

        const l = s.match(/^len\s*\(([\s\S]+)\)$/);
        if (l) {
            const n = this.lengthOf(l[1].trim());
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

        if (arg === 'df') return this.data.projects.length;
        if (arg === 'df.columns') return this.columns.length;

        const chain = this.parseChain(arg);
        if (!chain || chain.path.length !== 1) return null;
        const obj = this.objects[chain.base];
        const mem = obj && obj.members[chain.path[0]];
        if (!mem) return null;
        if (mem.type === 'frame' || mem.type === 'list') return mem.items().length;
        if (mem.type === 'dict') return mem.keys().length;
        if (mem.type === 'value' && mem.str) return mem.get().length;
        return null;
    },

    /* ---------- DataFrame methods ---------- */
    dfInfo() {
        const d = this.data;
        this.print("<class 'akurati.Portfolio'>");
        this.print(`RangeIndex: ${d.projects.length} entries, 0 to ${d.projects.length - 1}`);
        this.print(`Data columns (total ${this.columns.length} columns):`);
        this.printHtml(`<span class="term-muted"> #   Column           Non-Null  Dtype</span>`);
        this.printHtml(`<span class="term-muted">---  ---------------  --------  ------</span>`);
        this.columns.forEach(([col, dtype, count], i) => {
            this.printHtml(
                ` <span class="term-muted">${this.esc(String(i).padEnd(3))}</span> ` +
                `<span class="term-key">${this.esc(col.padEnd(16))}</span>` +
                `<span class="term-muted">${this.esc(String(count()).padEnd(10))}</span>` +
                `<span class="term-muted">${this.esc(dtype)}</span>`
            );
        });
        const counts = {};
        this.columns.forEach(([, t]) => { counts[t] = (counts[t] || 0) + 1; });
        this.print(`dtypes: ${Object.entries(counts).map(([k, v]) => `${k}(${v})`).join(', ')}`);
        this.print('memory usage: 42.7+ KB', 'term-muted');
        this.print('');
        this.tip('df.head()', 'the projects frame');
    },

    dfHead(arg, which) {
        const n = this.argInt(arg, 5);
        const all = this.data.projects;
        const start = which === 'head' ? 0 : Math.max(0, all.length - n);
        const rows = all.slice(start, which === 'head' ? n : all.length);
        this.projectTable(this.pairs(rows, start));
        this.print('');
        this.print(`[${rows.length} rows x 4 columns]`, 'term-muted');
        this.tip('df.projects[0]', 'one row in full');
    },

    dfDtypes() {
        this.columns.forEach(([col, dtype]) => {
            this.printHtml(`<span class="term-key">${this.esc(col.padEnd(16))}</span><span class="term-muted">${this.esc(dtype)}</span>`);
        });
        this.print('dtype: object', 'term-muted');
    },

    dfDescribe() {
        const cgpa  = this.data.education.filter((e) => e.cgpa).map((e) => Number(e.cgpa));
        const ntech = this.data.projects.map((p) => (p.tech || []).length);
        const cols = [['cgpa', cgpa], ['n_tech', ntech]];

        const stats = ['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'];
        this.printHtml(`<span class="term-muted">${this.esc(''.padEnd(7))}${this.esc('cgpa'.padStart(9))}${this.esc('n_tech'.padStart(9))}</span>`);
        stats.forEach((stat) => {
            const cells = cols.map(([, v]) => this.stat(v, stat));
            this.printHtml(
                `<span class="term-key">${this.esc(stat.padEnd(7))}</span>` +
                cells.map((c) => `<span>${this.esc(c.padStart(9))}</span>`).join('')
            );
        });
    },

    stat(values, which) {
        const v = [...values].sort((a, b) => a - b);
        const n = v.length;
        if (!n) return 'NaN';
        const mean = v.reduce((a, b) => a + b, 0) / n;
        switch (which) {
            case 'count': return n.toFixed(2);
            case 'mean':  return mean.toFixed(2);
            case 'std': {
                if (n < 2) return 'NaN';
                const s = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
                return s.toFixed(2);
            }
            case 'min': return v[0].toFixed(2);
            case 'max': return v[n - 1].toFixed(2);
            default:    return this.quantile(v, Number(which.replace('%', '')) / 100).toFixed(2);
        }
    },

    // linear interpolation, the numpy default
    quantile(sorted, q) {
        const pos = (sorted.length - 1) * q;
        const lo = Math.floor(pos), hi = Math.ceil(pos);
        return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
    },

    dfSample() {
        const all = this.data.projects;
        const i = Math.floor(Math.random() * all.length);
        this.showProject(all[i], i);
    },

    dfQuery(arg) {
        const expr = this.stringLiteral(arg);
        if (expr === null) return this.pyError('ValueError', 'expr must be a string');

        let m = expr.match(/^\s*(\w+)\s*==\s*['"]([^'"]*)['"]\s*$/);
        if (!m) m = expr.match(/^\s*(\w+)\s*==\s*(True|False)\s*$/);
        if (!m) {
            this.pyError('ValueError', `could not parse: ${expr}`);
            return this.tip(`df.query("category == 'Backend'")`, 'supported form');
        }

        const [, col, want] = m;
        if (!['category', 'org', 'featured', 'title'].includes(col)) {
            this.pyError('KeyError', `'${col}'`);
            return this.tip("category, org, featured, title", 'queryable columns');
        }

        const rows = [];
        this.data.projects.forEach((p, i) => {
            const val = col === 'featured' ? String(Boolean(p.featured)) : String(p[col] || '');
            if (val.toLowerCase() === want.toLowerCase()) rows.push([p, i]);
        });

        if (!rows.length) {
            this.print('Empty DataFrame', 'term-muted');
            return this.print('Columns: [title, category, org, tech]  Index: []', 'term-muted');
        }
        this.projectTable(rows);
        this.print('');
        this.print(`[${rows.length} rows x 4 columns]`, 'term-muted');
    },

    dfGroupby(arg) {
        const col = this.stringLiteral(arg) || 'category';
        if (!['category', 'org'].includes(col)) {
            this.pyError('KeyError', `'${col}'`);
            this.print('groupable columns: category, org', 'term-muted');
            return this.tip("df.groupby('category')", 'try');
        }
        const counts = {};
        this.data.projects.forEach((p) => {
            const k = p[col] || '—';
            counts[k] = (counts[k] || 0) + 1;
        });
        this.print(col);
        Object.keys(counts).sort().forEach((k) => {
            this.printHtml(`<span class="term-key">${this.esc(this.trunc(k, 22).padEnd(23))}</span>${this.esc(String(counts[k]).padStart(3))}`);
        });
        this.print('Name: count, dtype: int64', 'term-muted');
    },

    dfValueCounts(arg) {
        const col = this.stringLiteral(arg) || 'tech';
        if (col !== 'tech') {
            this.pyError('KeyError', `'${col}'`);
            return this.tip("df.value_counts('tech')", 'supported column');
        }
        const counts = {};
        this.data.projects.forEach((p) => (p.tech || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
        this.print('tech');
        top.forEach(([t, n]) => {
            this.printHtml(`<span class="term-key">${this.esc(this.trunc(t, 22).padEnd(23))}</span>${this.esc(String(n).padStart(3))}`);
        });
        this.print(`Name: count, dtype: int64  [top 10 of ${Object.keys(counts).length}]`, 'term-muted');
    },

    dfToDict() {
        const { info } = this.data;
        this.print('{');
        this.printHtml(`  <span class="term-key">'name'</span>: <span class="term-muted">'${this.esc(info.name)}'</span>,`);
        this.printHtml(`  <span class="term-key">'role'</span>: <span class="term-muted">'${this.esc(info.title)}'</span>,`);
        this.printHtml(`  <span class="term-key">'projects'</span>: <span class="term-muted">[... ${this.data.projects.length} items]</span>,`);
        this.printHtml(`  <span class="term-key">'skills'</span>: <span class="term-muted">{... ${Object.keys(this.data.skills).length} groups}</span>`);
        this.print('}');
    },

    argInt(arg, dflt) {
        if (!arg) return dflt;
        const m = arg.match(/^(?:n\s*=\s*)?(\d+)$/);
        return m ? Number(m[1]) : dflt;
    },

    /* ---------- model ---------- */
    layers() {
        const out = [];
        [...this.data.education].reverse().forEach((e) => {
            if (e.cgpa) out.push({ name: this.slug(e.degree), type: 'Dense', shape: e.cgpa, note: e.institution });
        });
        [...this.data.experience].reverse().forEach((j) => {
            out.push({ name: this.slug(j.company), type: 'LSTM', shape: String(j.details.length), note: j.role });
        });
        return out;
    },

    slug(s) {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 16);
    },

    paramCount() {
        const d = this.data;
        const tech = new Set();
        d.projects.forEach((p) => (p.tech || []).forEach((t) => tech.add(t)));
        return d.projects.length * 1000 + tech.size * 100 + Object.values(d.skills).flat().length;
    },

    modelSummary() {
        const layers = this.layers();
        this.print(`Model: "${this.slug(this.data.info.name)}"`);
        this.print('_'.repeat(52), 'term-muted');
        this.printHtml(`<span class="term-muted"> ${this.esc('Layer (type)'.padEnd(26))}${this.esc('Output'.padEnd(9))}Detail</span>`);
        this.print('='.repeat(52), 'term-muted');
        layers.forEach((l) => {
            this.printHtml(
                ` <span class="term-key">${this.esc(this.trunc(`${l.name} (${l.type})`, 25).padEnd(26))}</span>` +
                `<span>${this.esc(String(l.shape).padEnd(9))}</span>` +
                `<span class="term-muted">${this.esc(this.trunc(l.note, 24))}</span>`
            );
        });
        this.print('='.repeat(52), 'term-muted');
        this.print(`Total params: ${this.paramCount().toLocaleString('en-US')}`);
        this.print(`Trainable params: ${this.paramCount().toLocaleString('en-US')}`);
        this.print('Non-trainable params: 0');
        this.print('_'.repeat(52), 'term-muted');
        this.tip('model.evaluate()', 'the metrics');
    },

    modelEvaluate() {
        this.print('1/1 [==============================] - 0s', 'term-muted');
        (this.data.stats || []).forEach((s) => {
            this.printHtml(`  <span class="term-key">${this.esc(s.label.padEnd(28))}</span><span class="term-head">${this.esc(s.value)}</span>`);
            if (s.note) this.printHtml(`  <span class="term-muted">  ${this.esc(s.note)}</span>`);
        });
        this.printHtml(`  <span class="term-key">${this.esc('projects shipped'.padEnd(28))}</span><span class="term-head">${this.data.projects.length}</span>`);
        this.print('');
        this.out(`[${(0.977).toFixed(3)}, ${(9.51).toFixed(2)}, ${this.data.projects.length}]`);
    },

    modelPredict(arg) {
        const role = this.stringLiteral(arg);
        if (role === null) {
            this.pyError('ValueError', 'expected a role description as a string');
            return this.tip(`model.predict('Forward Deployed Engineer')`, 'try');
        }
        const corpus = this.corpus();
        const hits = this.score(role, corpus).filter((h) => h.score > 0);
        const conf = Math.min(0.99, 0.72 + hits.length * 0.05);
        this.print(`1/1 [==============================] - 0s`, 'term-muted');
        this.out(`array([${conf.toFixed(2)}], dtype=float32)`);
        this.print('');
        if (hits.length) {
            this.printHtml(`<span class="term-muted"># strongest signals for "${this.esc(this.trunc(role, 32))}"</span>`);
            hits.slice(0, 3).forEach((h) => {
                this.printHtml(`  <span class="term-key">${this.esc(h.source)}</span> <span class="term-muted">· ${this.esc(this.trunc(h.title, 34))}</span>`);
            });
        } else {
            this.print('# no matching signal in the training data — ask rag.query() instead', 'term-muted');
        }
    },

    modelFit(arg) {
        const what = this.stringLiteral(arg) || 'your problem';
        this.print(`Epoch 1/3`, 'term-muted');
        this.print(`7/7 [==============================] - 2s - loss: 0.41`, 'term-muted');
        this.print(`Epoch 2/3`, 'term-muted');
        this.print(`7/7 [==============================] - 1s - loss: 0.12`, 'term-muted');
        this.print(`Epoch 3/3`, 'term-muted');
        this.print(`7/7 [==============================] - 1s - loss: 0.03`, 'term-muted');
        this.print('');
        this.print(`Fitted on "${this.trunc(what, 40)}". Converged — let's talk.`, 'term-muted');
        this.printHtml(`<a class="term-link" href="mailto:${this.esc(this.data.contact.email)}">${this.esc(this.data.contact.email)}</a>`);
    },

    /* ---------- rag ---------- */
    corpus() {
        if (this._corpus) return this._corpus;
        const d = this.data;
        const docs = [];

        d.projects.forEach((p, i) => docs.push({
            source: `projects[${i}]`,
            title: p.title,
            body: [p.description, (p.highlights || []).join(' '), (p.tech || []).join(' '),
                   (p.detail || []).map((x) => `${x.heading} ${x.body}`).join(' ')].join(' '),
            show: () => this.showProject(p, i)
        }));

        d.experience.forEach((j, i) => docs.push({
            source: `experience[${i}]`,
            title: `${j.role} · ${j.company}`,
            body: j.details.join(' '),
            show: () => this.showJob(j, i, true)
        }));

        Object.entries(d.skills).forEach(([g, items]) => docs.push({
            source: `skills['${g}']`,
            title: g,
            body: items.join(' '),
            show: () => this.showGroup(g, items)
        }));

        this._corpus = docs;
        return docs;
    },

    score(query, docs) {
        const stop = new Set(['the', 'and', 'for', 'with', 'what', 'did', 'she', 'her', 'has', 'have', 'was', 'are', 'you', 'your', 'about', 'any', 'how']);
        const terms = query.toLowerCase().match(/[a-z0-9+#.]{2,}/g) || [];
        const q = terms.filter((t) => !stop.has(t));
        if (!q.length) return [];

        return docs.map((doc) => {
            const title = doc.title.toLowerCase();
            const body = doc.body.toLowerCase();
            let hits = 0;
            q.forEach((t) => {
                if (title.includes(t)) hits += 2;
                else if (body.includes(t)) hits += 1;
            });
            return { ...doc, score: hits / (q.length * 2) };
        }).sort((a, b) => b.score - a.score);
    },

    ragQuery(arg) {
        const q = this.stringLiteral(arg);
        if (q === null) {
            this.pyError('TypeError', 'query() takes a string');
            return this.tip(`rag.query('fastapi')`, 'try');
        }

        const hits = this.score(q, this.corpus()).filter((h) => h.score > 0).slice(0, 3);
        if (!hits.length) {
            this.print(`Retrieved 0 chunks for '${q}'`, 'term-muted');
            return this.tip('df.columns', 'nothing matched — try a column instead');
        }

        this.print(`Retrieved ${hits.length} chunks (k=3, metric='cosine')`, 'term-muted');
        this.print('');
        hits.forEach((h) => {
            this.printHtml(
                `  <span class="term-cmd">[${h.score.toFixed(2)}]</span> ` +
                `<span class="term-key">${this.esc(h.source)}</span> ` +
                `<span class="term-head">${this.esc(this.trunc(h.title, 34))}</span>`
            );
            this.printHtml(`         <span class="term-muted">${this.esc(this.trunc(h.body, 120))}</span>`);
            this.print('');
        });
        this.tip(hits[0].source.startsWith('skills') ? `df.${hits[0].source}` : `df.${hits[0].source}`, 'open the top hit');
    },

    /* ---------- builtins ---------- */
    biHelp(arg) {
        if (arg) return this.showObjHelp(arg.trim());

        this.heading('Three objects are in scope');
        this.print('');
        [['df',    'the portfolio as a DataFrame'],
         ['model', 'the career as a fitted estimator'],
         ['rag',   'a retriever over the same data']]
            .forEach(([o, desc]) => this.helpRow(o, desc));

        this.print('');
        this.printHtml(`  <span class="term-key">df — frame</span>`);
        [['df.info()',       'columns, dtypes, non-null counts'],
         ['df.head(n=5)',    'first n projects · .tail() too'],
         ['df.describe()',   'numeric summary'],
         ['df.shape',        'rows x columns · .columns .dtypes'],
         ['df.sample()',     'one project at random'],
         ["df.query(...)",   "category == 'Backend'"],
         ["df.groupby(...)", "counts by 'category'"],
         ["df.value_counts()", 'most-used tech']].forEach(([c, t]) => this.helpRow(c, t));

        this.print('');
        this.printHtml(`  <span class="term-key">df — columns</span>`);
        [['df.name',       'also .role .focus .location .email'],
         ['df.projects',   'also .experience .education .stats'],
         ['df.skills',     'dict — df.skills[\'Backend & APIs\']'],
         ['df.contact',    'every way to reach me'],
         ['df.projects[0]', 'one row in full · [:2] slices · df.iloc[0]']]
            .forEach(([c, t]) => this.helpRow(c, t));

        this.print('');
        this.printHtml(`  <span class="term-key">model / rag</span>`);
        [['model.summary()',  'the career as layers'],
         ['model.evaluate()', 'the headline metrics'],
         ["model.predict(x)", 'fit against a role you describe'],
         ["rag.query('rag')", 'search everything, with citations']]
            .forEach(([c, t]) => this.helpRow(c, t));

        this.print('');
        this.printHtml(`  <span class="term-key">builtins</span>`);
        [['dir(df)', 'every attribute'], ['len(df)', 'row count'],
         ['type(df)', 'the class'], ['clear()', 'clear the screen']]
            .forEach(([c, t]) => this.helpRow(c, t));

        this.print('');
        this.printHtml(`<span class="term-muted">Tab completes · ↑ ↓ recall history · Ctrl+L clears</span>`);
    },

    helpRow(cmd, desc) {
        this.printHtml(`    <span class="term-cmd">${this.esc(cmd.padEnd(20))}</span><span class="term-muted">${this.esc(desc)}</span>`);
    },

    showObjHelp(name) {
        const obj = this.objects[name];
        if (!obj) return this.nameError(name, name);
        this.heading(`Help on ${obj.cls} object:`);
        this.print('');
        this.print(`class ${obj.cls}(builtins.object)`);
        this.printHtml(` |  <span class="term-muted">${this.esc(obj.repr())}</span>`);
        this.print(' |');
        this.print(' |  Methods defined here:');
        Object.keys(obj.members).filter((k) => obj.members[k].type === 'method')
            .forEach((k) => this.printHtml(` |    <span class="term-cmd">${this.esc(k)}()</span>`));
        this.print(' |');
        this.print(' |  Data attributes:');
        this.printHtml(` |    <span class="term-muted">${this.esc(Object.keys(obj.members).filter((k) => obj.members[k].type !== 'method').join(', '))}</span>`);
    },

    biDir(arg) {
        const name = (arg || 'df').trim();
        const obj = this.objects[name];
        if (!obj) return this.nameError(name, name);
        this.out(this.reprList(Object.keys(obj.members).sort()));
        const methods = Object.keys(obj.members).filter((k) => obj.members[k].type === 'method');
        if (methods.length) {
            this.printHtml(`<span class="term-muted">Methods take parentheses: </span><span class="term-cmd">${this.esc(methods.slice(0, 6).map((m) => `${name}.${m}()`).join(', '))}</span>`);
        }
    },

    biLen(arg) {
        const n = this.lengthOf(arg.trim());
        if (n === null) return this.pyError('TypeError', 'object of this type has no len()');
        this.out(String(n));
    },

    biType(arg) {
        const s = (arg || '').trim();
        if (!s) return this.pyError('TypeError', 'type() takes 1 argument');

        if (this.objects[s]) return this.out(`<class 'akurati.${this.objects[s].cls}'>`);
        if (this.stringLiteral(s) !== null) return this.out("<class 'str'>");

        const chain = this.parseChain(s);
        if (chain && chain.path.length === 1 && this.objects[chain.base]) {
            const mem = this.objects[chain.base].members[chain.path[0]];
            if (!mem) return this.attrError(this.objects[chain.base], chain.path[0], chain.base);
            const py = { value: 'str', frame: 'DataFrame', list: 'list', dict: 'dict', method: 'method', indexer: 'object', view: 'Series' }[mem.type];
            return this.out(`<class '${py}'>`);
        }
        const v = this.evalValue(s);
        if (v.ok) return this.out(`<class '${typeof v.value === 'number' ? 'int' : 'str'}'>`);
        return this.pyError('SyntaxError', 'invalid syntax');
    },

    biPrint(arg) {
        if (!arg) return this.print('');
        const v = this.evalValue(arg);
        if (v.ok) return this.print(String(v.value));
        if (v.mem) return this.execute(arg);
        const bare = arg.match(/^([A-Za-z_]\w*)$/);
        if (bare) return this.nameError(bare[1], arg);
        return this.pyError('SyntaxError', 'invalid syntax');
    },

    biRepr(arg) {
        const s = (arg || '').trim();
        if (this.objects[s]) return this.out(`"${this.objects[s].repr()}"`);
        const v = this.evalValue(s);
        if (v.ok) return this.out(v.repr);
        return this.pyError('SyntaxError', 'invalid syntax');
    },

    handleImport(s) {
        const m = s.match(/^import\s+([\w.]+)(?:\s+as\s+(\w+))?$/);
        const f = s.match(/^from\s+([\w.]+)\s+import\s+(.+)$/);
        const mod = m ? m[1] : (f ? f[1] : null);

        if (mod === 'pandas' || mod === 'akurati' || mod === 'numpy') {
            const alias = (m && m[2]) || { pandas: 'pd', numpy: 'np', akurati: 'portfolio' }[mod];
            return this.printHtml(`<span class="term-muted"># already imported — ${this.esc(alias)} is in scope, df is loaded</span>`);
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
        this.pyError('ModuleNotFoundError', `No module named '${mod || s}'`);
        this.printHtml(`<span class="term-muted">this kernel ships </span><span class="term-cmd">pandas</span><span class="term-muted">, </span><span class="term-cmd">numpy</span><span class="term-muted"> and </span><span class="term-cmd">akurati</span>`);
    },

    /* ---------- errors ---------- */
    pyError(kind, msg) {
        this.print('Traceback (most recent call last):', 'term-muted');
        this.print(`  Cell In[${this.cell}], line 1`, 'term-muted');
        this.printHtml(`<span class="term-err">${this.esc(kind)}: ${this.esc(msg)}</span>`);
    },

    nameError(name, src) {
        this.pyError('NameError', `name '${name}' is not defined`);

        const col = this.dfMembers[name];
        if (col) {
            return this.tip(`df.${name}${col.type === 'method' ? '()' : ''}`, 'it is a column on df');
        }
        if (name === 'ak' || name === 'akurati') {
            return this.tip('df', 'the frame is called df');
        }
        if (this.shellWords.includes(name.toLowerCase())) return this.hintShell();
        return this.tip('help()', 'what is in scope');
    },

    attrError(obj, name, base) {
        this.pyError('AttributeError', `'${obj.cls}' object has no attribute '${name}'`);
        this.tip(`dir(${base})`, 'what it does have');
    },

    hintShell() {
        this.printHtml(`<span class="term-muted">this is a notebook kernel, not a shell — try </span><span class="term-cmd">df.info()</span>`);
    },

    tip(code, label) {
        this.printHtml(`<span class="term-muted">${this.esc(label)}: </span><span class="term-cmd">${this.esc(code)}</span>`);
    },

    /* ---------- output helpers ---------- */
    echoCommand(cmd) {
        this.printHtml(`<span class="term-cmd">In [${this.cell}]:</span> <span class="term-head">${this.esc(cmd)}</span>`);
    },

    out(repr) {
        this.printHtml(`<span class="term-key">Out[${this.cell}]:</span> ${this.esc(repr)}`);
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

    reprList(items) { return `[${items.map((s) => `'${s}'`).join(', ')}]`; },

    trunc(s, n) {
        const t = String(s).replace(/\s+/g, ' ').trim();
        return t.length > n ? `${t.slice(0, n - 1)}…` : t;
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
        this.print('Python 3.12.3 · IPython 8.26 · pandas 2.2.2', 'term-muted');
        this.print('');
        ['import pandas as pd', 'from akurati import portfolio', 'df = portfolio.load()']
            .forEach((line, i) => {
                this.printHtml(`<span class="term-cmd">In [${i + 1}]:</span> <span class="term-head">${this.esc(line)}</span>`);
            });
        this.printHtml(`<span class="term-cmd">In [4]:</span> <span class="term-head">df.shape</span>`);
        this.printHtml(`<span class="term-key">Out[4]:</span> (${this.data.projects.length}, ${this.columns.length})`);
        this.print('');
        this.heading(info.name);
        this.printHtml(`<span class="term-muted">${this.esc(info.subtitle)}</span>`);
        this.print('');
        this.printHtml(`<span class="term-muted">Start with </span><span class="term-cmd">df.info()</span><span class="term-muted"> · </span><span class="term-cmd">help()</span><span class="term-muted"> lists everything.</span>`);
        this.print('');
        this.cell = 5;
    },

    /* the projects frame as a narrow table. `pairs` is [[project, index], ...]
       so a filtered or sliced view keeps the original row numbers. */
    projectTable(pairs) {
        this.printHtml(`<span class="term-muted">${this.esc('idx'.padStart(4))}  ${this.esc('title'.padEnd(26))}  ${this.esc('category')}</span>`);
        pairs.forEach(([p, i]) => {
            this.printHtml(
                `<span class="term-muted">${this.esc(String(i).padStart(4))}</span>  ` +
                `<span class="term-head">${this.esc(this.trunc(p.title, 26).padEnd(26))}</span>  ` +
                `<span class="term-key">${this.esc(p.category || '—')}</span>` +
                (p.featured ? ' <span class="term-cmd">★</span>' : '')
            );
        });
    },

    pairs(rows, start = 0) { return rows.map((r, n) => [r, start + n]); },

    showProject(p, i) {
        this.heading(p.title);
        const meta = [p.subtitle, p.org, p.dates].filter(Boolean).join(' · ');
        this.printHtml(`<span class="term-muted">${this.esc(meta)}</span>`);
        if (typeof i === 'number') {
            this.printHtml(`<span class="term-muted">Name: projects[${i}], dtype: ${this.esc(p.category || 'object')}</span>`);
        }
        this.print('');
        this.print(p.description);
        (p.highlights || []).forEach((h, n) => {
            if (n === 0) this.print('');
            this.printHtml(`  <span class="term-muted">▸ ${this.esc(h)}</span>`);
        });
        (p.detail || []).forEach((sec, n) => {
            if (n === 0) this.print('');
            this.printHtml(`  <span class="term-key">${this.esc(sec.heading)}</span>`);
            this.printHtml(`    <span class="term-muted">${this.esc(sec.body)}</span>`);
        });
        if ((p.tech || []).length) {
            this.print('');
            this.printHtml(`  <span class="term-key">${this.esc(p.tech.join(' · '))}</span>`);
        }
        (p.links || []).forEach((l) => {
            this.printHtml(`  <a class="term-link" href="${this.esc(l.href)}" target="_blank" rel="noopener noreferrer">${this.esc(l.label)}</a>`);
        });
    },

    showJob(job, i, full) {
        this.printHtml(`  <span class="term-muted">[${i}]</span> <span class="term-head">${this.esc(job.role)}</span>${job.current ? ' <span class="term-cmd">[current]</span>' : ''}`);
        this.printHtml(`      <span class="term-key">${this.esc(job.company)}</span> <span class="term-muted">· ${this.esc(job.dates)}</span>`);
        (full ? job.details : job.details.slice(0, 2)).forEach((x) => {
            this.printHtml(`      <span class="term-muted">▸ ${this.esc(x)}</span>`);
        });
    },

    showDegree(e, i) {
        this.printHtml(`  <span class="term-muted">[${i}]</span> <span class="term-head">${this.esc(e.degree)}</span>`);
        this.printHtml(`      <span class="term-key">${this.esc(e.institution)}</span> <span class="term-muted">· ${this.esc(e.dates)}</span>`);
        const meta = e.cgpa ? `CGPA ${e.cgpa}` : (e.marks ? `Marks ${e.marks}` : '');
        if (meta) this.printHtml(`      <span class="term-muted">${this.esc(meta)}</span>`);
    },

    showCert(c, i) {
        this.printHtml(`  <span class="term-muted">[${i}]</span> <span class="term-head">${this.esc(c.title)}</span>`);
        this.printHtml(`      <span class="term-muted">${this.esc(c.issuer)} · ${this.esc(c.dates)}</span>`);
    },

    showInternship(x, i) {
        this.printHtml(`  <span class="term-muted">[${i}]</span> <span class="term-head">${this.esc(x.title)}</span>`);
        this.printHtml(`      <span class="term-muted">${this.esc(x.company)} · ${this.esc(x.dates)}</span>`);
    },

    showStat(s, i) {
        this.printHtml(`  <span class="term-muted">[${i}]</span> <span class="term-head">${this.esc(s.value)}</span>  ${this.esc(s.label)}`);
        if (s.note) this.printHtml(`      <span class="term-muted">${this.esc(s.note)}</span>`);
    },

    showGroup(k, items) {
        this.printHtml(`  <span class="term-key">${this.esc(k)}</span>`);
        this.printHtml(`    <span class="term-muted">${this.esc(this.reprList(items))}</span>`);
    },

    showContact() {
        const c = this.data.contact;
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
        if (!this.history.length) return this.print('[]', 'term-muted');
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
