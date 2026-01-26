document.addEventListener('DOMContentLoaded', () => {

    // --- 1. KONFIGURASI FIREBASE ---
    // Menggunakan konfigurasi yang Anda miliki
    const firebaseConfig = {
        apiKey: "AIzaSyCkZyH1fDLQk4CNS5gWKZX1BgdcvhxVljI",
        authDomain: "schoolnet-9635b.firebaseapp.com",
        projectId: "schoolnet-9635b",
        storageBucket: "schoolnet-9635b.firebasestorage.app",
        messagingSenderId: "269058883564",
        appId: "1:269058883564:web:bf3c71b3cfc3413ef28ac9",
        measurementId: "G-12Y60RSVC4"
    };

    // Inisialisasi Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore(app);
    const auth = firebase.auth(app);

    // --- 2. KONFIGURASI GEMINI AI ---
    // Menggunakan model 1.5-flash untuk stabilitas maksimal
    const geminiApiKey = "AIzaSyC5eqWAHnqKVYFGxe7p8ebSqY1YMjSxIho";
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    // --- 3. HELPER MODAL ---
    function openModal(modal) { if (modal) modal.classList.remove('hidden'); }
    function closeModal(modal) { if (modal) modal.classList.add('hidden'); }

    // --- 4. LOGIKA LOGIN GOOGLE ---
    const googleLoginBtn = document.getElementById('google-login-btn');
    const loginModal = document.getElementById('login-modal');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    closeModal(loginModal);
                    // Simpan data user ke Firestore
                    db.collection('users').doc(user.uid).set({
                        displayName: user.displayName,
                        email: user.email,
                        photoURL: user.photoURL,
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    location.reload(); // Refresh untuk update UI Profil
                })
                .catch((error) => alert("Login gagal: " + error.message));
        });
    }

    // --- 5. NAVIGASI HALAMAN (SPA) ---
    const pageContainers = document.querySelectorAll('main > div, main > section');
    const navLinks = document.querySelectorAll('.nav-link, .nav-link-mobile');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const pageId = link.dataset.page;
            if (pageId) {
                e.preventDefault();
                pageContainers.forEach(c => c.classList.toggle('hidden', c.id !== pageId));
                window.scrollTo(0, 0);
            }
        });
    });

    // --- 6. SISTEM CHAT AI (MENTOR & SUPPORT) ---
    async function handleAiChat(formId, inputId, boxId, systemPrompt) {
        const form = document.getElementById(formId);
        const input = document.getElementById(inputId);
        const box = document.getElementById(boxId);

        if (!form || !input || !box) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = input.value.trim();
            if (!msg) return;

            // Render Pesan User
            box.innerHTML += `<div class="flex justify-end mb-4"><div class="bg-indigo-600 text-white p-3 rounded-lg max-w-xs shadow-sm">${msg}</div></div>`;
            input.value = '';
            box.scrollTop = box.scrollHeight;

            // Render Loading
            const loadingId = 'loading-' + Date.now();
            box.innerHTML += `<div id="${loadingId}" class="flex justify-start mb-4"><div class="bg-white border p-3 rounded-lg animate-pulse text-gray-400 text-xs">Berpikir...</div></div>`;
            box.scrollTop = box.scrollHeight;

            try {
                const response = await fetch(geminiApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ 
                            parts: [{ text: `Instruksi: ${systemPrompt}\n\nPertanyaan User: ${msg}` }] 
                        }]
                    })
                });

                const data = await response.json();
                document.getElementById(loadingId).remove();

                if (data.candidates && data.candidates[0].content.parts[0].text) {
                    const aiMsg = data.candidates[0].content.parts[0].text;
                    const cleanMsg = aiMsg.replace(/(\*\*|#)/g, ''); // Hapus markdown kasar
                    box.innerHTML += `<div class="flex justify-start mb-4"><div class="bg-white border p-3 rounded-lg max-w-md shadow-sm text-sm text-gray-700">${cleanMsg}</div></div>`;
                }
            } catch (err) {
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.innerHTML = `<span class="text-red-500">Error: Gagal terhubung ke AI.</span>`;
            }
            box.scrollTop = box.scrollHeight;
        });
    }

    // Inisialisasi Fitur Chat AI
    handleAiChat('ai-mentor-form', 'ai-mentor-input', 'ai-chat-box', "Anda adalah AI Mentor SchoolNet. Berikan saran proyek kuliah atau sekolah yang kreatif dan bermanfaat.");
    handleAiChat('ai-support-form', 'ai-support-input', 'ai-support-chat-box', "Anda adalah AI Support SchoolNet. Bantu user mengatasi masalah teknis pada website dengan ramah.");

    // --- 7. STATISTIK & FAQ ---
    const statSection = document.getElementById('statistik');
    const statObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            document.querySelectorAll('.stat-item').forEach((item, i) => {
                setTimeout(() => item.classList.add('is-visible'), i * 200);
            });
            statObserver.disconnect();
        }
    }, { threshold: 0.5 });
    if (statSection) statObserver.observe(statSection);

    // Menangani penutupan modal universal
    document.querySelectorAll('.close-project-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('.fixed')));
    });
});
