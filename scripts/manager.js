const UIManager = {
    modal: null,
    contentArea: null,

    init() {
        this.createModalElements();
        this.showTutorial();
    },

    createModalElements() {
        const gearBtn = document.createElement('button');
        gearBtn.innerHTML = '<i class="fa-solid fa-sliders"></i>';
        gearBtn.className = 'gear-btn';
        gearBtn.onclick = () => this.showSettingsMenu();
        document.body.appendChild(gearBtn);

        this.modal = document.createElement('div');
        this.modal.className = 'modal-overlay hidden';
        
        const container = document.createElement('div');
        container.className = 'modal-container';
        
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'modal-content';
        
        container.appendChild(this.contentArea);
        this.modal.appendChild(container);
        document.body.appendChild(this.modal);
    },

    showTutorial() {
        this.contentArea.innerHTML = `
            <h2 class="text-2xl font-bold mb-4 text-teal-400">كيفية اللعب</h2>
            <p class="mb-6 leading-relaxed">أهلاً بك أيها المترجم. مهمتك هي فك تشفير النصوص القديمة.</p>
            <p class="mb-6 leading-relaxed text-teal-400"><strong>استخدم الأسهم لتحريك الحروف. عندما تٌرتب بشكل صحيح، سينكشف السر.</strong></p>
            <button onclick="UIManager.hide()" class="modal-btn-primary">فهمت!</button>
        `;
        this.show();
    },

    showSettingsMenu() {
        let hintButtonHTML = '';
        const is1DGame = window.currentGame && window.currentGame.constructor.name === "Sliding1DGame";

        if (HintSystem.hintAvailableInMenu && !is1DGame) {
            hintButtonHTML = `<button onclick="HintSystem.showHintPopup()" class="modal-btn-secondary text-amber-400">💡 طلب المساعدة الحالية</button>`;
        }

        this.contentArea.innerHTML = `
            <h2 class="text-2xl font-bold mb-6 text-teal-400">القائمة</h2>
            <div class="flex flex-col gap-4">
                ${hintButtonHTML}
                <button onclick="UIManager.showTutorial()" class="modal-btn-secondary"><i class="fa-solid fa-book-bookmark"></i> طريقة اللعب</button>
                <button onclick="UIManager.showResetConfirmation()" class="modal-btn-secondary border-red-900 text-red-400"><i class="fa-solid fa-arrows-rotate"></i> إعادة تشغيل اللعبة</button>
                <button onclick="UIManager.hide()" class="modal-btn-secondary">إغلاق</button>
            </div>
        `;
        this.show();
    },

    showResetConfirmation() {
        this.contentArea.innerHTML = `
            <h2 class="text-2xl font-bold mb-4 text-red-500">تنبيه!</h2>
            <p class="mb-6 leading-relaxed">هل أنت متأكد؟ إعادة التشغيل ستؤدي إلى فقدان جميع التقدم الذي أحرزته في فك الشفرات والعودة للمستوى الأول.</p>
            <div class="flex gap-4">
                <button onclick="location.reload()" class="modal-btn-primary bg-red-600 hover:bg-red-700 flex-1">نعم، أعد التشغيل</button>
                <button onclick="UIManager.showSettingsMenu()" class="modal-btn-secondary flex-1">تراجع</button>
            </div>
        `;
    },

    show() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    },

    hide() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
    }
};

const HintSystem = {
    timer: null,
    stage: 0, 
    thresholds: [120, 120, 180], // Time in seconds
    hintAvailableInMenu: false,

    startLevelTimer() {
        this.reset();
        this.tick();
    },

    reset() {
        clearTimeout(this.timer);
        this.stage = 0;
        this.hintAvailableInMenu = false;
        const skipBtn = document.getElementById('skip-level-btn');
        if (skipBtn) skipBtn.remove();
    },

    tick() {
        if (this.stage > 2) return; 
        const timeInMs = this.thresholds[this.stage] * 1000;
        this.timer = setTimeout(() => this.handleTimeout(), timeInMs);
    },

    handleTimeout() {
        this.hintAvailableInMenu = true;
        this.showHintPopup();
    },

    showHintPopup() {
        if (this.stage === 2) {
            this.showSkipButton();
            return;
        }

        const msgs = [
            "يبدو أن هذه المخطوطة معقدة.. هل تحتاج إلى معرفة أحرف الصف الأول؟",
            "لا تقلق، الرنين يزداد وضوحاً. هل تريد تفعيل خاصية كشف المواقع الصحيحة؟"
        ];

        this.contentArea = document.getElementById('modal-content');
        this.contentArea.innerHTML = `
            <h2 class="text-xl font-bold mb-4 text-amber-400">مساعدة من الأثر</h2>
            <p class="mb-6">${msgs[this.stage]}</p>
            <div class="flex gap-4">
                <button onclick="HintSystem.executeHint()" class="modal-btn-primary flex-1">نعم</button>
                <button onclick="HintSystem.declineHint()" class="modal-btn-secondary flex-1">ليس الآن</button>
            </div>
        `;
        UIManager.show();
    },

    executeHint() {
        if (window.currentGame && typeof window.currentGame.provideHint === 'function') {
            window.currentGame.provideHint(this.stage);
        }
        UIManager.hide();
        this.hintAvailableInMenu = false;
        this.stage++;
        this.tick();
    },

    declineHint() {
        UIManager.hide();
        // Reset timer for the same stage
        clearTimeout(this.timer);
        this.tick();
    },

    showSkipButton() {
        const oldBtn = document.getElementById('skip-level-btn');
        if (oldBtn) oldBtn.remove();

        const btn = document.createElement('button');
        btn.id = 'skip-level-btn';
        btn.innerHTML = 'فك شيفرة المخطوطة ✨'; 
        btn.className = 'fixed bottom-8 right-8 bg-zinc-900 border-2 border-teal-600 text-teal-400 px-6 py-3 rounded-full font-bold hover:bg-teal-950 transition-all z-50 shadow-[0_0_15px_rgba(20,184,166,0.4)]';
        btn.onclick = () => {
            if (window.currentGame && typeof window.currentGame.autoSolve === 'function') {
                window.currentGame.autoSolve();
                btn.remove();
            }
        };
        document.body.appendChild(btn);
    }
};

window.addEventListener('DOMContentLoaded', () => UIManager.init());