document.addEventListener('DOMContentLoaded', () => {

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
    const analytics = firebase.analytics(app);
    const db = firebase.firestore(app);
    const auth = firebase.auth(app);

    // DOM Elements
    const loginBtn = document.getElementById('login-btn');
    const loginBtnMobile = document.getElementById('login-btn-mobile');
    const loginModal = document.getElementById('login-modal');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const navContent = document.getElementById('nav-content');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const joinNowBtn = document.getElementById('join-now-btn');
    const footerJoinBtn = document.getElementById('footer-join-btn');

    // --- Fungsi Helper Modal ---
    function openModal(modal) { if (modal) modal.classList.remove('hidden'); }
    function closeModal(modal) { if (modal) modal.classList.add('hidden'); }

    function closeMobileMenu() {
        if (mobileMenu) mobileMenu.classList.add('hidden');
    }

    // --- LOGIKA LOGIN (ANTI-DOUBLE) ---
    function loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();

        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                updateUserUI(user); // Panggil fungsi update UI
                closeModal(loginModal);

                // Simpan ke Firestore
                db.collection('users').doc(user.uid).set({
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            })
            .catch((error) => {
                console.error("Login Gagal:", error.message);
                alert("Login gagal: " + error.message);
            });
    }

    // Fungsi pusat untuk update UI agar tidak duplikat
    function updateUserUI(user) {
        if (!user) return;

        // 1. Update Navbar Desktop
        if (!document.getElementById('user-profile-nav')) {
            if (loginBtn) loginBtn.classList.add('hidden'); // Sembunyikan tombol login asli
            
            const userProfile = document.createElement('div');
            userProfile.id = 'user-profile-nav';
            userProfile.innerHTML = `
                <a href="#" data-modal="profil-modal" class="project-detail-btn flex items-center space-x-3">
                    <img src="${user.photoURL}" alt="Avatar" class="w-8 h-8 rounded-full border-2 border-indigo-200">
                    <span class="text-gray-700 font-semibold">${user.displayName}</span>
                </a>
            `;
            if (navContent) navContent.appendChild(userProfile);
        }

        // 2. Update Navbar Mobile
        if (!document.getElementById('user-profile-mobile')) {
            if (loginBtnMobile) {
                const userProfileMobile = document.createElement('a');
                userProfileMobile.id = 'user-profile-mobile';
                userProfileMobile.href = "#";
                userProfileMobile.dataset.modal = "profil-modal";
                userProfileMobile.className = "project-detail-btn block flex items-center space-x-3 text-gray-700 font-medium p-2 rounded-md hover:bg-gray-100";
                userProfileMobile.innerHTML = `
                    <img src="${user.photoURL}" alt="Avatar" class="w-8 h-8 rounded-full border-2 border-indigo-200">
                    <span>Profil (${user.displayName})</span>
                `;
                loginBtnMobile.replaceWith(userProfileMobile);
            }
        }
    }

    // Cek status login saat halaman pertama kali dibuka
    auth.onAuthStateChanged((user) => {
        if (user) {
            updateUserUI(user);
        }
    });

    // --- Event Listeners ---
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', loginWithGoogle);
    if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(loginModal); });
    if (loginBtnMobile) loginBtnMobile.addEventListener('click', (e) => { e.preventDefault(); closeMobileMenu(); openModal(loginModal); });
    if (joinNowBtn) joinNowBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(loginModal); });
    if (footerJoinBtn) footerJoinBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(loginModal); });
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }

    // --- Navigasi Halaman ---
    const pageContainers = document.querySelectorAll('main > div, main > section');
    const navLinks = document.querySelectorAll('.nav-link, .nav-link-mobile');

    function showPage(targetId) {
        pageContainers.forEach(container => {
            if (container.id === targetId) {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const pageId = link.dataset.page;
            const anchor = link.getAttribute('href');

            if (pageId) {
                e.preventDefault();
                showPage(pageId);
                window.scrollTo(0, 0);
                closeMobileMenu();
            } else if (anchor && anchor.startsWith('#')) {
                if (document.getElementById('home-content').classList.contains('hidden')) {
                    e.preventDefault();
                    showPage('home-content');
                    setTimeout(() => {
                        document.querySelector(anchor).scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
                closeMobileMenu();
            }
        });
    });

    // --- Modal Universal Logic ---
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('.project-detail-btn');
        if (target) {
            e.preventDefault();
            const modalId = target.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                openModal(modal);
                if (modalId === 'forum-modal') {
                    const defaultTopic = document.querySelector('.forum-topic-link[data-topic="teknologi"]');
                    if(defaultTopic) defaultTopic.click();
                }
                if (modalId === 'moderator-modal') {
                    const score = 120;
                    const circle = modal.querySelector('.gauge-circle-progress');
                    if (circle) {
                        const radius = circle.r.baseVal.value;
                        const circumference = radius * 2 * Math.PI;
                        circle.style.strokeDashoffset = circumference - (score / 120) * circumference;
                    }
                }
            }
        }
    });

    // Menutup Modal
    document.querySelectorAll('.close-project-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('[id$="-modal"]')));
    });

    window.addEventListener('click', (e) => {
        if (e.target.id && e.target.id.endsWith('-modal')) closeModal(e.target);
    });

    // --- Stat Counter Animation ---
    const statSection = document.getElementById('statistik');
    const statItems = document.querySelectorAll('.stat-item');
    const statNumbers = document.querySelectorAll('.stat-number');
    let hasAnimatedStats = false;

    function animateCountUp(el) {
        const target = parseInt(el.dataset.target, 10);
        const duration = 2000;
        const startTime = Date.now();

        function step() {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            el.innerText = Math.floor(progress * target).toLocaleString('id-ID');
            if (progress < 1) window.requestAnimationFrame(step);
            else el.innerText = target.toLocaleString('id-ID');
        }
        window.requestAnimationFrame(step);
    }

    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimatedStats) {
                hasAnimatedStats = true;
                statItems.forEach((item, i) => {
                    setTimeout(() => item.classList.add('is-visible'), i * 200);
                });
                statNumbers.forEach(animateCountUp);
            }
        });
    }, { threshold: 0.5 });

    if (statSection) statObserver.observe(statSection);

    // --- AI Chat Logic (Mentor & Support) ---
    const apiKey = "AIzaSyC5eqWAHnqKVYFGxe7p8ebSqY1YMjSxIho";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    async function handleAiChat(formId, inputId, boxId, systemPrompt) {
        const form = document.getElementById(formId);
        const input = document.getElementById(inputId);
        const box = document.getElementById(boxId);

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = input.value.trim();
            if (!msg) return;

            // User Message
            const uDiv = document.createElement('div');
            uDiv.className = 'flex justify-end';
            uDiv.innerHTML = `<div class="bg-indigo-600 text-white p-3 rounded-lg max-w-xs"><p>${msg}</p></div>`;
            box.appendChild(uDiv);
            input.value = '';
            box.scrollTop = box.scrollHeight;

            // Loading
            const lDiv = document.createElement('div');
            lDiv.className = 'flex justify-start ai-loading';
            lDiv.innerHTML = `<div class="bg-white border p-3 rounded-lg"><div class="flex space-x-1"><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.1s"></div><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.2s"></div></div></div>`;
            box.appendChild(lDiv);

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: msg }] }],
                        systemInstruction: { parts: [{ text: systemPrompt }] }
                    })
                });
                const data = await response.json();
                const aiMsg = data.candidates[0].content.parts[0].text;
                
                box.querySelector('.ai-loading').remove();
                const aDiv = document.createElement('div');
                aDiv.className = 'flex justify-start';
                aDiv.innerHTML = `<div class="bg-white border p-3 rounded-lg max-w-md"><p class="text-sm text-gray-700">${aiMsg.replace(/(\*\*|#)/g, '')}</p></div>`;
                box.appendChild(aDiv);
            } catch (err) {
                box.querySelector('.ai-loading').remove();
            }
            box.scrollTop = box.scrollHeight;
        });
    }

    handleAiChat('ai-mentor-form', 'ai-mentor-input', 'ai-chat-box', "Anda adalah AI Mentor SchoolNet. Ramah & informatif.");
    handleAiChat('ai-support-form', 'ai-support-input', 'ai-support-chat-box', "Anda adalah AI Support SchoolNet. Fokus pada masalah teknis.");

    // --- FAQ Accordion ---
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            item.closest('.max-w-3xl').querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-answer').style.maxHeight = null;
            });
            if (!isOpen) {
                item.classList.add('active');
                item.querySelector('.faq-answer').style.maxHeight = item.querySelector('.faq-answer').scrollHeight + "px";
            }
        });
    });

});
