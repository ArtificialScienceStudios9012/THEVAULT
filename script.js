// --- CONFIG ---
const DELETE_PASSCODE = "16-mar-2012";

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. TIMER LOGIC
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 13);
    setInterval(() => {
        const diff = targetDate - new Date().getTime();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        document.getElementById('countdown').innerText = `${d.toString().padStart(2,'0')}:${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);

    // 2. FIREBASE INITIALIZATION CHECK
    const checkFirebase = setInterval(() => {
        if (window.dbFunctions) {
            clearInterval(checkFirebase);
            initTheVault();
        }
    }, 100);

    function initTheVault() {
        const { ref, push, onValue, serverTimestamp, remove, get } = window.dbFunctions;
        const db = window.db;
        const msgInput = document.getElementById('message-input');
        const postBtn = document.getElementById('post-btn');
        const wall = document.getElementById('wall-messages');
        const messagesRef = ref(db, 'messages');

        // --- GLOBAL EVENT LISTENER (EVENT DELEGATION) ---
        // Yeh sabse important part hai, yeh har trash icon ko detect karega
        document.addEventListener('click', function (e) {
            if (e.target && e.target.classList.contains('delete-trigger')) {
                const msgId = e.target.getAttribute('data-id');
                const userInput = prompt("⚠️ AUTHORIZATION REQUIRED\nEnter Secret Passcode to Delete:");

                if (userInput === DELETE_PASSCODE) {
                    remove(ref(db, `messages/${msgId}`))
                        .then(() => alert("✅ NUKED! Message deleted."))
                        .catch(() => alert("❌ Error!"));
                } else if (userInput !== null) {
                    alert("🚫 ACCESS DENIED! Wrong Code.");
                }
            }
        });

        // POST MESSAGE
        postBtn.onclick = () => {
            const text = msgInput.value.trim();
            const user = localStorage.getItem('vault_user') || 'Guest';
            if (text) {
                push(messagesRef, { content: text, user, timestamp: serverTimestamp() });
                msgInput.value = "";
                if (window.confetti) confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
            }
        };

        // RENDER MESSAGES
        onValue(messagesRef, (snapshot) => {
            wall.innerHTML = "";
            const data = snapshot.val();
            if (data) {
                Object.entries(data).reverse().forEach(([key, msg]) => {
                    const card = document.createElement('div');
                    card.className = "p-4 rounded-xl bg-white/5 border border-white/5 mb-3 relative group";
                    card.innerHTML = `
                        <button type="button" data-id="${key}" class="delete-trigger absolute top-2 right-2 text-red-500/30 hover:text-red-500 p-2 transition-all">🗑️</button>
                        <p class="text-sm text-cyan-50 font-medium pr-8 pointer-events-none">"${msg.content}"</p>
                        <p class="text-[9px] text-cyan-400 mt-2 uppercase font-black tracking-widest pointer-events-none">${msg.user}</p>
                    `;
                    wall.appendChild(card);
                });
            }
        });
    }
});