document.addEventListener('DOMContentLoaded', () => {

    // --- 1. FIREBASE CONFIGURATION ---
    const firebaseConfig = {
        apiKey: "AIzaSyCkZyH1fDLQk4CNS5gWKZX1BgdcvhxVljI",
        authDomain: "schoolnet-9635b.firebaseapp.com",
        projectId: "schoolnet-9635b",
        storageBucket: "schoolnet-9635b.firebasestorage.app",
        messagingSenderId: "269058883564",
        appId: "1:269058883564:web:bf3c71b3cfc3413ef28ac9"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- 2. GEMINI AI CONFIGURATION ---
    const geminiKey = "AIzaSyC5eqWAHnqKVYFGxe7p8ebSqY1YMjSxIho";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    // --- 3. UI NAVIGATION LOGIC ---
    const pageContainers = document.querySelectorAll('main > div, main > section');
    const navLinks = document.querySelectorAll('.nav-link');

    function showPage(targetId) {
        pageContainers.forEach(container => {
            container.classList.toggle('hidden', container.id !== targetId);
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            if (pageId) {
                showPage(pageId);
                window.scrollTo(0, 0);
            }
        });
    });

    // --- 4. MODAL LOGIC ---
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    }

    function closeModal(modal) {
        if (modal) modal.classList.add('hidden');
    }

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('.project-detail-btn');
        if (target) openModal(target.dataset.modal);
        
        if (e.target.closest('.close-project-modal-btn') || e.target.classList.contains('fixed')) {
            closeModal(e.target.closest('.fixed'));
        }
    });

    document.getElementById('login-btn')?.addEventListener('click', () => openModal('login-modal'));
    document.getElementById('join-now-btn')?.addEventListener('click', () => openModal('login-modal'));

    // --- 5. GOOGLE LOGIN ---
    document.getElementById('google-login-btn')?.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            const user = result.user;
            db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                photo: user.photoURL,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            alert(`Selamat datang, ${user.displayName}!`);
            location.reload(); 
        }).catch(err => console.error(err));
    });

    // --- 6. AI CHAT SYSTEM (MENTOR) ---
    async function handleAiChat(formId, inputId, boxId, systemPrompt) {
        const form = document.getElementById(formId);
        const input = document.getElementById(inputId);
        const box = document.getElementById(boxId);

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = input.value.trim();
            if (!msg) return;

            // Render User Message
            box.innerHTML += `<div class="flex justify-end"><div class="bg-indigo-600 text-white p-3 rounded-lg max-w-xs shadow-sm">${msg}</div></div>`;
            input.value = '';
            box.scrollTop = box.scrollHeight;

            // Loading State
            const loadingId = 'loading-' + Date.now();
            box.innerHTML += `<div id="${loadingId}" class="flex justify-start"><div class="bg-white border p-3 rounded-lg animate-pulse">Berpikir...</div></div>`;

            try {
                const response = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Instruksi: ${systemPrompt}\n\nUser: ${msg}` }] }]
                    })
                });

                const data = await response.json();
                document.getElementById(loadingId).remove();

                const aiMsg = data.candidates[0].content.parts[0].text;
                const cleanMsg = aiMsg.replace(/(\*\*|#)/g, '');

                box.innerHTML += `<div class="flex justify-start"><div class="bg-white border p-3 rounded-lg max-w-md shadow-sm text-sm">${cleanMsg}</div></div>`;
            } catch (err) {
                document.getElementById(loadingId).innerHTML = "Gagal terhubung.";
            }
            box.scrollTop = box.scrollHeight;
        });
    }

    handleAiChat('ai-mentor-form', 'ai-mentor-input', 'ai-chat-box', "Anda adalah AI Mentor SchoolNet. Berikan saran proyek kuliah atau sekolah yang realistis.");

    // --- 7. STATISTICS ANIMATION ---
    const statSection = document.getElementById('statistik');
    const statObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            document.querySelectorAll('.stat-item').forEach((item, i) => {
                setTimeout(() => item.classList.add('is-visible'), i * 200);
            });
            document.querySelectorAll('.stat-number').forEach(el => {
                const target = +el.dataset.target;
                let count = 0;
                const step = target / 50;
                const timer = setInterval(() => {
                    count += step;
                    if (count >= target) {
                        el.innerText = target.toLocaleString('id-ID');
                        clearInterval(timer);
                    } else {
                        el.innerText = Math.floor(count).toLocaleString('id-ID');
                    }
                }, 30);
            });
            statObserver.disconnect();
        }
    }, { threshold: 0.5 });
    if (statSection) statObserver.observe(statSection);

    // --- 8. FAQ ACCORDION ---
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const answer = item.querySelector('.faq-answer');
            const isActive = item.classList.contains('active');
            
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-answer').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
});
