document.addEventListener('DOMContentLoaded', () => {

    // --- 1. KONFIGURASI FIREBASE ---
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
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- 2. KONFIGURASI AI (GEMINI) ---
    // API Key ini yang akan digunakan. Jika error, pastikan API Key aktif di Google Cloud Console.
    const apiKeyGemini = "AIzaSyC5eqWAHnqKVYFGxe7p8ebSqY1YMjSxIho"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeyGemini}`;

    const systemPrompt_Mentor = "Anda adalah AI Mentor SchoolNet. JANGAN gunakan format LaTeX (seperti \\frac, \\times, atau $). Gunakan simbol keyboard biasa. Contoh: tulis 1/2 untuk pecahan, 'x' untuk kali, dan '^' untuk pangkat. Jawab dengan bahasa Indonesia yang ramah, jelas, dan rapi seperti chat biasa.";
    const systemPrompt_Support = "Anda adalah AI Support SchoolNet. Bantu masalah teknis akun. Gunakan teks biasa tanpa format rumit.";

    // Fungsi "Cuci" Teks: Mengubah sisa-sisa LaTeX menjadi teks biasa
    function cleanMathText(text) {
        if (!text) return "";
        return text
            .replace(/\\text\{?(.*?)\}?/g, '$1')
            .replace(/\\textbf\{?(.*?)\}?/g, '$1')
            .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '$1/$2')
            .replace(/\\times/g, 'x')
            .replace(/\\div/g, ':')
            .replace(/[\$\#\*]/g, '') // Hapus dollar, pagar, dan bintang sisa markdown
            .replace(/\\/g, '')
            .trim();
    }

    // Fungsi Utama Panggil AI
    async function getAiResponse(prompt, systemPrompt) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
            });

            if (!response.ok) throw new Error("API Error");

            const result = await response.json();
            return result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("AI Error:", error);
            return "Waduh, koneksi ke AI lagi bermasalah nih cuyy. Coba lagi ya!";
        }
    }

    // --- 3. LOGIKA CHAT AI (Mentor & Support) ---
    async function setupChat(formId, inputId, boxId, systemPrompt) {
        const form = document.getElementById(formId);
        const input = document.getElementById(inputId);
        const box = document.getElementById(boxId);

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = input.value.trim();
            if (!msg) return;

            // Render Pesan User
            appendMsg(box, msg, 'user');
            input.value = '';
            
            // Render Loading
            const loadingId = 'loading-' + Date.now();
            const loadDiv = document.createElement('div');
            loadDiv.id = loadingId;
            loadDiv.className = 'flex justify-start mb-4';
            loadDiv.innerHTML = `<div class="bg-gray-200 text-gray-500 p-3 rounded-lg text-xs animate-pulse">AI sedang mengetik...</div>`;
            box.appendChild(loadDiv);
            box.scrollTop = box.scrollHeight;

            // Ambil Respon & Bersihkan
            const rawRes = await getAiResponse(msg, systemPrompt);
            document.getElementById(loadingId).remove();
            
            const finalRes = cleanMathText(rawRes);
            appendMsg(box, finalRes, 'ai');
        });
    }

    function appendMsg(box, text, sender) {
        const div = document.createElement('div');
        div.className = sender === 'user' ? 'flex justify-end mb-4' : 'flex justify-start mb-4';
        const style = sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-800';
        div.innerHTML = `<div class="${style} p-3 rounded-lg max-w-[85%] shadow-sm"><p class="text-sm leading-relaxed">${text}</p></div>`;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }

    setupChat('ai-mentor-form', 'ai-mentor-input', 'ai-chat-box', systemPrompt_Mentor);
    setupChat('ai-support-form', 'ai-support-input', 'ai-support-chat-box', systemPrompt_Support);

    // --- 4. LOGIKA WAKTU WIB ---
    function updateWibTime() {
        const el = document.getElementById('currentTime');
        if (!el) return;
        const now = new Date();
        el.innerHTML = now.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: 'short', year: 'numeric'
        }) + " WIB";
    }
    setInterval(updateWibTime, 1000);
    updateWibTime();

    // --- 5. LOGIKA LOGIN GOOGLE ---
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then((result) => {
                alert("Halo " + result.user.displayName + "! Selamat datang di SchoolNet.");
                location.reload();
            }).catch(err => alert("Gagal login: " + err.message));
        });
    }

    // --- 6. MODAL & NAVIGASI ---
    // Buka Modal berdasarkan data-modal
    document.body.addEventListener('click', (e) => {
        const modalTrigger = e.target.closest('[data-modal]');
        if (modalTrigger) {
            e.preventDefault();
            const modalId = modalTrigger.getAttribute('data-modal');
            const targetModal = document.getElementById(modalId);
            if (targetModal) targetModal.classList.remove('hidden');
        }

        // Tutup Modal
        const closeBtn = e.target.closest('.close-project-modal-btn');
        if (closeBtn) {
            const modal = closeBtn.closest('[id$="-modal"]');
            if (modal) modal.classList.add('hidden');
        }
    });

    // Navigasi Halaman
    const navLinks = document.querySelectorAll('.nav-link, .nav-link-mobile');
    const sections = document.querySelectorAll('main > div, main > section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const pageId = link.getAttribute('data-page');
            if (pageId) {
                e.preventDefault();
                sections.forEach(s => s.classList.add('hidden'));
                document.getElementById(pageId).classList.remove('hidden');
                window.scrollTo(0, 0);
                // Tutup menu mobile jika terbuka
                document.getElementById('mobile-menu').classList.add('hidden');
            }
        });
    });

    // Toggle Menu Mobile
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });
    }
});
