class SignsGame {
    constructor(levelData, onWin) {
        this.data = levelData;
        this.onWin = onWin;
        this.currentPageIndex = 0;
        this.mappings = {};
        this.isSolved = false;
        this.selectedWord = null;
    }

    render() {
        const container = document.getElementById('game-content-area');
        container.innerHTML = `
            <div id="game-root" class="w-full h-full flex flex-row-reverse gap-8">
                <div class="flex-1 flex flex-col relative">
                    <div id="pagination" class="flex gap-2 mb-4"></div>
                    <div id="paper-container" class="paper-texture flex-1 p-16 overflow-y-auto rounded-sm flex flex-col items-center text-zinc-900">
                        <div id="paper-illustration" class="text-6xl mb-4"></div>
                        <div id="paper-content" class="leading-relaxed text-4xl text-center mt-8"></div>
                    </div>
                </div>
                <div id="sidebar" class="w-80 flex flex-col gap-6">
                    <div class="bg-zinc-800 p-6 rounded shadow-lg border border-zinc-700">
                        <h2 class="text-sm uppercase tracking-tighter opacity-50 mb-2">مدخل المعجم</h2>
                        <div id="active-symbol-display" class="text-5xl mb-4 h-16 flex items-center justify-center bg-black/20 rounded ancient-script">?</div>
                        <div id="meaning-options" class="flex flex-col gap-2"></div>
                    </div>
                </div>
            </div>`;
        this.renderPagination();
        this.renderPage();
    }

    renderPagination() {
        const nav = document.getElementById('pagination');
        nav.innerHTML = '';
        this.data.papers.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.className = `w-8 h-8 rounded-full border ${this.currentPageIndex === i ? 'bg-white text-black' : 'border-white/20'}`;
            btn.innerText = i + 1;
            btn.onclick = () => { this.currentPageIndex = i; this.renderPage(); this.renderPagination(); };
            nav.appendChild(btn);
        });
    }

    renderPage() {
        const paper = this.data.papers[this.currentPageIndex];
        document.getElementById('paper-illustration').innerText = paper.image;
        const content = document.getElementById('paper-content');
        content.innerHTML = '';

        if (this.isSolved) {
            content.innerText = paper.finalText;
            return;
        }

        paper.text.split(/(\s+|[،.])/).forEach(rawWord => {
            const clean = rawWord.trim();
            if (!clean) { content.append(' '); return; }
            if (this.data.requiredWords.includes(clean)) {
                const span = document.createElement('span');
                span.className = `word-wrapper ${this.selectedWord === clean ? 'selected' : ''}`;
                const translation = this.mappings[clean];
                span.innerHTML = `<span class="glyph ${translation ? 'translated-text' : 'ancient-script'}">${translation || GlobalDictionary[clean].symbol}</span>`;
                span.onclick = () => this.selectWord(clean);
                content.appendChild(span);
            } else {
                content.appendChild(document.createTextNode(rawWord));
            }
        });
    }

    selectWord(word) {
        this.selectedWord = word;
        const opts = document.getElementById('meaning-options');
        opts.innerHTML = '';
        document.getElementById('active-symbol-display').innerText = GlobalDictionary[word].symbol;
        
        GlobalDictionary[word].options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `w-full text-right p-3 rounded ${this.mappings[word] === opt ? 'bg-teal-700' : 'bg-zinc-700'}`;
            btn.innerText = opt;
            btn.onclick = () => {
                this.mappings[word] = opt;
                this.renderPage();
                this.selectWord(word);
                this.checkWin();
            };
            opts.appendChild(btn);
        });
        this.renderPage();
    }

    checkWin() {
        const win = this.data.requiredWords.every(w => this.mappings[w] === GlobalDictionary[w].options[0]);
        if (win) {
            this.isSolved = true;
            this.renderPage();
            document.getElementById('sidebar').classList.add('fade-out');
            setTimeout(() => this.onWin(), 1000);
        }
    }
}