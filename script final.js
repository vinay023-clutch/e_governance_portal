document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Theme Toggling ---
    const themeToggle = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;
    const themeIcon = themeToggle.querySelector('i');

    // Check local storage for theme
    const savedTheme = localStorage.getItem('egov-theme') || 'light';
    htmlEl.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('egov-theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.classList.remove('ph-moon');
            themeIcon.classList.add('ph-sun');
        } else {
            themeIcon.classList.remove('ph-sun');
            themeIcon.classList.add('ph-moon');
        }
    }


    // --- 2. Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });


    // --- 3. Number Counter Animation ---
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // The lower the slower

    const animateCounters = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const updateCount = () => {
                    const target = +counter.getAttribute('data-target');
                    const count = +counter.innerText;

                    const inc = target / speed;

                    if (count < target) {
                        counter.innerText = Math.ceil(count + inc);
                        setTimeout(updateCount, 15);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCount();
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        animateCounters.observe(counter);
    });


    // --- 4. Header Scroll Effect ---
    const header = document.querySelector('.glass-header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            header.style.padding = '0.5rem 0';
        } else {
            header.style.boxShadow = 'none';
            header.style.padding = '0';
        }
    });


    // --- 5. Mock Live News Ticker ---
    const newsList = document.getElementById('newsList');
    if (newsList) {
        // Clone the items to create a seamless scrolling loop in CSS
        const items = Array.from(newsList.children);
        items.forEach(item => {
            const clone = item.cloneNode(true);
            newsList.appendChild(clone);
        });
    }

    // --- 6. AI Chatbot Logic ---
    const chatbotTrigger = document.getElementById('chatbotTrigger');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatInputText = document.getElementById('chatInputText');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatbotMessages = document.getElementById('chatbotMessages');

    if (chatbotTrigger && chatbotWindow) {
        chatbotTrigger.addEventListener('click', () => {
            chatbotWindow.classList.add('open');
        });

        chatbotClose.addEventListener('click', () => {
            chatbotWindow.classList.remove('open');
        });

        const handleChatSubmit = () => {
            const text = chatInputText.value.trim();
            if (!text) return;

            // User Message
            const userMsg = document.createElement('div');
            userMsg.className = 'chat-message user';
            userMsg.innerHTML = `<p>${text}</p>`;
            chatbotMessages.appendChild(userMsg);
            chatInputText.value = '';

            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

            // Mock Bot Reply
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'chat-message bot';
                botMsg.innerHTML = `<p>Thank you for reaching out. I've noted: "${text}". Our system or representative will assist you soon.</p>`;
                chatbotMessages.appendChild(botMsg);
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            }, 1000);
        };

        chatSendBtn.addEventListener('click', handleChatSubmit);
        chatInputText.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSubmit();
        });
    }

    // --- 7. Public Grievance Form ---
    const grievanceForm = document.getElementById('grievanceForm');
    const grievanceResult = document.getElementById('grievanceResult');
    const tokenNumberSpan = document.getElementById('tokenNumber');
    const newGrievanceBtn = document.getElementById('newGrievanceBtn');

    if (grievanceForm && grievanceResult) {
        grievanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('g-name').value;
            const state = document.getElementById('g-state').value;
            const address = document.getElementById('g-address').value;
            const complaint = document.getElementById('g-complaint').value;

            // Generate Token
            const randomID = Math.floor(100000 + Math.random() * 900000);
            const statePrefix = state || 'IND';
            const token = `GRv-${statePrefix}-${randomID}`;

            // Mock Save
            console.log('Mock saving grievance:', { token, full_name: fullName, state, address, complaint });
            await new Promise(resolve => setTimeout(resolve, 500));

            tokenNumberSpan.innerText = token;
            grievanceForm.classList.add('hidden');
            grievanceResult.classList.remove('hidden');
        });

        newGrievanceBtn.addEventListener('click', () => {
            grievanceForm.reset();
            grievanceResult.classList.add('hidden');
            grievanceForm.classList.remove('hidden');
        });

        const copyTokenBtn = document.getElementById('copyTokenBtn');
        if (copyTokenBtn) {
            copyTokenBtn.addEventListener('click', () => {
                const token = tokenNumberSpan.innerText;
                navigator.clipboard.writeText(token).then(() => {
                    const icon = copyTokenBtn.querySelector('i');
                    icon.className = 'ph-fill ph-check-circle';
                    setTimeout(() => {
                        icon.className = 'ph ph-copy';
                    }, 2000);
                });
            });
        }
    }

    // --- 8. Dynamic Language Translation Trigger ---
    const customLangSelect = document.querySelector('.lang-selector.custom-select');

    if (customLangSelect) {
        customLangSelect.addEventListener('change', (e) => {
            const selectedLang = e.target.value;
            // The hidden google translate select box
            const googleSelect = document.querySelector('.goog-te-combo');

            if (googleSelect) {
                googleSelect.value = selectedLang;
                // Dispatch native change event to trigger translation
                googleSelect.dispatchEvent(new Event('change'));
            } else {
                // If widget hasn't fully loaded, retry briefly
                setTimeout(() => {
                    const googleSelectRetry = document.querySelector('.goog-te-combo');
                    if (googleSelectRetry) {
                        googleSelectRetry.value = selectedLang;
                        googleSelectRetry.dispatchEvent(new Event('change'));
                    }
                }, 1000);
            }
        });
    }

    // --- 9. Track Application Status ---
    const trackStatusForm = document.getElementById('trackStatusForm');
    const statusResultContainer = document.getElementById('statusResultContainer');
    const statusLoading = document.getElementById('statusLoading');
    const statusData = document.getElementById('statusData');
    
    if (trackStatusForm && statusResultContainer) {
        trackStatusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const category = document.getElementById('track-category').value;
            const appNumber = document.getElementById('track-app-number').value.trim();
            
            if (!category || !appNumber) return;
            
            statusResultContainer.classList.remove('hidden');
            statusData.classList.add('hidden');
            statusLoading.classList.remove('hidden');
            
            // Mock Fetch
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network request
            const data = null; // Mock no data found
            const error = true;

            statusLoading.classList.add('hidden');

            if (error || !data) {
                // Not found
                document.getElementById('resAppNumber').innerText = appNumber;
                document.getElementById('resApplicantName').innerText = 'Not Found';
                document.getElementById('resDate').innerText = '-';
                document.getElementById('resRemarks').innerText = 'No application found with this tracking number.';
                
                const badge = document.getElementById('resStatusBadge');
                badge.style.backgroundColor = '#ef444420'; 
                badge.style.color = '#ef4444';
                badge.innerHTML = `<i class="ph-fill ph-x-circle"></i> Not Found`;
                
                statusData.classList.remove('hidden');
                statusResultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return;
            }

            // Define UI logic for status types
            const statusConfig = {
                'In Progress': { color: '#eab308', icon: 'ph-clock' },
                'Approved': { color: '#22c55e', icon: 'ph-check-circle' },
                'Pending Documents': { color: '#f97316', icon: 'ph-warning-circle' },
                'Rejected': { color: '#ef4444', icon: 'ph-x-circle' },
                'Default': { color: '#3b82f6', icon: 'ph-info' }
            };

            const statusInfo = statusConfig[data.status] || statusConfig['Default'];
            
            // Update DOM with Real Data
            document.getElementById('resAppNumber').innerText = data.app_number;
            document.getElementById('resApplicantName').innerText = data.applicant_name;
            
            const submitDate = new Date(data.created_at);
            document.getElementById('resDate').innerText = submitDate.toLocaleDateString();
            
            document.getElementById('resRemarks').innerText = data.remarks || 'No remarks available.';
            
            const badge = document.getElementById('resStatusBadge');
            badge.style.backgroundColor = statusInfo.color + '20';
            badge.style.color = statusInfo.color;
            badge.innerHTML = `<i class="ph-fill ${statusInfo.icon}"></i> ${data.status}`;
            
            statusData.classList.remove('hidden');
            statusResultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // --- 10. Dynamic Hero Background ---
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        // Set styles dynamically
        // Using var(--bg-main) alongside the image ensures the image tint matches the light/dark theme seamlessly
        heroSection.style.backgroundImage = 'url("citizens_hero.png")';
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center right';
        heroSection.style.backgroundColor = 'var(--bg-main)';
        
        // Soft-light or overlay blends the image gently with the background color so it doesn't overpower the text
        heroSection.style.backgroundBlendMode = 'soft-light';
        // Add a smooth transition so it fades in nicely if applied late
        heroSection.style.transition = 'background 0.5s ease';
    }

});
