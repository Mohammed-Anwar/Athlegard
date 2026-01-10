class SlidingGame {
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
                    <h2 class="text-xl font-bold mb-8 opacity-70">مصفوفة التشفير</h2>
                    
                    <div id="controls-wrapper" class="relative flex flex-col items-center gap-2 transition-all duration-500">

                        <div class="relative flex flex-col items-center gap-2">
                            <div class="flex gap-[44px]">
                                <button onclick="currentGame.shiftCol(0, -1)" class="control-btn">▲</button>
                                <button onclick="currentGame.shiftCol(1, -1)" class="control-btn">▲</button>
                                <button onclick="currentGame.shiftCol(2, -1)" class="control-btn">▲</button>
                            </div>

                            <div class="flex items-center gap-2">
                                <div class="flex flex-col gap-[44px]">
                                    <button onclick="currentGame.shiftRow(0, 1)" class="control-btn">▶</button>
                                    <button onclick="currentGame.shiftRow(1, 1)" class="control-btn">▶</button>
                                    <button onclick="currentGame.shiftRow(2, 1)" class="control-btn">▶</button>
                                </div>

                                <div id="cipher-grid" class="grid-container"></div>

                                <div class="flex flex-col gap-[44px]">
                                    <button onclick="currentGame.shiftRow(0, -1)" class="control-btn">◀</button>
                                    <button onclick="currentGame.shiftRow(1, -1)" class="control-btn">◀</button>
                                    <button onclick="currentGame.shiftRow(2, -1)" class="control-btn">◀</button>
                                </div>
                            </div>

                            <div class="flex gap-[44px]">
                                <button onclick="currentGame.shiftCol(0, 1)" class="control-btn">▼</button>
                                <button onclick="currentGame.shiftCol(1, 1)" class="control-btn">▼</button>
                                <button onclick="currentGame.shiftCol(2, 1)" class="control-btn">▼</button>
                            </div>
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
            textDisplay.style.color = ""; // Reset color
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
        
        // Initial Scramble
        for(let i=0; i<12; i++) {
            if(Math.random() > 0.5) this.shiftRow(Math.floor(Math.random()*3), 1, false);
            else this.shiftCol(Math.floor(Math.random()*3), 1, false);
        }
        this.renderAll();
    }

    shiftRow(idx, dir, check = true) {
        if(this.isSolved || this.isAnimating) return;
        
        if (check) {
            this.isAnimating = true;
            this.animateRow(idx, dir);
            
            setTimeout(() => {
                const row = this.grid[idx];
                if (dir === 1) row.push(row.shift());
                else row.unshift(row.pop());
                this.isAnimating = false;
                this.afterMove();
            }, 250);
        } else {
            const row = this.grid[idx];
            if (dir === 1) row.push(row.shift());
            else row.unshift(row.pop());
        }
    }

    animateRow(rowIdx, dir) {
        const container = document.getElementById('cipher-grid');
        const cells = container.querySelectorAll('.grid-cell');
        
        // Get cells in this row (indices: rowIdx*3, rowIdx*3+1, rowIdx*3+2)
        const startIdx = rowIdx * 3;
        const rowCells = [cells[startIdx], cells[startIdx + 1], cells[startIdx + 2]];
        
        // dir === 1 means shift right (◀ button), dir === -1 means shift left (▶ button)
        const animClass = dir === 1 ? 'animate-row-right' : 'animate-row-left';
        const wrapClass = dir === 1 ? 'wrap-right' : 'wrap-left';
        
        // The wrapping cell is the one that will disappear and reappear
        const wrapIdx = dir === 1 ? 2 : 0; // rightmost wraps when going right, leftmost wraps when going left
        
        rowCells.reverse().forEach((cell, i) => {
            if (i === wrapIdx) {
                cell.classList.add(wrapClass);
            } else {
                cell.classList.add(animClass);
            }
        });
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

    animateCol(colIdx, dir) {
        const container = document.getElementById('cipher-grid');
        const cells = container.querySelectorAll('.grid-cell');
        
        // Get cells in this column (indices: colIdx, colIdx+3, colIdx+6)
        const colCells = [cells[colIdx], cells[colIdx + 3], cells[colIdx + 6]];
        
        // dir === 1 means shift down (▲ button), dir === -1 means shift up (▼ button)
        const animClass = dir === 1 ? 'animate-col-down' : 'animate-col-up';
        const wrapClass = dir === 1 ? 'wrap-down' : 'wrap-up';
        
        // The wrapping cell
        const wrapIdx = dir === 1 ? 2 : 0; // bottom wraps when going down, top wraps when going up
        
        colCells.forEach((cell, i) => {
            if (i === wrapIdx) {
                cell.classList.add(wrapClass);
            } else {
                cell.classList.add(animClass);
            }
        });
    }

    afterMove() {
        this.renderAll();
        
        if (JSON.stringify(this.grid) === JSON.stringify(this.solvedGrid)) {
            this.isSolved = true;
            this.renderAll();

            // 1. This triggers the CSS to hide arrows AND the Reset button
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.add('hide-arrows');

            // 2. Apply the green color and scale effect
            const textDisplay = document.getElementById('text-display');
            if (textDisplay) textDisplay.classList.add('text-win-animation');

            // 3. Proceed to the next step after the animation
            setTimeout(() => {
                if(this.onWin) this.onWin();
            }, 1000);
        }
    }

    renderAll() {
        this.renderGrid();
        this.renderText();
    }

    renderGrid() {
        const container = document.getElementById('cipher-grid');
        container.innerHTML = '';
        this.grid.flat().forEach(char => {
            const div = document.createElement('div');
            div.className = 'grid-cell';
            div.innerText = char;
            container.appendChild(div);
        });
    }

    renderText() {
        const display = document.getElementById('text-display');
        const map = {};
        this.solvedGrid.flat().forEach((char, i) => map[char] = this.grid.flat()[i]);
        
        display.innerHTML = this.data.text.split('').map(char => {
            // If game is solved, we use a specific class for the letters
            if (map[char]) {
                const statusClass = this.isSolved ? 'text-green-500 font-bold' : 'encrypted';
                return `<span class="${statusClass}">${map[char]}</span>`;
            }
            return char;
        }).join('');
    }
}