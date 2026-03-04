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
        const el = document.getElementById('countdown');
        if(el) el.innerText = `${d.toString().padStart(2,'0')}:${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);

    const checkFirebase = setInterval(() => {
        if (window.dbFunctions) {
            clearInterval(checkFirebase);
            initTheVault();
        }
    }, 100);

    function initTheVault() {
        const { ref, push, onValue, serverTimestamp, remove, update, get } = window.dbFunctions;
        const db = window.db;
        const msgInput = document.getElementById('message-input');
        const postBtn = document.getElementById('post-btn');
        const wall = document.getElementById('wall-messages');
        const searchInput = document.getElementById('search-bar');
        const replyIndicator = document.getElementById('reply-indicator');
        const messagesRef = ref(db, 'messages');

        let allMessagesData = [];
        let activeReplyId = null;

        // REPLY LOGIC
        window.setReply = (id, user) => {
            activeReplyId = id;
            document.getElementById('reply-text').innerText = `Replying to ${user}`;
            replyIndicator.classList.remove('hidden');
            msgInput.focus();
        };

        window.cancelReply = () => {
            activeReplyId = null;
            replyIndicator.classList.add('hidden');
        };

        // SEARCH
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            renderWall(allMessagesData.filter(m => 
                m.content.toLowerCase().includes(term) || m.user.toLowerCase().includes(term)
            ));
        });

        // EDIT & DELETE (Event Delegation)
        document.addEventListener('click', (e) => {
            const msgId = e.target.getAttribute('data-id');
            if (!msgId) return;

            if (e.target.classList.contains('delete-trigger')) {
                if (prompt("Enter Secret Code to DELETE:") === DELETE_PASSCODE) {
                    remove(ref(db, `messages/${msgId}`));
                }
            }

            if (e.target.classList.contains('edit-trigger')) {
                const newText = prompt("Edit message:");
                if (newText && prompt("Enter Secret Code to EDIT:") === DELETE_PASSCODE) {
                    update(ref(db, `messages/${msgId}`), { content: newText });
                }
            }
        });

        // POST MESSAGE
        postBtn.onclick = () => {
            const text = msgInput.value;
            if (text.trim()) {
                push(messagesRef, { 
                    content: text, 
                    user: localStorage.getItem('vault_user'), 
                    timestamp: serverTimestamp(),
                    replyTo: activeReplyId 
                });
                msgInput.value = "";
                cancelReply();
            }
        };

        // --- RENDER WALL (Fix for Profile Link) ---
        function renderWall(dataArray) {
            wall.innerHTML = "";
            dataArray.forEach(msg => {
                const card = document.createElement('div');
                card.className = "p-4 rounded-xl bg-white/5 border border-white/5 mb-3 relative group animate-in fade-in";
                
                let replyHtml = "";
                if(msg.replyTo) {
                    const parentMsg = allMessagesData.find(m => m.id === msg.replyTo);
                    replyHtml = parentMsg 
                        ? `<div class="bg-white/5 p-2 rounded text-[10px] mb-2 border-l-2 border-cyan-500 opacity-60 italic truncate">Replying to ${parentMsg.user}: ${parentMsg.content}</div>`
                        : `<div class="bg-white/5 p-2 rounded text-[10px] mb-2 border-l-2 border-red-500 opacity-60 italic">Message deleted</div>`;
                }

                card.innerHTML = `
                    <div class="absolute top-2 right-2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="setReply('${msg.id}', '${msg.user}')" class="text-slate-500 hover:text-cyan-400 text-[10px]">↩️ REPLY</button>
                        <button data-id="${msg.id}" class="edit-trigger text-slate-500 hover:text-cyan-400 text-[10px]">✏️ EDIT</button>
                        <button data-id="${msg.id}" class="delete-trigger text-slate-500 hover:text-red-400 text-[10px]">🗑️ DELETE</button>
                    </div>
                    ${replyHtml}
                    <p class="text-sm text-cyan-50 font-medium pr-14" style="white-space: pre-wrap; word-break: break-word;">${msg.content}</p>
                    
                    <a href="profile.html?user=${msg.user}" class="inline-block mt-3">
                        <span class="text-[9px] text-cyan-400 uppercase font-black tracking-widest hover:underline cursor-pointer">
                           Agent: ${msg.user} 🔗
                        </span>
                    </a>
                `;
                wall.appendChild(card);
            });
        }

        onValue(messagesRef, (snap) => {
            const data = snap.val();
            allMessagesData = data ? Object.entries(data).reverse().map(([id, val]) => ({ id, ...val })) : [];
            renderWall(allMessagesData);
        });
    }
});