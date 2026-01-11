class SlidingCrossGame {
    constructor(levelData, onWin) {
        this.data = levelData;
        this.onWin = onWin;
        this.grid = [];
        this.solvedGrid = [];
        this.isSolved = false;
        this.isAnimating = false;
    }

    render() {
        const container = document.getElementById('game-content-area');
        container.innerHTML = `
            <div id="game-root" class="w-full h-full flex gap-8">
                <div id="sidebar" class="w-[400px] bg-zinc-900 rounded-xl p-6 flex flex-col items-center justify-center">
                    <h2 id="level-title" class="text-xl font-bold mb-8 opacity-70">التشفير المتقاطع</h2>
                    
                    <div id="controls-wrapper" class="relative flex flex-col items-center gap-2 transition-all duration-500">
                        <div class="flex">
                            <button onclick="currentGame.shiftCol(1, -1)" class="control-btn">▲</button>
                        </div>

                        <div class="flex items-center gap-2">
                            <div class="flex flex-col">
                                <button onclick="currentGame.shiftRow(1, 1)" class="control-btn">▶</button>
                            </div>

                            <div id="cipher-grid" class="grid grid-cols-3 gap-2 p-2"></div>

                            <div class="flex flex-col">
                                <button onclick="currentGame.shiftRow(1, -1)" class="control-btn">◀</button>
                            </div>
                        </div>

                        <div class="flex">
                            <button onclick="currentGame.shiftCol(1, 1)" class="control-btn">▼</button>
                        </div>
                    </div>

                    <div class="mt-12 flex gap-4 w-full px-8">
                        <button onclick="currentGame.initGrid()" class="flex-1 border border-zinc-700 p-2 rounded text-xs">إعادة تعيين</button>
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
        const sidebar = document.getElementById('sidebar');
        const textDisplay = document.getElementById('text-display');
        
        if (sidebar) sidebar.classList.remove('hide-arrows');
        if (textDisplay) {
            textDisplay.classList.remove('text-win-animation');
            textDisplay.style.color = "";
        }

        const cleanChars = this.data.text.replace(/[^\u0621-\u064A]/g, '');
        const counts = {};
        for (let c of cleanChars) counts[c] = (counts[c] || 0) + 1;
        
        let targets = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(e=>e[0]);
        const fillers = "أبتثجحخدذرزسشصضطظعغفقكلمنهوي";
        let fIdx = 0;
        while(targets.length < 5) {
            if(!targets.includes(fillers[fIdx])) targets.push(fillers[fIdx]);
            fIdx++;
        }

        // Layout mapping for + sign:
        // [null, T0, null]
        // [T1,   T2, T3  ]
        // [null, T4, null]
        this.solvedGrid = [
            [null, targets[0], null],
            [targets[1], targets[2], targets[3]],
            [null, targets[4], null]
        ];
        this.grid = JSON.parse(JSON.stringify(this.solvedGrid));
        
        // Initial Scramble
        for(let i=0; i<12; i++) {
            if(Math.random() > 0.5) this.shiftRow(1, 1, false);
            else this.shiftCol(1, 1, false);
        }
        this.renderAll();
    }

    shiftRow(idx, dir, check = true) {
        if(this.isSolved || this.isAnimating) return;
        
        if (check) {
            this.isAnimating = true;
            this.animateRow(idx, dir);
            
            setTimeout(() => {
                const row = [this.grid[idx][0], this.grid[idx][1], this.grid[idx][2]];
                if (dir === 1) row.push(row.shift());
                else row.unshift(row.pop());
                this.grid[idx] = row;
                this.isAnimating = false;
                this.afterMove();
            }, 250);
        } else {
            const row = [this.grid[idx][0], this.grid[idx][1], this.grid[idx][2]];
            if (dir === 1) row.push(row.shift());
            else row.unshift(row.pop());
            this.grid[idx] = row;
        }
    }

    shiftCol(idx, dir, check = true) {
        if(this.isSolved || this.isAnimating) return;
        
        if (check) {
            this.isAnimating = true;
            this.animateCol(idx, dir);
            
            setTimeout(() => {
                const col = [this.grid[0][idx], this.grid[1][idx], this.grid[2][idx]];
                if (dir === 1) col.unshift(col.pop());
                else col.push(col.shift());
                [this.grid[0][idx], this.grid[1][idx], this.grid[2][idx]] = col;
                this.isAnimating = false;
                this.afterMove();
            }, 250);
        } else {
            const col = [this.grid[0][idx], this.grid[1][idx], this.grid[2][idx]];
            if (dir === 1) col.unshift(col.pop());
            else col.push(col.shift());
            [this.grid[0][idx], this.grid[1][idx], this.grid[2][idx]] = col;
        }
    }

    animateRow(rowIdx, dir) {
        const container = document.getElementById('cipher-grid');
        const cells = container.querySelectorAll('.grid-cell-active');
        const animClass = dir === 1 ? 'animate-row-right' : 'animate-row-left';
        
        cells.forEach(cell => {
            if (parseInt(cell.dataset.row) === rowIdx) {
                cell.classList.add(animClass);
            }
        });
    }

    animateCol(colIdx, dir) {
        const container = document.getElementById('cipher-grid');
        const cells = container.querySelectorAll('.grid-cell-active');
        const animClass = dir === 1 ? 'animate-col-down' : 'animate-col-up';
        
        cells.forEach(cell => {
            if (parseInt(cell.dataset.col) === colIdx) {
                cell.classList.add(animClass);
            }
        });
    }

    afterMove() {
        this.renderAll();
        if (JSON.stringify(this.grid) === JSON.stringify(this.solvedGrid)) {
            this.isSolved = true;
            this.renderAll();
            document.getElementById('sidebar')?.classList.add('hide-arrows');
            document.getElementById('text-display')?.classList.add('text-win-animation');
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
        
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const char = this.grid[r][c];
                const div = document.createElement('div');
                
                // Fixed size 64x64px
                div.style.width = '64px';
                div.style.height = '64px';

                if (char === null) {
                    div.className = 'opacity-0'; // Spacer cell
                } else {
                    div.className = 'grid-cell grid-cell-active';
                    div.innerText = char;
                    div.dataset.row = r;
                    div.dataset.col = c;
                }
                container.appendChild(div);
            }
        }
    }

    renderText() {
        const display = document.getElementById('text-display');
        const map = {};
        const positions = [[0,1], [1,0], [1,1], [1,2], [2,1]];
        positions.forEach(pos => {
            const solvedChar = this.solvedGrid[pos[0]][pos[1]];
            const currentChar = this.grid[pos[0]][pos[1]];
            map[solvedChar] = currentChar;
        });
        
        display.innerHTML = this.data.text.split('').map(char => {
            if (map[char]) {
                const statusClass = this.isSolved ? 'text-green-500 font-bold' : 'encrypted';
                return `<span class="${statusClass}">${map[char]}</span>`;
            }
            return char;
        }).join('');
    }
}