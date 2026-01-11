class Sliding1DGame {
    constructor(levelData, onWin) {
        this.data = levelData;
        this.onWin = onWin;
        this.grid = []; // Now a 1D array [char1, char2, char3]
        this.solvedGrid = [];
        this.isSolved = false;
        this.isAnimating = false;
    }

    render() {
        const container = document.getElementById('game-content-area');
        container.innerHTML = `
            <div id="game-root" class="w-full h-full flex gap-8">
                <div id="sidebar" class="w-[400px] bg-zinc-900 rounded-xl p-6 flex flex-col items-center justify-center">
                    <h2 id="level-title" class="text-xl font-bold mb-8 opacity-70">مصفوفة التشفير</h2>
                    
                    <div id="controls-wrapper" class="relative flex flex-col items-center gap-2">
                        <div class="flex items-center gap-4">
                            <button onclick="currentGame.shiftRow(1)" class="control-btn">▶</button>

                            <div id="cipher-grid" class="flex gap-2"></div>

                            <button onclick="currentGame.shiftRow(-1)" class="control-btn">◀</button>
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
        if (sidebar) sidebar.classList.remove('hide-arrows');

        // Extract most frequent characters for a 3-character target
        const cleanChars = this.data.text.replace(/[^\u0621-\u064A]/g, '');
        const counts = {};
        for (let c of cleanChars) counts[c] = (counts[c] || 0) + 1;
        
        let targets = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
        const fillers = "أبتثجحخدذرزسشصضطظعغفقكلمنهوي";
        let fIdx = 0;
        while(targets.length < 3) {
            if(!targets.includes(fillers[fIdx])) targets.push(fillers[fIdx]);
            fIdx++;
        }

        this.solvedGrid = [...targets];
        this.grid = [...targets];
        
        // Initial Scramble (just shifting a few times)
        for(let i=0; i<5; i++) {
            this.shiftRow(1, false);
        }
        this.renderAll();
    }

    shiftRow(dir, check = true) {
        if(this.isSolved || (this.isAnimating)) return;
        
        if (check) {
            this.isAnimating = true;
            // Simple logic for 1x3: shift elements in the array
            if (dir === 1) this.grid.push(this.grid.shift());
            else this.grid.unshift(this.grid.pop());

            // Set a short delay to simulate animation feel if desired
            setTimeout(() => {
                this.isAnimating = false;
                this.afterMove();
            }, 150);
        } else {
            if (dir === 1) this.grid.push(this.grid.shift());
            else this.grid.unshift(this.grid.pop());
        }
    }

    afterMove() {
        this.renderAll();
        
        if (JSON.stringify(this.grid) === JSON.stringify(this.solvedGrid)) {
            this.isSolved = true;
            this.renderAll();
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.add('hide-arrows');

            const textDisplay = document.getElementById('text-display');
            if (textDisplay) textDisplay.classList.add('text-win-animation');

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
        this.grid.forEach(char => {
            const div = document.createElement('div');
            // Reusing your grid-cell class
            div.className = 'grid-cell w-16 h-16 flex items-center justify-center border-2 border-zinc-700 rounded-lg text-2xl bg-zinc-800';
            div.innerText = char;
            container.appendChild(div);
        });
    }

    renderText() {
        const display = document.getElementById('text-display');
        const map = {};
        this.solvedGrid.forEach((char, i) => map[char] = this.grid[i]);
        
        display.innerHTML = this.data.text.split('').map(char => {
            if (map[char]) {
                const statusClass = this.isSolved ? 'text-green-500 font-bold' : 'encrypted';
                return `<span class="${statusClass}">${map[char]}</span>`;
            }
            return char;
        }).join('');
    }
}