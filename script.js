document.addEventListener('DOMContentLoaded', () => {
    
    // 1. INITIALIZE 3D TILT
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
            max: 8,
            speed: 1000,
            glare: true,
            "max-glare": 0.15,
        });
    }

    // 2. CUSTOM CURSOR
    const cursor = document.getElementById('custom-cursor');
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
    });

    document.querySelectorAll('button, input, .glass-card').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.style.transform = 'scale(2.5)');
        el.addEventListener('mouseleave', () => cursor.style.transform = 'scale(1)');
    });

    // 3. COUNTDOWN (Target: 13 Days from today)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 13);

    const updateTimer = () => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('countdown').innerText = 
            `${d.toString().padStart(2,'0')}:${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    };
    setInterval(updateTimer, 1000);

    // 4. FIREBASE LOGIC
    // Waiting for Firebase to load from HTML
    const checkFirebase = setInterval(() => {
        if (window.dbFunctions) {
            clearInterval(checkFirebase);
            initWall();
        }
    }, 100);

    function initWall() {
        const { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } = window.dbFunctions;
        const db = window.db;
        const msgInput = document.getElementById('message-input');
        const postBtn = document.getElementById('post-btn');
        const wall = document.getElementById('wall-messages');

        // Sending Message
        const postMessage = async () => {
            const text = msgInput.value.trim();
            if (text === "") return alert("Kuch likho toh sahi! 😂");

            try {
                await addDoc(collection(db, "messages"), {
                    content: text,
                    timestamp: serverTimestamp()
                });
                msgInput.value = "";
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#22d3ee', '#8b5cf6']
                });
            } catch (err) { console.error(err); }
        };

        postBtn.onclick = postMessage;
        msgInput.onkeypress = (e) => { if(e.key === 'Enter') postMessage(); };

        // Receiving Messages (Real-time)
        const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
        onSnapshot(q, (snapshot) => {
            wall.innerHTML = "";
            snapshot.forEach(doc => {
                const data = doc.data();
                const div = document.createElement('div');
                div.className = "p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 transform translate-y-2 animate-in fade-in fill-mode-forwards";
                div.innerHTML = `
                    <p class="text-sm text-cyan-100 font-medium">"${data.content}"</p>
                    <p class="text-[10px] text-slate-500 mt-2 uppercase tracking-tighter">Verified Ghost • Realtime</p>
                `;
                wall.appendChild(div);
            });
        });
    }
});