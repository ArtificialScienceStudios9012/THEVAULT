document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. DYNAMIC COUNTDOWN (13 Days) ---
    // Target date: Aaj se exactly 13 din baad
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
    updateTimer(); // Initial call


    // --- 2. FIREBASE REALTIME DATABASE LOGIC ---
    // Check karte hain jab tak Firebase HTML se load na ho jaye
    const checkFirebase = setInterval(() => {
        if (window.dbFunctions) {
            clearInterval(checkFirebase);
            initTheVault();
        }
    }, 100);

    function initTheVault() {
        // Firebase functions ko window se nikalna
        const { ref, push, onValue, serverTimestamp } = window.dbFunctions;
        const db = window.db;
        
        const msgInput = document.getElementById('message-input');
        const postBtn = document.getElementById('post-btn');
        const wall = document.getElementById('wall-messages');
        
        // 'messages' naam ka path create hoga database mein
        const messagesRef = ref(db, 'messages');

        // --- A. MESSAGE BHEJNA ---
        const postMessage = () => {
            const text = msgInput.value.trim();
            
            if (text !== "") {
                // Database mein data push karna
                push(messagesRef, {
                    content: text,
                    timestamp: serverTimestamp()
                }).then(() => {
                    msgInput.value = ""; // Input saaf karna
                    
                    // Celebration Confetti!
                    if (typeof confetti === 'function') {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.8 },
                            colors: ['#22d3ee', '#8b5cf6', '#ffffff']
                        });
                    }
                }).catch((error) => {
                    console.error("Data push failed: ", error);
                    alert("Error: Database check karo!");
                });
            }
        };

        // Click aur Enter key dono par message bhejien
        postBtn.onclick = postMessage;
        msgInput.onkeypress = (e) => { 
            if (e.key === 'Enter') postMessage(); 
        };

        // --- B. LIVE MESSAGES DISPLAY KARNA ---
        // onValue hamesha listen karta rahega naye data ke liye
        onValue(messagesRef, (snapshot) => {
            wall.innerHTML = ""; // Purane messages clear karein
            const data = snapshot.val();
            
            if (data) {
                // Object ko array mein badal kar reverse karein (Latest message top par)
                const messagesArray = Object.values(data).reverse();
                
                messagesArray.forEach(msg => {
                    const card = document.createElement('div');
                    card.className = "p-4 rounded-xl bg-white/5 border border-white/5 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500";
                    
                    card.innerHTML = `
                        <p class="text-sm text-cyan-50 font-medium">"${msg.content}"</p>
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-[9px] text-slate-500 uppercase tracking-widest">Secret Member</span>
                            <span class="text-[9px] text-cyan-500/50 italic font-bold tracking-tighter italic font-bold tracking-tighter">Verified</span>
                        </div>
                    `;
                    wall.appendChild(card);
                });
            } else {
                wall.innerHTML = `<p class="text-slate-500 text-center mt-10">Koi message nahi hai. Pehla roast aap kijiye! 😂</p>`;
            }
        });
    }
});