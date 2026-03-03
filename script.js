document.addEventListener('DOMContentLoaded', () => {
    
    // 1. DYNAMIC COUNTDOWN (13 Days)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 13);

    const updateTimer = () => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        const display = document.getElementById('countdown');
        if (display) {
            display.innerText = `${d.toString().padStart(2,'0')}:${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }
    };
    setInterval(updateTimer, 1000);

    // 2. FIREBASE INITIALIZATION
    const checkFirebase = setInterval(() => {
        if (window.dbFunctions) {
            clearInterval(checkFirebase);
            startApp();
        }
    }, 100);

    function startApp() {
        const { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } = window.dbFunctions;
        const db = window.db;
        const input = document.getElementById('message-input');
        const btn = document.getElementById('post-btn');
        const wall = document.getElementById('wall-messages');

        // Post Logic
        const sendMsg = async () => {
            const val = input.value.trim();
            if (!val) return;

            try {
                await addDoc(collection(db, "messages"), {
                    text: val,
                    time: serverTimestamp()
                });
                input.value = "";
                // Mobile-friendly confetti
                confetti({
                    particleCount: 80,
                    spread: 50,
                    origin: { y: 0.8 }
                });
            } catch (err) { console.error(err); }
        };

        btn.onclick = sendMsg;
        input.onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };

        // Listen Logic
        const q = query(collection(db, "messages"), orderBy("time", "desc"));
        onSnapshot(q, (snap) => {
            wall.innerHTML = "";
            snap.forEach(doc => {
                const d = doc.data();
                const card = document.createElement('div');
                card.className = "p-4 rounded-xl bg-white/5 border border-white/5 text-sm leading-relaxed mb-2 transition-all";
                card.innerHTML = `
                    <p class="text-cyan-50">"${d.text}"</p>
                    <p class="text-[9px] text-slate-500 mt-2 tracking-widest uppercase">Member • Just Now</p>
                `;
                wall.appendChild(card);
            });
        });
    }
});