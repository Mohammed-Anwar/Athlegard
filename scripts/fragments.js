class FragmentsGame {
    constructor(levelData, onWin) {
        this.data = levelData; // البيانات من levels.js
        this.onWin = onWin;
        this.slots = Array(this.data.totalSlots).fill(null);
        this.sidebarItems = [];
        this.isSolved = false;
    }

    render() {
        const container = document.getElementById('game-content-area');
        container.innerHTML = `
            <div id="game-root" class="w-full h-full flex gap-8">
                <div id="sidebar" class="w-80 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 overflow-y-auto">
                    <h2 class="text-xs uppercase tracking-widest opacity-40 mb-4 text-center">قطع المخطوطة</h2>
                    <div id="fragment-pool" class="flex flex-col gap-3"></div>
                </div>

                <div class="flex-1 paper-texture p-12 overflow-y-auto relative">
                    <div id="manuscript-assembly" class="max-w-2xl mx-auto flex flex-col gap-4"></div>
                </div>
            </div>`;
        
        this.initLogic();
    }

    initLogic() {
        // تجهيز القطع: نأخذ فقط القطع التي يجب على اللاعب وضعها
        this.sidebarItems = this.data.fragments.map(f => ({ ...f }));
        
        // توزيع القطع المثبتة مسبقاً في Slots
        if (this.data.preplaced) {
            this.data.preplaced.forEach(p => {
                this.slots[p.index] = { ...p, isFixed: true };
            });
        }

        this.renderPool();
        this.renderSlots();
    }

    renderPool() {
        const pool = document.getElementById('fragment-pool');
        pool.innerHTML = '';
        this.sidebarItems.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = "bg-zinc-800 p-4 rounded cursor-grab active:cursor-grabbing border border-zinc-700 hover:border-teal-500 transition-colors text-sm leading-relaxed";
            el.draggable = true;
            el.innerText = item.text;
            el.ondragstart = (e) => e.dataTransfer.setData('text/plain', `pool-${i}`);
            pool.appendChild(el);
        });
    }

    renderSlots() {
        const assembly = document.getElementById('manuscript-assembly');
        assembly.innerHTML = '';

        this.slots.forEach((content, i) => {
            const slot = document.createElement('div');
            // إذا كانت الخانة فارغة أو تحتوي على قطعة وضعها اللاعب أو قطعة مثبتة
            slot.className = `min-h-[80px] p-4 rounded border-2 border-dashed transition-all flex items-center justify-center text-center
                ${content ? 'border-transparent bg-black/5' : 'border-black/10'}`;
            
            if (content) {
                slot.innerHTML = `<p class="text-lg ${content.isFixed ? 'font-bold opacity-100' : 'text-zinc-700'}">${content.text}</p>`;
                if (!content.isFixed) {
                    slot.draggable = true;
                    slot.classList.add('cursor-move');
                    slot.ondragstart = (e) => e.dataTransfer.setData('text/plain', `slot-${i}`);
                }
            } else {
                slot.innerHTML = `<span class="opacity-20 text-xs">موضع قطعة مفقودة</span>`;
            }

            // منطق الإسقاط والتبديل
            slot.ondragover = (e) => e.preventDefault();
            slot.ondrop = (e) => this.handleDrop(e, i);

            assembly.appendChild(slot);
        });
    }

    handleDrop(e, targetIndex) {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        const [sourceType, sourceIndex] = data.split('-');
        const idx = parseInt(sourceIndex);

        // منع التعديل على القطع المثبتة مسبقاً
        if (this.slots[targetIndex]?.isFixed) return;

        let draggedItem;

        if (sourceType === 'pool') {
            draggedItem = this.sidebarItems.splice(idx, 1)[0];
            // إذا كان المكان المستهدف فيه قطعة أصلاً، نعيدها للجانب
            if (this.slots[targetIndex]) {
                this.sidebarItems.push(this.slots[targetIndex]);
            }
            this.slots[targetIndex] = draggedItem;
        } else if (sourceType === 'slot') {
            // منطق التبديل (Swap) بين خانتين
            const temp = this.slots[targetIndex];
            this.slots[targetIndex] = this.slots[idx];
            this.slots[idx] = temp;
        }

        this.renderPool();
        this.renderSlots();
        this.checkWin();
    }

    checkWin() {
        // التحقق من أن كل الخانات ممتلئة وأن الترتيب (correctIndex) مطابق
        const allFilled = this.slots.every(s => s !== null);
        if (!allFilled) return;

        const isCorrect = this.slots.every((s, i) => s.correctIndex === i);
        
        if (isCorrect && !this.isSolved) {
            this.isSolved = true;
            document.getElementById('sidebar').classList.add('fade-out');
            setTimeout(() => this.onWin(), 800);
        }
    }
}