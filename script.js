document.addEventListener('DOMContentLoaded', () => {
    // 1. Konfigurasi Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyCkZyH1fDLQk4CNS5gWKZX1BgdcvhxVljI",
        authDomain: "schoolnet-9635b.firebaseapp.com",
        projectId: "schoolnet-9635b",
        storageBucket: "schoolnet-9635b.firebasestorage.app",
        messagingSenderId: "269058883564",
        appId: "1:269058883564:web:bf3c71b3cfc3413ef28ac9",
        measurementId: "G-12Y60RSVC4"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // 2. Variabel AI & System Prompts
    // Meminta AI untuk menggunakan simbol standar, bukan LaTeX
    const systemPrompt_Mentor = "Anda adalah AI Mentor SchoolNet. JANGAN gunakan format LaTeX (seperti \\frac, \\times, atau $). Gunakan simbol keyboard biasa. Contoh: gunakan 'x' untuk kali, '/' untuk bagi, dan '^' untuk pangkat. Tuliskan langkah-langkah matematika dengan teks yang bersih dan mudah dimengerti pelajar.";
    const systemPrompt_Support = "Anda adalah AI Support SchoolNet. Fokus pada kendala teknis. Gunakan bahasa Indonesia yang ramah dan tanpa format kode/LaTeX.";
    const apiKeyGemini = "AIzaSyC5eqWAHnqKVYFGxe7p8ebSqY1YMjSxIho";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKeyGemini}`;

    // 3. Fungsi Helper Pembasmi LaTeX & Format Teks
    function formatAIResponse(text) {
        return text
            .replace(/\\text\{?(.*?)\}?/g, '$1')        // Menghapus \text{...}
            .replace(/\\textbf\{?(.*?)\}?/g, '$1')      // Menghapus \textbf{...}
            .replace(/\\mathbf\{?(.*?)\}?/g, '$1')      // Menghapus \mathbf{...}
            .replace(/\\times/g, 'x')                   // Ubah \times jadi x
            .replace(/\\div/g, ':')                     // Ubah \div jadi :
            .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '$1/$2') // Ubah \frac{a}{b} jadi a/b
            .replace(/[\$\#\*]/g, '')                   // Menghapus $, #, dan * (Markdown sisa)
            .replace(/\\/g, '')                         // Menghapus backslash sisa
            .trim();
    }

    // 4. Fungsi Integrasi API Gemini
    async function getAiResponse(prompt, systemPrompt) {
        const fullPrompt = `${systemPrompt}\n\nPertanyaan Pengguna: ${prompt}`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }]
                })
            });
            const result = await response.json();
            return result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("AI Error:", error);
            return "Maaf, koneksi ke server AI terputus. Coba lagi nanti.";
        }
    }

    // 5. Logika Chat (Mentor & Support)
    async function handleChat(formId, inputId, boxId, systemPrompt) {
        const form = document.getElementById(formId);
        const input = document.getElementById(inputId);
        const box = document.getElementById(boxId);

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = input.value.trim();
            if (!msg) return;

            // User Message
            appendMessage(box, msg, 'user');
            input.value = '';
            
            // AI Response
            showLoading(box);
            const rawReply = await getAiResponse(msg, systemPrompt);
            removeLoading(box);
            
            const cleanReply = formatAIResponse(rawReply);
            appendMessage(box, cleanReply, 'ai');
        });
    }

    function appendMessage(box, text, sender) {
        const div = document.createElement('div');
        div.className = sender === 'user' ? 'flex justify-end' : 'flex justify-start';
        const innerClass = sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-800';
        div.innerHTML = `<div class="${innerClass} p-3 rounded-lg max-w-[85%] shadow-sm"><p class="text-sm leading-relaxed">${text}</p></div>`;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }

    // 6. Jalankan Fitur Chat
    handleChat('ai-mentor-form', 'ai-mentor-input', 'ai-chat-box', systemPrompt_Mentor);
    handleChat('ai-support-form', 'ai-support-input', 'ai-support-chat-box', systemPrompt_Support);

    // 7. Fungsi Loading Animation
    function showLoading(box) {
        const loader = document.createElement('div');
        loader.id = 'ai-loader';
        loader.className = 'flex justify-start';
        loader.innerHTML = `<div class="bg-gray-200 p-3 rounded-lg animate-pulse text-xs text-gray-500">AI sedang mengetik...</div>`;
        box.appendChild(loader);
        box.scrollTop = box.scrollHeight;
    }

    function removeLoading(box) {
        const loader = document.getElementById('ai-loader');
        if (loader) loader.remove();
    }

    // 8. Logika Waktu WIB (Footer)
    function showTime() {
        const el = document.getElementById('currentTime');
        if (!el) return;
        const now = new Date();
        el.innerHTML = now.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }
    setInterval(showTime, 1000);
    showTime();

    // 9. Login Google
    window.loginWithGoogle = function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            location.reload(); // Refresh untuk update UI profil
        }).catch(err => alert(err.message));
    };

    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) googleBtn.onclick = window.loginWithGoogle;
});
