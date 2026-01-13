class SlidingBrokenGame {
    constructor(levelData, onWin) {
        this.data = levelData;
        this.onWin = onWin;
        this.grid = [];
        this.solvedGrid = [];
        this.isSolved = false;
        this.isAnimating = false;
        this.greenModeActive = false;
        
        // Determine which arrows are "broken" for this specific instance
        this.brokenControls = this.generateBrokenControls();
    }

    generateBrokenControls() {
        const allControls = [
            { type: 'col', idx: 0, dir: -1 }, { type: 'col', idx: 1, dir: -1 }, { type: 'col', idx: 2, dir: -1 },
            { type: 'col', idx: 0, dir: 1 },  { type: 'col', idx: 1, dir: 1 },  { type: 'col', idx: 2, dir: 1 },
            { type: 'row', idx: 0, dir: 1 },  { type: 'row', idx: 1, dir: 1 },  { type: 'row', idx: 2, dir: 1 },
            { type: 'row', idx: 0, dir: -1 }, { type: 'row', idx: 1, dir: -1 }, { type: 'row', idx: 2, dir: -1 }
        ];

        let selection = [];
        let isSolvable = false;

        while (!isSolvable) {
            // Shuffle and pick 2 or 3
            const shuffled = [...allControls].sort(() => 0.5 - Math.random());
            const count = Math.random() > 0.5 ? 3 : 2;
            selection = shuffled.slice(0, count);

            // Check solvability: 
            // A row/col is broken ONLY if BOTH directions for that specific index are in the selection.
            isSolvable = true;
            
            for (let i = 0; i < 3; i++) {
                // Check Row i: Does selection contain BOTH (row, i, 1) and (row, i, -1)?
                const rowBroken = selection.filter(c => c.type === 'row' && c.idx === i);
                if (rowBroken.length === 2) isSolvable = false;

                // Check Col i: Does selection contain BOTH (col, i, 1) and (col, i, -1)?
                const colBroken = selection.filter(c => c.type === 'col' && c.idx === i);
                if (colBroken.length === 2) isSolvable = false;
            }
        }

        return selection;
    }

    isBroken(type, idx, dir) {
        return this.brokenControls.some(c => c.type === type && c.idx === idx && c.dir === dir);
    }

    render() {
        const container = document.getElementById('game-content-area');
        
        // Helper to generate button HTML or a placeholder if broken
        const getBtn = (type, idx, dir, icon) => {
            if (this.isBroken(type, idx, dir)) {
                // We use 'opacity-20' and 'pointer-events-none' to show it's "broken" visually
                return `<div class="control-btn opacity-20 pointer-events-none filter grayscale cursor-not-allowed">${icon}</div>`;
            }
            const func = type === 'row' ? 'shiftRow' : 'shiftCol';
            return `<button onclick="window.currentGame.${func}(${idx}, ${dir})" class="control-btn">${icon}</button>`;
        };

        container.innerHTML = `
            <div id="game-root" class="w-full h-full flex gap-8">
                <div id="sidebar" class="w-[400px] bg-zinc-900 rounded-xl p-6 flex flex-col items-center justify-center">
                    <h2 id="level-title" class="text-xl font-bold mb-2 text-red-400">مصفوفة تالفة</h2>
                    <p class="text-xs mb-8 opacity-50">بعض مسارات التحكم معطلة...</p>
                    
                    <div id="controls-wrapper" class="relative flex flex-col items-center gap-2 transition-all duration-500">
                        <div class="relative flex flex-col items-center gap-2">
                            <div class="flex gap-[44px]">
                                ${getBtn('col', 0, -1, '▲')}
                                ${getBtn('col', 1, -1, '▲')}
                                ${getBtn('col', 2, -1, '▲')}
                            </div>

                            <div class="flex items-center gap-2">
                                <div class="flex flex-col gap-[44px]">
                                    ${getBtn('row', 0, 1, '▶')}
                                    ${getBtn('row', 1, 1, '▶')}
                                    ${getBtn('row', 2, 1, '▶')}
                                </div>

                                <div id="cipher-grid" class="grid-container"></div>

                                <div class="flex flex-col gap-[44px]">
                                    ${getBtn('row', 0, -1, '◀')}
                                    ${getBtn('row', 1, -1, '◀')}
                                    ${getBtn('row', 2, -1, '◀')}
                                </div>
                            </div>

                            <div class="flex gap-[44px]">
                                ${getBtn('col', 0, 1, '▼')}
                                ${getBtn('col', 1, 1, '▼')}
                                ${getBtn('col', 2, 1, '▼')}
                            </div>
                        </div>
                    </div>

                    <div class="mt-12 flex gap-4 w-full px-8">
                        <button onclick="window.currentGame.initGrid()" class="rest flex-1 border border-zinc-700 p-2 rounded text-xs">إعادة تعيين</button>
                        <div id="success-nav" class="hidden animate-fadeIn w-full">
                            <button onclick="GameManager.nextLevel()" class="w-full py-3 rounded font-bold shadow-lg transition-all success-textured-btn">
                                المخطوطة التالية ←
                            </button>
                        </div>
                    </div>
                </div>
                <div class="flex-1 paper-texture flex flex-col items-center justify-center p-12">
                    <div id="paper-illustration" class="text-8xl mb-8">${this.data.emoji}</div>
                    <div id="text-display" class="cipher-text"></div>
                </div>
            </div>`;
        this.initGrid();
    }

    initGrid() {
        this.isSolved = false;
        const textDisplay = document.getElementById('text-display');
        if (textDisplay) {
            textDisplay.classList.remove('solved-ink');
            textDisplay.style.color = "";
        }

        const cleanChars = this.data.text.replace(/[^\u0621-\u064A]/g, '');
        const counts = {};
        for (let c of cleanChars) counts[c] = (counts[c] || 0) + 1;
        
        let targets = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,9).map(e=>e[0]);
        const fillers = "أبتثجحخدذرزسشصضطظعغفقكلمنهوي";
        let fIdx = 0;
        while(targets.length < 9) {
            if(!targets.includes(fillers[fIdx])) targets.push(fillers[fIdx]);
            fIdx++;
        }

        this.solvedGrid = [targets.slice(0,3), targets.slice(3,6), targets.slice(6,9)];
        this.grid = JSON.parse(JSON.stringify(this.solvedGrid));
        
        // Shuffle the grid
        for(let i=0; i<15; i++) {
            if(Math.random() > 0.5) this.shiftRow(Math.floor(Math.random()*3), 1, false);
            else this.shiftCol(Math.floor(Math.random()*3), 1, false);
        }
        this.renderAll();
    }

    shiftRow(idx, dir, check = true) {
        if(this.isSolved || this.isAnimating) return;
        const row = this.grid[idx];
        if (dir === 1) row.push(row.shift());
        else row.unshift(row.pop());
        if (check) this.afterMove();
    }

    shiftCol(idx, dir, check = true) {
        if(this.isSolved || this.isAnimating) return;
        const col = [this.grid[0][idx], this.grid[1][idx], this.grid[2][idx]];
        if (dir === 1) col.unshift(col.pop());
        else col.push(col.shift());
        [this.grid[0][idx], this.grid[1][idx], this.grid[2][idx]] = col;
        if (check) this.afterMove();
    }

    afterMove() {
        this.renderAll();
        if (JSON.stringify(this.grid) === JSON.stringify(this.solvedGrid)) {
            this.isSolved = true;
            if (typeof HintSystem !== 'undefined') HintSystem.reset();
            document.getElementById('sidebar')?.classList.add('hide-arrows');
            document.getElementById('text-display')?.classList.add('solved-ink');
            setTimeout(() => { if(this.onWin) this.onWin(); }, 1000);
        }
    }

    renderAll() {
        this.renderGrid();
        this.renderText();
    }

    renderGrid() {
        const container = document.getElementById('cipher-grid');
        container.innerHTML = '';
        const flatSolved = this.solvedGrid.flat();

        this.grid.flat().forEach((char, i) => {
            const div = document.createElement('div');
            div.className = 'grid-cell';
            if (this.greenModeActive && char === flatSolved[i]) {
                div.style.color = "#4ade80";
                div.style.borderColor = "#4ade80";
            }
            div.innerText = char;
            container.appendChild(div);
        });
    }

    renderText() {
        const display = document.getElementById('text-display');
        const map = {};
        this.solvedGrid.flat().forEach((char, i) => map[char] = this.grid.flat()[i]);
        
        display.innerHTML = this.data.text.split('').map(char => {
            if (map[char]) {
                const statusClass = this.isSolved ? 'solved-ink' : 'encrypted';
                return `<span class="${statusClass}">${map[char]}</span>`;
            }
            return char;
        }).join('');
    }

    provideHint(stage) {
        if (stage === 0) {
            const firstRow = this.solvedGrid[0].join(' - ');
            this.showStickyHint("أحرف الصف الأول هي: " + firstRow);
        } else if (stage === 1) {
            this.greenModeActive = true;
            this.renderGrid();
        }
    }

    showStickyHint(message) {
        const existing = document.querySelector('.parchment-hint');
        if (existing) existing.remove();
        const hintEl = document.createElement('div');
        hintEl.className = 'parchment-hint';
        hintEl.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(hintEl);
    }

    autoSolve() {
        this.grid = JSON.parse(JSON.stringify(this.solvedGrid));
        this.renderAll();
        this.afterMove();
    }
}