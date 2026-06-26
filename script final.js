import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "firebase/auth";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCjQM8Ekkn4PAfRFturLj6fwTYvI2eVvWY",
  authDomain: "e-gov-portal-dde74.firebaseapp.com",
  projectId: "e-gov-portal-dde74",
  storageBucket: "e-gov-portal-dde74.firebasestorage.app",
  messagingSenderId: "637660867456",
  appId: "1:637660867456:web:2e1b828d599149a9d9ef65",
  measurementId: "G-FR1PDFP9G7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebaseApp = app;
        firebaseAuth = getAuth(firebaseApp);
        firebaseDb = getFirestore(firebaseApp);
        console.log("Firebase & Firestore initialized successfully.");
    } else {
        console.warn("Firebase was not initialized: Please replace placeholder API key in script final.js with your credentials.");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// Expose to window for testing or utility actions
window.firebaseApp = firebaseApp;
window.firebaseAuth = firebaseAuth;

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Theme Toggling ---
    const themeToggle = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;

    // Check local storage for theme with dark default upgrade
    if (!localStorage.getItem('egov-theme-v2')) {
        localStorage.setItem('egov-theme', 'dark');
        localStorage.setItem('egov-theme-v2', 'true');
    }
    const savedTheme = localStorage.getItem('egov-theme') || 'dark';
    htmlEl.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('egov-theme', newTheme);
    });


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


    // --- 4. Header Scroll Effect (Disabled to prevent header shifting) ---
    // const header = document.querySelector('.glass-header');
    // let isScrolled = false;
    // window.addEventListener('scroll', () => { ... });


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
                
                const lowerText = text.toLowerCase();
                let reply = `Thank you for reaching out. I've noted your message: "${text}". An E-Gov representative will assist you shortly.`;
                
                if (currentUser) {
                    if (lowerText.includes('apply') || lowerText.includes('service') || lowerText.includes('passport') || lowerText.includes('license') || lowerText.includes('birth')) {
                        reply = "I've navigated you to the <strong>Apply for Services</strong> tab in your dashboard. You can click 'Apply Now' on the Birth, Driving License, or Passport cards to begin filling the multi-step forms.";
                        switchDashboardTab('apply');
                    } else if (lowerText.includes('vault') || lowerText.includes('document') || lowerText.includes('upload')) {
                        reply = "I've navigated you to your <strong>Document Vault</strong>. You can drag and drop new files or preview existing credentials like Aadhaar Card and PAN Card.";
                        switchDashboardTab('vault');
                    } else if (lowerText.includes('grievance') || lowerText.includes('complaint')) {
                        reply = "I've navigated you to the <strong>Grievance Redressal Center</strong>. Here you can track active complaints or click 'Register Complaint' to file a new concern.";
                        switchDashboardTab('grievances');
                    } else if (lowerText.includes('status') || lowerText.includes('track') || lowerText.includes('app-')) {
                        const tokenMatch = text.toUpperCase().match(/APP-2026-\d+/);
                        if (tokenMatch) {
                            const matchApp = applications.find(a => a.id === tokenMatch[0]);
                            if (matchApp) {
                                reply = `Found application record: <strong>${matchApp.name} (${matchApp.id})</strong>.<br>Current Status: <span class="status-badge-pill progress" style="margin-left:0.2rem;">${matchApp.status}</span>.<br>Latest Remarks: <em>${matchApp.remarks}</em>`;
                            } else {
                                reply = `Searching for application <strong>${tokenMatch[0]}</strong>... No record found under your logged-in account. Check that the ID is entered correctly.`;
                            }
                        } else {
                            reply = "To track a specific application in chat, please type your tracking number (e.g. <em>APP-2026-302195</em>).";
                        }
                    }
                } else {
                    if (lowerText.includes('login') || lowerText.includes('sign') || lowerText.includes('dashboard') || lowerText.includes('admin')) {
                        reply = "Please sign in to access your digital citizen dashboard. Click the 'Sign In' button in the top right to start. You can use the demo credentials provided in the banner notice!";
                        toggleAuthModal(true);
                    }
                }
                
                botMsg.innerHTML = `<p>${reply}</p>`;
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
    const grievanceUploadZone = document.getElementById('grievanceUploadZone');
    const gImageInput = document.getElementById('g-image');
    const grievanceImagePreview = document.getElementById('grievanceImagePreview');
    let uploadedGrievanceBase64 = null;

    if (grievanceForm && grievanceResult) {
        // Drag and Drop listeners
        if (grievanceUploadZone && gImageInput) {
            grievanceUploadZone.addEventListener('click', () => {
                gImageInput.click();
            });

            grievanceUploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                grievanceUploadZone.style.borderColor = 'var(--primary-color)';
            });

            grievanceUploadZone.addEventListener('dragleave', () => {
                grievanceUploadZone.style.borderColor = '';
            });

            grievanceUploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                grievanceUploadZone.style.borderColor = '';
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    handleGrievanceImageFile(file);
                } else {
                    showToast('Only image files are accepted.', 'error');
                }
            });

            gImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    handleGrievanceImageFile(file);
                }
            });
        }

        function handleGrievanceImageFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedGrievanceBase64 = e.target.result;
                if (grievanceImagePreview) {
                    grievanceImagePreview.innerHTML = `
                        <img src="${uploadedGrievanceBase64}" alt="Preview">
                        <button type="button" class="grievance-image-remove-btn" id="removeGrievanceImgBtn" title="Remove Image">
                            <i class="ph ph-trash"></i>
                        </button>
                    `;
                    grievanceImagePreview.classList.remove('hidden');
                    
                    // Hook remove action
                    document.getElementById('removeGrievanceImgBtn').onclick = () => {
                        clearGrievanceImage();
                    };
                }
            };
            reader.readAsDataURL(file);
        }

        function clearGrievanceImage() {
            uploadedGrievanceBase64 = null;
            if (gImageInput) gImageInput.value = '';
            if (grievanceImagePreview) {
                grievanceImagePreview.innerHTML = '';
                grievanceImagePreview.classList.add('hidden');
            }
        }

        grievanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!uploadedGrievanceBase64) {
                showToast('Please upload a supporting image for your grievance.', 'error');
                if (grievanceUploadZone) {
                    grievanceUploadZone.style.borderColor = 'var(--danger-color)';
                    setTimeout(() => {
                        grievanceUploadZone.style.borderColor = '';
                    }, 2000);
                }
                return;
            }

            const fullName = document.getElementById('g-name').value;
            const state = document.getElementById('g-state').value;
            const address = document.getElementById('g-address').value;
            const complaint = document.getElementById('g-complaint').value;

            // Generate Token
            const randomID = Math.floor(100000 + Math.random() * 900000);
            const statePrefix = state || 'IND';
            const token = `GRv-${statePrefix}-${randomID}`;

            // Cache grievance info locally for Track Status lookup
            const grievanceData = {
                app_number: token,
                applicant_name: fullName,
                created_at: new Date().toISOString(),
                status: 'In Progress',
                remarks: `Grievance registered. Assigned to ${statePrefix} Grievance Cell for verification.`,
                has_image: !!uploadedGrievanceBase64
            };

            // If an image was uploaded, store it under a separate localStorage key to avoid exceeding size limits, or store a mock path
            if (uploadedGrievanceBase64) {
                try {
                    localStorage.setItem(`${token}-img`, uploadedGrievanceBase64);
                } catch (err) {
                    console.warn("Could not save image to localStorage due to quota limits, mocking instead:", err);
                    grievanceData.remarks += " [Attached: Supporting Image]";
                }
            }

            localStorage.setItem(token, JSON.stringify(grievanceData));

            // Mock Save API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            tokenNumberSpan.innerText = token;
            grievanceForm.classList.add('hidden');
            grievanceResult.classList.remove('hidden');
            
            // Clear inputs and images after successful submission
            clearGrievanceImage();
        });

        newGrievanceBtn.addEventListener('click', () => {
            grievanceForm.reset();
            clearGrievanceImage();
            grievanceResult.classList.add('hidden');
            grievanceForm.classList.remove('hidden');
        });

        const copyTokenBtn = document.getElementById('copyTokenBtn');
        if (copyTokenBtn) {
            copyTokenBtn.addEventListener('click', () => {
                const token = tokenNumberSpan.innerText;
                const updateIcon = () => {
                    const icon = copyTokenBtn.querySelector('i');
                    icon.className = 'ph-fill ph-check-circle';
                    setTimeout(() => {
                        icon.className = 'ph ph-copy';
                    }, 2000);
                };

                if (navigator.clipboard) {
                    navigator.clipboard.writeText(token).then(updateIcon);
                } else {
                    // Fallback clipboard method
                    const tempInput = document.createElement('input');
                    tempInput.value = token;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    updateIcon();
                }
            });
        }
    }

    // --- 8. Dynamic Language Translation Trigger ---
    const customLangSelects = document.querySelectorAll('.lang-selector.custom-select');

    customLangSelects.forEach(selectEl => {
        selectEl.addEventListener('change', (e) => {
            const selectedLang = e.target.value;
            
            // Sync all language selectors
            customLangSelects.forEach(s => {
                s.value = selectedLang;
            });

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
    });

    // --- 9. Track Application Status ---
    const trackStatusForm = document.getElementById('trackStatusForm');
    const statusResultContainer = document.getElementById('statusResultContainer');
    const statusLoading = document.getElementById('statusLoading');
    const statusData = document.getElementById('statusData');

    // Pre-seeded standard applications database for testing
    const mockApplications = {
        'APP-2026-123456': {
            app_number: 'APP-2026-123456',
            applicant_name: 'Aarav Sharma',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'In Progress',
            remarks: 'Document verification completed. Pending department approval.'
        },
        'APP-2026-789012': {
            app_number: 'APP-2026-789012',
            applicant_name: 'Priya Patel',
            created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Approved',
            remarks: 'Certificate issued successfully. You can download the digital copy.'
        },
        'APP-2026-112233': {
            app_number: 'APP-2026-112233',
            applicant_name: 'Rajesh Kumar',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Pending Documents',
            remarks: 'Please upload address proof document within 7 days to avoid rejection.'
        },
        'APP-2026-445566': {
            app_number: 'APP-2026-445566',
            applicant_name: 'Sunita Devi',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Rejected',
            remarks: 'Invalid identity details. Please file a fresh application with correct details.'
        }
    };
    
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
            
            let data = null;
            let error = false;

            // Search localStorage first, then fallback to pre-seed
            const localApp = localStorage.getItem(appNumber);
            if (localApp) {
                try {
                    data = JSON.parse(localApp);
                } catch(err) {
                    console.error('Error parsing cached application:', err);
                }
            }

            if (!data && mockApplications[appNumber]) {
                data = mockApplications[appNumber];
            }

            if (!data) {
                error = true;
            }

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

    // --- 10. Dynamic Hero Background Init ---
    // (This is now fully handled dynamically by updateHeroBackground function linked to theme state)

    // --- 11. Interactive Modals & Live Search Filtering ---
    const servicesModal = document.getElementById('servicesModal');
    const departmentsModal = document.getElementById('departmentsModal');
    const closeServicesModal = document.getElementById('closeServicesModal');
    const closeDepartmentsModal = document.getElementById('closeDepartmentsModal');
    const navServicesLink = document.getElementById('navServicesLink');
    const navDepartmentsLink = document.getElementById('navDepartmentsLink');
    const statsServicesItem = document.getElementById('statsServicesItem');
    const statsDeptItem = document.getElementById('statsDeptItem');
    const deptSearchInput = document.getElementById('deptSearchInput');
    const servicesSearchInput = document.getElementById('servicesSearchInput');
    const modalServicesGrid = document.getElementById('modalServicesGrid');
    const modalDepartmentsGrid = document.getElementById('modalDepartmentsGrid');
    const servicesNoResults = document.getElementById('servicesNoResults');
    const deptNoResults = document.getElementById('deptNoResults');

    const toggleModal = (modal, show) => {
        if (!modal) return;
        if (show) {
            modal.classList.add('open');
            document.body.classList.add('modal-open');
            // Reset search inputs on open
            const searchInput = modal.querySelector('input[type="text"]');
            if (searchInput) {
                searchInput.value = '';
                // Trigger input event to reset filter state
                searchInput.dispatchEvent(new Event('input'));
            }
        } else {
            modal.classList.remove('open');
            // Only remove overflow lock if no other modal is open
            const openModals = document.querySelectorAll('.modal-overlay.open');
            if (openModals.length === 0) {
                document.body.classList.remove('modal-open');
            }
        }
    };

    // Open Listeners
    if (navServicesLink) {
        navServicesLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleModal(servicesModal, true);
        });
    }
    if (statsServicesItem) {
        statsServicesItem.addEventListener('click', () => {
            toggleModal(servicesModal, true);
        });
    }
    if (navDepartmentsLink) {
        navDepartmentsLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleModal(departmentsModal, true);
        });
    }

    // Admin Panel Navbar navigation hook
    const navAdminPanelLink = document.getElementById('navAdminPanelLink');
    if (navAdminPanelLink) {
        navAdminPanelLink.addEventListener('click', (e) => {
            e.preventDefault();
            const adminSelectionModal = document.getElementById('adminSelectionModal');
            toggleModal(adminSelectionModal, true);
        });
    }

    // Refresh Sessions button hook
    const btnRefreshSessions = document.getElementById('btnRefreshSessions');
    if (btnRefreshSessions) {
        btnRefreshSessions.addEventListener('click', (e) => {
            e.preventDefault();
            renderCitizenSessions();
        });
    }
    if (statsDeptItem) {
        statsDeptItem.addEventListener('click', () => {
            toggleModal(departmentsModal, true);
        });
    }

    // Close Listeners
    if (closeServicesModal) {
        closeServicesModal.addEventListener('click', () => toggleModal(servicesModal, false));
    }
    if (closeDepartmentsModal) {
        closeDepartmentsModal.addEventListener('click', () => toggleModal(departmentsModal, false));
    }

    // Click outside backdrop to close
    [servicesModal, departmentsModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    toggleModal(modal, false);
                }
            });
        }
    });

    // Escape key to close active modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-overlay.open');
            if (openModal) {
                toggleModal(openModal, false);
            }
        }
    });

    // --- 11. Government Departments Sub-Portal Engine ---
    const departmentData = {
        "agriculture & farmers welfare": {
            icon: "ph ph-plant",
            subDepts: [
                { name: "Crop Insurance", desc: "Protect crops against natural calamities, pests, and diseases with financial cover.", icon: "ph ph-shield-check" },
                { name: "Farmer Subsidies", desc: "Apply for direct subsidies on seeds, tractors, fertilizers, and modern equipment.", icon: "ph ph-currency-inr" },
                { name: "Soil Health Card", desc: "Get soil nutrient analysis, recommendation cards, and custom fertilizer guides.", icon: "ph ph-leaf" },
                { name: "PM Kisan Services", desc: "Manage income support registration, beneficiary statuses, and installment tracking.", icon: "ph ph-user-check" },
                { name: "Irrigation Support", desc: "Apply for drip/sprinkler system installation funding and water channel setups.", icon: "ph ph-drop" },
                { name: "Seed Distribution", desc: "Purchase certified high-yield seeds at government subsidised rates online.", icon: "ph ph-sprout" }
            ]
        },
        "animal husbandry & dairying": {
            icon: "ph ph-cow",
            subDepts: [
                { name: "Dairy Farming", desc: "Register dairy cooperatives, claim cold storage subsidies, and set up milk production units.", icon: "ph ph-drop-half-bottom" },
                { name: "Veterinary Services", desc: "Access public animal clinics, mobile medical vans, and livestock vaccination schedules.", icon: "ph ph-first-aid" },
                { name: "Livestock Insurance", desc: "Insure dairy cattle, sheep, goats, and poultry farms against accidental death and diseases.", icon: "ph ph-shield" },
                { name: "Poultry Development", desc: "Get training, breeding assistance, and micro-loans for poultry farm startups.", icon: "ph ph-egg" },
                { name: "Fisheries Support", desc: "Obtain pond cultivation licenses, fingerling subsidies, and cold-chain transport funding.", icon: "ph ph-fish" }
            ]
        },
        "civil aviation": {
            icon: "ph ph-airplane-in-flight",
            subDepts: [
                { name: "Flight Services", desc: "Track regional air connectivity (UDAN status), domestic airlines passenger charters, and flight paths.", icon: "ph ph-airplane" },
                { name: "Airport Information", desc: "Get updates on newly commissioned greenfield airports, lounges, and cargo infrastructure.", icon: "ph ph-buildings" },
                { name: "Air Safety", desc: "Submit DGCA incident reports, air safety guidelines, and airworthiness inspections.", icon: "ph ph-warning" },
                { name: "Pilot Licensing", desc: "Online flight training academy registrations, commercial pilot licensing verification, and exams.", icon: "ph ph-identification-card" },
                { name: "Drone Permissions", desc: "Register recreational or commercial drones on the Digital Sky portal for flight planning.", icon: "ph ph-wind" }
            ]
        },
        "consumer affairs & food": {
            icon: "ph ph-shopping-bag",
            subDepts: [
                { name: "Ration Card", desc: "Apply for a new digital ration card, add family members, or update fair price shop mappings.", icon: "ph ph-cardholder" },
                { name: "Consumer Complaints", desc: "File consumer disputes online with NCDRC, track case proceedings, and view rights documents.", icon: "ph ph-megaphone" },
                { name: "Food Distribution", desc: "Monitor state grain reserves, central food distribution channels, and storage logistics.", icon: "ph ph-scales" },
                { name: "Public Distribution System", desc: "Verify monthly entitlement quotas, check PDS dealer ratings, and view allocation timings.", icon: "ph ph-storefront" },
                { name: "Essential Commodities", desc: "Get updates on wholesale price caps, commodity stocking limits, and anti-hoarding campaigns.", icon: "ph ph-package" }
            ]
        },
        "defense & home guards": {
            icon: "ph ph-shield-star",
            subDepts: [
                { name: "Recruitment", desc: "Apply for army, navy, air force commissions, Agnipath schemes, and territorial armies.", icon: "ph ph-briefcase" },
                { name: "Ex-Servicemen Welfare", desc: "Pension services via SPARSH, medical benefits under ECHS, and resettlement quotas.", icon: "ph ph-medal" },
                { name: "NCC Services", desc: "Enroll students in senior/junior divisions, check training camps, and verify credit points.", icon: "ph ph-users" },
                { name: "National Security Information", desc: "Access official defense notifications, maritime boundaries, and air defense alerts.", icon: "ph ph-eye" },
                { name: "Border Welfare", desc: "Socio-economic infrastructure funding, roads, and healthcare support for border residents.", icon: "ph ph-map-pin" }
            ]
        },
        "education & literacy": {
            icon: "ph ph-graduation-cap",
            subDepts: [
                { name: "Scholarships", desc: "Direct access to central pre-matric, post-matric, and merit-cum-means fellowships.", icon: "ph ph-student" },
                { name: "Student Certificates", desc: "Verify board certificates, transcripts, and equivalent degrees from central boards.", icon: "ph ph-file-text" },
                { name: "School Admissions", desc: "Apply under Right to Education (RTE) quotas, central school (KV/JNV) admissions.", icon: "ph ph-door" },
                { name: "University Services", desc: "Check UGC registrations, equivalency certifications, and national university lists.", icon: "ph ph-book-open" },
                { name: "Digital Learning", desc: "Free video classes on SWAYAM, digital books library on NDL, and online course certifications.", icon: "ph ph-desktop" }
            ]
        },
        "electronics & it (meity)": {
            icon: "ph ph-cpu",
            subDepts: [
                { name: "Digital India", desc: "Check updates on public Wi-Fi access networks, electronics manufacturing incentives.", icon: "ph ph-globe" },
                { name: "Cyber Security", desc: "Report active security breaches to CERT-In, access internet security safety handbooks.", icon: "ph ph-lock-keyhole" },
                { name: "e-Governance Services", desc: "Central API repository (API Setu) integrations, open-data portals, and cloud hosting.", icon: "ph ph-cloud" },
                { name: "DigiLocker", desc: "Upload, verify, and store academic transcripts, vehicle records, and tax identifiers digitally.", icon: "ph ph-folder-open" },
                { name: "Aadhaar Integration", desc: "Biometric e-KYC authentications, developer integration SDKs, and Aadhaar portal access.", icon: "ph ph-fingerprint" }
            ]
        },
        "environment & forests": {
            icon: "ph ph-tree",
            subDepts: [
                { name: "Pollution Control", desc: "Apply for air/water pollution compliance certificates, green category permits.", icon: "ph ph-leaf" },
                { name: "Forest Permissions", desc: "Clearances for eco-tourism access, research logging, and boundary road mappings.", icon: "ph ph-map" },
                { name: "Wildlife Protection", desc: "Report illegal logging, animal poaching, or seek forest ranger assistance zones.", icon: "ph ph-paw-print" },
                { name: "Climate Programs", desc: "Join carbon footprint audits, regional afforestation programs, and climate projects.", icon: "ph ph-globe-hemisphere-west" },
                { name: "Green Initiatives", desc: "Subsidies for waste treatment plants, municipal compost programs, and organic farming.", icon: "ph ph-recycle" }
            ]
        },
        "finance & revenue": {
            icon: "ph ph-bank",
            subDepts: [
                { name: "Income Tax", desc: "Submit annual income declarations (ITR), process refunds, and apply for PAN linkage.", icon: "ph ph-coins" },
                { name: "GST Services", desc: "Apply for a new GSTIN identifier, file quarterly returns, or track input tax credits.", icon: "ph ph-receipt" },
                { name: "PAN Services", desc: "Apply for new Permanent Account Numbers, update biodata records, and download e-PAN.", icon: "ph ph-identification-card" },
                { name: "Budget Information", desc: "Read current union allocations, central tax revenues, and department expenditures.", icon: "ph ph-trend-up" },
                { name: "Banking Support", desc: "Apply for micro-credit schemes (Mudra), Jan Dhan accounts, and rural credit linkages.", icon: "ph ph-credit-card" }
            ]
        },
        "health & family welfare": {
            icon: "ph ph-heartbeat",
            subDepts: [
                { name: "Ayushman Bharat", desc: "Register health insurance cards, check local hospital eligibility, and check claims.", icon: "ph ph-first-aid-kit" },
                { name: "Hospital Services", desc: "Book outpatient appointments via e-Sanjeevani, check real-time bed counts.", icon: "ph ph-hospital" },
                { name: "Vaccination", desc: "Book immunizations, print Covid/BCG records, and check school vaccination dates.", icon: "ph ph-syringe" },
                { name: "Health Records", desc: "Access the digital ABHA locker, record vitals, and share records with health networks.", icon: "ph ph-notebook" },
                { name: "Ambulance Services", desc: "Request standard, cardiac, or neonatal response units via the central helpline.", icon: "ph ph-truck" }
            ]
        },
        "home affairs (police)": {
            icon: "ph ph-house-line",
            subDepts: [
                { name: "FIR Registration", desc: "File first information reports for non-cognizable incidents, missing belongings.", icon: "ph ph-pencil" },
                { name: "Police Verification", desc: "Request background clearance certificates for employment, tenant registry, and visas.", icon: "ph ph-user-focus" },
                { name: "Cyber Crime", desc: "Report identity theft, phishing campaigns, online fraud, or cyber bullying zones.", icon: "ph ph-terminal-window" },
                { name: "Passport Verification", desc: "Track field visits, check police report logs, and upload supplementary proof.", icon: "ph ph-airplane-tilt" },
                { name: "Emergency Services", desc: "Dial central emergency dispatchers (112) for immediate rescue, fire, or police.", icon: "ph ph-phone-call" }
            ]
        },
        "housing & urban affairs": {
            icon: "ph ph-buildings",
            subDepts: [
                { name: "Housing Schemes", desc: "Apply for affordable housing allotments, interest subsidies under PMAY.", icon: "ph ph-house" },
                { name: "Smart City Services", desc: "Access municipal CCTV services, smart parking allocations, and traffic maps.", icon: "ph ph-map-trifold" },
                { name: "Water Supply", desc: "Apply for new municipal tap pipe links, report dirty supply, and pay bills.", icon: "ph ph-drop" },
                { name: "Property Tax", desc: "Calculate yearly property valuations, pay tax liabilities, and download receipts.", icon: "ph ph-coins" },
                { name: "Urban Development", desc: "Access municipal zoning directories, commercial building clearances, and parks.", icon: "ph ph-tree" }
            ]
        },
        "information & broadcasting": {
            icon: "ph ph-broadcast",
            subDepts: [
                { name: "Media Services", desc: "Register newspapers, journals, or apply for state press accreditation cards.", icon: "ph ph-newspaper" },
                { name: "Government News", desc: "Access official press summaries, ministerial updates, and state directories.", icon: "ph ph-megaphone" },
                { name: "Press Information", desc: "View daily PIB bulletins, media advisories, and fact-checking updates.", icon: "ph ph-info" },
                { name: "Broadcasting Licenses", desc: "Apply for community FM radios, satellite television transponder slots.", icon: "ph ph-rss" },
                { name: "Public Announcements", desc: "Read state gazette announcements, public auction lists, and notification logs.", icon: "ph ph-bell" }
            ]
        },
        "labour & employment": {
            icon: "ph ph-briefcase",
            subDepts: [
                { name: "Job Portal", desc: "Register as job seekers, browse career portals, and enroll in skill tests.", icon: "ph ph-user-plus" },
                { name: "Labour Registration", desc: "Get unorganised labour cards (e-Shram), apply for worker compensation.", icon: "ph ph-identification-badge" },
                { name: "Skill Development", desc: "Register for free skill workshops, certifications under PMKVY.", icon: "ph ph-graduation-cap" },
                { name: "Worker Welfare", desc: "Apply for health assistance funds, safety gear allocations, and worker housing.", icon: "ph ph-users-three" },
                { name: "Employment Exchange", desc: "Verify registrations, check local recruitment dates, and access databases.", icon: "ph ph-database" }
            ]
        },
        "law & justice": {
            icon: "ph ph-scales",
            subDepts: [
                { name: "Legal Aid", desc: "Access free legal counseling services for low-income citizens and families.", icon: "ph ph-chats" },
                { name: "Court Services", desc: "Access court forms, check fee structures, and download court rules.", icon: "ph ph-file" },
                { name: "e-Courts", desc: "Check case statuses across district/high courts, read judgments online.", icon: "ph ph-desktop" },
                { name: "Notary Services", desc: "Find registered notary officers, execute affidavits, and certify documents.", icon: "ph ph-pen" },
                { name: "Case Tracking", desc: "Track legal disputes, check court calendars, and view hearing logs.", icon: "ph ph-timer" }
            ]
        },
        "panchayati raj & rural": {
            icon: "ph ph-house-line",
            subDepts: [
                { name: "Rural Development", desc: "Apply for rural cottage funding, check sanitation grants, and village works.", icon: "ph ph-plugs" },
                { name: "Village Welfare", desc: "Check agricultural market linkages, village clinics, and public works.", icon: "ph ph-users" },
                { name: "Panchayat Services", desc: "Apply for rural birth registration, check Gram Sabha resolutions.", icon: "ph ph-chalkboard" },
                { name: "Rural Roads", desc: "Track village road construction under PMGSY, report pothole issues.", icon: "ph ph-road-horizon" },
                { name: "Water Schemes", desc: "Register for clean tap connection grants under Jal Jeevan Mission.", icon: "ph ph-drop" }
            ]
        },
        "petroleum & natural gas": {
            icon: "ph ph-gas-can",
            subDepts: [
                { name: "LPG Services", desc: "Apply for new household cooking gas connections (Ujjwala Scheme).", icon: "ph ph-fire" },
                { name: "Gas Booking", desc: "Book cylinder refills, pay fuel bills, and schedule pipeline tests.", icon: "ph ph-calendar" },
                { name: "Fuel Subsidies", desc: "Manage bank transfer mappings, check gas subsidy logs, and eligibility.", icon: "ph ph-hand-coins" },
                { name: "Oil Distribution", desc: "Check diesel allocations, access commercial aviation fuel licensing.", icon: "ph ph-drop-half" },
                { name: "Pipeline Services", desc: "Report household gas leaks, map new connection lines, and check pipeline safety.", icon: "ph ph-wrench" }
            ]
        },
        "power & renewable energy": {
            icon: "ph ph-lightning",
            subDepts: [
                { name: "Electricity Bills", desc: "Pay electricity bills online, calculate home energy use, and check records.", icon: "ph ph-credit-card" },
                { name: "Solar Schemes", desc: "Apply for solar rooftop subsidies, check solar pump grants for farms.", icon: "ph ph-sun" },
                { name: "Power Complaints", desc: "Report grid failure outages, local transformer fires, or billing issues.", icon: "ph ph-warning-octagon" },
                { name: "Energy Savings", desc: "Order subsidised LED bulbs, check rating guidelines for appliances.", icon: "ph ph-lightbulb" },
                { name: "Renewable Projects", desc: "Apply for wind farm allocations, check municipal waste energy projects.", icon: "ph ph-globe" }
            ]
        },
        "railways": {
            icon: "ph ph-train",
            subDepts: [
                { name: "Train Booking", desc: "Book train tickets on IRCTC, manage bookings, and request seat changes.", icon: "ph ph-ticket" },
                { name: "PNR Status", desc: "Check real-time PNR travel validation, seat charts, and waitlists.", icon: "ph ph-magnifying-glass" },
                { name: "Railway Complaints", desc: "Report cleanliness issues, check food services, and report medical emergencies.", icon: "ph ph-megaphone" },
                { name: "Freight Services", desc: "Book shipping cargo containers, track train shipments, and check pricing.", icon: "ph ph-package" },
                { name: "Platform Information", desc: "Check platform mappings, train schedules, and station parking services.", icon: "ph ph-info" }
            ]
        },
        "road transport & highways": {
            icon: "ph ph-steering-wheel",
            subDepts: [
                { name: "Driving License", desc: "Apply for learner license, schedule test slots, and renew driver card.", icon: "ph ph-identification-card" },
                { name: "Vehicle Registration", desc: "Check RTO registration details, transfer ownership, and get duplicate RC.", icon: "ph ph-car" },
                { name: "Traffic Fines", desc: "Check pending traffic fines, view violations, and pay challenges.", icon: "ph ph-receipt" },
                { name: "Highway Information", desc: "Fastag account setups, national toll fee calculators, and route works.", icon: "ph ph-road-horizon" },
                { name: "Road Safety", desc: "Report highway accidents, check active speed limits, and road condition reports.", icon: "ph ph-shield-warning" }
            ]
        },
        "social justice & welfare": {
            icon: "ph ph-users",
            subDepts: [
                { name: "Pension Schemes", desc: "Apply for senior old age, widow, or disability monthly benefits.", icon: "ph ph-heart-straight" },
                { name: "Disability Services", desc: "Apply for national UDID disability cards, seek assistive tools grants.", icon: "ph ph-wheelchair" },
                { name: "Minority Welfare", desc: "Manage educational skill grants, coaching programs, and micro-loans.", icon: "ph ph-users-three" },
                { name: "Senior Citizen Support", desc: "Helpline directories, home care programs, and travel discount cards.", icon: "ph ph-user-plus" },
                { name: "Social Security", desc: "Apply for accident insurance (Pradhan Mantri Suraksha Bima) and death cover.", icon: "ph ph-shield-check" }
            ]
        },
        "tourism & culture": {
            icon: "ph ph-compass",
            subDepts: [
                { name: "Tourism Booking", desc: "Book tickets for national heritage landmarks, schedule tourist guide cards.", icon: "ph ph-ticket" },
                { name: "Heritage Sites", desc: "Browse conservation records of monuments, view maps, and open hours.", icon: "ph ph-bank" },
                { name: "Cultural Events", desc: "Join state cultural festival events, apply for artist grants.", icon: "ph ph-guitar" },
                { name: "Museum Information", desc: "Check national museum schedules, book tickets, and check maps.", icon: "ph ph-info" },
                { name: "Pilgrimage Services", desc: "Register for state-sponsored pilgrimage routes, check travel camps.", icon: "ph ph-hands-praying" }
            ]
        },
        "women & child development": {
            icon: "ph ph-baby",
            subDepts: [
                { name: "Women Safety", desc: "Access emergency helpline numbers, safe house listings, and local cells.", icon: "ph ph-shield-warning" },
                { name: "Child Welfare", desc: "Report missing children, register child protection claims, and child assistance.", icon: "ph ph-first-aid" },
                { name: "Nutrition Programs", desc: "Apply for pregnancy nutrition support grants (Matru Vandana).", icon: "ph ph-heart" },
                { name: "Anganwadi Services", desc: "Find local Anganwadi preschool facilities, nutritional distribution days.", icon: "ph ph-storefront" },
                { name: "Helpline Support", desc: "Access 24/7 dedicated support lines for family issues and counsel.", icon: "ph ph-phone-call" }
            ]
        },
        "youth affairs & sports": {
            icon: "ph ph-trophy",
            subDepts: [
                { name: "Sports Registration", desc: "Enroll in national athlete directories, check sports academy entries.", icon: "ph ph-barbell" },
                { name: "Youth Programs", desc: "Join national youth volunteer groups (NYKS), leadership training camps.", icon: "ph ph-hand-fist" },
                { name: "Stadium Booking", desc: "Apply for public sports complex access, book stadium practice times.", icon: "ph ph-calendar" },
                { name: "Fitness Campaigns", desc: "Participate in Fit India challenge campaigns, check diet guidelines.", icon: "ph ph-heartbeat" },
                { name: "Scholarship Programs", desc: "Apply for national sports talent funding, monthly grants for athletes.", icon: "ph ph-graduation-cap" }
            ]
        }
    };

    // Card Title Map to preserve original visual casing
    const cardTitleMap = {};
    const cards = modalDepartmentsGrid ? modalDepartmentsGrid.querySelectorAll('.department-card') : [];
    cards.forEach(card => {
        const h3 = card.querySelector('h3');
        if (h3) {
            const title = h3.textContent.trim();
            cardTitleMap[title.toLowerCase()] = title;
        }
    });

    // Create Toast Container notifications dynamically
    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `dept-toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="ph-fill ph-bell-ringing toast-icon"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close-btn">&times;</button>
        `;
        
        toast.querySelector('.toast-close-btn').addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    };

    // Breadcrumbs System
    const updateBreadcrumbs = (deptKey = null, subName = null) => {
        const breadcrumbs = document.getElementById('deptBreadcrumbs');
        if (!breadcrumbs) return;
        
        breadcrumbs.innerHTML = '';
        
        const root = document.createElement('span');
        root.className = deptKey ? 'breadcrumb-item' : 'breadcrumb-item active';
        root.textContent = 'Departments';
        root.addEventListener('click', () => {
            document.getElementById('deptDetailView').classList.add('hidden');
            if (modalDepartmentsGrid) modalDepartmentsGrid.classList.remove('hidden');
            const searchResults = document.getElementById('deptSearchResultsList');
            if (searchResults) searchResults.classList.add('hidden');
            if (deptSearchInput) {
                deptSearchInput.value = '';
                deptSearchInput.dispatchEvent(new Event('input'));
            }
            updateBreadcrumbs();
        });
        breadcrumbs.appendChild(root);
        
        if (deptKey) {
            breadcrumbs.appendChild(createCaretSeparator());
            
            const deptItem = document.createElement('span');
            deptItem.className = subName ? 'breadcrumb-item' : 'breadcrumb-item active';
            deptItem.textContent = cardTitleMap[deptKey] || deptKey;
            deptItem.addEventListener('click', () => {
                openDepartmentView(deptKey);
            });
            breadcrumbs.appendChild(deptItem);
        }
        
        if (subName) {
            breadcrumbs.appendChild(createCaretSeparator());
            
            const subItem = document.createElement('span');
            subItem.className = 'breadcrumb-item active';
            subItem.textContent = subName;
            breadcrumbs.appendChild(subItem);
        }
    };
    
    const createCaretSeparator = () => {
        const i = document.createElement('i');
        i.className = 'ph ph-caret-right separator';
        return i;
    };

    // Highlight text helper
    const highlightDeptText = (text, query) => {
        if (!query) return text;
        const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return text.replace(regex, '<mark class="highlight">$1</mark>');
    };

    // Detailed Department Sub-Portal Renderer
    const openDepartmentView = (deptName, targetSubServiceName = null) => {
        const cleanName = deptName.toLowerCase().trim();
        const deptInfo = departmentData[cleanName];
        if (!deptInfo) return;
        
        const loader = document.getElementById('deptLoadingOverlay');
        const detailView = document.getElementById('deptDetailView');
        const searchResults = document.getElementById('deptSearchResultsList');
        
        if (loader) loader.classList.remove('hidden');
        if (detailView) detailView.classList.add('hidden');
        if (modalDepartmentsGrid) modalDepartmentsGrid.classList.add('hidden');
        if (searchResults) searchResults.classList.add('hidden');
        
        setTimeout(() => {
            if (loader) loader.classList.add('hidden');
            if (detailView) detailView.classList.remove('hidden');
            
            document.getElementById('detailDeptName').textContent = cardTitleMap[cleanName] || deptName;
            
            let descText = "Government Ministerial Administrative Body.";
            cards.forEach(card => {
                const h3 = card.querySelector('h3');
                if (h3 && h3.textContent.trim().toLowerCase() === cleanName) {
                    const p = card.querySelector('p');
                    if (p) descText = p.textContent.trim();
                }
            });
            document.getElementById('detailDeptDesc').textContent = descText;
            
            const iconEl = document.getElementById('detailDeptIcon').querySelector('i');
            if (iconEl) iconEl.className = deptInfo.icon;
            
            const subDeptsList = document.getElementById('subDeptsList');
            subDeptsList.innerHTML = '';
            
            deptInfo.subDepts.forEach(sub => {
                const subItem = document.createElement('div');
                subItem.className = 'sub-dept-accordion';
                subItem.setAttribute('data-name', sub.name.toLowerCase());
                subItem.innerHTML = `
                    <button class="sub-dept-header">
                        <div class="sub-dept-header-left">
                            <div class="sub-dept-icon-box">
                                <i class="${sub.icon}"></i>
                            </div>
                            <span class="sub-dept-title">${sub.name}</span>
                        </div>
                        <i class="ph ph-caret-down accordion-caret"></i>
                    </button>
                    <div class="sub-dept-content">
                        <div class="sub-dept-content-inner">
                            <p class="sub-dept-desc">${sub.desc}</p>
                            <div class="sub-dept-actions">
                                <button class="btn btn-primary btn-sm btn-open-service" data-service="${sub.name}">
                                    <i class="ph ph-arrow-square-out"></i> Open Service
                                </button>
                                <button class="btn btn-secondary btn-sm btn-apply-service" data-service="${sub.name}">
                                    <i class="ph ph-note-pencil"></i> Apply Now
                                </button>
                                <button class="btn btn-outline btn-sm btn-learn-service" data-service="${sub.name}">
                                    <i class="ph ph-info"></i> Learn More
                                </button>
                                <button class="btn btn-outline btn-sm btn-track-service" data-service="${sub.name}">
                                    <i class="ph ph-magnifying-glass"></i> Track Application
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                const header = subItem.querySelector('.sub-dept-header');
                const content = subItem.querySelector('.sub-dept-content');
                
                header.addEventListener('click', () => {
                    const isOpen = subItem.classList.contains('open');
                    
                    subDeptsList.querySelectorAll('.sub-dept-accordion').forEach(item => {
                        item.classList.remove('open');
                        item.querySelector('.sub-dept-content').style.maxHeight = null;
                    });
                    
                    if (!isOpen) {
                        subItem.classList.add('open');
                        content.style.maxHeight = content.scrollHeight + "px";
                        updateBreadcrumbs(cleanName, sub.name);
                    } else {
                        updateBreadcrumbs(cleanName);
                    }
                });
                
                // Action buttons logic mapping
                subItem.querySelector('.btn-open-service').addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Find matching service in premium portal database
                    let matched = null;
                    for (const [catKey, catVal] of Object.entries(citizenServicesData)) {
                        const found = catVal.services.find(s => 
                            s.name.toLowerCase() === sub.name.toLowerCase() || 
                            s.name.toLowerCase().includes(sub.name.toLowerCase()) || 
                            sub.name.toLowerCase().includes(s.name.toLowerCase())
                        );
                        if (found) {
                            matched = { service: found, category: catKey };
                            break;
                        }
                    }
                    
                    if (matched) {
                        toggleModal(departmentsModal, false);
                        currentCategoryKey = matched.category;
                        togglePortalOverlay(true);
                        openServiceDashboard(matched.service);
                    } else {
                        showToast(`Successfully connected to the central database for ${sub.name}... Status: Active`, 'success');
                    }
                });
                
                subItem.querySelector('.btn-apply-service').addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    const serviceName = sub.name.toLowerCase();
                    let wizardType = null;
                    
                    if (serviceName.includes("birth")) {
                        wizardType = "birth";
                    } else if (serviceName.includes("driving")) {
                        wizardType = "license";
                    } else if (serviceName.includes("passport")) {
                        wizardType = "passport";
                    }
                    
                    if (wizardType) {
                        if (!currentUser) {
                            toggleModal(departmentsModal, false);
                            showToast("Please login to apply for this service", "error");
                            toggleAuthModal(true);
                        } else {
                            toggleModal(departmentsModal, false);
                            switchDashboardTab('apply');
                            openWizard(wizardType);
                            const wizardView = document.getElementById('serviceFormWizardView');
                            if (wizardView) {
                                wizardView.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }
                    } else {
                        // Find matching service in premium portal database
                        let matched = null;
                        for (const [catKey, catVal] of Object.entries(citizenServicesData)) {
                            const found = catVal.services.find(s => 
                                s.name.toLowerCase() === sub.name.toLowerCase() || 
                                s.name.toLowerCase().includes(sub.name.toLowerCase()) || 
                                sub.name.toLowerCase().includes(s.name.toLowerCase())
                            );
                            if (found) {
                                matched = { service: found, category: catKey };
                                break;
                            }
                        }
                        
                        if (matched) {
                            if (!currentUser) {
                                toggleModal(departmentsModal, false);
                                showToast("Please login to apply for this service", "error");
                                toggleAuthModal(true);
                            } else {
                                toggleModal(departmentsModal, false);
                                currentCategoryKey = matched.category;
                                togglePortalOverlay(true);
                                openServiceDashboard(matched.service);
                            }
                        } else {
                            showToast(`Initiating digital application portal for ${sub.name}...`, 'success');
                        }
                    }
                });
                
                subItem.querySelector('.btn-learn-service').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const previewModal = document.getElementById('filePreviewModal');
                    if (previewModal) {
                        document.getElementById('previewTitle').textContent = `${sub.name} - Service Manual`;
                        document.getElementById('previewInfo').textContent = `Official Guidelines & Documentation (Department of ${cardTitleMap[cleanName] || deptName})`;
                        document.getElementById('previewBody').innerHTML = `
                            <div class="preview-handbook-content" style="color: var(--text-primary); line-height: 1.6; font-family: var(--font-body);">
                                <h4 style="color: var(--primary-color); margin-bottom: 0.75rem;">1. Service Description</h4>
                                <p style="margin-bottom: 1rem;">This handbook provides general guidelines for utilizing <strong>${sub.name}</strong> under the administrative body of ${cardTitleMap[cleanName] || deptName}. This service is integrated into the national single-window digital channel.</p>
                                <h4 style="color: var(--primary-color); margin-bottom: 0.75rem;">2. Eligibility Criteria</h4>
                                <ul style="margin-bottom: 1rem; padding-left: 1.25rem; list-style-type: disc;">
                                    <li>Applicant must be a resident citizen of India.</li>
                                    <li>Must possess valid foundational identification (Aadhaar, PAN, or state credentials).</li>
                                    <li>Supplementary certifications may be required depending on classification.</li>
                                </ul>
                                <h4 style="color: var(--primary-color); margin-bottom: 0.75rem;">3. Required Credentials</h4>
                                <p style="margin-bottom: 1rem;">Please keep clean scanned copies of identity verification documents ready before applying online. Documents can also be linked dynamically from your registered <strong>DigiLocker</strong> profile during step-by-step submission.</p>
                                <div style="background: rgba(37, 99, 235, 0.05); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary-color);">
                                    <strong>Unified Support:</strong> For direct complaints or tracking status errors relating to this department service, access the central grievance helpdesk tab or dial 112.
                                </div>
                            </div>
                        `;
                        previewModal.classList.add('open');
                        document.body.classList.add('modal-open');
                    }
                });
                
                subItem.querySelector('.btn-track-service').addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleModal(departmentsModal, false);
                    const trackSection = document.getElementById('track-status');
                    if (trackSection) {
                        trackSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const trackCat = document.getElementById('track-category');
                        if (trackCat) {
                            if (sub.name.toLowerCase().includes("passport")) {
                                trackCat.value = "passport";
                            } else if (sub.name.toLowerCase().includes("license") || sub.name.toLowerCase().includes("driving")) {
                                trackCat.value = "license";
                            } else if (sub.name.toLowerCase().includes("birth")) {
                                trackCat.value = "birth";
                            } else if (sub.name.toLowerCase().includes("death")) {
                                trackCat.value = "death";
                            } else if (sub.name.toLowerCase().includes("welfare") || sub.name.toLowerCase().includes("kisan") || sub.name.toLowerCase().includes("pension")) {
                                trackCat.value = "welfare";
                            } else {
                                trackCat.value = "other";
                            }
                        }
                        const inputField = document.getElementById('track-app-number');
                        if (inputField) {
                            inputField.focus();
                            inputField.placeholder = "Enter Token/App ID...";
                        }
                        showToast(`Enter your application credentials below to track ${sub.name} status.`, 'success');
                    }
                });
                
                subDeptsList.appendChild(subItem);
            });
            
            // Expand subservice if targeted by search results click
            if (targetSubServiceName) {
                const targetAccordion = subDeptsList.querySelector(`.sub-dept-accordion[data-name="${targetSubServiceName.toLowerCase()}"]`);
                if (targetAccordion) {
                    targetAccordion.querySelector('.sub-dept-header').click();
                }
            } else {
                updateBreadcrumbs(cleanName);
            }
        }, 450);
    };

    // Close departments reset listener
    if (closeDepartmentsModal) {
        closeDepartmentsModal.addEventListener('click', () => {
            document.getElementById('deptDetailView').classList.add('hidden');
            if (modalDepartmentsGrid) modalDepartmentsGrid.classList.remove('hidden');
            const searchResults = document.getElementById('deptSearchResultsList');
            if (searchResults) searchResults.classList.add('hidden');
            if (deptSearchInput) {
                deptSearchInput.value = '';
            }
            updateBreadcrumbs();
        });
    }

    // Card Clicks trigger openDepartmentView
    cards.forEach(card => {
        const link = card.querySelector('.card-link');
        const clickHandler = (e) => {
            e.preventDefault();
            const deptName = card.querySelector('h3').textContent.trim();
            openDepartmentView(deptName);
        };
        
        if (link) {
            link.addEventListener('click', clickHandler);
        }
        card.addEventListener('click', clickHandler);
    });

    // Departments and Sub-departments Search engine
    if (deptSearchInput && modalDepartmentsGrid) {
        let searchResultsContainer = document.getElementById('deptSearchResultsList');
        if (!searchResultsContainer) {
            searchResultsContainer = document.createElement('div');
            searchResultsContainer.id = 'deptSearchResultsList';
            searchResultsContainer.className = 'dept-search-results hidden';
            modalDepartmentsGrid.parentNode.insertBefore(searchResultsContainer, modalDepartmentsGrid.nextSibling);
        }
        
        const searchIcon = document.getElementById('deptSearchIcon');
        let searchTimeout = null;

        deptSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            // Toggle typing spinner loading state
            if (searchIcon) {
                searchIcon.className = 'ph ph-spinner search-icon loading';
            }
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (searchIcon) {
                    searchIcon.className = 'ph ph-magnifying-glass search-icon';
                }
                
                updateBreadcrumbs();
                
                if (!query) {
                    searchResultsContainer.classList.add('hidden');
                    modalDepartmentsGrid.classList.remove('hidden');
                    document.getElementById('deptDetailView').classList.add('hidden');
                    cards.forEach(card => card.style.display = '');
                    if (deptNoResults) deptNoResults.classList.add('hidden');
                    return;
                }
                
                document.getElementById('deptDetailView').classList.add('hidden');
                modalDepartmentsGrid.classList.add('hidden');
                searchResultsContainer.classList.remove('hidden');
                searchResultsContainer.innerHTML = '';
                
                const matchedServices = [];
                const matchedDepts = [];
                
                for (const [deptKey, deptInfo] of Object.entries(departmentData)) {
                    // Search subservices names & descriptions
                    deptInfo.subDepts.forEach(sub => {
                        if (sub.name.toLowerCase().includes(query) || sub.desc.toLowerCase().includes(query)) {
                            matchedServices.push({
                                sub: sub,
                                deptKey: deptKey,
                                deptName: cardTitleMap[deptKey] || deptKey
                            });
                        }
                    });
                    
                    // Search main department keys
                    if (deptKey.includes(query)) {
                        matchedDepts.push({
                            deptKey: deptKey,
                            deptName: cardTitleMap[deptKey] || deptKey
                        });
                    }
                }
                
                let resultsHtml = '';
                
                if (matchedDepts.length > 0) {
                    resultsHtml += `<div class="search-results-section-header">Matching Departments</div><div class="dept-results-grid">`;
                    matchedDepts.forEach(item => {
                        const icon = departmentData[item.deptKey].icon;
                        resultsHtml += `
                            <div class="dept-result-item glass-panel" data-dept="${item.deptKey}">
                                <div class="dept-result-icon"><i class="${icon}"></i></div>
                                <span>${highlightDeptText(item.deptName, query)}</span>
                            </div>
                        `;
                    });
                    resultsHtml += `</div>`;
                }
                
                if (matchedServices.length > 0) {
                    resultsHtml += `<div class="search-results-section-header">Matching Services</div><div class="service-results-list">`;
                    matchedServices.forEach(item => {
                        resultsHtml += `
                            <div class="service-result-item glass-panel" data-dept="${item.deptKey}" data-sub="${item.sub.name}">
                                <div class="service-result-left">
                                    <div class="service-result-icon"><i class="${item.sub.icon}"></i></div>
                                    <div class="service-result-info">
                                        <h4>${highlightDeptText(item.sub.name, query)}</h4>
                                        <p>${highlightDeptText(item.sub.desc, query)}</p>
                                    </div>
                                </div>
                                <span class="service-result-dept-badge">${item.deptName}</span>
                            </div>
                        `;
                    });
                    resultsHtml += `</div>`;
                }
                
                searchResultsContainer.innerHTML = resultsHtml;
                
                // Clicking result directly navigates to department detail and expands accordion
                searchResultsContainer.querySelectorAll('.dept-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const dept = item.getAttribute('data-dept');
                        openDepartmentView(dept);
                    });
                });
                
                searchResultsContainer.querySelectorAll('.service-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const dept = item.getAttribute('data-dept');
                        const sub = item.getAttribute('data-sub');
                        openDepartmentView(dept, sub);
                    });
                });
                
                if (matchedDepts.length === 0 && matchedServices.length === 0) {
                    searchResultsContainer.classList.add('hidden');
                    if (deptNoResults) deptNoResults.classList.remove('hidden');
                } else {
                    if (deptNoResults) deptNoResults.classList.add('hidden');
                }
                
            }, 250);
        });
    }

    // Services Live Search Filter
    if (servicesSearchInput && modalServicesGrid) {
        servicesSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const cards = modalServicesGrid.querySelectorAll('.service-card');
            let matchCount = 0;

            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const desc = card.querySelector('p').textContent.toLowerCase();
                const keywords = card.getAttribute('data-keywords') ? card.getAttribute('data-keywords').toLowerCase() : '';

                if (title.includes(query) || desc.includes(query) || keywords.includes(query)) {
                    card.style.display = '';
                    matchCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (matchCount === 0) {
                if (servicesNoResults) servicesNoResults.classList.remove('hidden');
            } else {
                if (servicesNoResults) servicesNoResults.classList.add('hidden');
            }
        });
    }

    // --- 12. Responsive Mobile Menu Toggler ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const icon = mobileMenuBtn.querySelector('i');
            if (mainNav.classList.contains('open')) {
                icon.className = 'ph ph-x'; // Close icon
                document.body.classList.add('nav-menu-open');
            } else {
                icon.className = 'ph ph-list'; // List burger icon
                document.body.classList.remove('nav-menu-open');
            }
        });

        // Close mobile menu when nav link is clicked
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('open');
                mobileMenuBtn.querySelector('i').className = 'ph ph-list';
                document.body.classList.remove('nav-menu-open');
            });
        });
    }

    // --- 14. Dynamic State Welfare Schemes Database & Selector ---
    const stateSchemesData = {
        'AP': {
            stateName: 'Andhra Pradesh',
            schemes: [
                { badge: 'EDUCATION', title: 'Jagananna Amma Vodi', desc: 'Provides annual financial assistance of ₹15,000 to poor mothers to support educating their school-going children.', eligibility: 'BPL mothers with kids in Class I-XII' },
                { badge: 'AGRICULTURE', title: 'YSR Rythu Bharosa', desc: 'Offers annual investment support of ₹13,500 to land-owning farmers, promoting sustainable agricultural practices.', eligibility: 'Landholding farmer families' },
                { badge: 'HEALTH', title: 'Aarogyasri Health Scheme', desc: 'Provides free healthcare cover up to ₹25 Lakhs per year for medical treatment in corporate hospitals.', eligibility: 'Low-income families' }
            ]
        },
        'AR': {
            stateName: 'Arunachal Pradesh',
            schemes: [
                { badge: 'HEALTH', title: "CMAAY Scheme", desc: "Provides cashless medical treatment up to ₹5 Lakhs per family per year for secondary and tertiary care.", eligibility: 'State resident families' },
                { badge: 'EMPLOYMENT', title: 'Deen Dayal Swavalamban', desc: 'Supports startup ventures with 30% capital subsidy on loans ranging from ₹10 Lakhs to ₹1 Crore.', eligibility: 'Local entrepreneurs & youth' },
                { badge: 'WOMEN', title: 'Dulari Kanya Yojana', desc: 'Invests a fixed deposit of ₹20,000 for girl children born in government hospitals, maturity at age 18.', eligibility: 'Girl child born in government hospital' }
            ]
        },
        'AS': {
            stateName: 'Assam',
            schemes: [
                { badge: 'WOMEN', title: 'Orunodoi Scheme', desc: 'Monthly cash assistance of ₹1,250 transferred directly to the female head of low-income families.', eligibility: 'Resident low-income households' },
                { badge: 'EDUCATION', title: 'Pragyan Bharati', desc: 'Provides free admission, text books, and scooties to meritorious female students for higher education.', eligibility: 'Assamese students' },
                { badge: 'MARRIAGE', title: 'Arundhati Gold Scheme', desc: 'Offers ₹40,000 financial aid to register marriages and purchase gold for brides from poor backgrounds.', eligibility: 'Newly married brides (family income < ₹5L)' }
            ]
        },
        'BR': {
            stateName: 'Bihar',
            schemes: [
                { badge: 'WOMEN', title: 'Kanya Utthan Yojana', desc: 'Financial support of up to ₹54,100 to girls from birth till graduation to promote education and prevent child marriage.', eligibility: 'All resident girls in Bihar' },
                { badge: 'EDUCATION', title: 'Student Credit Card', desc: 'Interest-free educational loans up to ₹4 Lakhs for pursuing higher professional education.', eligibility: 'Students who completed 12th standard' },
                { badge: 'UTILITIES', title: 'Har Ghar Gangajal', desc: 'Supplies purified Ganga water to water-stressed cities like Rajgir, Bodhgaya, and Gaya directly to home taps.', eligibility: 'Local households in target areas' }
            ]
        },
        'CT': {
            stateName: 'Chhattisgarh',
            schemes: [
                { badge: 'AGRICULTURE', title: 'Rajiv Gandhi Kisan Nyay', desc: 'Direct cash transfer of ₹10,000 per acre to crop farmers to ensure input cost relief and production growth.', eligibility: 'Paddy and crop farmers' },
                { badge: 'HEALTH', title: 'Suposhan Yojana', desc: 'Distributes hot nutritious meals, iron supplements, and counseling to eradicate malnutrition among kids and women.', eligibility: 'Malnourished children and women' },
                { badge: 'WOMEN', title: 'Mahtari Vandan Yojana', desc: 'Provides ₹1,000 monthly financial aid to married women to elevate their economic self-reliance and wellness.', eligibility: 'Married women (age 21-60)' }
            ]
        },
        'GA': {
            stateName: 'Goa',
            schemes: [
                { badge: 'WOMEN', title: 'Griha Aadhar Scheme', desc: 'Provides ₹1,500 monthly financial assistance to housewives from low-income groups to support basic food security.', eligibility: 'Housewives (family income < ₹3L)' },
                { badge: 'MARRIAGE', title: 'Laadli Laxmi Scheme', desc: 'Offers ₹1 Lakh fixed deposit to resident girls to be used for their wedding or self-employment goals.', eligibility: 'Resident girls aged 18-35 years' },
                { badge: 'EMPLOYMENT', title: 'CM Apprenticeship', desc: 'Paid monthly stipend training program across departments to prepare local youth for commercial jobs.', eligibility: 'Unemployed Goan youth' }
            ]
        },
        'GJ': {
            stateName: 'Gujarat',
            schemes: [
                { badge: 'AGRICULTURE', title: 'Kisan Sahay Yojana', desc: 'Compensates farmers for up to 33% crop damage caused by natural calamities like drought, heavy rains, or cyclones.', eligibility: 'State landholding farmers' },
                { badge: 'SENIORS', title: 'Shravan Tirth Yojana', desc: 'Provides 50% travel concession on state buses to senior citizens traveling on cultural pilgrimage circuits.', eligibility: 'Resident seniors aged 60+' },
                { badge: 'EDUCATION', title: 'MYSY Scholarship', desc: 'Offers up to ₹2 Lakhs annual tuition fee reimbursement to meritorious students for professional courses.', eligibility: 'Students scoring 80+ percentile in 12th' }
            ]
        },
        'HR': {
            stateName: 'Haryana',
            schemes: [
                { badge: 'IDENTITY', title: 'Parivar Pehchan Patra', desc: 'Establishes a digital 8-digit family ID to link welfare delivery and income criteria directly to household accounts.', eligibility: 'All Haryana resident families' },
                { badge: 'PENSION', title: 'Ladli Social Security', desc: 'Provides a monthly allowance of ₹3,000 to parents who only have girl children, starting from their age of 45.', eligibility: 'Parents with only girl children' },
                { badge: 'LIVELIHOOD', title: 'Antyodaya Parivar Utthan', desc: 'Integrates self-employment training, subsidies, and credit guidance to elevate low-income families.', eligibility: 'Families with annual income < ₹1.8L' }
            ]
        },
        'HP': {
            stateName: 'Himachal Pradesh',
            schemes: [
                { badge: 'HEALTH', title: 'Sahara Yojna', desc: 'Offers ₹3,000 per month to patients suffering from chronic diseases like cancer, paralysis, or kidney failure.', eligibility: 'Patients from poor families' },
                { badge: 'EMPLOYMENT', title: 'Mukhya Mantri Swavalamban', desc: 'Provides 25% to 35% capital subsidy on industrial machinery to motivate local startups and ventures.', eligibility: 'Resident youth aged 18-45 years' },
                { badge: 'WOMEN', title: 'Pyari Behna Sukh Samman', desc: 'Monthly cash support of ₹1,500 transferred to women to ensure basic dignity and financial stability.', eligibility: 'Women resident aged 18-60 years' }
            ]
        },
        'JH': {
            stateName: 'Jharkhand',
            schemes: [
                { badge: 'HOUSING', title: 'Abua Awas Yojana', desc: 'Constructs permanent three-room houses with separate kitchens for rural homeless and marginalized families.', eligibility: 'Homeless or mud-house dwellers' },
                { badge: 'WOMEN', title: 'Maiya Samman Yojana', desc: 'Assists women aged 21-50 years with ₹1,000 per month to help meet their personal health and household goals.', eligibility: 'Resident women from low-income groups' },
                { badge: 'EDUCATION', title: 'Marang Gomke Scholarship', desc: 'Fully funds postgraduate education in selected UK/Ireland universities for students from tribal communities.', eligibility: 'SC, ST, and minority students' }
            ]
        },
        'KA': {
            stateName: 'Karnataka',
            schemes: [
                { badge: 'WOMEN', title: 'Gruha Lakshmi Yojana', desc: 'Offers ₹2,000 monthly financial aid transferred directly to the designated female head of each household.', eligibility: 'Female head of household (non-taxpayers)' },
                { badge: 'UTILITIES', title: 'Gruha Jyothi Scheme', desc: 'Provides up to 200 units of free household electricity monthly to eligible domestic consumer lines.', eligibility: 'Domestic electricity consumers' },
                { badge: 'EMPLOYMENT', title: 'Yuva Nidhi Scheme', desc: 'Unemployment stipend of ₹3,000 for graduates and ₹1,500 for diploma holders for up to 2 years.', eligibility: 'Unemployed graduates/diploma holders' }
            ]
        },
        'KL': {
            stateName: 'Kerala',
            schemes: [
                { badge: 'HEALTH', title: 'Karunya Benevolent Fund', desc: 'Provides financial aid up to ₹3 Lakhs for treatment of chronic illnesses like kidney, heart, and cancer diseases.', eligibility: 'Low-income and BPL families' },
                { badge: 'AGRICULTURE', title: 'Subhiksha Keralam', desc: 'Supports cooperative farming, wasteland cultivation, and food production with credit linkages.', eligibility: 'Local farming groups and individuals' },
                { badge: 'EDUCATION', title: 'Vidyajyothi Scheme', desc: 'Offers educational scholarships and aid to physically challenged students to continue formal schooling.', eligibility: 'Students with 40%+ disability' }
            ]
        },
        'MP': {
            stateName: 'Madhya Pradesh',
            schemes: [
                { badge: 'WOMEN', title: 'Ladli Behna Yojana', desc: 'Provides ₹1,250 monthly direct cash transfers to women to enhance their health, nutrition, and self-reliance.', eligibility: 'Married resident women aged 21-60 years' },
                { badge: 'EDUCATION', title: 'Ladli Laxmi Yojana 2.0', desc: 'Awards academic scholarships of up to ₹1.43 Lakhs in stages to ensure girls finish high school and college.', eligibility: 'Girl children born in registered families' },
                { badge: 'AGRICULTURE', title: 'Kisan Kalyan Yojana', desc: 'Offers ₹6,000 annual direct benefit transfer in installments, supplementing the central PM-Kisan scheme.', eligibility: 'PM-Kisan landholder beneficiaries in MP' }
            ]
        },
        'MH': {
            stateName: 'Maharashtra',
            schemes: [
                { badge: 'WOMEN', title: 'Ladki Bahin Yojana', desc: 'Provides direct financial assistance of ₹1,500 per month to underprivileged women to improve their health and status.', eligibility: 'Women (family income < ₹2.5L)' },
                { badge: 'SENIORS', title: 'Mukhyamantri Vayoshri', desc: 'Gives one-time cash assistance of ₹3,000 to purchase assistive devices and support materials for senior citizens.', eligibility: 'Senior citizens aged 65+' },
                { badge: 'PENSION', title: 'Sanjay Gandhi Niradhar', desc: 'Provides a monthly pension of ₹1,500 to destitutes, blind, disabled, and widows without support channels.', eligibility: 'Destitute and disabled citizens' }
            ]
        },
        'MN': {
            stateName: 'Manipur',
            schemes: [
                { badge: 'HEALTH', title: 'CMHT Health Scheme', desc: 'Offers cashless medical cover up to ₹5 Lakhs per family per year for secondary and tertiary treatments.', eligibility: 'AAY card holders and marginalized families' },
                { badge: 'EMPLOYMENT', title: 'Manipur Startup Scheme', desc: 'Provides seed funds, subsidy matching, and low-interest venture loans to help local young entrepreneurs.', eligibility: 'Local innovative startup founders' },
                { badge: 'GOVERNANCE', title: 'Go To Hills Mission', desc: 'Brings citizen service desks and welfare scheme enrollment camps directly to remote hill district villages.', eligibility: 'Hill region residents' }
            ]
        },
        'ML': {
            stateName: 'Meghalaya',
            schemes: [
                { badge: 'AGRICULTURE', title: 'FOCUS Scheme', desc: 'Grants ₹5,000 per member directly to local farming groups to invest in seeds, machinery, and market links.', eligibility: 'Members of registered producer groups' },
                { badge: 'HEALTH', title: 'Meghalaya Health Cover (MHIS)', desc: 'Universal insurance scheme giving cashless medical treatment up to ₹5 Lakhs per family in empanelled hospitals.', eligibility: 'All state resident families' },
                { badge: 'LIVELIHOOD', title: 'M-YES Livelihoods', desc: 'Funds vocational training, micro-business startups, and job placements for local village youth.', eligibility: 'Unemployed resident youth' }
            ]
        },
        'MZ': {
            stateName: 'Mizoram',
            schemes: [
                { badge: 'HEALTH', title: 'Mizoram Health Care (MSHCS)', desc: 'Cashless medical billing benefit up to ₹2 Lakhs per year for hospitalized illnesses in state hospitals.', eligibility: 'State residents (excluding government staff)' },
                { badge: 'LIVELIHOOD', title: 'SEDP Livelihood Support', desc: 'Distributes financial assistance of ₹50,000 to family units to initiate local farming, rearing, or retail trades.', eligibility: 'Selected resident families' },
                { badge: 'TRADE', title: 'Kaladan Corridor Support', desc: 'Special compensation and micro-business credit lines for communities situated along trade transit routes.', eligibility: 'Affected border transit communities' }
            ]
        },
        'NL': {
            stateName: 'Nagaland',
            schemes: [
                { badge: 'HEALTH', title: 'CMHIS Nagaland', desc: 'Universal cashless medical coverage of ₹5 Lakhs per family for hospitalization and diagnostic procedures.', eligibility: 'All Nagaland resident households' },
                { badge: 'LIVELIHOOD', title: 'NSRLM Livelihood Program', desc: 'Supplies Self-Help Groups with revolving credit funds and enterprise resources to build rural businesses.', eligibility: 'Rural women Self-Help Groups' },
                { badge: 'FINANCE', title: 'CM Micro Finance Initiative', desc: 'Provides subsidized bank credit and interest subvention for agriculture machinery and tourism startups.', eligibility: 'Farmers, SHGs, and local entrepreneurs' }
            ]
        },
        'OR': {
            stateName: 'Odisha',
            schemes: [
                { badge: 'WOMEN', title: 'SUBHADRA Yojana', desc: 'Provides ₹10,000 annually in two installments to support girls and women in financing health, education, and savings.', eligibility: 'Eligible women aged 21-60 years' },
                { badge: 'HEALTH', title: 'Biju Swasthya Kalyan (BSKY)', desc: 'Cashless health treatment cover up to ₹5 Lakhs for men and ₹10 Lakhs for women per family annually.', eligibility: 'Smart Health Card holders' },
                { badge: 'AGRICULTURE', title: 'KALIA Scheme', desc: 'Offers input assistance of ₹10,000 per year to small farmers, alongside landless crop labor support grants.', eligibility: 'Cultivators and landless farm laborers' }
            ]
        },
        'PB': {
            stateName: 'Punjab',
            schemes: [
                { badge: 'FOOD', title: 'Atta Dal Scheme', desc: 'Provides heavily subsidized wheat and food grains at ₹2 per kg to low-income families via smart cards.', eligibility: 'Blue Card holder families' },
                { badge: 'EDUCATION', title: 'Mai Bhago Vidya Yojana', desc: 'Distributes free bicycles to girls studying in high schools (Classes XI & XII) to support daily commute safety.', eligibility: 'Government school girl students' },
                { badge: 'MARRIAGE', title: 'Ashirwad Scheme', desc: 'Grants financial support of ₹51,000 for the wedding expenses of girls belonging to Scheduled Castes and BPL families.', eligibility: 'BPL girls / SC, ST, OBC brides' }
            ]
        },
        'RJ': {
            stateName: 'Rajasthan',
            schemes: [
                { badge: 'HEALTH', title: 'Chiranjeevi Swasthya Bima', desc: 'Cashless medical insurance coverage up to ₹25 Lakhs per family per year for major illnesses.', eligibility: 'All resident families in Rajasthan' },
                { badge: 'EMPLOYMENT', title: 'Indira Gandhi Urban Employment', desc: 'Guarantees 125 days of wage labor employment per year for unemployed residents in urban municipal areas.', eligibility: 'Urban residents aged 18-60 years' },
                { badge: 'HEALTH', title: 'Nishulk Dawa Yojana', desc: 'Distributes free essential medicines and clinical tests across all state public hospitals and clinics.', eligibility: 'All OPD/IPD patients in state hospitals' }
            ]
        },
        'SK': {
            stateName: 'Sikkim',
            schemes: [
                { badge: 'HOUSING', title: 'Garib Awas Yojana', desc: 'Builds permanent concrete houses with standard furniture and home appliances for low-income families.', eligibility: 'Rural poor families' },
                { badge: 'WOMEN', title: 'Aama Yojana', desc: 'Provides annual financial support of ₹20,000 to non-working mothers to encourage personal savings and security.', eligibility: 'Non-working resident mothers' },
                { badge: 'LIVELIHOOD', title: 'CM Livelihood Scheme', desc: 'Allocates free utility vehicles, tools, and farming inputs to local youth to build agricultural trades.', eligibility: 'Resident young adults' }
            ]
        },
        'TN': {
            stateName: 'Tamil Nadu',
            schemes: [
                { badge: 'WOMEN', title: 'Magalir Urimai Thogai', desc: 'Transfers a monthly entitlement of ₹1,000 to female heads of families to recognize household contributions.', eligibility: 'Low-income female heads of families' },
                { badge: 'HEALTH', title: 'Makkalai Thedi Maruthuvam', desc: 'Doorstep health screening and medication delivery for chronic ailments like diabetes and hypertension.', eligibility: 'All resident citizens' },
                { badge: 'EDUCATION', title: 'Pudhumai Penn Scheme', desc: 'Provides ₹1,000 monthly stipend to girl students from government schools pursuing higher college degrees.', eligibility: 'Girls who studied in government schools' }
            ]
        },
        'TG': {
            stateName: 'Telangana',
            schemes: [
                { badge: 'AGRICULTURE', title: 'Rythu Bandhu', desc: 'Investment support scheme providing ₹10,000 per acre per year for crop seeds, fertilizers, and field preparation.', eligibility: 'Land-owning farmers' },
                { badge: 'MARRIAGE', title: 'Kalyana Lakshmi Scheme', desc: 'Provides a one-time financial grant of ₹1,00,116 to girls from poor families at the time of their marriage.', eligibility: 'Resident brides aged 18+ (income limit < ₹2L)' },
                { badge: 'UTILITIES', title: 'Gruha Jyothi Telangana', desc: 'Offers 200 units of free household electricity monthly to eligible residential power lines.', eligibility: 'Residential electricity lines' }
            ]
        },
        'TR': {
            stateName: 'Tripura',
            schemes: [
                { badge: 'WOMEN', title: 'Matru Pushti Uphaar', desc: 'Distributes nutrition kits containing dry fruits, pulses, and health supplements to pregnant and lactating mothers.', eligibility: 'Pregnant and lactating mothers' },
                { badge: 'LIVELIHOOD', title: 'Tripura Livelihood Mission', desc: 'Organizes self-help groups and matches bank credit to establish local handicraft and food businesses.', eligibility: 'Rural women SHGs' },
                { badge: 'EDUCATION', title: 'Bidyajyoti Schools Program', desc: 'Upgrades government schools into modern smart classrooms with digital learning tools and CBSE curricula.', eligibility: 'State school students' }
            ]
        },
        'UP': {
            stateName: 'Uttar Pradesh',
            schemes: [
                { badge: 'WOMEN', title: 'Kanya Sumangala Yojana', desc: 'Offers a financial package of ₹15,000 in six stages from birth to graduation to ensure female health and education.', eligibility: 'Resident families with up to 2 daughters' },
                { badge: 'EDUCATION', title: 'Abhyuday Coaching Scheme', desc: 'Provides free guidance, digital content, and tablets to prepare poor students for competitive exams like IIT-JEE/UPSC.', eligibility: 'Meritorious youth from low-income groups' },
                { badge: 'PENSION', title: 'UP Integrated Pension', desc: 'Gives ₹1,000 monthly pension directly to senior citizens, widows, and disabled individuals.', eligibility: 'Elderly, widows, and disabled (income-tested)' }
            ]
        },
        'UT': {
            stateName: 'Uttarakhand',
            schemes: [
                { badge: 'WOMEN', title: 'Gaura Devi Kanya Dhan', desc: 'Awards a fixed deposit of ₹50,000 to girl students on passing intermediate schooling (Class 12th) to fund college fees.', eligibility: 'BPL class 12th passed girls' },
                { badge: 'NUTRITION', title: 'Aanchal Amrit Yojana', desc: 'Distributes free fortified milk weekly to children studying in state Anganwadi centers to combat stunting.', eligibility: 'Anganwadi enrolled children' },
                { badge: 'SPORTS', title: 'Udiyaman Chhatra Scheme', desc: 'Offers a sports scholarship of ₹1,500 per month to budding student athletes to procure sports gear.', eligibility: 'Talented student athletes aged 8-14' }
            ]
        },
        'WB': {
            stateName: 'West Bengal',
            schemes: [
                { badge: 'WOMEN', title: 'Lakshmir Bhandar', desc: 'Monthly cash support of ₹1,000 for general and ₹1,200 for SC/ST families transferred to the female head.', eligibility: 'Resident women aged 25-60' },
                { badge: 'EDUCATION', title: 'Kanyashree Prakalpa', desc: 'Multi-stage cash scholarship of up to ₹25,000 to incentivize girls to stay in school and delay marriage.', eligibility: 'Unmarried girls studying in Classes VIII-XII' },
                { badge: 'EDUCATION', title: 'Student Credit Card', desc: 'Provides collateral-free educational loans up to ₹10 Lakhs at nominal interest rate for higher university studies.', eligibility: 'Students residing in Bengal for 10+ years' }
            ]
        }
    };

    // --- 13. Hero Universal Search System ---
    const heroSearchInput = document.getElementById('heroSearchInput');
    const heroSearchBtn = document.getElementById('heroSearchBtn');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const searchAutocompleteSection = document.getElementById('searchAutocompleteSection');
    const searchAutocompleteList = document.getElementById('searchAutocompleteList');
    const searchResultsSection = document.getElementById('searchResultsSection');
    const searchResultsList = document.getElementById('searchResultsList');
    const searchResultsTitle = document.getElementById('searchResultsTitle');
    const searchSkeletonContainer = document.getElementById('searchSkeletonContainer');
    const searchVoiceOverlay = document.getElementById('searchVoiceOverlay');
    const searchNoResults = document.getElementById('searchNoResults');
    const voiceSearchBtn = document.getElementById('voiceSearchBtn');
    const voiceCloseBtn = document.getElementById('voiceCloseBtn');
    const voiceStatusText = document.getElementById('voiceStatusText');
    const searchMainIcon = document.getElementById('searchMainIcon');

    if (heroSearchInput && searchSuggestions) {
        let currentFilter = 'all';
        let debounceTimer = null;
        let keyboardActiveIndex = -1;
        let recognition = null;
        let isListening = false;

        const universalSearchData = [
            {
                id: 'srv-birth',
                title: 'Birth Certificate Application',
                description: 'Apply for registration and issuance of birth certificates, or download digital copies.',
                category: 'services',
                icon: 'ph ph-baby',
                keywords: 'birth certificate register child new born certificate baby identity',
                action: { type: 'modal', modalId: 'servicesModal', searchVal: 'Health & Family' },
                suggestions: ['Birth Certificate Apply', 'Birth Certificate Renewal', 'Birth Certificate Status']
            },
            {
                id: 'srv-death',
                title: 'Death Certificate Application',
                description: 'Apply for registration and official death certificates online.',
                category: 'services',
                icon: 'ph ph-activity',
                keywords: 'death certificate register demises deceased dead relative certificate identity',
                action: { type: 'modal', modalId: 'servicesModal', searchVal: 'Health & Family' },
                suggestions: ['Death Certificate Apply', 'Death Certificate Status', 'Report Demise']
            },
            {
                id: 'srv-aadhaar',
                title: 'Aadhaar Update (UIDAI)',
                description: 'Update address, mobile number, photo, biometrics, or download your e-Aadhaar.',
                category: 'services',
                icon: 'ph ph-identification-card',
                keywords: 'aadhaar card update address mobile details uidai download photo thumb identity uid',
                action: { type: 'modal', modalId: 'servicesModal', searchVal: 'Identity & Citizenship' },
                suggestions: ['Aadhaar Update Address', 'Aadhaar Mobile Link', 'Aadhaar Card Download', 'UIDAI Portal']
            },
            {
                id: 'srv-pan',
                title: 'PAN Card Services (NSDL/UTI)',
                description: 'Apply for a new Permanent Account Number (PAN), verify details, or request a reprint.',
                category: 'services',
                icon: 'ph ph-credit-card',
                keywords: 'pan card permanent account number tax identity new pan apply update details reprint nsdl uti',
                action: { type: 'modal', modalId: 'servicesModal', searchVal: 'Identity & Citizenship' },
                suggestions: ['PAN Card Apply', 'PAN Card Reprint', 'PAN Card Address Update']
            },
            {
                id: 'srv-passport',
                title: 'Passport Seva Services',
                description: 'Apply for new passport, book appointment for verification, or track passport delivery.',
                category: 'services',
                icon: 'ph ph-airplane-tilt',
                keywords: 'passport apply renewal appointment status check seva travel passport status passport renewal passport apply visa details external affairs ministry',
                action: { type: 'modal', modalId: 'servicesModal', searchVal: 'Identity & Citizenship' },
                suggestions: ['Passport Apply', 'Passport Renewal', 'Passport Status', 'Passport Appointment']
            },
            {
                id: 'srv-license',
                title: 'Driving License & RTO',
                description: 'Apply for Learner License, permanent DL test, renewal of license, or vehicle RC details.',
                category: 'services',
                icon: 'ph ph-steering-wheel',
                keywords: 'driving license learning license permanent dl test rto vehicle rc registration road transport car bike steering wheel sarathi parivahan',
                action: { type: 'modal', modalId: 'servicesModal', searchVal: 'Identity & Citizenship' },
                suggestions: ['Driving License Apply', 'Driving License Renewal', 'Learner License DL', 'RTO Vehicle RC Details']
            },
            {
                id: 'sch-kisan',
                title: 'PM Kisan Samman Nidhi',
                description: 'An income support welfare scheme for marginal landholding farmer families.',
                category: 'schemes',
                icon: 'ph ph-plant',
                keywords: 'pm kisan farmer farming land support crop money transfer installment benefit agricultural welfare',
                action: { type: 'scroll', target: '#schemes', callback: () => {
                    const toggleNationalBtn = document.getElementById('toggleNationalBtn');
                    if (toggleNationalBtn) toggleNationalBtn.click();
                }},
                suggestions: ['PM Kisan Beneficiary Status', 'PM Kisan Installment Tracker', 'PM Kisan Farmer Registration']
            },
            {
                id: 'sch-ayushman',
                title: 'Ayushman Bharat (PM-JAY)',
                description: 'Provides cashless health insurance coverage up to ₹5 Lakhs per family per year.',
                category: 'schemes',
                icon: 'ph ph-first-aid-kit',
                keywords: 'ayushman bharat gold card pmjay health insurance hospital free cover medical care family health prime minister gold card',
                action: { type: 'scroll', target: '#schemes', callback: () => {
                    const toggleNationalBtn = document.getElementById('toggleNationalBtn');
                    if (toggleNationalBtn) toggleNationalBtn.click();
                }},
                suggestions: ['Ayushman Bharat Registration', 'Ayushman Card Eligibility Check', 'PMJAY Hospital List']
            },
            {
                id: 'sch-scholarships',
                title: 'National Scholarship Portal',
                description: 'Apply for merit-cum-means scholarships, state awards, or higher education fellowships.',
                category: 'schemes',
                icon: 'ph ph-graduation-cap',
                keywords: 'scholarship student education school college fee waiver fellowship aid nsp matric pre post academic awards',
                action: { type: 'scroll', target: '#schemes', callback: () => {
                    const toggleNationalBtn = document.getElementById('toggleNationalBtn');
                    if (toggleNationalBtn) toggleNationalBtn.click();
                }},
                suggestions: ['National Scholarship Portal NSP', 'Scholarship Application Form', 'Post Matric Scholarship Status']
            },
            {
                id: 'srv-tax',
                title: 'Income Tax Return (ITR) Filing',
                description: 'E-file your annual tax returns, pay liabilities, or track your tax refund status.',
                category: 'services',
                icon: 'ph ph-coins',
                keywords: 'income tax filing ITR returns refund tax status e-file audit gst pan finance department',
                action: { type: 'modal', modalId: 'servicesModal', searchVal: 'Taxes & Finance' },
                suggestions: ['Tax Filing ITR', 'ITR Refund Status', 'Pay Property Tax', 'E-File Income Tax']
            },
            {
                id: 'cmp-water',
                title: 'Water Supply Complaint',
                description: 'File complaints regarding water quality, pipeline leakage, supply timings, or new meters.',
                category: 'complaints',
                icon: 'ph ph-drop',
                keywords: 'water supply complaint leak quality supply dirty tap pipeline connection register grievance utility',
                action: { type: 'scroll', target: '#grievance', callback: () => {
                    const gComplaint = document.getElementById('g-complaint');
                    if (gComplaint) {
                        gComplaint.value = "Water supply issue: ";
                        gComplaint.focus();
                    }
                }},
                suggestions: ['Water Leakage Complaint', 'Register Water Grievance', 'Dirty Water Supply Report']
            },
            {
                id: 'cmp-electricity',
                title: 'Electricity & Power Complaint',
                description: 'Report prolonged power outages, voltage drops, faulty meters, or incorrect bills.',
                category: 'complaints',
                icon: 'ph ph-lightning',
                keywords: 'electricity power cut outage billing transformer meter fault lines register grievance linesman utility bill issue',
                action: { type: 'scroll', target: '#grievance', callback: () => {
                    const gComplaint = document.getElementById('g-complaint');
                    if (gComplaint) {
                        gComplaint.value = "Electricity/Power Supply issue: ";
                        gComplaint.focus();
                    }
                }},
                suggestions: ['Electricity Bill Dispute', 'Power Cut Grievance', 'Faulty Electricity Meter Report']
            },
            {
                id: 'sch-pension',
                title: 'Welfare Pension Schemes',
                description: 'Apply for social security pensions including old age, widow, and disability benefits.',
                category: 'schemes',
                icon: 'ph ph-heart',
                keywords: 'pension old age widow disabled atal pension social security support money senior citizens atal pension yojana apy',
                action: { type: 'scroll', target: '#schemes', callback: () => {
                    const toggleNationalBtn = document.getElementById('toggleNationalBtn');
                    if (toggleNationalBtn) toggleNationalBtn.click();
                }},
                suggestions: ['Old Age Pension Apply', 'Atal Pension Scheme APY', 'Widow Pension Status']
            },
            {
                id: 'srv-employment',
                title: 'Employment & Career Exchange',
                description: 'Register as a job seeker, search central vacancies, or enroll in skill development.',
                category: 'services',
                icon: 'ph ph-briefcase',
                keywords: 'employment job seeker register jobs career portal apprenticeship work mgnrega training exchange ministry of labour',
                action: { type: 'modal', modalId: 'servicesModal', searchVal: 'Education & Careers' },
                suggestions: ['Register on Employment Exchange', 'MGNREGA Job Card Apply', 'Government Job Finder']
            },
            {
                id: 'dept-finance',
                title: 'Department of Finance & Revenue',
                description: 'Oversees budget allocations, taxation policies, GST updates, and public expenditure.',
                category: 'departments',
                icon: 'ph ph-bank',
                keywords: 'department of finance revenue tax budget economic banking gold coins ministry corporate affairs GST',
                action: { type: 'modal', modalId: 'departmentsModal', searchVal: 'Finance & Revenue' },
                suggestions: ['Finance Ministry Portal', 'GST Guidelines', 'Union Budget Updates']
            },
            {
                id: 'dept-health',
                title: 'Department of Health & Family Welfare',
                description: 'Manages national immunization programs, medical colleges, hospitals, and wellness schemes.',
                category: 'departments',
                icon: 'ph ph-first-aid',
                keywords: 'department health family welfare medical hospital clinic vaccine doctor first-aid public health medical facilities',
                action: { type: 'modal', modalId: 'departmentsModal', searchVal: 'Health & Family Welfare' },
                suggestions: ['Health Ministry Services', 'Vaccine Booking Center', 'Ayushman Bharat Hospital List']
            },
            {
                id: 'upd-tax-deadline',
                title: 'ITR Filing Deadline Extension',
                description: 'URGENT: Income Tax return deadline has been extended to September 30th for individual filings.',
                category: 'updates',
                icon: 'ph ph-bell',
                keywords: 'deadline extended income tax return sep september 30 ITR date news announcement update urgent alert',
                action: { type: 'scroll', target: '#news' },
                suggestions: ['Income Tax Return Deadline Extension', 'ITR Extension Date', 'Tax News 2026']
            },
            {
                id: 'upd-solar-subsidy',
                title: 'Solar Panel Subsidy Program',
                description: 'Under the Green Initiative, subsidies are announced for household solar rooftop installations.',
                category: 'updates',
                icon: 'ph ph-sun',
                keywords: 'solar panel subsidy green rooftop electricity power billing reduction news update policy announcement benefits',
                action: { type: 'scroll', target: '#news' },
                suggestions: ['Solar Subsidy Application', 'Rooftop Solar Program', 'Green Initiative Subsidy']
            },
            {
                id: 'support-chatbot',
                title: 'E-Gov AI Assistant Help Desk',
                description: 'Initiate a live chat with our virtual assistant for instant support and application help.',
                category: 'services',
                icon: 'ph ph-robot',
                keywords: 'ai assistant support chatbot virtual agent help desk citizens query help chat robot support desk faq help',
                action: { type: 'function', callback: () => {
                    const chatbotTrigger = document.getElementById('chatbotTrigger');
                    if (chatbotTrigger) chatbotTrigger.click();
                }},
                suggestions: ['Talk to AI Assistant', 'Citizens Helpdesk Support', 'Raise a Grievance Live']
            },
            {
                id: 'srv-track',
                title: 'Check Application / Token Status',
                description: 'Check the real-time status of your submitted applications and grievances.',
                category: 'services',
                icon: 'ph ph-hash',
                keywords: 'track status application number token check progress updates remarks certificate status tracker checking portal details',
                action: { type: 'scroll', target: '#track-status' },
                suggestions: ['Track Application Status', 'Token Status Check', 'APP-2026-123456 Status']
            }
        ];

        // --- Core logic functions ---

        const debounce = (func, wait) => {
            return function(...args) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => func.apply(this, args), wait);
            };
        };

        const highlightMatch = (text, query) => {
            if (!query) return text;
            const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'gi');
            return text.replace(regex, '<mark class="highlight">$1</mark>');
        };

        const showSuggestionsBox = () => {
            searchSuggestions.classList.remove('hidden');
        };

        const hideSuggestionsBox = () => {
            searchSuggestions.classList.add('hidden');
            keyboardActiveIndex = -1;
        };

        const handleAction = (action) => {
            hideSuggestionsBox();
            if (action.type === 'scroll') {
                const target = document.querySelector(action.target);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight the target panel for feedback
                    const panel = target.querySelector('.glass-panel') || target;
                    panel.style.transition = 'box-shadow var(--transition-base), border-color var(--transition-base)';
                    panel.style.boxShadow = '0 0 35px var(--primary-color)';
                    panel.style.borderColor = 'var(--primary-color)';
                    setTimeout(() => {
                        panel.style.boxShadow = '';
                        panel.style.borderColor = '';
                    }, 2500);
                }
                if (action.callback) action.callback();
            } else if (action.type === 'modal') {
                const modal = document.getElementById(action.modalId);
                if (modal) {
                    toggleModal(modal, true);
                    if (action.searchVal) {
                        const modalSearchInput = modal.querySelector('input[type="text"]');
                        if (modalSearchInput) {
                            modalSearchInput.value = action.searchVal;
                            modalSearchInput.dispatchEvent(new Event('input'));
                        }
                    }
                }
            } else if (action.type === 'function') {
                if (action.callback) action.callback();
            }
        };

        // Render function
        const renderSearch = (query) => {
            keyboardActiveIndex = -1;
            const cleanQuery = query.trim().toLowerCase();

            // Clear sections
            searchAutocompleteList.innerHTML = '';
            searchResultsList.innerHTML = '';
            searchAutocompleteSection.classList.add('hidden');
            searchNoResults.classList.add('hidden');
            searchVoiceOverlay.classList.add('hidden');

            if (!cleanQuery) {
                // If query is empty, hide dropdown
                hideSuggestionsBox();
                return;
            }

            // 1. Generate Autocomplete Suggestions (prefix matching)
            let autocompleteMatches = [];
            universalSearchData.forEach(item => {
                item.suggestions.forEach(phrase => {
                    if (phrase.toLowerCase().startsWith(cleanQuery) || phrase.toLowerCase().includes(' ' + cleanQuery)) {
                        if (!autocompleteMatches.includes(phrase)) {
                            autocompleteMatches.push(phrase);
                        }
                    }
                });
            });

            // Limit to 5 suggestions
            autocompleteMatches = autocompleteMatches.slice(0, 5);

            if (autocompleteMatches.length > 0) {
                searchAutocompleteSection.classList.remove('hidden');
                autocompleteMatches.forEach(phrase => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'autocomplete-item';
                    itemDiv.innerHTML = `<i class="ph ph-magnifying-glass"></i> <span>${highlightMatch(phrase, cleanQuery)}</span>`;
                    itemDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        heroSearchInput.value = phrase;
                        // Run search directly
                        triggerSearch(phrase);
                    });
                    searchAutocompleteList.appendChild(itemDiv);
                });
            }

            // 2. Filter Result Cards
            let matchedCards = universalSearchData.filter(item => {
                // Filter by search bar filters first
                if (currentFilter !== 'all' && item.category !== currentFilter) {
                    return false;
                }
                // Match search words
                return (
                    item.title.toLowerCase().includes(cleanQuery) ||
                    item.description.toLowerCase().includes(cleanQuery) ||
                    item.keywords.toLowerCase().includes(cleanQuery)
                );
            });

            // If no card matches but we have an autocomplete phrase, try to see if any items match those phrases
            if (matchedCards.length === 0 && currentFilter === 'all') {
                // Check if any title or keywords map
                matchedCards = universalSearchData.filter(item => {
                    return item.suggestions.some(phrase => phrase.toLowerCase().includes(cleanQuery));
                });
            }

            // Limit cards to 8
            const displayCards = matchedCards.slice(0, 8);

            if (displayCards.length > 0) {
                searchResultsSection.classList.remove('hidden');
                searchResultsTitle.innerText = "Top Suggestions";
                
                displayCards.forEach(item => {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'result-card';
                    cardDiv.setAttribute('data-category', item.category);
                    cardDiv.innerHTML = `
                        <div class="result-card-icon-box">
                            <i class="${item.icon}"></i>
                        </div>
                        <div class="result-card-details">
                            <h4 class="result-card-title">${highlightMatch(item.title, cleanQuery)}</h4>
                            <p class="result-card-desc">${highlightMatch(item.description, cleanQuery)}</p>
                        </div>
                        <div class="result-card-right-group">
                            <span class="result-card-category">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                            <i class="ph ph-caret-right chevron-icon"></i>
                        </div>
                    `;
                    cardDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        handleAction(item.action);
                    });
                    searchResultsList.appendChild(cardDiv);
                });
            } else {
                // No result cards
                if (autocompleteMatches.length === 0) {
                    searchAutocompleteSection.classList.add('hidden');
                }
                searchResultsSection.classList.add('hidden');
                
                if (autocompleteMatches.length === 0) {
                    // Show "No Results Found" block
                    searchNoResults.classList.remove('hidden');
                }
            }

            showSuggestionsBox();
        };

        // Simulate intelligent search load with skeleton loaders
        const triggerSearch = (query) => {
            if (!query.trim()) {
                hideSuggestionsBox();
                return;
            }

            showSuggestionsBox();
            searchAutocompleteSection.classList.add('hidden');
            searchResultsSection.classList.remove('hidden');
            searchResultsTitle.innerText = "Processing Query...";
            searchResultsList.innerHTML = '';
            searchNoResults.classList.add('hidden');
            searchVoiceOverlay.classList.add('hidden');
            
            // Show Skeleton and toggle main icon to loading
            searchSkeletonContainer.classList.remove('hidden');
            if (searchMainIcon) searchMainIcon.className = "ph ph-spinner search-icon loading";

            setTimeout(() => {
                searchSkeletonContainer.classList.add('hidden');
                if (searchMainIcon) searchMainIcon.className = "ph ph-magnifying-glass search-icon";
                renderSearch(query);
            }, 250); // Fast 250ms smart-app skeleton delay
        };

        // Input event debounced
        heroSearchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value;
            triggerSearch(query);
        }, 150));

        // Refocus handler
        heroSearchInput.addEventListener('focus', () => {
            if (heroSearchInput.value.trim()) {
                showSuggestionsBox();
            }
        });

        // Click outside handler
        document.addEventListener('click', (e) => {
            if (!heroSearchInput.contains(e.target) && !searchSuggestions.contains(e.target) && !voiceSearchBtn.contains(e.target)) {
                hideSuggestionsBox();
            }
        });

        // Filter pills event binding
        const filterPills = searchSuggestions.querySelectorAll('.filter-pill');
        filterPills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentFilter = pill.getAttribute('data-filter');
                renderSearch(heroSearchInput.value);
            });
        });

        // No results popular tag handler
        const popularTags = searchSuggestions.querySelectorAll('.popular-tag-btn');
        popularTags.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tagText = btn.getAttribute('data-tag');
                let searchVal = tagText;
                if (tagText === 'aadhaar') searchVal = "Aadhaar Update";
                if (tagText === 'passport') searchVal = "Passport Seva";
                if (tagText === 'kisan') searchVal = "PM Kisan";
                if (tagText === 'complaint') searchVal = "Water Supply Complaint";

                heroSearchInput.value = searchVal;
                triggerSearch(searchVal);
            });
        });

        // Keyboard navigation setup
        const updateKeyboardSelection = (items) => {
            items.forEach((item, idx) => {
                if (idx === keyboardActiveIndex) {
                    item.classList.add('active');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('active');
                }
            });
        };

        heroSearchInput.addEventListener('keydown', (e) => {
            if (searchSuggestions.classList.contains('hidden')) return;

            const visibleItems = Array.from(searchSuggestions.querySelectorAll('.autocomplete-item, .result-card'));
            if (visibleItems.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                keyboardActiveIndex = (keyboardActiveIndex + 1) % visibleItems.length;
                updateKeyboardSelection(visibleItems);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                keyboardActiveIndex = (keyboardActiveIndex - 1 + visibleItems.length) % visibleItems.length;
                updateKeyboardSelection(visibleItems);
            } else if (e.key === 'Enter') {
                if (keyboardActiveIndex >= 0 && keyboardActiveIndex < visibleItems.length) {
                    e.preventDefault();
                    visibleItems[keyboardActiveIndex].click();
                } else {
                    // Regular Enter triggers search directly
                    performBtnSearch();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideSuggestionsBox();
                heroSearchInput.blur();
            }
        });

        const performBtnSearch = () => {
            const query = heroSearchInput.value.trim();
            if (query) {
                // If it looks like a token number (e.g. APP-2026-123456 or GRv-MP-123456)
                if (/^(app|grv)-[a-z0-9-]+$/i.test(query)) {
                    const categorySelect = document.getElementById('track-category');
                    const tokenInput = document.getElementById('track-app-number');
                    const trackStatusSection = document.getElementById('track-status');
                    
                    if (tokenInput && categorySelect) {
                        tokenInput.value = query.toUpperCase();
                        if (query.toLowerCase().startsWith('grv')) {
                            categorySelect.value = 'grievance';
                        } else {
                            categorySelect.value = 'other';
                        }

                        if (trackStatusSection) {
                            trackStatusSection.scrollIntoView({ behavior: 'smooth' });
                            const panel = trackStatusSection.querySelector('.glass-panel');
                            if (panel) {
                                panel.style.boxShadow = '0 0 35px var(--primary-color)';
                                setTimeout(() => panel.style.boxShadow = '', 2000);
                            }
                        }

                        const trackStatusForm = document.getElementById('trackStatusForm');
                        if (trackStatusForm) {
                            trackStatusForm.dispatchEvent(new Event('submit'));
                        }
                    }
                    hideSuggestionsBox();
                } else {
                    // Find first result card and click it if available
                    const firstResult = searchSuggestions.querySelector('.result-card');
                    if (firstResult) {
                        firstResult.click();
                    } else {
                        // Default fallback: open general services directory
                        toggleModal(document.getElementById('servicesModal'), true);
                        const sInput = document.getElementById('servicesSearchInput');
                        if (sInput) {
                            sInput.value = query;
                            sInput.dispatchEvent(new Event('input'));
                        }
                        hideSuggestionsBox();
                    }
                }
            }
        };

        heroSearchBtn.addEventListener('click', performBtnSearch);

        // --- Voice Search Web Speech API ---

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-IN'; // English India supports local pronunciation

            recognition.onstart = () => {
                isListening = true;
                voiceSearchBtn.classList.add('listening');
                showSuggestionsBox();
                
                // Hide standard segments, show voice overlay
                searchAutocompleteSection.classList.add('hidden');
                searchResultsSection.classList.add('hidden');
                searchNoResults.classList.add('hidden');
                searchVoiceOverlay.classList.remove('hidden');
                voiceStatusText.innerText = "Listening... Speak now";
            };

            recognition.onresult = (event) => {
                const speechToText = event.results[0][0].transcript;
                heroSearchInput.value = speechToText;
                voiceStatusText.innerText = `Recognized: "${speechToText}"`;
                
                setTimeout(() => {
                    stopVoiceSearch();
                    triggerSearch(speechToText);
                }, 1000);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    voiceStatusText.innerText = "Permission Denied. Please enable microphone.";
                } else {
                    voiceStatusText.innerText = "Could not hear you clearly. Please try again.";
                }
                setTimeout(() => {
                    stopVoiceSearch();
                }, 2000);
            };

            recognition.onend = () => {
                stopVoiceSearch();
            };
        }

        const startVoiceSearch = () => {
            if (!recognition) {
                // Browser Fallback
                showSuggestionsBox();
                searchAutocompleteSection.classList.add('hidden');
                searchResultsSection.classList.add('hidden');
                searchNoResults.classList.add('hidden');
                searchVoiceOverlay.classList.remove('hidden');
                voiceStatusText.innerText = "Voice Search not supported in this browser. Try Chrome/Edge.";
                setTimeout(() => {
                    searchVoiceOverlay.classList.add('hidden');
                    hideSuggestionsBox();
                }, 3000);
                return;
            }
            
            try {
                recognition.start();
            } catch (err) {
                console.error(err);
                stopVoiceSearch();
            }
        };

        const stopVoiceSearch = () => {
            isListening = false;
            voiceSearchBtn.classList.remove('listening');
            searchVoiceOverlay.classList.add('hidden');
            if (recognition) {
                try { recognition.stop(); } catch(e) {}
            }
        };

        voiceSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isListening) {
                stopVoiceSearch();
                hideSuggestionsBox();
            } else {
                startVoiceSearch();
            }
        });

        voiceCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stopVoiceSearch();
            hideSuggestionsBox();
        });
    }

    

    const stateSchemeSelector = document.getElementById('stateSchemeSelector');
    const stateSchemesList = document.getElementById('stateSchemesList');

    
// --- Local Fallback Database for Offline Support ---
const localNationalSchemes = [
    { badge: "HEALTH", title: "Ayushman Bharat (PM-JAY)", desc: "Provides free health coverage up to ₹5 Lakhs per family per year for secondary and tertiary care hospitalization.", eligibility: "Low-income families" },
    { badge: "AGRICULTURE", title: "PM Kisan Samman Nidhi", desc: "An initiative providing an income support of ₹6,000 per year in three equal installments to small and marginal farmer families.", eligibility: "Landholding farmers" },
    { badge: "EDUCATION", title: "National Scholarship Portal", desc: "A single unified portal for applying, processing, and disbursing various state and central government scholarships.", eligibility: "Meritorious students" },
    { badge: "HOUSING", title: "Pradhan Mantri Awas Yojana (PMAY)", desc: "Aims to provide affordable housing with basic amenities like water, sanitation, and electricity to urban and rural poor families.", eligibility: "Economically weaker sections" },
    { badge: "PENSION", title: "Atal Pension Yojana (APY)", desc: "A social security pension scheme focused on unorganized sector workers, providing a guaranteed minimum pension after the age of 60.", eligibility: "Citizens aged 18-40 years" },
    { badge: "EMPLOYMENT", title: "Mahatma Gandhi NREGA (MGNREGA)", desc: "Guarantees 100 days of wage employment in a financial year to rural households whose adult members volunteer for manual work.", eligibility: "Rural adult citizens" }
];
const localStateSchemes = {
  "AP": [
    {
      "badge": "EDUCATION",
      "title": "Jagananna Amma Vodi",
      "desc": "Provides annual financial assistance of ₹15,000 to poor mothers to support educating their school-going children.",
      "eligibility": "BPL mothers with kids in Class I-XII"
    },
    {
      "badge": "AGRICULTURE",
      "title": "YSR Rythu Bharosa",
      "desc": "Offers annual investment support of ₹13,500 to land-owning farmers, promoting sustainable agricultural practices.",
      "eligibility": "Landholding farmer families"
    },
    {
      "badge": "HEALTH",
      "title": "Aarogyasri Health Scheme",
      "desc": "Provides free healthcare cover up to ₹25 Lakhs per year for medical treatment in corporate hospitals.",
      "eligibility": "Low-income families"
    }
  ],
  "AR": [
    {
      "badge": "HEALTH",
      "title": "CMAAY Scheme",
      "desc": "Provides cashless medical treatment up to ₹5 Lakhs per family per year for secondary and tertiary care.",
      "eligibility": "State resident families"
    },
    {
      "badge": "EMPLOYMENT",
      "title": "Deen Dayal Swavalamban",
      "desc": "Supports startup ventures with 30% capital subsidy on loans ranging from ₹10 Lakhs to ₹1 Crore.",
      "eligibility": "Local entrepreneurs & youth"
    },
    {
      "badge": "WOMEN",
      "title": "Dulari Kanya Yojana",
      "desc": "Invests a fixed deposit of ₹20,000 for girl children born in government hospitals, maturity at age 18.",
      "eligibility": "Girl child born in government hospital"
    }
  ],
  "AS": [
    {
      "badge": "WOMEN",
      "title": "Orunodoi Scheme",
      "desc": "Monthly cash assistance of ₹1,250 transferred directly to the female head of low-income families.",
      "eligibility": "Resident low-income households"
    },
    {
      "badge": "EDUCATION",
      "title": "Pragyan Bharati",
      "desc": "Provides free admission, text books, and scooties to meritorious female students for higher education.",
      "eligibility": "Assamese students"
    },
    {
      "badge": "MARRIAGE",
      "title": "Arundhati Gold Scheme",
      "desc": "Offers ₹40,000 financial aid to register marriages and purchase gold for brides from poor backgrounds.",
      "eligibility": "Newly married brides (family income < ₹5L)"
    }
  ],
  "BR": [
    {
      "badge": "WOMEN",
      "title": "Kanya Utthan Yojana",
      "desc": "Financial support of up to ₹54,100 to girls from birth till graduation to promote education and prevent child marriage.",
      "eligibility": "All resident girls in Bihar"
    },
    {
      "badge": "EDUCATION",
      "title": "Student Credit Card",
      "desc": "Interest-free educational loans up to ₹4 Lakhs for pursuing higher professional education.",
      "eligibility": "Students who completed 12th standard"
    },
    {
      "badge": "UTILITIES",
      "title": "Har Ghar Gangajal",
      "desc": "Supplies purified Ganga water to water-stressed cities like Rajgir, Bodhgaya, and Gaya directly to home taps.",
      "eligibility": "Local households in target areas"
    }
  ],
  "CT": [
    {
      "badge": "AGRICULTURE",
      "title": "Rajiv Gandhi Kisan Nyay",
      "desc": "Direct cash transfer of ₹10,000 per acre to crop farmers to ensure input cost relief and production growth.",
      "eligibility": "Paddy and crop farmers"
    },
    {
      "badge": "HEALTH",
      "title": "Suposhan Yojana",
      "desc": "Distributes hot nutritious meals, iron supplements, and counseling to eradicate malnutrition among kids and women.",
      "eligibility": "Malnourished children and women"
    },
    {
      "badge": "WOMEN",
      "title": "Mahtari Vandan Yojana",
      "desc": "Provides ₹1,000 monthly financial aid to married women to elevate their economic self-reliance and wellness.",
      "eligibility": "Married women (age 21-60)"
    }
  ],
  "GA": [
    {
      "badge": "WOMEN",
      "title": "Griha Aadhar Scheme",
      "desc": "Provides ₹1,500 monthly financial assistance to housewives from low-income groups to support basic food security.",
      "eligibility": "Housewives (family income < ₹3L)"
    },
    {
      "badge": "MARRIAGE",
      "title": "Laadli Laxmi Scheme",
      "desc": "Offers ₹1 Lakh fixed deposit to resident girls to be used for their wedding or self-employment goals.",
      "eligibility": "Resident girls aged 18-35 years"
    },
    {
      "badge": "EMPLOYMENT",
      "title": "CM Apprenticeship",
      "desc": "Paid monthly stipend training program across departments to prepare local youth for commercial jobs.",
      "eligibility": "Unemployed Goan youth"
    }
  ],
  "GJ": [
    {
      "badge": "AGRICULTURE",
      "title": "Kisan Sahay Yojana",
      "desc": "Compensates farmers for up to 33% crop damage caused by natural calamities like drought, heavy rains, or cyclones.",
      "eligibility": "State landholding farmers"
    },
    {
      "badge": "SENIORS",
      "title": "Shravan Tirth Yojana",
      "desc": "Provides 50% travel concession on state buses to senior citizens traveling on cultural pilgrimage circuits.",
      "eligibility": "Resident seniors aged 60+"
    },
    {
      "badge": "EDUCATION",
      "title": "MYSY Scholarship",
      "desc": "Offers up to ₹2 Lakhs annual tuition fee reimbursement to meritorious students for professional courses.",
      "eligibility": "Students scoring 80+ percentile in 12th"
    }
  ],
  "HR": [
    {
      "badge": "IDENTITY",
      "title": "Parivar Pehchan Patra",
      "desc": "Establishes a digital 8-digit family ID to link welfare delivery and income criteria directly to household accounts.",
      "eligibility": "All Haryana resident families"
    },
    {
      "badge": "PENSION",
      "title": "Ladli Social Security",
      "desc": "Provides a monthly allowance of ₹3,000 to parents who only have girl children, starting from their age of 45.",
      "eligibility": "Parents with only girl children"
    },
    {
      "badge": "LIVELIHOOD",
      "title": "Antyodaya Parivar Utthan",
      "desc": "Integrates self-employment training, subsidies, and credit guidance to elevate low-income families.",
      "eligibility": "Families with annual income < ₹1.8L"
    }
  ],
  "HP": [
    {
      "badge": "HEALTH",
      "title": "Sahara Yojna",
      "desc": "Offers ₹3,000 per month to patients suffering from chronic diseases like cancer, paralysis, or kidney failure.",
      "eligibility": "Patients from poor families"
    },
    {
      "badge": "EMPLOYMENT",
      "title": "Mukhya Mantri Swavalamban",
      "desc": "Provides 25% to 35% capital subsidy on industrial machinery to motivate local startups and ventures.",
      "eligibility": "Resident youth aged 18-45 years"
    },
    {
      "badge": "WOMEN",
      "title": "Pyari Behna Sukh Samman",
      "desc": "Monthly cash support of ₹1,500 transferred to women to ensure basic dignity and financial stability.",
      "eligibility": "Women resident aged 18-60 years"
    }
  ],
  "JH": [
    {
      "badge": "HOUSING",
      "title": "Abua Awas Yojana",
      "desc": "Constructs permanent three-room houses with separate kitchens for rural homeless and marginalized families.",
      "eligibility": "Homeless or mud-house dwellers"
    },
    {
      "badge": "WOMEN",
      "title": "Maiya Samman Yojana",
      "desc": "Assists women aged 21-50 years with ₹1,000 per month to help meet their personal health and household goals.",
      "eligibility": "Resident women from low-income groups"
    },
    {
      "badge": "EDUCATION",
      "title": "Marang Gomke Scholarship",
      "desc": "Fully funds postgraduate education in selected UK/Ireland universities for students from tribal communities.",
      "eligibility": "SC, ST, and minority students"
    }
  ],
  "KA": [
    {
      "badge": "WOMEN",
      "title": "Gruha Lakshmi Yojana",
      "desc": "Offers ₹2,000 monthly financial aid transferred directly to the designated female head of each household.",
      "eligibility": "Female head of household (non-taxpayers)"
    },
    {
      "badge": "UTILITIES",
      "title": "Gruha Jyothi Scheme",
      "desc": "Provides up to 200 units of free household electricity monthly to eligible domestic consumer lines.",
      "eligibility": "Domestic electricity consumers"
    },
    {
      "badge": "EMPLOYMENT",
      "title": "Yuva Nidhi Scheme",
      "desc": "Unemployment stipend of ₹3,000 for graduates and ₹1,500 for diploma holders for up to 2 years.",
      "eligibility": "Unemployed graduates/diploma holders"
    }
  ],
  "KL": [
    {
      "badge": "HEALTH",
      "title": "Karunya Benevolent Fund",
      "desc": "Provides financial aid up to ₹3 Lakhs for treatment of chronic illnesses like kidney, heart, and cancer diseases.",
      "eligibility": "Low-income and BPL families"
    },
    {
      "badge": "AGRICULTURE",
      "title": "Subhiksha Keralam",
      "desc": "Supports cooperative farming, wasteland cultivation, and food production with credit linkages.",
      "eligibility": "Local farming groups and individuals"
    },
    {
      "badge": "EDUCATION",
      "title": "Vidyajyothi Scheme",
      "desc": "Offers educational scholarships and aid to physically challenged students to continue formal schooling.",
      "eligibility": "Students with 40%+ disability"
    }
  ],
  "MP": [
    {
      "badge": "WOMEN",
      "title": "Ladli Behna Yojana",
      "desc": "Provides ₹1,250 monthly direct cash transfers to women to enhance their health, nutrition, and self-reliance.",
      "eligibility": "Married resident women aged 21-60 years"
    },
    {
      "badge": "EDUCATION",
      "title": "Ladli Laxmi Yojana 2.0",
      "desc": "Awards academic scholarships of up to ₹1.43 Lakhs in stages to ensure girls finish high school and college.",
      "eligibility": "Girl children born in registered families"
    },
    {
      "badge": "AGRICULTURE",
      "title": "Kisan Kalyan Yojana",
      "desc": "Offers ₹6,000 annual direct benefit transfer in installments, supplementing the central PM-Kisan scheme.",
      "eligibility": "PM-Kisan landholder beneficiaries in MP"
    }
  ],
  "MH": [
    {
      "badge": "WOMEN",
      "title": "Ladki Bahin Yojana",
      "desc": "Provides direct financial assistance of ₹1,500 per month to underprivileged women to improve their health and status.",
      "eligibility": "Women (family income < ₹2.5L)"
    },
    {
      "badge": "SENIORS",
      "title": "Mukhyamantri Vayoshri",
      "desc": "Gives one-time cash assistance of ₹3,000 to purchase assistive devices and support materials for senior citizens.",
      "eligibility": "Senior citizens aged 65+"
    },
    {
      "badge": "PENSION",
      "title": "Sanjay Gandhi Niradhar",
      "desc": "Provides a monthly pension of ₹1,500 to destitutes, blind, disabled, and widows without support channels.",
      "eligibility": "Destitute and disabled citizens"
    }
  ],
  "MN": [
    {
      "badge": "HEALTH",
      "title": "CMHT Health Scheme",
      "desc": "Offers cashless medical cover up to ₹5 Lakhs per family per year for secondary and tertiary treatments.",
      "eligibility": "AAY card holders and marginalized families"
    },
    {
      "badge": "EMPLOYMENT",
      "title": "Manipur Startup Scheme",
      "desc": "Provides seed funds, subsidy matching, and low-interest venture loans to help local young entrepreneurs.",
      "eligibility": "Local innovative startup founders"
    },
    {
      "badge": "GOVERNANCE",
      "title": "Go To Hills Mission",
      "desc": "Brings citizen service desks and welfare scheme enrollment camps directly to remote hill district villages.",
      "eligibility": "Hill region residents"
    }
  ],
  "ML": [
    {
      "badge": "AGRICULTURE",
      "title": "FOCUS Scheme",
      "desc": "Grants ₹5,000 per member directly to local farming groups to invest in seeds, machinery, and market links.",
      "eligibility": "Members of registered producer groups"
    },
    {
      "badge": "HEALTH",
      "title": "Meghalaya Health Cover (MHIS)",
      "desc": "Universal insurance scheme giving cashless medical treatment up to ₹5 Lakhs per family in empanelled hospitals.",
      "eligibility": "All state resident families"
    },
    {
      "badge": "LIVELIHOOD",
      "title": "M-YES Livelihoods",
      "desc": "Funds vocational training, micro-business startups, and job placements for local village youth.",
      "eligibility": "Unemployed resident youth"
    }
  ],
  "MZ": [
    {
      "badge": "HEALTH",
      "title": "Mizoram Health Care (MSHCS)",
      "desc": "Cashless medical billing benefit up to ₹2 Lakhs per year for hospitalized illnesses in state hospitals.",
      "eligibility": "State residents (excluding government staff)"
    },
    {
      "badge": "LIVELIHOOD",
      "title": "SEDP Livelihood Support",
      "desc": "Distributes financial assistance of ₹50,000 to family units to initiate local farming, rearing, or retail trades.",
      "eligibility": "Selected resident families"
    },
    {
      "badge": "TRADE",
      "title": "Kaladan Corridor Support",
      "desc": "Special compensation and micro-business credit lines for communities situated along trade transit routes.",
      "eligibility": "Affected border transit communities"
    }
  ],
  "NL": [
    {
      "badge": "HEALTH",
      "title": "CMHIS Nagaland",
      "desc": "Universal cashless medical coverage of ₹5 Lakhs per family for hospitalization and diagnostic procedures.",
      "eligibility": "All Nagaland resident households"
    },
    {
      "badge": "LIVELIHOOD",
      "title": "NSRLM Livelihood Program",
      "desc": "Supplies Self-Help Groups with revolving credit funds and enterprise resources to build rural businesses.",
      "eligibility": "Rural women Self-Help Groups"
    },
    {
      "badge": "FINANCE",
      "title": "CM Micro Finance Initiative",
      "desc": "Provides subsidized bank credit and interest subvention for agriculture machinery and tourism startups.",
      "eligibility": "Farmers, SHGs, and local entrepreneurs"
    }
  ],
  "OR": [
    {
      "badge": "WOMEN",
      "title": "SUBHADRA Yojana",
      "desc": "Provides ₹10,000 annually in two installments to support girls and women in financing health, education, and savings.",
      "eligibility": "Eligible women aged 21-60 years"
    },
    {
      "badge": "HEALTH",
      "title": "Biju Swasthya Kalyan (BSKY)",
      "desc": "Cashless health treatment cover up to ₹5 Lakhs for men and ₹10 Lakhs for women per family annually.",
      "eligibility": "Smart Health Card holders"
    },
    {
      "badge": "AGRICULTURE",
      "title": "KALIA Scheme",
      "desc": "Offers input assistance of ₹10,000 per year to small farmers, alongside landless crop labor support grants.",
      "eligibility": "Cultivators and landless farm laborers"
    }
  ],
  "PB": [
    {
      "badge": "FOOD",
      "title": "Atta Dal Scheme",
      "desc": "Provides heavily subsidized wheat and food grains at ₹2 per kg to low-income families via smart cards.",
      "eligibility": "Blue Card holder families"
    },
    {
      "badge": "EDUCATION",
      "title": "Mai Bhago Vidya Yojana",
      "desc": "Distributes free bicycles to girls studying in high schools (Classes XI & XII) to support daily commute safety.",
      "eligibility": "Government school girl students"
    },
    {
      "badge": "MARRIAGE",
      "title": "Ashirwad Scheme",
      "desc": "Grants financial support of ₹51,000 for the wedding expenses of girls belonging to Scheduled Castes and BPL families.",
      "eligibility": "BPL girls / SC, ST, OBC brides"
    }
  ],
  "RJ": [
    {
      "badge": "HEALTH",
      "title": "Chiranjeevi Swasthya Bima",
      "desc": "Cashless medical insurance coverage up to ₹25 Lakhs per family per year for major illnesses.",
      "eligibility": "All resident families in Rajasthan"
    },
    {
      "badge": "EMPLOYMENT",
      "title": "Indira Gandhi Urban Employment",
      "desc": "Guarantees 125 days of wage labor employment per year for unemployed residents in urban municipal areas.",
      "eligibility": "Urban residents aged 18-60 years"
    },
    {
      "badge": "HEALTH",
      "title": "Nishulk Dawa Yojana",
      "desc": "Distributes free essential medicines and clinical tests across all state public hospitals and clinics.",
      "eligibility": "All OPD/IPD patients in state hospitals"
    }
  ],
  "SK": [
    {
      "badge": "HOUSING",
      "title": "Garib Awas Yojana",
      "desc": "Builds permanent concrete houses with standard furniture and home appliances for low-income families.",
      "eligibility": "Rural poor families"
    },
    {
      "badge": "WOMEN",
      "title": "Aama Yojana",
      "desc": "Provides annual financial support of ₹20,000 to non-working mothers to encourage personal savings and security.",
      "eligibility": "Non-working resident mothers"
    },
    {
      "badge": "LIVELIHOOD",
      "title": "CM Livelihood Scheme",
      "desc": "Allocates free utility vehicles, tools, and farming inputs to local youth to build agricultural trades.",
      "eligibility": "Resident young adults"
    }
  ],
  "TN": [
    {
      "badge": "WOMEN",
      "title": "Magalir Urimai Thogai",
      "desc": "Transfers a monthly entitlement of ₹1,000 to female heads of families to recognize household contributions.",
      "eligibility": "Low-income female heads of families"
    },
    {
      "badge": "HEALTH",
      "title": "Makkalai Thedi Maruthuvam",
      "desc": "Doorstep health screening and medication delivery for chronic ailments like diabetes and hypertension.",
      "eligibility": "All resident citizens"
    },
    {
      "badge": "EDUCATION",
      "title": "Pudhumai Penn Scheme",
      "desc": "Provides ₹1,000 monthly stipend to girl students from government schools pursuing higher college degrees.",
      "eligibility": "Girls who studied in government schools"
    }
  ],
  "TG": [
    {
      "badge": "AGRICULTURE",
      "title": "Rythu Bandhu",
      "desc": "Investment support scheme providing ₹10,000 per acre per year for crop seeds, fertilizers, and field preparation.",
      "eligibility": "Land-owning farmers"
    },
    {
      "badge": "MARRIAGE",
      "title": "Kalyana Lakshmi Scheme",
      "desc": "Provides a one-time financial grant of ₹1,00,116 to girls from poor families at the time of their marriage.",
      "eligibility": "Resident brides aged 18+ (income limit < ₹2L)"
    },
    {
      "badge": "UTILITIES",
      "title": "Gruha Jyothi Telangana",
      "desc": "Offers 200 units of free household electricity monthly to eligible residential power lines.",
      "eligibility": "Residential electricity lines"
    }
  ],
  "TR": [
    {
      "badge": "WOMEN",
      "title": "Matru Pushti Uphaar",
      "desc": "Distributes nutrition kits containing dry fruits, pulses, and health supplements to pregnant and lactating mothers.",
      "eligibility": "Pregnant and lactating mothers"
    },
    {
      "badge": "LIVELIHOOD",
      "title": "Tripura Livelihood Mission",
      "desc": "Organizes self-help groups and matches bank credit to establish local handicraft and food businesses.",
      "eligibility": "Rural women SHGs"
    },
    {
      "badge": "EDUCATION",
      "title": "Bidyajyoti Schools Program",
      "desc": "Upgrades government schools into modern smart classrooms with digital learning tools and CBSE curricula.",
      "eligibility": "State school students"
    }
  ],
  "UP": [
    {
      "badge": "WOMEN",
      "title": "Kanya Sumangala Yojana",
      "desc": "Offers a financial package of ₹15,000 in six stages from birth to graduation to ensure female health and education.",
      "eligibility": "Resident families with up to 2 daughters"
    },
    {
      "badge": "EDUCATION",
      "title": "Abhyuday Coaching Scheme",
      "desc": "Provides free guidance, digital content, and tablets to prepare poor students for competitive exams like IIT-JEE/UPSC.",
      "eligibility": "Meritorious youth from low-income groups"
    },
    {
      "badge": "PENSION",
      "title": "UP Integrated Pension",
      "desc": "Gives ₹1,000 monthly pension directly to senior citizens, widows, and disabled individuals.",
      "eligibility": "Elderly, widows, and disabled (income-tested)"
    }
  ],
  "UT": [
    {
      "badge": "WOMEN",
      "title": "Gaura Devi Kanya Dhan",
      "desc": "Awards a fixed deposit of ₹50,000 to girl students on passing intermediate schooling (Class 12th) to fund college fees.",
      "eligibility": "BPL class 12th passed girls"
    },
    {
      "badge": "NUTRITION",
      "title": "Aanchal Amrit Yojana",
      "desc": "Distributes free fortified milk weekly to children studying in state Anganwadi centers to combat stunting.",
      "eligibility": "Anganwadi enrolled children"
    },
    {
      "badge": "SPORTS",
      "title": "Udiyaman Chhatra Scheme",
      "desc": "Offers a sports scholarship of ₹1,500 per month to budding student athletes to procure sports gear.",
      "eligibility": "Talented student athletes aged 8-14"
    }
  ],
  "WB": [
    {
      "badge": "WOMEN",
      "title": "Lakshmir Bhandar",
      "desc": "Monthly cash support of ₹1,000 for general and ₹1,200 for SC/ST families transferred to the female head.",
      "eligibility": "Resident women aged 25-60"
    },
    {
      "badge": "EDUCATION",
      "title": "Kanyashree Prakalpa",
      "desc": "Multi-stage cash scholarship of up to ₹25,000 to incentivize girls to stay in school and delay marriage.",
      "eligibility": "Unmarried girls studying in Classes VIII-XII"
    },
    {
      "badge": "EDUCATION",
      "title": "Student Credit Card",
      "desc": "Provides collateral-free educational loans up to ₹10 Lakhs at nominal interest rate for higher university studies.",
      "eligibility": "Students residing in Bengal for 10+ years"
    }
  ]
};

    function renderNationalSchemes() {
        const nationalList = document.querySelector('#nationalSchemesCol .schemes-grid-list');
        if (!nationalList) return;

        fetch('/api/schemes/national')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch national schemes');
                return res.json();
            })
            .then(schemes => {
                displayNationalSchemes(schemes);
            })
            .catch(err => {
                console.warn('Error fetching national schemes from API, falling back to local database:', err);
                displayNationalSchemes(localNationalSchemes);
            });

        function displayNationalSchemes(schemes) {
            nationalList.innerHTML = '';
            schemes.forEach(scheme => {
                const card = document.createElement('div');
                card.className = 'scheme-card glass-panel';
                card.innerHTML = `
                    <div class="scheme-badge">${scheme.badge}</div>
                    <h3>${scheme.title}</h3>
                    <p>${scheme.desc}</p>
                    <div class="scheme-footer">
                        <span class="eligibility">${scheme.eligibility}</span>
                        <button class="btn btn-outline btn-sm" onclick="applyForScheme('${scheme.title.replace(/'/g, "\\'")}', '')">Apply Now <i class="ph ph-arrow-right"></i></button>
                    </div>
                `;
                nationalList.appendChild(card);
            });
        }
    }

    function renderStateSchemes(stateCode) {
        if (!stateSchemesList) return;
        stateSchemesList.innerHTML = '<div class="text-center"><i class="ph ph-spinner-gap loading-spinner"></i><p>Loading state schemes...</p></div>';

        fetch(`/api/schemes/state/${stateCode}`)
            .then(res => {
                if (!res.ok) throw new Error('State schemes not found');
                return res.json();
            })
            .then(schemes => {
                displayStateSchemes(schemes);
            })
            .catch(err => {
                console.warn('Error fetching state schemes from API, falling back to local database:', err);
                const schemes = localStateSchemes[stateCode.toUpperCase()] || [];
                displayStateSchemes(schemes);
            });

        function displayStateSchemes(schemes) {
            stateSchemesList.innerHTML = '';
            if (schemes.length === 0) {
                stateSchemesList.innerHTML = '<p class="text-center">No schemes available for this state.</p>';
                return;
            }
            schemes.forEach(scheme => {
                const card = document.createElement('div');
                card.className = 'scheme-card glass-panel';
                card.innerHTML = `
                    <div class="scheme-badge state-badge">${scheme.badge} [${stateCode}]</div>
                    <h3>${scheme.title}</h3>
                    <p>${scheme.desc}</p>
                    <div class="scheme-footer">
                        <span class="eligibility">Eligibility: ${scheme.eligibility}</span>
                        <button class="btn btn-outline btn-sm" onclick="applyForScheme('${scheme.title.replace(/'/g, "\\'")}', '${stateCode}')">Apply Now <i class="ph ph-arrow-right"></i></button>
                    </div>
                `;
                stateSchemesList.appendChild(card);
            });
        }
    }

    if (stateSchemeSelector) {
        stateSchemeSelector.addEventListener('change', (e) => {
            renderStateSchemes(e.target.value);
        });
        // Render national and default state schemes on load
        renderNationalSchemes();
        renderStateSchemes(stateSchemeSelector.value);
    }

    // --- 15. Schemes Section Tab Switcher ---
    const toggleNationalBtn = document.getElementById('toggleNationalBtn');
    const toggleStateBtn = document.getElementById('toggleStateBtn');
    const nationalSchemesCol = document.getElementById('nationalSchemesCol');
    const stateSchemesCol = document.getElementById('stateSchemesCol');

    function switchSchemeTab(tabName) {
        if (tabName === 'national') {
            if (toggleNationalBtn) toggleNationalBtn.classList.add('active');
            if (toggleStateBtn) toggleStateBtn.classList.remove('active');
            if (nationalSchemesCol) {
                nationalSchemesCol.classList.add('active');
                nationalSchemesCol.style.display = 'block';
            }
            if (stateSchemesCol) {
                stateSchemesCol.classList.remove('active');
                stateSchemesCol.style.display = 'none';
            }
        } else if (tabName === 'state') {
            if (toggleStateBtn) toggleStateBtn.classList.add('active');
            if (toggleNationalBtn) toggleNationalBtn.classList.remove('active');
            if (stateSchemesCol) {
                stateSchemesCol.classList.add('active');
                stateSchemesCol.style.display = 'block';
            }
            if (nationalSchemesCol) {
                nationalSchemesCol.classList.remove('active');
                nationalSchemesCol.style.display = 'none';
            }
        }
    }
    window.switchSchemeTab = switchSchemeTab;

    if (toggleNationalBtn && toggleStateBtn) {
        toggleNationalBtn.addEventListener('click', () => switchSchemeTab('national'));
        toggleStateBtn.addEventListener('click', () => switchSchemeTab('state'));
    }

    // Initialize default tab on load
    switchSchemeTab('national');

    // --- 16. Firebase Authentication Logic ---
    const authModal = document.getElementById('authModal');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const signinError = document.getElementById('signin-error');
    const signupError = document.getElementById('signup-error');
    const authHeaderContainer = document.getElementById('authHeaderContainer');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const authLoaderOverlay = document.getElementById('authLoaderOverlay');
    const authLoaderText = document.getElementById('authLoaderText');

    // Helper functions for validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        const re = /^[0-9]{10}$/;
        return re.test(phone);
    }

    // Toggle Modal Open/Close
    const toggleAuthModal = (show) => {
        if (!authModal) return;
        if (show) {
            authModal.classList.add('open');
            document.body.classList.add('modal-open');
            signinError.classList.add('hidden');
            signupError.classList.add('hidden');
            signInForm.reset();
            signUpForm.reset();
            // Reset password input types and eye buttons on open
            authModal.querySelectorAll('.password-input').forEach(input => {
                input.type = 'password';
            });
            authModal.querySelectorAll('.password-toggle-btn').forEach(btn => {
                btn.innerHTML = '<i class="ph ph-eye"></i>';
            });
            showLoader(false);
        } else {
            authModal.classList.remove('open');
            document.body.classList.remove('modal-open');
        }
    };

    const showLoader = (show, text = 'Processing...') => {
        if (!authLoaderOverlay) return;
        if (show) {
            if (authLoaderText) authLoaderText.innerText = text;
            authLoaderOverlay.classList.add('open');
            authLoaderOverlay.classList.remove('hidden');
        } else {
            authLoaderOverlay.classList.remove('open');
            authLoaderOverlay.classList.add('hidden');
        }
    };

    if (authHeaderContainer) {
        authHeaderContainer.addEventListener('click', (e) => {
            if (e.target.id === 'headerSignInBtn') {
                toggleAuthModal(true);
            }
        });
    }

    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', () => toggleAuthModal(false));
    }

    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) toggleAuthModal(false);
        });
    }

    // Toggle Tabs (Sign In / Sign Up)
    if (tabSignIn && tabSignUp && signInForm && signUpForm) {
        tabSignIn.addEventListener('click', () => {
            tabSignIn.classList.add('active');
            tabSignUp.classList.remove('active');
            signInForm.classList.remove('hidden');
            signUpForm.classList.add('hidden');
            signinError.classList.add('hidden');
        });

        tabSignUp.addEventListener('click', () => {
            tabSignUp.classList.add('active');
            tabSignIn.classList.remove('active');
            signUpForm.classList.remove('hidden');
            signInForm.classList.add('hidden');
            signupError.classList.add('hidden');
        });
    }

    // Handle Forgot Password Click
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('signin-username').value.trim();
            
            let email = usernameInput;
            if (!validateEmail(email)) {
                const userEmail = prompt("Please enter your registered email address to receive password reset link:");
                if (!userEmail) return;
                email = userEmail.trim();
                if (!validateEmail(email)) {
                    alert("Please enter a valid email address.");
                    return;
                }
            }

            if (!firebaseAuth) {
                alert("Demo Mode: In a production environment, this sends a password reset email to: " + email);
                return;
            }

            try {
                showLoader(true, "Sending password reset email...");
                await sendPasswordResetEmail(firebaseAuth, email);
                alert(`Password reset link sent successfully to ${email}. Please check your inbox.`);
                addNotification(`Password reset link sent to ${email}`, 'info');
            } catch (err) {
                console.error("Password Reset Error:", err);
                alert("Error sending password reset email: " + err.message.replace("Firebase: ", ""));
            } finally {
                showLoader(false);
            }
        });
    }

    // Google Auth Popup handler
    const handleGoogleAuth = async () => {
        if (!firebaseAuth) {
            isMockAuth = true;
            const mockUser = { email: 'google.citizen@egov.gov.in', displayName: 'Google Citizen' };
            initDashboardUI(mockUser);
            toggleAuthModal(false);
            addNotification('Demo login via Google successful!', 'success');
            return;
        }

        try {
            showLoader(true, "Connecting to Google...");
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(firebaseAuth, provider);
            const user = result.user;

            if (firebaseDb) {
                const userDocRef = doc(firebaseDb, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        name: user.displayName || 'Google Citizen',
                        email: user.email,
                        phone: user.phoneNumber || '',
                        role: 'citizen',
                        createdAt: new Date().toISOString()
                    });
                    console.log("New user profile created in Firestore via Google login.");
                }
            }
            toggleAuthModal(false);
            addNotification(`Successfully signed in as ${user.displayName || user.email}`, 'success');
        } catch (err) {
            console.error("Google Sign-In Error:", err);
            alert(`Google authentication failed: ${err.message.replace("Firebase: ", "")}`);
        } finally {
            showLoader(false);
        }
    };

    // Bind Google buttons
    const btnGoogleSignIn = document.getElementById('btnGoogleSignIn');
    const btnGoogleSignUp = document.getElementById('btnGoogleSignUp');
    if (btnGoogleSignIn) btnGoogleSignIn.addEventListener('click', handleGoogleAuth);
    if (btnGoogleSignUp) btnGoogleSignUp.addEventListener('click', handleGoogleAuth);

    // Handle Sign In Submission
    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signin-username').value.trim();
            const password = document.getElementById('signin-password').value;

            // Mock login fallback check
            const allowedMockEmails = [
                'citizen@egov.gov.in',
                'admin@gov.in',
                'super.admin@gov.in',
                'central.officer@gov.in',
                'state.officer@gov.in',
                'district.officer@gov.in',
                'dept.officer@gov.in',
                'helpdesk@gov.in'
            ];
            if (allowedMockEmails.includes(username) || username === '9876543210') {
                isMockAuth = true;
                const email = username === '9876543210' ? 'citizen@egov.gov.in' : username;
                let name = 'Aarav Sharma';
                if (email === 'admin@gov.in') name = 'System Admin';
                else if (email === 'super.admin@gov.in') name = 'Super Admin';
                else if (email === 'central.officer@gov.in') name = 'Central Government Officer';
                else if (email === 'state.officer@gov.in') name = 'State Officer';
                else if (email === 'district.officer@gov.in') name = 'District Officer';
                else if (email === 'dept.officer@gov.in') name = 'Department Officer';
                else if (email === 'helpdesk@gov.in') name = 'Helpdesk Operator';

                const mockUser = { email: email, displayName: name };
                initDashboardUI(mockUser);
                toggleAuthModal(false);
                addNotification(`Demo login successful. Logged in as ${name}.`, 'success');
                return;
            }

            // Frontend Validation
            if (!username) {
                signinError.innerText = "Please enter your Email or Mobile Number.";
                signinError.classList.remove('hidden');
                return;
            }
            if (password.length < 8) {
                signinError.innerText = "Password must be at least 8 characters.";
                signinError.classList.remove('hidden');
                return;
            }

            if (!firebaseAuth) {
                signinError.innerText = "Firebase not configured. Use citizen@egov.gov.in or admin@gov.in credentials.";
                signinError.classList.remove('hidden');
                return;
            }

            try {
                signinError.classList.add('hidden');
                showLoader(true, "Signing in...");

                let loginEmail = username;
                
                // Check if username is a mobile number
                if (validatePhone(username)) {
                    if (!firebaseDb) {
                        throw new Error("Firestore is required for login by Mobile Number.");
                    }
                    showLoader(true, "Locating account by mobile number...");
                    const usersRef = collection(firebaseDb, "users");
                    const q = query(usersRef, where("phone", "==", username));
                    const querySnapshot = await getDocs(q);
                    
                    if (querySnapshot.empty) {
                        throw new Error("No account found with this mobile number. Please register.");
                    }
                    
                    const userDoc = querySnapshot.docs[0].data();
                    loginEmail = userDoc.email;
                } else if (!validateEmail(username)) {
                    throw new Error("Please enter a valid email address or 10-digit mobile number.");
                }

                // Remember Me persistence config
                const rememberMe = document.getElementById('signin-remember').checked;
                const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
                await setPersistence(firebaseAuth, persistence);

                showLoader(true, "Verifying credentials...");
                await signInWithEmailAndPassword(firebaseAuth, loginEmail, password);
                toggleAuthModal(false);
            } catch (err) {
                console.error("Sign In Error:", err);
                signinError.innerText = err.message.replace("Firebase: ", "");
                signinError.classList.remove('hidden');
            } finally {
                showLoader(false);
            }
        });
    }

    // Handle Sign Up Submission
    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const phone = document.getElementById('signup-phone').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            // Frontend Validation
            if (!fullName) {
                signupError.innerText = "Please enter your Full Name.";
                signupError.classList.remove('hidden');
                return;
            }
            if (!validateEmail(email)) {
                signupError.innerText = "Please enter a valid Email Address.";
                signupError.classList.remove('hidden');
                return;
            }
            if (!validatePhone(phone)) {
                signupError.innerText = "Please enter a valid 10-digit Mobile Number.";
                signupError.classList.remove('hidden');
                return;
            }
            if (password.length < 8) {
                signupError.innerText = "Password must be at least 8 characters.";
                signupError.classList.remove('hidden');
                return;
            }
            if (password !== confirmPassword) {
                signupError.innerText = "Passwords do not match.";
                signupError.classList.remove('hidden');
                return;
            }

            if (!firebaseAuth) {
                isMockAuth = true;
                const mockUser = { email: email, displayName: fullName };
                initDashboardUI(mockUser);
                toggleAuthModal(false);
                addNotification('Demo account created and logged in successfully!', 'success');
                return;
            }

            try {
                signupError.classList.add('hidden');
                showLoader(true, "Registering profile...");
                
                // Create user
                const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
                
                // Update profile name
                await updateProfile(userCredential.user, { displayName: fullName });

                // Store in Firestore
                if (firebaseDb) {
                    showLoader(true, "Saving citizen profile...");
                    await setDoc(doc(firebaseDb, "users", userCredential.user.uid), {
                        uid: userCredential.user.uid,
                        name: fullName,
                        email: email,
                        phone: phone,
                        role: 'citizen',
                        createdAt: new Date().toISOString()
                    });
                }
                
                toggleAuthModal(false);
                addNotification('Account registered successfully!', 'success');
            } catch (err) {
                console.error("Sign Up Error:", err);
                signupError.innerText = err.message.replace("Firebase: ", "");
                signupError.classList.remove('hidden');
            } finally {
                showLoader(false);
            }
        });
    }

    // --- 17. E-Governance Dashboard & Analytics Engine ---
    let currentUser = null;
    let isMockAuth = false;

    // Database Seeds
    const DEFAULT_DOCUMENTS = [
        { id: 'aadhaar-doc', name: 'Aadhaar Card.pdf', size: '1.2 MB', type: 'pdf', url: '#' },
        { id: 'pan-doc', name: 'PAN Card.png', size: '450 KB', type: 'image', url: '#' },
        { id: 'passport-doc', name: 'Passport Document.pdf', size: '1.8 MB', type: 'pdf', url: '#' },
        { id: 'driving-license-doc', name: 'Driving License.pdf', size: '950 KB', type: 'pdf', url: '#' },
        { id: 'birth-certificate-doc', name: 'Birth Certificate.pdf', size: '780 KB', type: 'pdf', url: '#' },
        { id: 'education-certificate-doc', name: 'Educational Certificate.pdf', size: '2.1 MB', type: 'pdf', url: '#' }
    ];

    const DEFAULT_APPLICATIONS = [
        { id: 'APP-2026-894125', name: 'Birth Certificate', applicant: 'Aarav Sharma', date: '2026-05-20', status: 'Approved', step: 4, remarks: 'Certificate issued and uploaded to Document Vault.', details: { state: 'Karnataka', district: 'Bengaluru' } },
        { id: 'APP-2026-302195', name: 'Driving License', applicant: 'Aarav Sharma', date: '2026-05-24', status: 'Under Review', step: 2, remarks: 'Learner verification successful. Document screening pending.', details: { state: 'Maharashtra', district: 'Mumbai' } }
    ];

    const DEFAULT_GRIEVANCES = [
        { id: 'GRv-MP-412051', subject: 'Road Repair Request', dept: 'Roads & Highways', date: '2026-05-22', status: 'In Progress', remarks: 'Site inspection scheduled by Arera Colony municipal unit.' }
    ];

    const DEFAULT_NOTIFICATIONS = [
        { id: 'nt-1', text: 'Welcome to the E-Governance portal! Verify your email to complete verification.', time: '1 hour ago', type: 'info', read: false },
        { id: 'nt-2', text: 'Your Driving License application has been received and is under verification.', time: '2 days ago', type: 'success', read: true }
    ];

    const DEFAULT_DEPARTMENTS = [
        { id: 'DEPT-001', name: 'Identity & Citizenship', subs: 'Passport Board, Aadhaar Registry', activeServices: 3, head: 'Shri S. K. Verma' },
        { id: 'DEPT-002', name: 'Transport Department', subs: 'RTO Office, Highway Transit', activeServices: 2, head: 'Smt. Priya Sharma' },
        { id: 'DEPT-003', name: 'Health & Family Welfare', subs: 'Ayushman Desk, Registrar Births', activeServices: 4, head: 'Dr. Anil Mehta' },
        { id: 'DEPT-004', name: 'Finance & Revenue', subs: 'Income Tax Division, PAN Registry', activeServices: 3, head: 'Shri R. N. Iyer' }
    ];

    const DEFAULT_SCHEMES = [
        { id: 'SCH-001', badge: 'EDUCATION', title: 'National Scholarship Portal', desc: 'Centralized government scholarship dashboard for secondary and higher college students.', eligibility: 'Meritorious students (family income < ₹8L)', deadline: '2026-08-31' },
        { id: 'SCH-002', badge: 'UTILITIES', title: 'Gruha Jyothi Welfare', desc: 'Provides up to 200 units of free domestic electricity monthly to eligible family consumer meters.', eligibility: 'Low and middle-income families', deadline: '2026-12-31' },
        { id: 'SCH-003', badge: 'HEALTH', title: 'Ayushman Bharat PM-JAY', desc: 'Universal cashless medical insurance covering ₹5 Lakhs per family per year for secondary/tertiary hospitalizations.', eligibility: 'All low-income families', deadline: '2026-10-15' }
    ];

    const DEFAULT_AUDIT_LOGS = [
        { timestamp: '2026-05-29 10:30 AM', user: 'super.admin@gov.in', area: 'System Login', details: 'Successful login. 2FA Verification passed.', ip: '192.168.1.104' },
        { timestamp: '2026-05-29 11:15 AM', user: 'helpdesk@gov.in', area: 'Grievance Desk', details: 'Assigned complaint GRv-MP-412051 to MP Cell.', ip: '192.168.1.108' }
    ];

    // Load state from local storage or seed
    let documents = JSON.parse(localStorage.getItem('egov-docs')) || DEFAULT_DOCUMENTS;
    let applications = JSON.parse(localStorage.getItem('egov-apps')) || DEFAULT_APPLICATIONS;
    let grievances = JSON.parse(localStorage.getItem('egov-grievances')) || DEFAULT_GRIEVANCES;
    let notifications = JSON.parse(localStorage.getItem('egov-notifications')) || DEFAULT_NOTIFICATIONS;
    let adminDepartments = JSON.parse(localStorage.getItem('egov-departments')) || DEFAULT_DEPARTMENTS;
    let adminSchemes = JSON.parse(localStorage.getItem('egov-schemes')) || DEFAULT_SCHEMES;
    let adminAuditLogs = JSON.parse(localStorage.getItem('egov-audit-logs')) || DEFAULT_AUDIT_LOGS;

    const DEFAULT_SECTOR_ADMINS = [
        {
            id: 'admin-1',
            name: 'Dr. Ramesh Kumar',
            email: 'ramesh.kumar@gov.in',
            sector: 'Transport',
            term: '2 Years (June 2026 - June 2028)',
            approvalsToday: 14,
            rejectionsToday: 2,
            directivesCount: 3,
            status: 'Active'
        },
        {
            id: 'admin-2',
            name: 'Smt. Priya Sharma',
            email: 'priya.sharma@gov.in',
            sector: 'Revenue',
            term: '3 Years (Jan 2025 - Jan 2028)',
            approvalsToday: 28,
            rejectionsToday: 5,
            directivesCount: 5,
            status: 'Active'
        },
        {
            id: 'admin-3',
            name: 'Shri Amit Patel',
            email: 'amit.patel@gov.in',
            sector: 'Health',
            term: '1 Year (March 2026 - March 2027)',
            approvalsToday: 9,
            rejectionsToday: 1,
            directivesCount: 1,
            status: 'Active'
        }
    ];

    const DEFAULT_DIRECTIVES = [
        {
            id: 'dir-1',
            adminName: 'Smt. Priya Sharma',
            sector: 'Revenue',
            text: 'Prioritize crop certificate approvals for farmers affected by unseasonal rainfall.',
            timestamp: '2026-06-07 10:15 AM'
        },
        {
            id: 'dir-2',
            adminName: 'Dr. Ramesh Kumar',
            sector: 'Transport',
            text: 'Ensure all driving license applications are reviewed within 48 hours.',
            timestamp: '2026-06-06 02:30 PM'
        }
    ];

    let sectorAdmins = JSON.parse(localStorage.getItem('egov-sector-admins')) || DEFAULT_SECTOR_ADMINS;
    let nationalDirectives = JSON.parse(localStorage.getItem('egov-national-directives')) || DEFAULT_DIRECTIVES;

    function saveSectorAdminsState() {
        localStorage.setItem('egov-sector-admins', JSON.stringify(sectorAdmins));
        localStorage.setItem('egov-national-directives', JSON.stringify(nationalDirectives));
    }

    let currentAdminRole = 'super-admin';

    // Seed default citizen sessions if not present
    const DEFAULT_CITIZEN_SESSIONS = [
        { name: 'Rajesh Patel', email: 'rajesh.patel@gmail.com', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), ip: '192.168.1.45', status: 'Active' },
        { name: 'Ananya Iyer', email: 'ananya.iyer@yahoo.com', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), ip: '103.45.2.19', status: 'Active' },
        { name: 'Amit Kumar', email: 'amit.kumar@outlook.com', timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), ip: '172.16.8.112', status: 'Active' }
    ];
    if (!localStorage.getItem('egov-citizen-sessions')) {
        localStorage.setItem('egov-citizen-sessions', JSON.stringify(DEFAULT_CITIZEN_SESSIONS));
    }

    function saveState() {
        localStorage.setItem('egov-docs', JSON.stringify(documents));
        localStorage.setItem('egov-apps', JSON.stringify(applications));
        localStorage.setItem('egov-grievances', JSON.stringify(grievances));
        localStorage.setItem('egov-notifications', JSON.stringify(notifications));
    }

    // Initialize UI on Login
    function initDashboardUI(user) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        currentUser = user;
        // Record active citizen session
        recordCitizenSession(user);
        if (window.pendingWelfareScheme) {
            const schName = window.pendingWelfareScheme;
            const stCode = window.pendingWelfareState || '';
            window.pendingWelfareScheme = null;
            window.pendingWelfareState = '';
            setTimeout(() => {
                applyForScheme(schName, stCode);
            }, 800);
        }
        const allowedOfficerEmails = [
            'admin@gov.in',
            'super.admin@gov.in',
            'central.officer@gov.in',
            'state.officer@gov.in',
            'district.officer@gov.in',
            'dept.officer@gov.in',
            'helpdesk@gov.in'
        ];
        const isAdmin = allowedOfficerEmails.includes(user.email);

        const landingPage = document.getElementById('landingPage');
        const citizenDashboard = document.getElementById('citizenDashboard');
        
        if (landingPage) {
            if (isAdmin) landingPage.classList.add('hidden');
            else landingPage.classList.remove('hidden');
        }
        if (citizenDashboard) {
            if (isAdmin) citizenDashboard.classList.remove('hidden');
            else citizenDashboard.classList.add('hidden');
        }

        // Toggle nav links: show landing links, hide dashboard links
        const landingNavLinks = document.getElementById('landingNavLinks');
        const dashboardNavLinks = document.getElementById('dashboardNavLinks');
        if (landingNavLinks) {
            if (isAdmin) landingNavLinks.classList.add('hidden');
            else landingNavLinks.classList.remove('hidden');
        }
        if (dashboardNavLinks) {
            if (isAdmin) dashboardNavLinks.classList.remove('hidden');
            else dashboardNavLinks.classList.add('hidden');
        }

        // Apply admin view logic for sidebar and dashboard toggles
        applyAdminSidebarView(isAdmin);

        // Hide dashboard mode toggle containers initially for citizens, permanently for admins
        const dashboardModeToggle = document.getElementById('dashboardModeToggle');
        const dashboardModeToggleMobile = document.getElementById('dashboardModeToggleMobile');
        if (dashboardModeToggle) dashboardModeToggle.classList.add('hidden');
        if (dashboardModeToggleMobile) dashboardModeToggleMobile.classList.add('hidden');

        // Initialize mode toggles state
        const btnToggleDashboardMode = document.getElementById('btnToggleDashboardMode');
        const btnToggleDashboardModeMobile = document.getElementById('btnToggleDashboardModeMobile');
        [btnToggleDashboardMode, btnToggleDashboardModeMobile].forEach(btn => {
            if (btn) {
                if (isAdmin) btn.classList.add('admin-active');
                else btn.classList.remove('admin-active');
            }
        });

        const optCitizen = document.getElementById('modeOptCitizen');
        const optCitizenMobile = document.getElementById('modeOptCitizenMobile');
        const optAdmin = document.getElementById('modeOptAdmin');
        const optAdminMobile = document.getElementById('modeOptAdminMobile');
        [optCitizen, optCitizenMobile].forEach(opt => { 
            if (opt) {
                if (isAdmin) opt.classList.remove('active');
                else opt.classList.add('active'); 
            }
        });
        [optAdmin, optAdminMobile].forEach(opt => { 
            if (opt) {
                if (isAdmin) opt.classList.add('active');
                else opt.classList.remove('active'); 
            }
        });

        // Update profile branding/header
        updateHeaderProfile(user);
        
        // Populate Sidebar
        document.getElementById('sidebarUserName').innerText = user.displayName || user.email.split('@')[0];
        document.getElementById('sidebarAvatar').innerText = (user.displayName || 'U')[0].toUpperCase();
        
        // Show/Hide Admin Sidebar Tab
        const adminBtn = document.getElementById('adminSidebarBtn');
        if (isAdmin) {
            let roleTitle = 'Administrator';
            if (user.email === 'super.admin@gov.in') roleTitle = 'Super Admin';
            else if (user.email === 'admin@gov.in') roleTitle = 'Department Officer';
            else if (user.email === 'central.officer@gov.in') roleTitle = 'Central Officer';
            else if (user.email === 'state.officer@gov.in') roleTitle = 'State Officer';
            else if (user.email === 'district.officer@gov.in') roleTitle = 'District Officer';
            else if (user.email === 'dept.officer@gov.in') roleTitle = 'Department Officer';
            else if (user.email === 'helpdesk@gov.in') roleTitle = 'Helpdesk Operator';

            document.getElementById('sidebarUserRole').innerText = roleTitle;
            if (adminBtn) adminBtn.classList.remove('hidden');

            const selectRole = document.getElementById('adminActiveRoleSelect');
            if (selectRole) {
                if (user.email === 'admin@gov.in') selectRole.value = 'dept-officer';
                else if (user.email === 'super.admin@gov.in') selectRole.value = 'super-admin';
                else if (user.email === 'central.officer@gov.in') selectRole.value = 'central-officer';
                else if (user.email === 'state.officer@gov.in') selectRole.value = 'state-officer';
                else if (user.email === 'district.officer@gov.in') selectRole.value = 'district-officer';
                else if (user.email === 'dept.officer@gov.in') selectRole.value = 'dept-officer';
                else if (user.email === 'helpdesk@gov.in') selectRole.value = 'helpdesk-operator';
            }
        } else {
            document.getElementById('sidebarUserRole').innerText = 'Citizen';
            if (adminBtn) adminBtn.classList.add('hidden');
        }

        // Welcome banner date
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('dbWelcomeDate').innerText = new Date().toLocaleDateString('en-US', dateOptions);
        
        // Welcome message with dynamic greeting based on time of day
        const currentHour = new Date().getHours();
        let greeting = "Namaste";
        if (currentHour < 12) greeting = "Good Morning";
        else if (currentHour < 17) greeting = "Good Afternoon";
        else greeting = "Good Evening";
        
        const dispName = user.displayName || user.email.split('@')[0];
        document.getElementById('dbWelcomeTitle').innerText = `${greeting}, ${dispName}!`;
        
        // Populate profile card in overview tab
        if (document.getElementById('overviewGreetingName')) {
            document.getElementById('overviewGreetingName').innerHTML = `${greeting}, ${dispName} <span class="citizen-badge-id" id="overviewCitizenId">ID: EGOV-2026-98412</span>`;
        }
        if (document.getElementById('overviewUserAvatar')) {
            document.getElementById('overviewUserAvatar').innerText = dispName.slice(0, 2).toUpperCase();
        }
        if (document.getElementById('overviewLastLogin')) {
            document.getElementById('overviewLastLogin').innerText = `Last Login: Yesterday at 08:30 PM`;
        }

        // Render dashboard tabs in background
        renderOverviewTab();
        renderProfileTab();
        renderVaultTab();
        renderGrievancesTab();
        renderRecommendedSchemes();
        renderAdminTab();
        renderNotifications();
        renderAppointmentsTab();
        renderSupportCenterTab();
        renderSecuritySettings();
        renderMyApplicationsTab();

        if (isAdmin) {
            switchDashboardTab('admin');
        }
    }

    function initLandingUI() {
        currentUser = null;
        const landingPage = document.getElementById('landingPage');
        const citizenDashboard = document.getElementById('citizenDashboard');
        
        if (landingPage) landingPage.classList.remove('hidden');
        if (citizenDashboard) citizenDashboard.classList.add('hidden');

        // Toggle nav links
        const landingNavLinks = document.getElementById('landingNavLinks');
        const dashboardNavLinks = document.getElementById('dashboardNavLinks');
        if (landingNavLinks) landingNavLinks.classList.remove('hidden');
        if (dashboardNavLinks) dashboardNavLinks.classList.add('hidden');

        // Restore sidebar and dashboard mode toggles for citizen
        applyAdminSidebarView(false);

        // Hide dashboard mode toggles (Desktop & Mobile)
        const dashboardModeToggle = document.getElementById('dashboardModeToggle');
        const dashboardModeToggleMobile = document.getElementById('dashboardModeToggleMobile');
        if (dashboardModeToggle) dashboardModeToggle.classList.add('hidden');
        if (dashboardModeToggleMobile) dashboardModeToggleMobile.classList.add('hidden');

        // Reset header
        const authHeaderContainer = document.getElementById('authHeaderContainer');
        if (authHeaderContainer) {
            authHeaderContainer.innerHTML = `<button class="btn btn-primary" id="headerSignInBtn">Sign In</button>`;
        }
    }

    function goToLandingPage() {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const landingPage = document.getElementById('landingPage');
        const citizenDashboard = document.getElementById('citizenDashboard');
        if (landingPage) landingPage.classList.remove('hidden');
        if (citizenDashboard) citizenDashboard.classList.add('hidden');
        
        const landingNavLinks = document.getElementById('landingNavLinks');
        const dashboardNavLinks = document.getElementById('dashboardNavLinks');
        if (landingNavLinks) landingNavLinks.classList.remove('hidden');
        if (dashboardNavLinks) dashboardNavLinks.classList.add('hidden');
        
        // Hide dashboard mode toggle containers
        const dashboardModeToggle = document.getElementById('dashboardModeToggle');
        const dashboardModeToggleMobile = document.getElementById('dashboardModeToggleMobile');
        if (dashboardModeToggle) dashboardModeToggle.classList.add('hidden');
        if (dashboardModeToggleMobile) dashboardModeToggleMobile.classList.add('hidden');
    }
    window.goToLandingPage = goToLandingPage;

    function showDashboard(tabId) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const landingPage = document.getElementById('landingPage');
        const citizenDashboard = document.getElementById('citizenDashboard');
        if (landingPage) landingPage.classList.add('hidden');
        if (citizenDashboard) citizenDashboard.classList.remove('hidden');
        
        const allowedOfficerEmails = [
            'admin@gov.in',
            'super.admin@gov.in',
            'central.officer@gov.in',
            'state.officer@gov.in',
            'district.officer@gov.in',
            'dept.officer@gov.in',
            'helpdesk@gov.in'
        ];
        const email = currentUser ? currentUser.email : '';
        const isAdmin = allowedOfficerEmails.includes(email);

        const landingNavLinks = document.getElementById('landingNavLinks');
        const dashboardNavLinks = document.getElementById('dashboardNavLinks');
        if (landingNavLinks) landingNavLinks.classList.add('hidden');
        if (dashboardNavLinks) {
            if (isAdmin) dashboardNavLinks.classList.add('hidden');
            else dashboardNavLinks.classList.remove('hidden');
        }
        
        // Show/hide dashboard mode toggle containers based on email role
        const dashboardModeToggle = document.getElementById('dashboardModeToggle');
        const dashboardModeToggleMobile = document.getElementById('dashboardModeToggleMobile');
        const showModeToggle = isAdmin;
        
        [dashboardModeToggle, dashboardModeToggleMobile].forEach(toggle => {
            if (toggle) {
                if (showModeToggle) toggle.classList.remove('hidden');
                else toggle.classList.add('hidden');
            }
        });

        // Toggle active view mode on dashboard based on role
        if (showModeToggle) {
            handleModeToggleClick(true);
        } else {
            handleModeToggleClick(false);
        }
        
        // Switch to appropriate tab
        switchDashboardTab(tabId || 'overview');
    }
    window.showDashboard = showDashboard;

    function goHome() {
        if (currentUser) {
            goToLandingPage();
        } else {
            window.location.reload();
        }
    }
    window.goHome = goHome;

    function updateHeaderProfile(user) {
        const authHeaderContainer = document.getElementById('authHeaderContainer');
        if (!authHeaderContainer) return;
        const displayName = user.displayName || user.email.split('@')[0];
        
        const allowedOfficerEmails = [
            'admin@gov.in',
            'super.admin@gov.in',
            'central.officer@gov.in',
            'state.officer@gov.in',
            'district.officer@gov.in',
            'dept.officer@gov.in',
            'helpdesk@gov.in'
        ];
        const isAdmin = allowedOfficerEmails.includes(user.email);

        let dropdownLinksHtml = '';
        if (isAdmin) {
            dropdownLinksHtml = `
                <button class="dropdown-item" id="navToAdminBtn">
                    <i class="ph ph-shield-check"></i> Admin Dashboard
                </button>
                <button class="dropdown-item sign-out" id="signOutBtn">
                    <i class="ph ph-sign-out"></i> Logout
                </button>
            `;
        } else {
            dropdownLinksHtml = `
                <button class="dropdown-item" id="navToOverviewBtn">
                    <i class="ph ph-chart-pie-slice"></i> My Dashboard
                </button>
                <button class="dropdown-item" id="navToAppsBtn">
                    <i class="ph ph-file-text"></i> My Applications
                </button>
                <button class="dropdown-item" id="navToVaultBtn">
                    <i class="ph ph-folder-open"></i> Document Vault
                </button>
                <button class="dropdown-item" id="navToGrievanceBtn">
                    <i class="ph ph-warning-octagon"></i> Submit Grievance
                </button>
                <button class="dropdown-item" id="navToProfileBtn">
                    <i class="ph ph-user"></i> My Profile
                </button>
                <button class="dropdown-item sign-out" id="signOutBtn">
                    <i class="ph ph-sign-out"></i> Logout
                </button>
            `;
        }

        authHeaderContainer.innerHTML = `
            <div class="user-profile-menu">
                <button class="user-profile-trigger">
                    <i class="ph-fill ph-user-circle"></i>
                    <span>${displayName}</span>
                    <i class="ph ph-caret-down"></i>
                </button>
                <div class="user-profile-dropdown">
                    <div class="dropdown-user-info">
                        <span class="user-name">${displayName}</span>
                        <span class="user-email">${user.email}</span>
                    </div>
                    <div class="dropdown-links">
                        ${dropdownLinksHtml}
                    </div>
                </div>
            </div>
        `;

        // Add menu triggers
        const trigger = authHeaderContainer.querySelector('.user-profile-trigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                authHeaderContainer.querySelector('.user-profile-menu').classList.toggle('open');
            });
        }

        const navToAdminBtn = document.getElementById('navToAdminBtn');
        if (navToAdminBtn) {
            navToAdminBtn.addEventListener('click', () => {
                showDashboard('admin');
            });
        }

        const navToOverviewBtn = document.getElementById('navToOverviewBtn');
        if (navToOverviewBtn) {
            navToOverviewBtn.addEventListener('click', () => {
                showDashboard('overview');
            });
        }

        const navToAppsBtn = document.getElementById('navToAppsBtn');
        if (navToAppsBtn) {
            navToAppsBtn.addEventListener('click', () => {
                showDashboard('my-applications');
            });
        }

        const navToVaultBtn = document.getElementById('navToVaultBtn');
        if (navToVaultBtn) {
            navToVaultBtn.addEventListener('click', () => {
                showDashboard('vault');
            });
        }

        const navToGrievanceBtn = document.getElementById('navToGrievanceBtn');
        if (navToGrievanceBtn) {
            navToGrievanceBtn.addEventListener('click', () => {
                showDashboard('grievances');
            });
        }

        const navToProfileBtn = document.getElementById('navToProfileBtn');
        if (navToProfileBtn) {
            navToProfileBtn.addEventListener('click', () => {
                showDashboard('profile');
            });
        }

        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                signOutUser();
            });
        }
    }

    // Toggle dropdown open/close
    document.addEventListener('click', () => {
        const menu = document.querySelector('.user-profile-menu');
        if (menu) menu.classList.remove('open');
        
        const notificationDropdown = document.getElementById('notificationDropdown');
        if (notificationDropdown) notificationDropdown.classList.remove('open');
    });

    // Sign out function
    async function signOutUser() {
        if (isMockAuth) {
            isMockAuth = false;
            initLandingUI();
            addNotification('Signed out from demo session.', 'info');
        } else if (firebaseAuth) {
            try {
                await signOut(firebaseAuth);
                initLandingUI();
            } catch (err) {
                console.error("Sign Out Error:", err);
            }
        }
    }

    // Sidebar navigation hook
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchDashboardTab(tabId);
        });
    });

    // Dashboard header nav links hook
    document.querySelectorAll('.db-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            if (tabId) {
                switchDashboardTab(tabId);
            }
        });
    });

    // Dashboard Home button hook
    const navDbHome = document.getElementById('navDbHome');
    if (navDbHome) {
        navDbHome.addEventListener('click', (e) => {
            e.preventDefault();
            goToLandingPage();
        });
    }

    // Dashboard Mode Switchers (Desktop & Mobile)
    const btnToggleDashboardMode = document.getElementById('btnToggleDashboardMode');
    const btnToggleDashboardModeMobile = document.getElementById('btnToggleDashboardModeMobile');

    function handleModeToggleClick(isActiveAdmin) {
        [btnToggleDashboardMode, btnToggleDashboardModeMobile].forEach(btn => {
            if (btn) {
                if (isActiveAdmin) {
                    btn.classList.add('admin-active');
                } else {
                    btn.classList.remove('admin-active');
                }
            }
        });

        const optCitizen = document.getElementById('modeOptCitizen');
        const optCitizenMobile = document.getElementById('modeOptCitizenMobile');
        const optAdmin = document.getElementById('modeOptAdmin');
        const optAdminMobile = document.getElementById('modeOptAdminMobile');

        [optCitizen, optCitizenMobile].forEach(opt => {
            if (opt) {
                if (isActiveAdmin) opt.classList.remove('active');
                else opt.classList.add('active');
            }
        });

        [optAdmin, optAdminMobile].forEach(opt => {
            if (opt) {
                if (isActiveAdmin) opt.classList.add('active');
                else opt.classList.remove('active');
            }
        });

        if (isActiveAdmin) {
            switchDashboardTab('admin');
        } else {
            switchDashboardTab('overview');
        }
    }

    if (btnToggleDashboardMode) {
        btnToggleDashboardMode.addEventListener('click', () => {
            const isControlAdmin = btnToggleDashboardMode.classList.contains('admin-active');
            handleModeToggleClick(!isControlAdmin);
        });
    }

    if (btnToggleDashboardModeMobile) {
        btnToggleDashboardModeMobile.addEventListener('click', () => {
            const isControlAdmin = btnToggleDashboardModeMobile.classList.contains('admin-active');
            handleModeToggleClick(!isControlAdmin);
        });
    }

    window.switchDashboardTab = function(tabId) {
        document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.sidebar-btn[data-tab="${tabId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        document.querySelectorAll('.dashboard-tab-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById(`tab-${tabId}`);
        if (activeContent) activeContent.classList.add('active');

        // Synchronize navbar dashboard nav links
        document.querySelectorAll('.db-nav-link').forEach(link => {
            if (link.getAttribute('data-tab') === tabId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Synchronize navbar mode toggle switchers (Desktop & Mobile)
        const btnToggleDashboardMode = document.getElementById('btnToggleDashboardMode');
        const btnToggleDashboardModeMobile = document.getElementById('btnToggleDashboardModeMobile');
        const optCitizen = document.getElementById('modeOptCitizen');
        const optCitizenMobile = document.getElementById('modeOptCitizenMobile');
        const optAdmin = document.getElementById('modeOptAdmin');
        const optAdminMobile = document.getElementById('modeOptAdminMobile');
        
        [btnToggleDashboardMode, btnToggleDashboardModeMobile].forEach(btn => {
            if (btn) {
                if (tabId === 'admin') {
                    btn.classList.add('admin-active');
                } else {
                    btn.classList.remove('admin-active');
                }
            }
        });

        [optCitizen, optCitizenMobile].forEach(opt => {
            if (opt) {
                if (tabId === 'admin') opt.classList.remove('active');
                else opt.classList.add('active');
            }
        });

        [optAdmin, optAdminMobile].forEach(opt => {
            if (opt) {
                if (tabId === 'admin') opt.classList.add('active');
                else opt.classList.remove('active');
            }
        });

        // Render tab specific data if needed
        if (tabId === 'overview') renderOverviewTab();
        if (tabId === 'vault') renderVaultTab();
        if (tabId === 'grievances') renderGrievancesTab();
        if (tabId === 'admin') renderAdminTab();
        if (tabId === 'appointments') renderAppointmentsTab();
        if (tabId === 'support-center') renderSupportCenterTab();
        if (tabId === 'profile') { renderProfileTab(); renderSecuritySettings(); }
        if (tabId === 'my-applications') renderMyApplicationsTab();
    }

    function renderOverviewTab() {
        const totalApps = applications.length;
        const inProgressCount = applications.filter(a => a.status === 'Under Review' || a.status === 'In Progress' || a.status === 'Submitted' || a.status === 'Form Submitted').length;
        const approvedCount = applications.filter(a => a.status === 'Approved').length;
        const rejectedCount = applications.filter(a => a.status === 'Rejected').length;
        const downloadedCerts = parseInt(localStorage.getItem('egov-downloaded-certs-count')) || 5;
        const notificationsCount = notifications.length;

        // Set text
        if (document.getElementById('statTotalApps')) document.getElementById('statTotalApps').innerText = totalApps;
        if (document.getElementById('statInProgApps')) document.getElementById('statInProgApps').innerText = inProgressCount;
        if (document.getElementById('statApprovedApps')) document.getElementById('statApprovedApps').innerText = approvedCount;
        if (document.getElementById('statRejectedApps')) document.getElementById('statRejectedApps').innerText = rejectedCount;
        if (document.getElementById('statDownloadedCerts')) document.getElementById('statDownloadedCerts').innerText = downloadedCerts;
        if (document.getElementById('statNotificationsCount')) document.getElementById('statNotificationsCount').innerText = notificationsCount;

        // Render Recent Applications Table
        const recentAppsBody = document.getElementById('overviewRecentAppsBody');
        if (recentAppsBody) {
            recentAppsBody.innerHTML = '';
            if (applications.length === 0) {
                recentAppsBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No applications found.</td></tr>`;
            } else {
                // Display in reverse order (most recent first)
                const sortedApps = [...applications];
                sortedApps.forEach(app => {
                    let badgeClass = 'submitted';
                    if (app.status === 'Approved') badgeClass = 'approved';
                    else if (app.status === 'Rejected') badgeClass = 'rejected';
                    else if (app.status === 'Under Review' || app.status === 'In Progress' || app.status === 'Form Submitted') badgeClass = 'inreview';
                    
                    let dept = 'Identity & Civil';
                    if (app.name.toLowerCase().includes('license') || app.name.toLowerCase().includes('driving')) dept = 'Transport';
                    else if (app.name.toLowerCase().includes('tax') || app.name.toLowerCase().includes('finance')) dept = 'Finance & Revenue';
                    else if (app.name.toLowerCase().includes('birth') || app.name.toLowerCase().includes('health')) dept = 'Health & Registrar';
                    else if (app.name.toLowerCase().includes('grievance') || app.name.toLowerCase().includes('complaint')) dept = 'Public Grievance';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${app.id}</strong></td>
                        <td>${app.name}</td>
                        <td>${dept}</td>
                        <td>${app.date}</td>
                        <td><span class="badge-status ${badgeClass}">${app.status}</span></td>
                        <td><button class="btn btn-outline btn-sm" onclick="viewApplicationTimeline('${app.id}')">View Details</button></td>
                    `;
                    recentAppsBody.appendChild(row);
                });
            }
        }

        // Setup track app action listener
        const actionTrackAppBtn = document.getElementById('actionTrackApp');
        if (actionTrackAppBtn) {
            // Remove previous listener to avoid duplicate trigger
            const newTrackBtn = actionTrackAppBtn.cloneNode(true);
            actionTrackAppBtn.parentNode.replaceChild(newTrackBtn, actionTrackAppBtn);
            newTrackBtn.addEventListener('click', () => {
                if (applications.length > 0) {
                    const appToTrack = applications[0];
                    viewApplicationTimeline(appToTrack.id);
                } else {
                    addNotification("No active applications found to track.", "info");
                }
            });
        }
    }

    window.viewApplicationTimeline = function(appId) {
        const app = applications.find(a => a.id === appId);
        if (!app) return;
        
        const timelineCard = document.getElementById('overviewTimelineCard');
        if (!timelineCard) return;

        timelineCard.classList.remove('hidden');
        document.getElementById('timelineAppName').innerText = `${app.name} Application Progress`;
        document.getElementById('timelineAppMeta').innerText = `ID: ${app.id} | Applicant: ${app.applicant} | Submitted: ${app.date}`;
        document.getElementById('timelineRemarks').innerText = app.remarks || "No remarks available.";

        // Map step (1-5) and status to progress bar and highlight classes
        // Stages: 1 = Submitted, 2 = Under Verification, 3 = Processing, 4 = Approved, 5 = Certificate Generated
        let step = app.step || 1;
        if (app.status === 'Approved') {
            step = 5;
        } else if (app.status === 'Rejected') {
            step = 4; // Show up to officer review
        } else if (app.status === 'Under Review') {
            step = 3;
        } else if (app.status === 'Form Submitted') {
            step = 1;
        }

        // Reset all stages
        for (let i = 1; i <= 5; i++) {
            const node = document.getElementById(`node-stage-${i}`);
            if (node) {
                node.classList.remove('active', 'completed');
                const dot = node.querySelector('.timeline-node-dot');
                if (dot) dot.innerHTML = i;
            }
        }

        // Highlight up to current step
        for (let i = 1; i <= step; i++) {
            const node = document.getElementById(`node-stage-${i}`);
            if (node) {
                if (i < step) {
                    node.classList.add('completed');
                    const dot = node.querySelector('.timeline-node-dot');
                    if (dot) dot.innerHTML = '<i class="ph-fill ph-check"></i>';
                } else if (i === step) {
                    if (app.status === 'Approved' && step === 5) {
                        node.classList.add('completed');
                        const dot = node.querySelector('.timeline-node-dot');
                        if (dot) dot.innerHTML = '<i class="ph-fill ph-check"></i>';
                    } else {
                        node.classList.add('active');
                    }
                }
            }
        }

        // Progress bar percentage
        let progressPct = 0;
        if (step === 1) progressPct = 0;
        else if (step === 2) progressPct = 25;
        else if (step === 3) progressPct = 50;
        else if (step === 4) progressPct = 75;
        else if (step === 5) progressPct = 100;
        
        const progressBar = document.getElementById('timelineProgressBar');
        if (progressBar) {
            progressBar.style.width = `${progressPct}%`;
        }

        // Handle Rejected specific styles in timeline nodes
        if (app.status === 'Rejected') {
            const approvedNode = document.getElementById('node-stage-4');
            if (approvedNode) {
                approvedNode.classList.remove('completed');
                approvedNode.classList.add('active');
                const dot = approvedNode.querySelector('.timeline-node-dot');
                if (dot) {
                    dot.innerHTML = '<i class="ph ph-x" style="color: var(--danger-color);"></i>';
                    dot.style.borderColor = 'var(--danger-color)';
                }
                const label = approvedNode.querySelector('.timeline-node-text');
                if (label) {
                    label.innerText = 'Rejected';
                    label.style.color = 'var(--danger-color)';
                }
            }
            const certNode = document.getElementById('node-stage-5');
            if (certNode) {
                certNode.style.opacity = '0.5';
            }
        } else {
            // Restore stage 4 text if not rejected
            const approvedNode = document.getElementById('node-stage-4');
            if (approvedNode) {
                const label = approvedNode.querySelector('.timeline-node-text');
                if (label) {
                    label.innerText = 'Approved';
                    label.style.color = '';
                }
                const dot = approvedNode.querySelector('.timeline-node-dot');
                if (dot) dot.style.borderColor = '';
            }
            const certNode = document.getElementById('node-stage-5');
            if (certNode) {
                certNode.style.opacity = '';
            }
        }

        // Scroll to timeline card
        timelineCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // --- Document Vault Logic ---
    function renderVaultTab() {
        const vaultGrid = document.getElementById('vaultGrid');
        if (!vaultGrid) return;
        vaultGrid.innerHTML = '';

        documents.forEach(doc => {
            const vaultCard = document.createElement('div');
            vaultCard.className = 'vault-card glass-panel';
            const iconClass = doc.type === 'pdf' ? 'ph-fill ph-file-pdf pdf' : 'ph-fill ph-image image';
            const typeLabel = doc.type === 'pdf' ? 'pdf' : 'image';

            vaultCard.innerHTML = `
                <div class="vault-file-type ${typeLabel}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="vault-file-info">
                    <span class="vault-file-name" title="${doc.name}">${doc.name}</span>
                    <span class="vault-file-size">${doc.size}</span>
                </div>
                <div class="vault-card-actions" style="grid-template-columns: repeat(2, 1fr); gap: 0.5rem; width: 100%; margin-top: 1rem; display: grid;">
                    <button class="vault-action-btn view" onclick="previewVaultDoc('${doc.id}')" style="padding: 0.5rem; font-size: 0.78rem;">
                        <i class="ph ph-eye"></i> Preview
                    </button>
                    <button class="vault-action-btn view" onclick="downloadVaultDoc('${doc.id}')" style="padding: 0.5rem; font-size: 0.78rem; background: rgba(14, 165, 233, 0.1); color: var(--glow-cyan); border-color: rgba(14, 165, 233, 0.2);">
                        <i class="ph ph-download"></i> Download
                    </button>
                    <button class="vault-action-btn view" onclick="shareVaultDoc('${doc.id}')" style="padding: 0.5rem; font-size: 0.78rem; background: rgba(245, 158, 11, 0.1); color: var(--accent-color); border-color: rgba(245, 158, 11, 0.2);">
                        <i class="ph ph-share-network"></i> Share
                    </button>
                    <button class="vault-action-btn view" onclick="verifyVaultDoc('${doc.id}')" style="padding: 0.5rem; font-size: 0.78rem; background: rgba(16, 185, 129, 0.1); color: var(--success-color); border-color: rgba(16, 185, 129, 0.2);">
                        <i class="ph ph-shield-check"></i> Verify
                    </button>
                </div>
                <button class="vault-action-btn delete" onclick="deleteVaultDoc('${doc.id}')" style="width: 100%; margin-top: 0.5rem; padding: 0.4rem; font-size: 0.78rem; border-radius: 8px;">
                    <i class="ph ph-trash"></i> Remove File
                </button>
            `;
            vaultGrid.appendChild(vaultCard);
        });

        // Update form selectors
        document.querySelectorAll('.vault-proof-selector').forEach(sel => {
            const prevVal = sel.value;
            sel.innerHTML = `<option value="">-- Select File --</option>`;
            documents.forEach(doc => {
                sel.innerHTML += `<option value="${doc.name}">${doc.name}</option>`;
            });
            if (prevVal) sel.value = prevVal;
        });
    }

    // Vault Action Handlers
    window.downloadVaultDoc = function(id) {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;
        
        // Generate mock data URI file download
        const element = document.createElement('a');
        const fileContent = `National E-Governance Security Document\nName: ${doc.name}\nSize: ${doc.size}\nHash: SHA-256 Mocked Hash ${Date.now()}`;
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
        element.setAttribute('download', doc.name);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        // Increment downloaded certificates count
        let count = parseInt(localStorage.getItem('egov-downloaded-certs-count')) || 5;
        count++;
        localStorage.setItem('egov-downloaded-certs-count', count);

        // Refresh stats
        renderOverviewTab();
        
        addNotification(`Certificate "${doc.name}" downloaded successfully.`, 'success');
    };

    window.shareVaultDoc = function(id) {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;
        
        const shareLink = `https://egov.gov.in/share/credentials/${doc.id}-${Math.floor(Math.random() * 900000 + 100000)}`;
        
        navigator.clipboard.writeText(shareLink).then(() => {
            addNotification(`Sharing link copied to clipboard: ${doc.name}`, 'success');
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
            addNotification(`Mock Share Link: ${shareLink}`, 'info');
        });
    };

    let verifyTimer = null;
    window.verifyVaultDoc = function(id) {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;

        const modal = document.getElementById('documentVerifyModal');
        if (!modal) return;

        document.getElementById('verifyModalDocName').innerText = `${doc.name} (${doc.size})`;
        
        // Reset verify modal status
        const scanBox = document.getElementById('verifyScanBox');
        const scanIcon = document.getElementById('verifyScanIcon');
        const logsBox = document.getElementById('verifyLogsBox');
        
        scanBox.classList.remove('scanning');
        scanIcon.className = 'ph ph-file-text verify-scan-doc';
        scanIcon.style.color = '';
        
        logsBox.innerHTML = `<div class="audit-log-line info">> Awaiting cryptographic verification request...</div>`;
        
        // Setup trigger button click
        const triggerBtn = document.getElementById('verifyTriggerBtn');
        triggerBtn.style.display = 'block';
        triggerBtn.onclick = () => {
            triggerBtn.style.display = 'none';
            runCryptographicVerification(doc, scanBox, scanIcon, logsBox);
        };

        modal.classList.add('open');
    };

    function runCryptographicVerification(doc, scanBox, scanIcon, logsBox) {
        scanBox.classList.add('scanning');
        logsBox.innerHTML = `<div class="audit-log-line info">> Connecting to National E-Sign verification node...</div>`;
        
        let logs = [
            `> Initializing SHA-256 hash checksum calculation...`,
            `> Fetching signature registry records for ${doc.name}...`,
            `> Validating E-Governance root certificate keys...`,
            `> Checking decentralized blockchain registry consensus...`,
            `> Cryptographic match found: VALID SIGNATURE`
        ];

        let index = 0;
        if (verifyTimer) clearInterval(verifyTimer);

        verifyTimer = setInterval(() => {
            if (index < logs.length) {
                const isLast = index === logs.length - 1;
                const logClass = isLast ? 'success' : 'info';
                logsBox.innerHTML += `<div class="audit-log-line ${logClass}">${logs[index]}</div>`;
                logsBox.scrollTop = logsBox.scrollHeight;
                index++;
            } else {
                clearInterval(verifyTimer);
                scanBox.classList.remove('scanning');
                scanIcon.className = 'ph-fill ph-shield-check verify-scan-doc';
                addNotification(`Document "${doc.name}" cryptographically verified!`, 'success');
            }
        }, 500);
    }

    // Modal Close Action
    const closeVerifyBtn = document.getElementById('closeVerifyBtn');
    if (closeVerifyBtn) {
        closeVerifyBtn.addEventListener('click', () => {
            if (verifyTimer) clearInterval(verifyTimer);
            document.getElementById('documentVerifyModal').classList.remove('open');
        });
    }
    
    const documentVerifyModal = document.getElementById('documentVerifyModal');
    if (documentVerifyModal) {
        documentVerifyModal.addEventListener('click', (e) => {
            if (e.target === documentVerifyModal) {
                if (verifyTimer) clearInterval(verifyTimer);
                documentVerifyModal.classList.remove('open');
            }
        });
    }

    window.previewVaultDoc = function(id) {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;
        const modal = document.getElementById('filePreviewModal');
        document.getElementById('previewTitle').innerText = doc.name;
        document.getElementById('previewInfo').innerText = `Secure Verified ${doc.type.toUpperCase()} Locker Document`;
        
        const previewBody = document.getElementById('previewBody');
        if (doc.type === 'image') {
            previewBody.innerHTML = `<img src="governance_hero.png" class="file-preview-image" alt="Doc Preview">`;
        } else {
            previewBody.innerHTML = `
                <div class="file-preview-doc-box">
                    <i class="ph-fill ph-file-pdf" style="font-size: 4rem; color: var(--danger-color);"></i>
                    <p style="font-weight: 600; margin: 1rem 0 0 0;">Standard Government Digital Document</p>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">Cryptographically verified by E-Sign India authority. Ready for verification check.</p>
                </div>
            `;
        }
        modal.classList.add('open');
    };

    window.deleteVaultDoc = function(id) {
        documents = documents.filter(d => d.id !== id);
        saveState();
        renderVaultTab();
        renderOverviewTab();
        addNotification('Document removed from vault locker.', 'info');
    };

    const closePreviewBtn = document.getElementById('closePreviewBtn');
    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', () => {
            document.getElementById('filePreviewModal').classList.remove('open');
        });
    }

    const filePreviewModal = document.getElementById('filePreviewModal');
    if (filePreviewModal) {
        filePreviewModal.addEventListener('click', (e) => {
            if (e.target === filePreviewModal) {
                filePreviewModal.classList.remove('open');
            }
        });
    }

    const vaultDropzone = document.getElementById('vaultDropzone');
    const vaultFileInput = document.getElementById('vaultFileInput');
    const progressContainer = document.getElementById('vaultUploadProgress');
    const progressBar = document.getElementById('vaultProgressBarInner');
    const progressPct = document.getElementById('uploadProgressPct');
    const progressFileName = document.getElementById('uploadFileName');

    if (vaultDropzone && vaultFileInput) {
        vaultDropzone.addEventListener('click', () => {
            vaultFileInput.click();
        });

        vaultFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            simulateFileUpload(file);
        });
    }

    function simulateFileUpload(file) {
        progressFileName.innerText = file.name;
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressPct.innerText = '0%';

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = `${progress}%`;
            progressPct.innerText = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    progressContainer.classList.add('hidden');
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                    const sizeStr = sizeMB > 0.1 ? `${sizeMB} MB` : `${(file.size / 1024).toFixed(0)} KB`;
                    const fileType = file.name.endsWith('.pdf') ? 'pdf' : 'image';
                    
                    documents.push({
                        id: 'doc-' + Date.now(),
                        name: file.name,
                        size: sizeStr,
                        type: fileType,
                        url: '#'
                    });
                    saveState();
                    renderVaultTab();
                    renderOverviewTab();
                    addNotification(`File "${file.name}" uploaded successfully to vault!`, 'success');
                }, 400);
            }
        }, 150);
    }

    // --- Profile Save updates ---
    const profileUpdateForm = document.getElementById('profileUpdateForm');
    if (profileUpdateForm) {
        profileUpdateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = document.getElementById('profName').value;
            if (currentUser) {
                currentUser.displayName = newName;
                document.getElementById('sidebarUserName').innerText = newName;
                document.getElementById('profileIdentityName').innerText = newName;
                document.querySelector('.user-profile-trigger span').innerText = newName;
                document.querySelector('.dropdown-user-info .user-name').innerText = newName;
                addNotification('Profile data saved successfully.', 'success');
            }
        });
    }

    function renderProfileTab() {
        if (!currentUser) return;
        document.getElementById('profName').value = currentUser.displayName || currentUser.email.split('@')[0];
        document.getElementById('profileIdentityName').innerText = currentUser.displayName || currentUser.email.split('@')[0];
        document.getElementById('profileIdentityEmail').innerText = currentUser.email;
        document.getElementById('profileAvatarBig').innerText = (currentUser.displayName || 'U')[0].toUpperCase();
    }

    // --- Multi-Step wizard form handling ---
    const applyButtons = document.querySelectorAll('.apply-service-btn');
    const catalogView = document.getElementById('servicesCatalogView');
    const wizardView = document.getElementById('serviceFormWizardView');
    const cancelWizardBtn = document.getElementById('cancelWizardBtn');
    const prevBtn = document.getElementById('prevStepBtn');
    const nextBtn = document.getElementById('nextStepBtn');
    const submitBtn = document.getElementById('submitAppBtn');
    const wizardForm = document.getElementById('serviceApplicationForm');
    const appliedServiceInput = document.getElementById('appliedServiceType');
    const wizardTitle = document.getElementById('wizardFormTitle');
    const specificFieldsContainer = document.getElementById('serviceSpecificFields');
    
    let currentWizardStep = 1;

    applyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const service = btn.getAttribute('data-service');
            openWizard(service);
        });
    });

    if (cancelWizardBtn) {
        cancelWizardBtn.addEventListener('click', () => {
            closeWizard();
        });
    }

    function openWizard(service) {
        catalogView.classList.add('hidden');
        wizardView.classList.remove('hidden');
        appliedServiceInput.value = service;
        currentWizardStep = 1;
        wizardSelectedFiles = [];
        prefillStep1();
        
        // Populate Wizard Specific Details
        if (service === 'birth') {
            wizardTitle.innerText = 'Application for Birth Certificate';
            specificFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label for="birthPlace">Hospital / Place of Birth</label>
                    <input type="text" id="birthPlace" required placeholder="City Hospital, Bhopal">
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label for="birthMother">Mother's Full Name</label>
                    <input type="text" id="birthMother" required placeholder="Sunita Sharma">
                </div>
            `;
        } else if (service === 'license') {
            wizardTitle.innerText = 'Application for Driving License';
            specificFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label for="licenseClass">Vehicle Category Class</label>
                    <select id="licenseClass" required>
                        <option value="">Select Category</option>
                        <option value="MCWG">Motorcycle with Gear (MCWG)</option>
                        <option value="LMV">Light Motor Vehicle (LMV - Car)</option>
                        <option value="Both">Both MCWG & LMV</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label for="rtoLocation">RTO Regional Office Location</label>
                    <input type="text" id="rtoLocation" required placeholder="MP-04 Bhopal RTO">
                </div>
            `;
        } else if (service === 'passport') {
            wizardTitle.innerText = 'Application for Fresh Passport';
            specificFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label for="passportEmployment">Employment Type</label>
                    <select id="passportEmployment" required>
                        <option value="private">Private Sector</option>
                        <option value="government">Government Service</option>
                        <option value="student">Student</option>
                        <option value="self">Self Employed</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label for="passportSize">Booklet Size Pages</label>
                    <select id="passportSize" required>
                        <option value="36">36 Pages (Standard)</option>
                        <option value="60">60 Pages (Jumbo)</option>
                    </select>
                </div>
            `;
        }

        renderVaultTab();
        updateWizardStepDisplay();
    }

    function closeWizard() {
        catalogView.classList.remove('hidden');
        wizardView.classList.add('hidden');
        wizardForm.reset();
        wizardSelectedFiles = [];
        currentWizardStep = 1;
        updateWizardStepDisplay();
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const activeStepEl = document.querySelector(`.form-step[data-step="${currentWizardStep}"]`);
            const inputs = activeStepEl.querySelectorAll('input, select, textarea');
            let valid = true;
            inputs.forEach(input => {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    valid = false;
                }
            });

            if (!valid) return;

            if (currentWizardStep === 3) {
                if (wizardSelectedFiles.length === 0) {
                    alert("Please upload at least one supporting document before proceeding.");
                    return;
                }
            }

            if (currentWizardStep < 4) {
                currentWizardStep++;
                updateWizardStepDisplay();
                saveActiveDraft();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentWizardStep > 1) {
                currentWizardStep--;
                updateWizardStepDisplay();
                saveActiveDraft();
            }
        });
    }

    function updateWizardStepDisplay() {
        document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
        const activeStep = document.querySelector(`.form-step[data-step="${currentWizardStep}"]`);
        if (activeStep) activeStep.classList.add('active');

        document.querySelectorAll('.step-indicator-node').forEach(node => {
            const stepNum = parseInt(node.getAttribute('data-step'));
            node.classList.remove('active', 'completed');
            if (stepNum === currentWizardStep) {
                node.classList.add('active');
            } else if (stepNum < currentWizardStep) {
                node.classList.add('completed');
            }
        });

        const wizardActions = document.getElementById('wizardActions');
        const cancelWizardBtn = document.getElementById('cancelWizardBtn');

        if (currentWizardStep === 5) {
            if (wizardActions) wizardActions.classList.add('hidden');
            if (cancelWizardBtn) cancelWizardBtn.classList.add('hidden');
        } else {
            if (wizardActions) wizardActions.classList.remove('hidden');
            if (cancelWizardBtn) cancelWizardBtn.classList.remove('hidden');

            prevBtn.disabled = currentWizardStep === 1;

            if (currentWizardStep === 4) {
                nextBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
                renderStep4Review();
            } else {
                nextBtn.classList.remove('hidden');
                submitBtn.classList.add('hidden');
            }
        }
    }

    if (wizardForm) {
        wizardForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const reviewPassed = renderStep4Review();
            if (!reviewPassed) {
                alert("Please correct missing or invalid fields in Step 4 before submitting.");
                return;
            }

            const serviceType = appliedServiceInput.value;
            const fullName = document.getElementById('appFullName').value;

            const tokenId = `EGOV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
            const serviceNames = { birth: 'Birth Certificate', license: 'Driving License', passport: 'Passport Issuance' };
            const sName = serviceNames[serviceType] || 'Service Application';
            const todayStr = new Date().toISOString().split('T')[0];
            const uniqueHash = btoa(tokenId + fullName).slice(0, 10).toLowerCase();

            const newApp = {
                id: tokenId,
                name: sName,
                applicant: fullName,
                date: todayStr,
                status: 'Submitted',
                step: 1,
                remarks: 'Application filed online. Supporting credentials attached.'
            };

            applications.unshift(newApp);

            wizardSelectedFiles.forEach(file => {
                const docId = 'vault-proof-' + Math.floor(100000 + Math.random() * 900000);
                documents.unshift({
                    id: docId,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: '#'
                });
            });

            saveState();

            document.getElementById('receiptTokenId').innerText = tokenId;
            document.getElementById('receiptServiceName').innerText = sName;
            document.getElementById('receiptApplicantName').innerText = fullName;
            document.getElementById('receiptDate').innerText = todayStr;
            document.getElementById('receiptHash').innerText = uniqueHash;

            localStorage.removeItem('egov-app-active-draft');
            wizardSelectedFiles = [];

            addNotification(`Successfully submitted application for ${sName}. ID: ${tokenId}`, 'success');

            currentWizardStep = 5;
            updateWizardStepDisplay();

            renderOverviewTab();
            renderVaultTab();
            renderMyApplicationsTab();
        });
    }

    // --- Grievance Center Management ---
    function renderGrievancesTab() {
        const tableBody = document.getElementById('dbGrievanceTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (grievances.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No grievances filed.</td></tr>`;
            return;
        }

        grievances.forEach(g => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${g.id}</strong></td>
                <td>
                    <div style="font-weight:600;">${g.subject}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary);">${g.dept}</div>
                </td>
                <td>${g.date}</td>
                <td><span class="status-badge-pill progress">${g.status}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="viewGrievanceHistory('${g.id}')">
                        Track File
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    const btnGrievanceList = document.getElementById('btnGrievanceList');
    const btnGrievanceNew = document.getElementById('btnGrievanceNew');
    const grievanceListView = document.getElementById('grievanceListView');
    const grievanceNewView = document.getElementById('grievanceNewView');
    const dbGrievanceForm = document.getElementById('dbGrievanceForm');
    const btnCancelGrievance = document.getElementById('btnCancelGrievance');

    if (btnGrievanceList && btnGrievanceNew) {
        btnGrievanceList.addEventListener('click', () => {
            btnGrievanceList.classList.add('active');
            btnGrievanceNew.classList.remove('active');
            grievanceListView.classList.remove('hidden');
            grievanceNewView.classList.add('hidden');
        });

        btnGrievanceNew.addEventListener('click', () => {
            btnGrievanceNew.classList.add('active');
            btnGrievanceList.classList.remove('active');
            grievanceNewView.classList.remove('hidden');
            grievanceListView.classList.add('hidden');
            
            // prefill name
            if (currentUser) {
                document.getElementById('dg-name').value = currentUser.displayName || currentUser.email.split('@')[0];
            }
            renderVaultTab();
        });
    }

    if (btnCancelGrievance) {
        btnCancelGrievance.addEventListener('click', () => {
            btnGrievanceList.click();
            dbGrievanceForm.reset();
        });
    }

    if (dbGrievanceForm) {
        dbGrievanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const subject = document.getElementById('dg-subject').value;
            const dept = document.getElementById('dg-dept').value;
            const complaint = document.getElementById('dg-complaint').value;
            const token = `GRv-MP-${Math.floor(100000 + Math.random() * 900000)}`;

            const newGrievance = {
                id: token,
                subject: subject,
                dept: dept,
                date: new Date().toISOString().split('T')[0],
                status: 'In Progress',
                remarks: `Grievance registered. Assigned to Madhya Pradesh cell. Description: ${complaint}`
            };

            grievances.unshift(newGrievance);
            saveState();

            addNotification(`Grievance complaint filed. Tracking token: ${token}`, 'warning');
            
            btnGrievanceList.click();
            dbGrievanceForm.reset();
            renderGrievancesTab();
            renderOverviewTab();
        });
    }

    window.viewGrievanceHistory = function(id) {
        const g = grievances.find(item => item.id === id);
        if (!g) return;
        alert(`Grievance Track Log [${g.id}]\n\nStatus: ${g.status}\nFiling Date: ${g.date}\nLatest Remarks: ${g.remarks}`);
    };

    // --- Schemes Recommendations ---
    function renderRecommendedSchemes() {
        const schemesContainer = document.getElementById('recommendedSchemesContainer');
        if (!schemesContainer) return;
        schemesContainer.innerHTML = '';

        adminSchemes.forEach(sch => {
            const card = document.createElement('div');
            card.className = 'service-apply-card glass-panel';
            const stateVal = sch.stateCode || '';
            card.innerHTML = `
                <div class="scheme-badge" style="background: rgba(245, 158, 11, 0.1); color: var(--accent-color); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; align-self: flex-start;">${sch.badge || sch.category}</div>
                <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0;">${sch.title}</h3>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin:0 0 0.5rem 0;">${sch.desc}</p>
                <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-solid); padding-top: 0.5rem; margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <span><strong>Eligibility:</strong> ${sch.eligibility}</span>
                    <button class="btn btn-primary btn-sm" onclick="applyForScheme('${sch.title.replace(/'/g, "\\'")}', '${stateVal}')" style="padding: 0.25rem 0.50rem; font-size: 0.75rem;">Apply Now</button>
                </div>
            `;
            schemesContainer.appendChild(card);
        });
    }

    // --- Admin Panel Operations ---
    function hasPermission(role, action) {
        if (role === 'super-admin') return true;

        switch (action) {
            case 'view-overview':
                return true;
            case 'view-review':
                return role !== 'helpdesk-operator';
            case 'view-departments':
                return false; 
            case 'view-schemes':
                return role === 'central-officer';
            case 'view-complaints':
                return role === 'helpdesk-operator';
            case 'view-analytics':
                return ['central-officer', 'state-officer'].includes(role);
            case 'view-alerts':
                return ['central-officer', 'state-officer'].includes(role);
            case 'view-audit':
                return false; 
            
            case 'verify-docs': 
                return ['district-officer'].includes(role);
            case 'desk-review': 
                return ['dept-officer'].includes(role);
            case 'final-approve': 
                return ['central-officer', 'state-officer'].includes(role);
            case 'reject-app':
                return ['central-officer', 'state-officer'].includes(role);
            
            case 'manage-departments':
                return false;
            case 'manage-schemes':
                return role === 'central-officer';
            case 'manage-complaints':
                return role === 'helpdesk-operator';
            case 'send-alerts':
                return ['central-officer', 'state-officer'].includes(role);
            
            default:
                return false;
        }
    }

    function applyRolePermissions(role) {
        const subNavButtons = document.querySelectorAll('.admin-sub-nav .admin-sub-btn');
        const allowedTabsMap = {
            'super-admin': ['admin-overview', 'admin-review', 'admin-departments', 'admin-schemes', 'admin-complaints', 'admin-analytics', 'admin-notifications', 'admin-audit', 'admin-sessions', 'admin-manage-admins'],
            'central-officer': ['admin-overview', 'admin-review', 'admin-schemes', 'admin-analytics', 'admin-notifications'],
            'state-officer': ['admin-overview', 'admin-review', 'admin-analytics', 'admin-notifications'],
            'district-officer': ['admin-overview', 'admin-review'],
            'dept-officer': ['admin-overview', 'admin-review'],
            'helpdesk-operator': ['admin-overview', 'admin-complaints']
        };
        const allowedTabs = allowedTabsMap[role] || allowedTabsMap['super-admin'];

        subNavButtons.forEach(btn => {
            const subtab = btn.getAttribute('data-subtab');
            if (allowedTabs.includes(subtab)) {
                btn.style.display = '';
            } else {
                btn.style.display = 'none';
            }
        });

        const activeBtn = document.querySelector('.admin-sub-nav .admin-sub-btn.active');
        if (activeBtn && activeBtn.style.display === 'none') {
            const firstAllowedBtn = Array.from(subNavButtons).find(btn => btn.style.display !== 'none');
            if (firstAllowedBtn) {
                firstAllowedBtn.click();
            }
        }
    }

    function saveAdminState() {
        localStorage.setItem('egov-departments', JSON.stringify(adminDepartments));
        localStorage.setItem('egov-schemes', JSON.stringify(adminSchemes));
        localStorage.setItem('egov-audit-logs', JSON.stringify(adminAuditLogs));
    }

    function logSystemEvent(area, details) {
        const user = currentUser ? currentUser.email : 'System';
        const timestamp = new Date().toLocaleString('en-US', { hour12: true });
        const ip = '192.168.1.104'; 
        
        adminAuditLogs.unshift({ timestamp, user, area, details, ip });
        localStorage.setItem('egov-audit-logs', JSON.stringify(adminAuditLogs));
        
        renderAdminAuditLogs();
        renderRecentEventsSummary();
    }

    function recordCitizenSession(user) {
        const allowedOfficerEmails = [
            'admin@gov.in',
            'super.admin@gov.in',
            'central.officer@gov.in',
            'state.officer@gov.in',
            'district.officer@gov.in',
            'dept.officer@gov.in',
            'helpdesk@gov.in'
        ];
        if (allowedOfficerEmails.includes(user.email)) {
            return;
        }

        const session = {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            timestamp: new Date().toISOString(),
            ip: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
            status: 'Active'
        };

        let sessions = JSON.parse(localStorage.getItem('egov-citizen-sessions')) || [];
        const isRecent = sessions.some(s => s.email === session.email && (Date.now() - new Date(s.timestamp).getTime() < 60000));
        if (!isRecent) {
            sessions.unshift(session);
            if (sessions.length > 100) {
                sessions = sessions.slice(0, 100);
            }
            localStorage.setItem('egov-citizen-sessions', JSON.stringify(sessions));
        }

        if (firebaseDb) {
            try {
                const sessionId = 'session-' + Date.now();
                setDoc(doc(firebaseDb, "sessions", sessionId), session)
                    .then(() => console.log("Session saved in Firestore"))
                    .catch(err => console.error("Error saving session in Firestore:", err));
            } catch (e) {
                console.error("Failed to save Firestore session:", e);
            }
        }
    }

    function renderCitizenSessions() {
        const listBody = document.getElementById('adminSessionsTableBody');
        if (!listBody) return;
        listBody.innerHTML = '';

        if (firebaseDb) {
            const sessionsRef = collection(firebaseDb, "sessions");
            getDocs(sessionsRef).then((querySnapshot) => {
                let sessions = [];
                querySnapshot.forEach((doc) => {
                    sessions.push(doc.data());
                });
                sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                displaySessions(sessions);
            }).catch((err) => {
                console.error("Error getting sessions from Firestore:", err);
                const sessions = JSON.parse(localStorage.getItem('egov-citizen-sessions')) || [];
                displaySessions(sessions);
            });
        } else {
            const sessions = JSON.parse(localStorage.getItem('egov-citizen-sessions')) || [];
            displaySessions(sessions);
        }

        function displaySessions(sessions) {
            const activeCitizensCount = sessions.filter(s => s.status === 'Active').length;

            const activeStatLabel = document.getElementById('statAdminActiveCitizens');
            if (activeStatLabel) activeStatLabel.innerText = activeCitizensCount;

            const badgeCount = document.getElementById('badgeActiveSessions');
            if (badgeCount) badgeCount.innerText = activeCitizensCount;

            if (sessions.length === 0) {
                listBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">No active citizen sessions found.</td></tr>`;
                return;
            }

            sessions.forEach(s => {
                const dateStr = new Date(s.timestamp).toLocaleString();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${s.name}</strong></td>
                    <td>${s.email}</td>
                    <td>${dateStr}</td>
                    <td>${s.ip}</td>
                    <td><span class="badge-status approved">Active</span></td>
                `;
                listBody.appendChild(row);
            });
        }
    }

    function renderSubtabData(subtabId) {
        if (subtabId === 'admin-overview') renderAdminOverview();
        else if (subtabId === 'admin-review') renderAdminReviewQueue();
        else if (subtabId === 'admin-departments') renderAdminDepts();
        else if (subtabId === 'admin-schemes') renderAdminSchemes();
        else if (subtabId === 'admin-complaints') renderAdminComplaints();
        else if (subtabId === 'admin-analytics') renderAdminAnalytics();
        else if (subtabId === 'admin-audit') renderAdminAuditLogs();
        else if (subtabId === 'admin-sessions') renderCitizenSessions();
        else if (subtabId === 'admin-manage-admins') renderManageAdminsSubtab();
    }

    function renderAdminOverview() {
        const totalCitizens = 1248; 
        const activeCount = applications.filter(a => ['Submitted', 'Form Submitted', 'Under Review', 'In Progress', 'Pending Documents'].includes(a.status)).length;
        const approvedCount = applications.filter(a => a.status === 'Approved').length;
        const rejectedCount = applications.filter(a => a.status === 'Rejected').length;
        const certCount = approvedCount; 
        
        let pendingReviewCount = 0;
        applications.forEach(a => {
            if (a.status === 'Submitted' || a.status === 'Form Submitted') {
                if (currentAdminRole === 'district-officer' || currentAdminRole === 'super-admin') pendingReviewCount++;
            } else if (a.status === 'Under Review') {
                if (currentAdminRole === 'dept-officer' || currentAdminRole === 'super-admin') pendingReviewCount++;
            } else if (a.status === 'In Progress') {
                if (currentAdminRole === 'super-admin') pendingReviewCount++;
                else if (currentAdminRole === 'state-officer' && (a.name.includes('License') || a.name.includes('Birth'))) pendingReviewCount++;
                else if (currentAdminRole === 'central-officer' && a.name.includes('Passport')) pendingReviewCount++;
            }
        });

        if (document.getElementById('statAdminCitizens')) document.getElementById('statAdminCitizens').innerText = totalCitizens.toLocaleString();
        if (document.getElementById('statAdminActive')) document.getElementById('statAdminActive').innerText = activeCount;
        if (document.getElementById('statAdminApproved')) document.getElementById('statAdminApproved').innerText = approvedCount;
        if (document.getElementById('statAdminRejected')) document.getElementById('statAdminRejected').innerText = rejectedCount;
        if (document.getElementById('statAdminPending')) document.getElementById('statAdminPending').innerText = pendingReviewCount;
        if (document.getElementById('statAdminCerts')) document.getElementById('statAdminCerts').innerText = certCount;

        // Update active citizens count
        let sessions = JSON.parse(localStorage.getItem('egov-citizen-sessions')) || [];
        const activeCitizensCount = sessions.filter(s => s.status === 'Active').length;
        if (document.getElementById('statAdminActiveCitizens')) {
            document.getElementById('statAdminActiveCitizens').innerText = activeCitizensCount;
        }
        if (document.getElementById('badgeActiveSessions')) {
            document.getElementById('badgeActiveSessions').innerText = activeCitizensCount;
        }
        
        if (!window.adminSessionTimer) {
            let timeLeft = 30 * 60; 
            const timerLabel = document.getElementById('adminSessionTimeoutVal');
            window.adminSessionTimer = setInterval(() => {
                if (!document.getElementById('tab-admin').classList.contains('active')) return;
                timeLeft--;
                if (timeLeft <= 0) {
                    clearInterval(window.adminSessionTimer);
                    window.adminSessionTimer = null;
                    signOutUser();
                } else {
                    const mins = Math.floor(timeLeft / 60);
                    const secs = timeLeft % 60;
                    if (timerLabel) {
                        timerLabel.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs} Minutes (Auto Logout enabled)`;
                    }
                }
            }, 1000);
        }

        const failedCount = localStorage.getItem('egov-failed-logins') || 0;
        if (document.getElementById('adminFailedLoginsCount')) {
            document.getElementById('adminFailedLoginsCount').innerText = `${failedCount} Alerts`;
        }

        renderRecentEventsSummary();
        
        const badgePendingReview = document.getElementById('badgePendingReview');
        if (badgePendingReview) badgePendingReview.innerText = pendingReviewCount;
        
        const activeComplaintsCount = grievances.filter(g => g.status === 'In Progress' || g.status === 'Escalated').length;
        const badgePendingComplaints = document.getElementById('badgePendingComplaints');
        if (badgePendingComplaints) badgePendingComplaints.innerText = activeComplaintsCount;
    }

    function renderRecentEventsSummary() {
        const eventsList = document.getElementById('adminRecentEventsList');
        if (!eventsList) return;
        eventsList.innerHTML = '';
        
        const recent = adminAuditLogs.slice(0, 5);
        if (recent.length === 0) {
            eventsList.innerHTML = `<span style="color:var(--text-muted)">No recent events.</span>`;
            return;
        }

        recent.forEach(log => {
            const item = document.createElement('div');
            item.style.borderBottom = '1px solid var(--border-solid)';
            item.style.paddingBottom = '0.35rem';
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:0.15rem;">
                    <strong>${log.area}</strong>
                    <span style="color:var(--text-muted); font-size:0.7rem;">${log.timestamp.split(', ')[1] || ''}</span>
                </div>
                <div style="color:var(--text-secondary); line-height: 1.2;">${log.details} (${log.user})</div>
            `;
            eventsList.appendChild(item);
        });
    }

    window.renderAdminReviewQueue = function() {
        const queueBody = document.getElementById('adminReviewListQueue');
        if (!queueBody) return;
        queueBody.innerHTML = '';

        const searchQuery = document.getElementById('adminReviewSearch') ? document.getElementById('adminReviewSearch').value.toLowerCase().trim() : '';
        const statusFilter = document.getElementById('adminReviewFilterStatus') ? document.getElementById('adminReviewFilterStatus').value : 'all';

        let filtered = applications.filter(a => {
            const matchesSearch = a.id.toLowerCase().includes(searchQuery) || a.applicant.toLowerCase().includes(searchQuery);
            let matchesStatus = true;
            if (statusFilter !== 'all') {
                if (statusFilter === 'Submitted') {
                    matchesStatus = a.status === 'Submitted' || a.status === 'Form Submitted';
                } else {
                    matchesStatus = a.status === statusFilter;
                }
            } else {
                matchesStatus = ['Submitted', 'Form Submitted', 'Under Review', 'In Progress', 'Pending Documents'].includes(a.status);
            }

            // Location Filters (State and District)
            let matchesLocation = true;
            const stateFilter = document.getElementById('adminStateSelect') ? document.getElementById('adminStateSelect').value : 'All';
            const districtFilter = document.getElementById('adminDistrictSelect') ? document.getElementById('adminDistrictSelect').value : 'All';

            if (stateFilter !== 'All') {
                const appState = a.details && a.details.state ? a.details.state : '';
                const filterStateName = STATE_NAMES[stateFilter];
                matchesLocation = (appState === filterStateName);
            }
            if (matchesLocation && districtFilter !== 'All') {
                const appDistrict = a.details && a.details.district ? a.details.district : '';
                matchesLocation = (appDistrict === districtFilter);
            }

            return matchesSearch && matchesStatus && matchesLocation;
        });

        if (filtered.length === 0) {
            queueBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">No pending files in review queue.</td></tr>`;
            return;
        }

        filtered.forEach(app => {
            let badgeClass = 'submitted';
            if (app.status === 'Approved') badgeClass = 'approved';
            else if (app.status === 'Rejected') badgeClass = 'rejected';
            else if (app.status === 'Under Review' || app.status === 'In Progress' || app.status === 'Form Submitted') badgeClass = 'inreview';
            else if (app.status === 'Pending Documents' || app.status === 'Clarification Required') badgeClass = 'rejected';

            let dept = 'Identity & Civil';
            if (app.name.toLowerCase().includes('license') || app.name.toLowerCase().includes('driving')) dept = 'Transport';
            else if (app.name.toLowerCase().includes('tax') || app.name.toLowerCase().includes('finance')) dept = 'Finance & Revenue';
            else if (app.name.toLowerCase().includes('birth') || app.name.toLowerCase().includes('health')) dept = 'Health & Registrar';

            let canAct = false;
            if (app.status === 'Submitted' || app.status === 'Form Submitted') {
                canAct = hasPermission(currentAdminRole, 'verify-docs');
            } else if (app.status === 'Under Review') {
                canAct = hasPermission(currentAdminRole, 'desk-review');
            } else if (app.status === 'In Progress') {
                canAct = hasPermission(currentAdminRole, 'final-approve');
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${app.id}</strong></td>
                <td>${app.applicant}</td>
                <td>${app.name}</td>
                <td>${dept}</td>
                <td>${app.date}</td>
                <td><span class="badge-status ${badgeClass}">${app.status}</span></td>
                <td>
                    <button class="btn ${canAct ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="openAdminAppDetailModal('${app.id}')">
                        <i class="ph ${canAct ? 'ph-gear-six' : 'ph-eye'}"></i> ${canAct ? 'Process' : 'View'}
                    </button>
                </td>
            `;
            queueBody.appendChild(row);
        });
    };

    let activeDetailAppId = null;
    let documentVerificationStatus = {}; 

    window.openAdminAppDetailModal = function(appId) {
        const app = applications.find(a => a.id === appId);
        if (!app) return;
        activeDetailAppId = appId;
        documentVerificationStatus = {}; 

        const modal = document.getElementById('adminAppDetailModal');
        if (!modal) return;

        modal.classList.remove('hidden');
        document.getElementById('adminModalAppMeta').innerText = `ID: ${app.id} | Stage status: ${app.status} | Submitted: ${app.date}`;
        document.getElementById('adminModalRemarks').value = app.remarks || '';

        const applicantTable = document.getElementById('adminModalApplicantTable');
        applicantTable.innerHTML = `
            <tr><td class="label-col">Full Name:</td><td class="value-col">${app.applicant}</td></tr>
            <tr><td class="label-col">Mobile Number:</td><td class="value-col">+91 98765 43210</td></tr>
            <tr><td class="label-col">Email Address:</td><td class="value-col">citizen@egov.gov.in</td></tr>
            <tr><td class="label-col">Aadhaar Card:</td><td class="value-col">XXXX-XXXX-8412</td></tr>
            <tr><td class="label-col">Permanent Address:</td><td class="value-col">45, Arera Colony, Near Shalimar Lake, Bhopal, MP</td></tr>
        `;

        const serviceTable = document.getElementById('adminModalServiceTable');
        let detailsHtml = '';
        if (app.name.toLowerCase().includes('birth')) {
            detailsHtml = `
                <tr><td class="label-col">Hospital/Place of Birth:</td><td class="value-col">Mother & Child Care Hospital, Bhopal</td></tr>
                <tr><td class="label-col">Mother's Full Name:</td><td class="value-col">Smt. Radha Sharma</td></tr>
                <tr><td class="label-col">Father's Full Name:</td><td class="value-col">Shri Ramesh Sharma</td></tr>
            `;
        } else if (app.name.toLowerCase().includes('license') || app.name.toLowerCase().includes('driving')) {
            detailsHtml = `
                <tr><td class="label-col">Vehicle Class:</td><td class="value-col">MCWG & LMV (Light Motor Vehicle)</td></tr>
                <tr><td class="label-col">RTO Office Location:</td><td class="value-col">RTO Bhopal (MP-04)</td></tr>
                <tr><td class="label-col">Blood Group:</td><td class="value-col">O Positive</td></tr>
            `;
        } else if (app.name.toLowerCase().includes('passport')) {
            detailsHtml = `
                <tr><td class="label-col">Employment Type:</td><td class="value-col">Private Sector Service</td></tr>
                <tr><td class="label-col">Booklet Size:</td><td class="value-col">36 Pages (Standard)</td></tr>
                <tr><td class="label-col">ECR Status:</td><td class="value-col">Non-ECR Required</td></tr>
            `;
        } else {
            detailsHtml = `
                <tr><td class="label-col">Registry Service:</td><td class="value-col">${app.name}</td></tr>
                <tr><td class="label-col">Regional Authority:</td><td class="value-col">Central Registry Office</td></tr>
            `;
        }
        serviceTable.innerHTML = detailsHtml;

        const docChecklist = document.getElementById('adminModalDocChecklist');
        docChecklist.innerHTML = '';

        const mockDocs = [
            { id: 'doc-aadhaar', name: 'Aadhaar Card Copy.pdf', type: 'pdf' },
            { id: 'doc-address', name: 'Electricity Bill (Address Proof).png', type: 'image' },
            { id: 'doc-photo', name: 'Applicant Photograph.jpg', type: 'image' }
        ];

        mockDocs.forEach(d => {
            const item = document.createElement('div');
            item.className = 'doc-checklist-item';
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; width:100%;">
                    <span style="font-weight:600; font-size:0.85rem;"><i class="ph ph-file-text"></i> ${d.name}</span>
                    <button class="btn btn-outline btn-sm" style="padding:0.15rem 0.4rem; font-size:0.75rem;" onclick="zoomAdminDoc('${d.name}', '${d.type}')">
                        <i class="ph ph-magnifying-glass-plus"></i> View Zoom
                    </button>
                </div>
                <div class="checklist-options-group" style="display:flex; gap:0.5rem;">
                    <label class="check-opt verified" style="font-size:0.75rem; display:flex; align-items:center; gap:0.2rem; cursor:pointer;">
                        <input type="radio" name="check-${d.id}" value="verified" onchange="setDocCheck('${d.id}', 'verified')"> ✓ Verified
                    </label>
                    <label class="check-opt rejected" style="font-size:0.75rem; display:flex; align-items:center; gap:0.2rem; cursor:pointer; color:var(--danger-color)">
                        <input type="radio" name="check-${d.id}" value="rejected" onchange="setDocCheck('${d.id}', 'rejected')"> ✗ Reject
                    </label>
                    <label class="check-opt warning" style="font-size:0.75rem; display:flex; align-items:center; gap:0.2rem; cursor:pointer; color:var(--accent-color)">
                        <input type="radio" name="check-${d.id}" value="clarification" onchange="setDocCheck('${d.id}', 'clarification')"> ⚠ Clarify
                    </label>
                </div>
            `;
            docChecklist.appendChild(item);
            documentVerificationStatus[d.id] = 'pending'; 
        });

        const buttonsContainer = document.getElementById('adminModalActionButtons');
        buttonsContainer.innerHTML = '';

        let canAct = false;
        let actionHtml = '';

        if (app.status === 'Submitted' || app.status === 'Form Submitted') {
            if (hasPermission(currentAdminRole, 'verify-docs')) {
                canAct = true;
                actionHtml = `
                    <button class="btn btn-primary" onclick="processWorkflowStage('verify')"><i class="ph ph-check"></i> Verify & Forward</button>
                    <button class="btn btn-outline" onclick="processWorkflowStage('clarify')" style="border-color:var(--accent-color); color:var(--accent-color);"><i class="ph ph-warning"></i> Clarification</button>
                `;
            }
        } else if (app.status === 'Under Review') {
            if (hasPermission(currentAdminRole, 'desk-review')) {
                canAct = true;
                actionHtml = `
                    <button class="btn btn-primary" onclick="processWorkflowStage('desk-review')"><i class="ph ph-arrow-square-out"></i> Complete Desk Review</button>
                    <button class="btn btn-outline" onclick="processWorkflowStage('clarify')" style="border-color:var(--accent-color); color:var(--accent-color);"><i class="ph ph-warning"></i> Clarification</button>
                `;
            }
        } else if (app.status === 'In Progress') {
            const isDLOrBirth = app.name.includes('License') || app.name.includes('Birth');
            const isPassport = app.name.includes('Passport');

            let hasFinalApprovalPermission = false;
            if (currentAdminRole === 'super-admin') hasFinalApprovalPermission = true;
            else if (currentAdminRole === 'state-officer' && isDLOrBirth) hasFinalApprovalPermission = true;
            else if (currentAdminRole === 'central-officer' && isPassport) hasFinalApprovalPermission = true;

            if (hasFinalApprovalPermission) {
                canAct = true;
                actionHtml = `
                    <button class="btn btn-primary" onclick="processWorkflowStage('approve')" style="background-color:var(--success-color); border-color:var(--success-color);"><i class="ph ph-certificate"></i> Approve & Issue</button>
                    <button class="btn btn-outline" onclick="processWorkflowStage('reject')" style="border-color:var(--danger-color); color:var(--danger-color);"><i class="ph ph-x"></i> Reject File</button>
                    <button class="btn btn-outline" onclick="processWorkflowStage('clarify')" style="border-color:var(--accent-color); color:var(--accent-color);"><i class="ph ph-warning"></i> Clarification</button>
                `;
            }
        }

        if (!canAct) {
            buttonsContainer.innerHTML = `
                <div style="background:rgba(239, 68, 68, 0.08); border-left:4px solid var(--danger-color); padding:0.6rem; font-size:0.8rem; border-radius:4px; width:100%; color:var(--danger-color); font-weight:600;">
                    <i class="ph ph-lock-key"></i> View Only Mode: Active role (${currentAdminRole}) lacks authority for this stage (${app.status}).
                </div>
            `;
        } else {
            buttonsContainer.innerHTML = actionHtml;
        }
    };

    window.closeAdminAppDetailModal = function() {
        const modal = document.getElementById('adminAppDetailModal');
        if (modal) modal.classList.add('hidden');
        activeDetailAppId = null;
    };

    window.setDocCheck = function(docId, status) {
        documentVerificationStatus[docId] = status;
    };

    window.processWorkflowStage = function(action) {
        if (!activeDetailAppId) return;
        const app = applications.find(a => a.id === activeDetailAppId);
        if (!app) return;

        const remarksInput = document.getElementById('adminModalRemarks');
        const remarks = remarksInput ? remarksInput.value.trim() : '';

        let pendingCheckCount = 0;
        for (const [key, val] of Object.entries(documentVerificationStatus)) {
            if (val === 'pending') pendingCheckCount++;
        }
        if (pendingCheckCount > 0 && action === 'verify') {
            alert('Please review and check all uploaded documents first!');
            return;
        }

        if (action === 'verify') {
            app.status = 'Under Review';
            app.step = 2;
            app.remarks = remarks || 'Identity credentials verified. Forwarded to Department Desk for review.';
            logSystemEvent('Oversight Action', `Verified credentials & forwarded ${app.id} to Department Desk.`);
            addNotification(`Application ${app.id} documents verified. Sent to Dept.`, 'info');
        } else if (action === 'desk-review') {
            app.status = 'In Progress';
            app.step = 3;
            app.remarks = remarks || 'Department review completed. Sent to Senior Approving Authority for digital signature.';
            logSystemEvent('Oversight Action', `Completed Desk Review and forwarded ${app.id} to Senior Approval.`);
            addNotification(`Application ${app.id} Desk Review completed. Sent for Senior sign-off.`, 'info');
        } else if (action === 'approve') {
            app.status = 'Approved';
            app.step = 5;
            app.remarks = remarks || 'Final approval granted. Cryptographic digital certificate issued successfully.';
            
            const certId = 'cert-' + Date.now();
            documents.push({
                id: certId,
                name: `Issued_${app.name.replace(/ /g, '_')}_Certificate.pdf`,
                size: '1.2 MB',
                type: 'pdf',
                url: '#'
            });
            logSystemEvent('Oversight Action', `Approved and issued digital certificate for ${app.id}.`);
            addNotification(`Application ${app.id} approved! Digital certificate generated.`, 'success');
        } else if (action === 'reject') {
            if (!remarks) {
                alert('Please state the audit remarks detailing the reason for rejection.');
                return;
            }
            app.status = 'Rejected';
            app.step = 4;
            app.remarks = remarks;
            logSystemEvent('Oversight Action', `Rejected application ${app.id}. Reason: ${remarks}`);
            addNotification(`Application ${app.id} rejected. Reason: ${remarks}`, 'danger');
        } else if (action === 'clarify') {
            if (!remarks) {
                alert('Please state what clarifications or documents are required from the applicant.');
                return;
            }
            app.status = 'Pending Documents';
            app.step = 2; 
            app.remarks = `Clarification Required: ${remarks}`;
            logSystemEvent('Oversight Action', `Requested clarification for ${app.id}: ${remarks}`);
            addNotification(`Clarification requested for ${app.id}.`, 'warning');
        }

        saveState();
        closeAdminAppDetailModal();
        renderAdminOverview();
        renderAdminReviewQueue();
        renderOverviewTab();
        renderMyApplicationsTab();
        renderVaultTab();
    };

    window.zoomAdminDoc = function(docName, docType) {
        const modal = document.getElementById('adminDocZoomModal');
        if (!modal) return;

        modal.classList.remove('hidden');
        document.getElementById('adminDocZoomTitle').innerText = docName;

        const body = document.getElementById('adminDocZoomBody');
        body.innerHTML = '';

        if (docType === 'image' || docName.toLowerCase().endsWith('.png') || docName.toLowerCase().endsWith('.jpg') || docName.toLowerCase().endsWith('.jpeg')) {
            body.innerHTML = `
                <div style="text-align:center; padding:1.2rem; background:#fff; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); max-width:320px; color:#333;">
                    <div style="font-weight:700; border-bottom:2px solid var(--primary-color); padding-bottom:0.5rem; margin-bottom:0.5rem; color:#0f172a; text-transform:uppercase; font-size: 0.85rem;">
                        <i class="ph ph-bank" style="color:var(--primary-color);"></i> Government of India
                    </div>
                    <div style="display:flex; gap:0.75rem; align-items:center; text-align:left; margin-top: 0.8rem;">
                        <div style="background:#ddd; width:70px; height:85px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; color:#555;">
                            AS
                        </div>
                        <div style="font-size:0.7rem; line-height:1.4; color: #334155;">
                            <strong>Aarav Sharma</strong><br>
                            DOB: 15-08-1995<br>
                            Gender: Male<br>
                            Address: 45, Arera Colony, Bhopal, MP
                        </div>
                    </div>
                    <div style="margin-top:0.9rem; border-top:1px dashed #ccc; padding-top:0.4rem; font-family:monospace; font-size:0.85rem; font-weight:700; letter-spacing:1.5px; color: #1e293b;">
                        8412 9015 3295
                    </div>
                </div>
            `;
        } else {
            body.innerHTML = `
                <div style="background:#fafafa; border:1px solid #ddd; border-radius:8px; width:340px; padding:1.5rem; text-align:left; color:#1e293b; font-family:var(--font-body); box-shadow:0 4px 15px rgba(0,0,0,0.15);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem;">
                        <span style="font-weight:700; font-size:0.8rem; text-transform:uppercase; color:#0f172a;"><i class="ph ph-shield-check" style="color:var(--primary-color);"></i> Document Verification</span>
                        <span style="font-size:0.65rem; color:#10b981; font-weight:700;">ORIGINAL RECORD</span>
                    </div>
                    <p style="font-size:0.7rem; line-height:1.4; margin-bottom:0.8rem; color:#475569;">
                        This document serves as proof of residential address and identity credentials for the applicant. All details align with central government registries.
                    </p>
                    <table style="width:100%; font-size:0.65rem; border-collapse:collapse; color:#334155;">
                        <tr style="border-bottom:1px solid #f1f5f9;"><td style="font-weight:600; padding:0.25rem 0;">Citizen Name:</td><td style="text-align:right;">Aarav Sharma</td></tr>
                        <tr style="border-bottom:1px solid #f1f5f9;"><td style="font-weight:600; padding:0.25rem 0;">Aadhaar Link:</td><td style="text-align:right;">Verified (OTP checked)</td></tr>
                        <tr style="border-bottom:1px solid #f1f5f9;"><td style="font-weight:600; padding:0.25rem 0;">Billing Reference:</td><td style="text-align:right;">DISCOM-MP-04981</td></tr>
                    </table>
                    <div style="text-align:center; margin-top:1.25rem; font-size:0.6rem; color:#94a3b8;">
                        Digital Stamp ID: hash_${btoa(docName).slice(0, 8).toLowerCase()}
                    </div>
                </div>
            `;
        }

        const zoomActions = document.getElementById('adminDocZoomActionButtons');
        zoomActions.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="setZoomCheckAndClose('${docName}', 'verified')" style="background-color:var(--success-color); border-color:var(--success-color);"><i class="ph ph-check"></i> Mark Verified</button>
            <button class="btn btn-outline btn-sm" onclick="setZoomCheckAndClose('${docName}', 'rejected')" style="border-color:var(--danger-color); color:var(--danger-color);"><i class="ph ph-x"></i> Reject</button>
            <button class="btn btn-outline btn-sm" onclick="closeAdminDocZoomModal()"><i class="ph ph-close"></i> Close View</button>
        `;
    };

    window.closeAdminDocZoomModal = function() {
        const modal = document.getElementById('adminDocZoomModal');
        if (modal) modal.classList.add('hidden');
    };

    window.setZoomCheckAndClose = function(docName, status) {
        let docId = 'doc-photo';
        if (docName.toLowerCase().includes('aadhaar')) docId = 'doc-aadhaar';
        else if (docName.toLowerCase().includes('bill') || docName.toLowerCase().includes('address')) docId = 'doc-address';

        const radio = document.querySelector(`input[name="check-${docId}"][value="${status}"]`);
        if (radio) {
            radio.checked = true;
            setDocCheck(docId, status);
        }
        closeAdminDocZoomModal();
    };

    window.renderAdminDepts = function() {
        const tableBody = document.getElementById('adminDeptTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        adminDepartments.forEach(dept => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${dept.id}</strong></td>
                <td>${dept.name}</td>
                <td>${dept.subs}</td>
                <td>${dept.activeServices} Services</td>
                <td>${dept.head}</td>
                <td>
                    <div style="display:flex; gap:0.25rem;">
                        <button class="btn btn-outline btn-sm" onclick="openAdminEditDept('${dept.id}')" style="padding:0.2rem 0.4rem; font-size:0.75rem;"><i class="ph ph-pencil"></i> Edit</button>
                        <button class="btn btn-outline btn-sm" onclick="deleteAdminDept('${dept.id}')" style="padding:0.2rem 0.4rem; font-size:0.75rem; border-color:var(--danger-color); color:var(--danger-color);"><i class="ph ph-trash"></i> Delete</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    const btnAdminAddDept = document.getElementById('btnAdminAddDept');
    if (btnAdminAddDept) {
        btnAdminAddDept.addEventListener('click', () => {
            document.getElementById('deptModalTitle').innerText = 'Add New Department';
            document.getElementById('adminDeptForm').reset();
            document.getElementById('adminDeptId').value = '';
            document.getElementById('adminDeptModal').classList.remove('hidden');
        });
    }

    window.closeAdminDeptModal = function() {
        document.getElementById('adminDeptModal').classList.add('hidden');
    };

    window.openAdminEditDept = function(id) {
        const dept = adminDepartments.find(d => d.id === id);
        if (!dept) return;

        document.getElementById('deptModalTitle').innerText = 'Edit Department Config';
        document.getElementById('adminDeptId').value = dept.id;
        document.getElementById('adminDeptName').value = dept.name;
        document.getElementById('adminDeptSubs').value = dept.subs;
        document.getElementById('adminDeptHead').value = dept.head;

        document.getElementById('adminDeptModal').classList.remove('hidden');
    };

    window.deleteAdminDept = function(id) {
        if (!hasPermission(currentAdminRole, 'manage-departments')) {
            alert('Access Denied: Lacks administrative permissions.');
            return;
        }
        if (confirm('Are you sure you want to delete this department configuration?')) {
            const index = adminDepartments.findIndex(d => d.id === id);
            if (index !== -1) {
                const name = adminDepartments[index].name;
                adminDepartments.splice(index, 1);
                saveAdminState();
                renderAdminDepts();
                logSystemEvent('Department Alteration', `Deleted department configuration for ${name}.`);
                addNotification(`Department ${name} deleted successfully.`, 'warning');
            }
        }
    };

    const deptForm = document.getElementById('adminDeptForm');
    if (deptForm) {
        deptForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('adminDeptId').value;
            const name = document.getElementById('adminDeptName').value.trim();
            const subs = document.getElementById('adminDeptSubs').value.trim();
            const head = document.getElementById('adminDeptHead').value.trim();

            if (!name || !head) return;

            if (id) {
                const dept = adminDepartments.find(d => d.id === id);
                if (dept) {
                    dept.name = name;
                    dept.subs = subs;
                    dept.head = head;
                    logSystemEvent('Department Alteration', `Edited department configuration for ${name}.`);
                    addNotification(`Department ${name} updated successfully.`, 'success');
                }
            } else {
                const newId = 'DEPT-0' + (adminDepartments.length + 1);
                adminDepartments.push({
                    id: newId,
                    name: name,
                    subs: subs || 'General Services Division',
                    activeServices: 1,
                    head: head
                });
                logSystemEvent('Department Alteration', `Created new department configuration: ${name}.`);
                addNotification(`Department ${name} published successfully.`, 'success');
            }

            saveAdminState();
            closeAdminDeptModal();
            renderAdminDepts();
        });
    }

    window.renderAdminSchemes = function() {
        const tableBody = document.getElementById('adminSchemesTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        adminSchemes.forEach(sch => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${sch.title}</strong></td>
                <td><span class="scheme-badge" style="background: rgba(245, 158, 11, 0.1); color: var(--accent-color); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">${sch.badge || sch.category}</span></td>
                <td>${sch.eligibility}</td>
                <td><span style="color:var(--danger-color); font-weight:600;">${sch.deadline}</span></td>
                <td>
                    <div style="display:flex; gap:0.25rem;">
                        <button class="btn btn-outline btn-sm" onclick="openAdminEditScheme('${sch.id}')" style="padding:0.2rem 0.4rem; font-size:0.75rem;"><i class="ph ph-pencil"></i> Edit</button>
                        <button class="btn btn-outline btn-sm" onclick="deleteAdminScheme('${sch.id}')" style="padding:0.2rem 0.4rem; font-size:0.75rem; border-color:var(--danger-color); color:var(--danger-color);"><i class="ph ph-trash"></i> Delete</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    const btnAdminAddScheme = document.getElementById('btnAdminAddScheme');
    if (btnAdminAddScheme) {
        btnAdminAddScheme.addEventListener('click', () => {
            if (!hasPermission(currentAdminRole, 'manage-schemes')) {
                alert('Access Denied: Lacks administrative permissions.');
                return;
            }
            document.getElementById('schemeModalTitle').innerText = 'Publish Welfare Scheme';
            document.getElementById('adminSchemeForm').reset();
            document.getElementById('adminSchemeId').value = '';
            document.getElementById('adminSchemeModal').classList.remove('hidden');
        });
    }

    window.closeAdminSchemeModal = function() {
        document.getElementById('adminSchemeModal').classList.add('hidden');
    };

    window.openAdminEditScheme = function(id) {
        if (!hasPermission(currentAdminRole, 'manage-schemes')) {
            alert('Access Denied: Lacks administrative permissions.');
            return;
        }
        const sch = adminSchemes.find(s => s.id === id);
        if (!sch) return;

        document.getElementById('schemeModalTitle').innerText = 'Edit Scheme Details';
        document.getElementById('adminSchemeId').value = sch.id;
        document.getElementById('adminSchemeTitle').value = sch.title;
        document.getElementById('adminSchemeCategory').value = sch.badge || sch.category;
        document.getElementById('adminSchemeDeadline').value = sch.deadline;
        document.getElementById('adminSchemeDesc').value = sch.desc;
        document.getElementById('adminSchemeEligibility').value = sch.eligibility;

        document.getElementById('adminSchemeModal').classList.remove('hidden');
    };

    window.deleteAdminScheme = function(id) {
        if (!hasPermission(currentAdminRole, 'manage-schemes')) {
            alert('Access Denied: Lacks administrative permissions.');
            return;
        }
        if (confirm('Are you sure you want to delete this welfare scheme?')) {
            const index = adminSchemes.findIndex(s => s.id === id);
            if (index !== -1) {
                const title = adminSchemes[index].title;
                adminSchemes.splice(index, 1);
                saveAdminState();
                renderAdminSchemes();
                renderRecommendedSchemes(); 
                logSystemEvent('Scheme Alteration', `Deleted welfare scheme: ${title}`);
                addNotification(`Scheme ${title} deleted successfully.`, 'warning');
            }
        }
    };

    const schemeForm = document.getElementById('adminSchemeForm');
    if (schemeForm) {
        schemeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('adminSchemeId').value;
            const title = document.getElementById('adminSchemeTitle').value.trim();
            const category = document.getElementById('adminSchemeCategory').value;
            const deadline = document.getElementById('adminSchemeDeadline').value;
            const desc = document.getElementById('adminSchemeDesc').value.trim();
            const eligibility = document.getElementById('adminSchemeEligibility').value.trim();

            if (!title || !deadline || !desc || !eligibility) return;

            if (id) {
                const sch = adminSchemes.find(s => s.id === id);
                if (sch) {
                    sch.title = title;
                    sch.badge = category;
                    sch.category = category;
                    sch.deadline = deadline;
                    sch.desc = desc;
                    sch.eligibility = eligibility;
                    logSystemEvent('Scheme Alteration', `Edited welfare scheme: ${title}`);
                    addNotification(`Welfare Scheme ${title} updated successfully.`, 'success');
                }
            } else {
                const newId = 'SCH-0' + (adminSchemes.length + 1);
                adminSchemes.push({
                    id: newId,
                    badge: category,
                    category: category,
                    title: title,
                    desc: desc,
                    eligibility: eligibility,
                    deadline: deadline
                });
                logSystemEvent('Scheme Alteration', `Published new welfare scheme: ${title}`);
                addNotification(`Welfare Scheme ${title} published successfully.`, 'success');
            }

            saveAdminState();
            closeAdminSchemeModal();
            renderAdminSchemes();
            renderRecommendedSchemes(); 
        });
    }

    window.renderAdminComplaints = function() {
        const tableBody = document.getElementById('adminComplaintsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (grievances.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary); padding:2rem 0;">No grievances registered in system.</td></tr>`;
            return;
        }

        grievances.forEach(g => {
            let badgeClass = 'submitted';
            if (g.status === 'Resolved') badgeClass = 'approved';
            else if (g.status === 'Escalated') badgeClass = 'rejected';
            else if (g.status === 'In Progress') badgeClass = 'inreview';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${g.id || g.app_number}</strong></td>
                <td>
                    <div style="font-weight:600; font-size:0.85rem;">${g.subject || 'Public Complaint'}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${g.remarks || ''}">${g.remarks || ''}</div>
                </td>
                <td>${g.date || g.created_at ? (g.date || g.created_at).split('T')[0] : '2026-05-29'}</td>
                <td><span class="badge-status ${badgeClass}">${g.status}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="openAdminComplaintModal('${g.id || g.app_number}')" ${g.status === 'Resolved' ? 'disabled style="opacity:0.6"' : ''}>
                        <i class="ph ph-note-pencil"></i> Resolve
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    window.openAdminComplaintModal = function(id) {
        const g = grievances.find(item => (item.id === id || item.app_number === id));
        if (!g) return;

        document.getElementById('adminComplaintId').value = id;
        document.getElementById('adminComplaintModalMeta').innerText = `Token ID: ${id} | Filer: ${g.applicant_name || 'Citizen'}`;
        document.getElementById('adminComplaintResponse').value = '';
        document.getElementById('adminComplaintModal').classList.remove('hidden');
    };

    window.closeAdminComplaintModal = function() {
        document.getElementById('adminComplaintModal').classList.add('hidden');
    };

    window.submitGrievanceResolution = function(action) {
        const id = document.getElementById('adminComplaintId').value;
        const officer = document.getElementById('adminComplaintOfficer').value;
        const response = document.getElementById('adminComplaintResponse').value.trim();

        if (!response) {
            alert('Please provide response/resolution remarks before submitting.');
            return;
        }

        const g = grievances.find(item => (item.id === id || item.app_number === id));
        if (!g) return;

        if (action === 'Resolve') {
            g.status = 'Resolved';
            g.remarks = `Resolved by ${officer}. Resolution: ${response}`;
            logSystemEvent('Grievance Redressal', `Resolved complaint ${id} (Assigned officer: ${officer}).`);
            addNotification(`Complaint ${id} has been resolved.`, 'success');
        } else {
            g.status = 'Escalated';
            g.remarks = `Escalated by ${officer}. Escalation details: ${response}`;
            logSystemEvent('Grievance Redressal', `Escalated complaint ${id} to Higher Authority.`);
            addNotification(`Complaint ${id} escalated to higher authority.`, 'warning');
        }

        const localKey = id;
        const localData = localStorage.getItem(localKey);
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                parsed.status = g.status;
                parsed.remarks = g.remarks;
                localStorage.setItem(localKey, JSON.stringify(parsed));
            } catch(e){}
        }

        saveState();
        closeAdminComplaintModal();
        renderAdminComplaints();
        renderAdminOverview(); 
    };

    window.renderAdminAnalytics = function() {
        const chartDeptPerf = document.getElementById('chartAdminDeptPerf');
        if (chartDeptPerf) {
            const data = [
                { name: 'Identity & Civil', value: 36, color: 'var(--primary-color)' },
                { name: 'Transport RTO', value: 72, color: 'var(--accent-color)' },
                { name: 'Health Office', value: 24, color: 'var(--success-color)' },
                { name: 'Finance Revenue', value: 48, color: 'var(--warning-color)' }
            ];

            let html = `
                <line x1="40" y1="20" x2="340" y2="20" stroke="var(--border-solid)" stroke-dasharray="3" />
                <line x1="40" y1="60" x2="340" y2="60" stroke="var(--border-solid)" stroke-dasharray="3" />
                <line x1="40" y1="100" x2="340" y2="100" stroke="var(--border-solid)" stroke-dasharray="3" />
                <line x1="40" y1="140" x2="340" y2="140" stroke="var(--border-solid)" stroke-dasharray="3" />
                <line x1="40" y1="180" x2="340" y2="180" stroke="var(--border-solid)" />
            `;

            html += `
                <text x="30" y="25" fill="var(--text-secondary)" font-size="9" text-anchor="end">72h</text>
                <text x="30" y="65" fill="var(--text-secondary)" font-size="9" text-anchor="end">54h</text>
                <text x="30" y="105" fill="var(--text-secondary)" font-size="9" text-anchor="end">36h</text>
                <text x="30" y="145" fill="var(--text-secondary)" font-size="9" text-anchor="end">18h</text>
                <text x="30" y="185" fill="var(--text-secondary)" font-size="9" text-anchor="end">0h</text>
            `;

            const barWidth = 40;
            const startX = 60;
            const gap = 30;

            data.forEach((d, i) => {
                const x = startX + i * (barWidth + gap);
                const height = (d.value / 72) * 160;
                const y = 180 - height;
                html += `
                    <rect x="${x}" y="180" width="${barWidth}" height="0" rx="4" fill="${d.color}" opacity="0.8">
                        <animate attributeName="y" from="180" to="${y}" dur="0.8s" fill="freeze" />
                        <animate attributeName="height" from="0" to="${height}" dur="0.8s" fill="freeze" />
                    </rect>
                    <text x="${x + barWidth / 2}" y="${y - 6}" fill="var(--text-primary)" font-size="9" font-weight="600" text-anchor="middle">${d.value}h</text>
                    <text x="${x + barWidth / 2}" y="195" fill="var(--text-secondary)" font-size="8.5" text-anchor="middle">${d.name}</text>
                `;
            });

            chartDeptPerf.innerHTML = html;
        }

        const chartTrends = document.getElementById('chartAdminTrends');
        if (chartTrends) {
            const points = [
                { label: 'W1', value: 10 },
                { label: 'W2', value: 25 },
                { label: 'W3', value: 18 },
                { label: 'W4', value: 42 },
                { label: 'W5', value: 35 },
                { label: 'W6', value: 55 }
            ];

            let html = `
                <line x1="40" y1="20" x2="340" y2="20" stroke="var(--border-solid)" stroke-dasharray="3" />
                <line x1="40" y1="60" x2="340" y2="60" stroke="var(--border-solid)" stroke-dasharray="3" />
                <line x1="40" y1="100" x2="340" y2="100" stroke="var(--border-solid)" stroke-dasharray="3" />
                <line x1="40" y1="140" x2="340" y2="140" stroke="var(--border-solid)" stroke-dasharray="3" />
                <line x1="40" y1="180" x2="340" y2="180" stroke="var(--border-solid)" />
            `;

            html += `
                <text x="30" y="25" fill="var(--text-secondary)" font-size="9" text-anchor="end">60</text>
                <text x="30" y="65" fill="var(--text-secondary)" font-size="9" text-anchor="end">45</text>
                <text x="30" y="105" fill="var(--text-secondary)" font-size="9" text-anchor="end">30</text>
                <text x="30" y="145" fill="var(--text-secondary)" font-size="9" text-anchor="end">15</text>
                <text x="30" y="185" fill="var(--text-secondary)" font-size="9" text-anchor="end">0</text>
            `;

            const startX = 50;
            const endX = 330;
            const dx = (endX - startX) / (points.length - 1);
            let pathD = '';
            let areaD = `M ${startX} 180 `;

            points.forEach((p, i) => {
                const x = startX + i * dx;
                const y = 180 - (p.value / 60) * 160;
                if (i === 0) {
                    pathD += `M ${x} ${y} `;
                } else {
                    pathD += `L ${x} ${y} `;
                }
                areaD += `L ${x} ${y} `;
                if (i === points.length - 1) {
                    areaD += `L ${x} 180 Z`;
                }
            });

            html += `
                <path d="${areaD}" fill="url(#trendsAreaGrad)" opacity="0.15" />
                <path d="${pathD}" fill="none" stroke="var(--primary-color)" stroke-width="2.5" stroke-linecap="round" />
            `;

            points.forEach((p, i) => {
                const x = startX + i * dx;
                const y = 180 - (p.value / 60) * 160;
                html += `
                    <circle cx="${x}" cy="${y}" r="4.5" fill="var(--primary-color)" stroke="#fff" stroke-width="1.5">
                        <title>Volume: ${p.value}</title>
                    </circle>
                    <text x="${x}" y="195" fill="var(--text-secondary)" font-size="9" text-anchor="middle">${p.label}</text>
                    <text x="${x}" y="${y - 8}" fill="var(--text-primary)" font-size="8.5" font-weight="600" text-anchor="middle">${p.value}</text>
                `;
            });

            html = `<defs>
                <linearGradient id="trendsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--primary-color)" />
                    <stop offset="100%" stop-color="var(--primary-color)" stop-opacity="0" />
                </linearGradient>
            </defs>` + html;

            chartTrends.innerHTML = html;
        }

        const chartApprovalRing = document.getElementById('chartAdminApprovalRing');
        if (chartApprovalRing) {
            const approved = applications.filter(a => a.status === 'Approved').length;
            const rejected = applications.filter(a => a.status === 'Rejected').length;
            const pending = applications.filter(a => ['Submitted', 'Form Submitted', 'Under Review', 'In Progress'].includes(a.status)).length;
            
            const total = approved + rejected + pending || 1;
            const pct = Math.round((approved / total) * 100);

            const r = 70;
            const circum = Math.round(2 * Math.PI * r);
            const offset = Math.round(circum - (pct / 100) * circum);

            chartApprovalRing.innerHTML = `
                <circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--border-solid)" stroke-width="15" />
                <circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--success-color)" stroke-width="15" 
                        stroke-dasharray="${circum}" stroke-dashoffset="${circum}" transform="rotate(-90 100 100)" stroke-linecap="round">
                    <animate attributeName="stroke-dashoffset" from="${circum}" to="${offset}" dur="0.8s" fill="freeze" />
                </circle>
                <text x="100" y="105" fill="var(--text-primary)" font-size="22" font-weight="700" text-anchor="middle">${pct}%</text>
                <text x="100" y="125" fill="var(--text-secondary)" font-size="8.5" font-weight="600" text-anchor="middle">APPROVAL RATE</text>
            `;
        }

        const chartPopularity = document.getElementById('chartAdminPopularity');
        if (chartPopularity) {
            const counts = {};
            applications.forEach(a => {
                counts[a.name] = (counts[a.name] || 0) + 1;
            });

            const data = [
                { name: 'Birth Certificate', count: counts['Birth Certificate'] || 4 },
                { name: 'Driving License', count: counts['Driving License'] || 3 },
                { name: 'Passport Issuance', count: counts['Passport'] || counts['Passport Issuance'] || 2 },
                { name: 'Income Tax Return', count: counts['Income Tax Return'] || 1 }
            ];

            const maxCount = Math.max(...data.map(d => d.count)) || 1;

            let html = '';
            const rowHeight = 35;
            const startY = 20;

            data.forEach((d, i) => {
                const y = startY + i * rowHeight;
                const barWidthMax = 200;
                const width = (d.count / maxCount) * barWidthMax;
                html += `
                    <text x="15" y="${y + 16}" fill="var(--text-primary)" font-size="9.5" text-anchor="start" font-weight="600">${d.name}</text>
                    <rect x="130" y="${y + 6}" width="0" height="13" rx="3.5" fill="var(--accent-color)" opacity="0.8">
                        <animate attributeName="width" from="0" to="${width}" dur="0.8s" fill="freeze" />
                    </rect>
                    <text x="${135 + width}" y="${y + 16}" fill="var(--text-primary)" font-size="9" font-weight="700" text-anchor="start">${d.count}</text>
                `;
            });

            chartPopularity.innerHTML = html;
        }
    };

    const adminNotificationForm = document.getElementById('adminNotificationForm');
    if (adminNotificationForm) {
        adminNotificationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('adminAlertTitle').value.trim();
            const type = document.getElementById('adminAlertType').value;
            const audience = document.getElementById('adminAlertAudience').value;

            if (!title) return;

            logSystemEvent('System Alert Broadcast', `Sent alert to audience "${audience}": "${title}"`);
            addNotification(`Broadcast: ${title}`, type);
            adminNotificationForm.reset();
            alert('Broadcast alert sent successfully!');
        });
    }

    window.renderAdminAuditLogs = function() {
        const tableBody = document.getElementById('adminAuditLogsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (adminAuditLogs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary); padding:2rem 0;">No audit entries logged in trace database.</td></tr>`;
            return;
        }

        adminAuditLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${log.timestamp}</strong></td>
                <td>${log.user}</td>
                <td><span style="font-weight:600;">${log.area}</span></td>
                <td>${log.details}</td>
                <td><span style="font-family:monospace;">${log.ip}</span></td>
            `;
            tableBody.appendChild(row);
        });
    };

    window.clearAdminAuditLogs = function() {
        if (!hasPermission(currentAdminRole, 'view-audit')) {
            alert('Access Denied: Lacks administrative permissions.');
            return;
        }
        if (confirm('Are you sure you want to clear all cryptographic audit logs? This action is irrevocable.')) {
            adminAuditLogs = [];
            saveAdminState();
            renderAdminAuditLogs();
            renderRecentEventsSummary();
            alert('Audit logs reset successfully.');
        }
    };

    function initAdminSubnav() {
        const subNavButtons = document.querySelectorAll('.admin-sub-nav .admin-sub-btn');
        subNavButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                subNavButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const subtab = btn.getAttribute('data-subtab');
                document.querySelectorAll('.admin-subtab-content').forEach(panel => {
                    panel.classList.remove('active');
                });

                const activePanel = document.getElementById(`subtab-${subtab}`);
                if (activePanel) activePanel.classList.add('active');

                renderSubtabData(subtab);
            });
        });

        const selectRole = document.getElementById('adminActiveRoleSelect');
        if (selectRole) {
            selectRole.addEventListener('change', (e) => {
                const newRole = e.target.value;
                currentAdminRole = newRole;

                const label = document.getElementById('adminSessionRoleLabel');
                if (label) {
                    label.className = `admin-badge-role-tag ${newRole}`;
                    const titleCase = newRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    label.innerText = titleCase;
                }

                logSystemEvent('Role Override', `Logged-in session swapped role to ${newRole}.`);
                applyRolePermissions(newRole);
                applyAdminSidebarView(true);

                const activeBtn = document.querySelector('.admin-sub-nav .admin-sub-btn.active');
                if (activeBtn) {
                    const subtab = activeBtn.getAttribute('data-subtab');
                    renderSubtabData(subtab);
                }
            });
        }
    }

    function renderAdminTab() {
        if (currentUser && !window.adminSubnavInitialized) {
            window.adminSubnavInitialized = true;
            initAdminSubnav();

            if (currentUser.email === 'admin@gov.in') currentAdminRole = 'dept-officer';
            else if (currentUser.email === 'super.admin@gov.in') currentAdminRole = 'super-admin';
            else if (currentUser.email === 'central.officer@gov.in') currentAdminRole = 'central-officer';
            else if (currentUser.email === 'state.officer@gov.in') currentAdminRole = 'state-officer';
            else if (currentUser.email === 'district.officer@gov.in') currentAdminRole = 'district-officer';
            else if (currentUser.email === 'dept.officer@gov.in') currentAdminRole = 'dept-officer';
            else if (currentUser.email === 'helpdesk@gov.in') currentAdminRole = 'helpdesk-operator';

            const selectRole = document.getElementById('adminActiveRoleSelect');
            if (selectRole) {
                selectRole.value = currentAdminRole;
                selectRole.dispatchEvent(new Event('change'));
            }
        }

        applyRolePermissions(currentAdminRole);

        const activeBtn = document.querySelector('.admin-sub-nav .admin-sub-btn.active');
        if (activeBtn) {
            const subtab = activeBtn.getAttribute('data-subtab');
            renderSubtabData(subtab);
        }
    }

    // --- Notification dropdown center logic ---
    const bellTrigger = document.getElementById('bellTrigger');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');

    if (bellTrigger && notificationDropdown) {
        bellTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('open');
            notifications.forEach(n => n.read = true);
            saveState();
            renderNotifications();
        });
    }

    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifications = [];
            saveState();
            renderNotifications();
        });
    }

    function renderNotifications() {
        const list = document.getElementById('notificationList');
        const badge = document.getElementById('bellBadge');
        if (!list) return;

        list.innerHTML = '';
        const unread = notifications.filter(n => !n.read).length;

        if (unread > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        if (notifications.length === 0) {
            list.innerHTML = `<div class="notification-empty">No notifications.</div>`;
            return;
        }

        notifications.forEach(n => {
            const item = document.createElement('div');
            item.className = `notification-item ${n.read ? '' : 'unread'} ${n.type}`;
            const iconMap = { info: 'ph-info', success: 'ph-check-circle', warning: 'ph-warning-octagon', danger: 'ph-x-circle' };
            const icon = iconMap[n.type] || 'ph-bell';
            
            item.innerHTML = `
                <i class="ph-fill ${icon}"></i>
                <div class="notification-content">
                    <p class="notification-text">${n.text}</p>
                    <span class="notification-time">${n.time}</span>
                </div>
            `;
            list.appendChild(item);
        });
    }

    function addNotification(text, type = 'info') {
        notifications.unshift({
            id: 'nt-' + Date.now(),
            text: text,
            time: 'Just now',
            type: type,
            read: false
        });
        saveState();
        renderNotifications();
    }

    // Monitor Auth State Changes to Dynamic Header Profile UI
    if (firebaseAuth) {
        onAuthStateChanged(firebaseAuth, (user) => {
            if (!authHeaderContainer) return;
            if (user) {
                initDashboardUI(user);
            } else {
                if (!isMockAuth) {
                    initLandingUI();
                }
            }
        });
    }

    // --- 18. Password Visibility Toggles ---
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const input = this.parentNode.querySelector('input');
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    this.innerHTML = '<i class="ph ph-eye-slash"></i>';
                } else {
                    input.type = 'password';
                    this.innerHTML = '<i class="ph ph-eye"></i>';
                }
            }
        });
    });

    // =========================================================================
    // Premium Citizen Service Portal JavaScript Engine
    // =========================================================================

    // Comprehensive Service Database
    const citizenServicesData = {
        "Identity & Citizenship": {
            desc: "Manage foundational identity proof cards, citizenship verifications, and civil registry operations.",
            icon: "ph ph-identification-card",
            services: [
                {
                    name: "Aadhaar Services",
                    desc: "Apply for a fresh Aadhaar digital identity, update biometric profiles, edit demographic registry details, and verify email/mobile associations.",
                    icon: "ph ph-identification-badge",
                    eligibility: [
                        "Must be a resident citizen of India.",
                        "No age bar - newborns can apply for Bal Aadhaar card.",
                        "Must have valid proof of identity (POI) and proof of address (POA)."
                    ],
                    documents: [
                        "Proof of Identity (Passport, PAN, Voter ID, or Driving License)",
                        "Proof of Address (Utility Bill, Bank Statement, or Rent Agreement)",
                        "Proof of Date of Birth (Birth Certificate or Matriculation sheet)"
                    ],
                    processingTime: "7 - 10 Working Days",
                    fee: "Free (Demographic updates ₹50, Biometrics ₹100)",
                    animationType: "aadhaar",
                    faqs: [
                        { q: "Is Aadhaar card mandatory for filing taxes?", a: "Yes, linking Aadhaar with your PAN is mandatory under current tax guidelines." },
                        { q: "How can I update my mobile number on my Aadhaar?", a: "Mobile number updates require biometric verification at a certified local Aadhaar Seva Kendra." }
                    ],
                    contacts: [
                        { type: "Helpline", value: "1947 (Toll Free)" },
                        { type: "Support Email", value: "help@uidai.gov.in" }
                    ]
                },
                {
                    name: "Passport Services",
                    desc: "Apply for a fresh Indian passport, issue jumbo booklets, request renewals, schedule appointment slots, and track background police checks.",
                    icon: "ph ph-globe",
                    eligibility: [
                        "Must be a resident citizen of India.",
                        "Minors require parents' consent and identity proofs.",
                        "No pending criminal records or travel bans in any judicial court."
                    ],
                    documents: [
                        "Proof of Address (Utility Bill, Voter ID, or Aadhaar Card)",
                        "Proof of Date of Birth (Birth Certificate or School Leaving Certificate)",
                        "Non-ECR Category Proof (10th Standard Matriculation Certificate or higher)"
                    ],
                    processingTime: "15 Working Days (Tatkaal: 3 - 5 Days)",
                    fee: "₹ 1,500 (Standard), ₹ 3,500 (Tatkaal)",
                    animationType: "passport",
                    faqs: [
                        { q: "What is the validity of a standard Indian passport?", a: "Passports for adults are valid for 10 years, and for minors, they are valid for 5 years." },
                        { q: "Is police verification mandatory for all passport renewals?", a: "Not for all cases. Renewals with unchanged details and clean history may get police verification post-issuance." }
                    ],
                    contacts: [
                        { type: "National Call Center", value: "1800-258-1800" },
                        { type: "Official Portal", value: "passportindia.gov.in" }
                    ]
                },
                {
                    name: "Voter ID",
                    desc: "Enroll in the national electoral database, search name rolls, correct registration credentials, and request epic identity cards.",
                    icon: "ph ph-identification-card",
                    eligibility: [
                        "Must be a citizen of India.",
                        "Must be 18 years of age or older on the qualifying date.",
                        "Must be ordinarily resident in the constituency area where registration is sought."
                    ],
                    documents: [
                        "Proof of Identity (Aadhaar Card, Passport, or PAN)",
                        "Proof of Age (Birth Certificate or 10th Marksheet)",
                        "Address Proof (Electricity Bill, Water Bill, or Bank Passbook)"
                    ],
                    processingTime: "21 - 30 Working Days",
                    fee: "Free",
                    animationType: "aadhaar",
                    faqs: [
                        { q: "Can an NRI vote in Indian elections?", a: "Yes, NRIs can register as overseas voters and vote in person at the designated polling stations." },
                        { q: "How can I transfer my vote to a new constituency?", a: "You must file Form 8 on the NVSP portal to transfer voter registrations between assembly areas." }
                    ],
                    contacts: [
                        { type: "Voter Helpline", value: "1950" },
                        { type: "Support Portal", value: "nvsp.in" }
                    ]
                },
                {
                    name: "Birth Certificate",
                    desc: "Register a fresh birth with local Municipal Corporations and secure legally validated proof of birth records.",
                    icon: "ph ph-baby",
                    eligibility: [
                        "Birth must have occurred within the state jurisdiction area.",
                        "Registration must ideally occur within 21 days of birth."
                    ],
                    documents: [
                        "Hospital Discharge Slip / Birth Report signed by doctor",
                        "Parents' Aadhaar Cards / Identity Proofs",
                        "Affidavit (required only for delayed registration post 1 year)"
                    ],
                    processingTime: "7 Working Days",
                    fee: "Free (Delayed registrations require ₹20 - ₹50 late fee)",
                    animationType: "aadhaar",
                    faqs: [
                        { q: "Is registration mandatory within 21 days?", a: "Yes, reporting births within 21 days is legally required, after which late registrations require executive approvals." },
                        { q: "Can I download my birth certificate online?", a: "Yes, if the local municipal authority is digitally active, certificates can be downloaded via their e-gov portal." }
                    ],
                    contacts: [
                        { type: "Municipal Registry Office", value: "Dial 100/Local Urban Body desk" },
                        { type: "Registry Portal", value: "crsorgi.gov.in" }
                    ]
                },
                {
                    name: "Death Certificate",
                    desc: "File registry records for a deceased citizen and acquire certified municipal death declarations for estate settlements.",
                    icon: "ph ph-activity",
                    eligibility: [
                        "The death event must have occurred within the municipal limits.",
                        "Ideally registered within 21 days of the event."
                    ],
                    documents: [
                        "Hospital Death Summary / Medical cause of death certificate",
                        "Deceased person's Aadhaar / Voter Card",
                        "Applicant's Identity Proof & relation declaration"
                    ],
                    processingTime: "5 - 7 Working Days",
                    fee: "Free",
                    animationType: "aadhaar",
                    faqs: [
                        { q: "Why is a death certificate required?", a: "It is legally mandatory for settling insurance claims, property transfer, and closing bank accounts." },
                        { q: "What if registration is delayed?", a: "Delayed registration beyond 30 days requires verification from the Area Registrar and Executive Magistrate." }
                    ],
                    contacts: [
                        { type: "Civil Registration desk", value: "Contact Local Registrar Office" }
                    ]
                }
            ]
        },
        "Taxes & Finance": {
            desc: "File Income Tax Returns (ITR), register for GST, apply for PAN cards, pay property taxes, and manage pension balances.",
            icon: "ph ph-coins",
            services: [
                {
                    name: "Income Tax Filing",
                    desc: "Submit e-returns for personal or business income tax, claim deductions, compute tax slabs, and track refund clearances.",
                    icon: "ph ph-file-text",
                    eligibility: [
                        "Individual residents, HUFs, companies, or partnership firms with taxable income.",
                        "Must hold a valid PAN card linked to Aadhaar."
                    ],
                    documents: [
                        "Form 16 (provided by employer)",
                        "Form 26AS / Annual Information Statement (AIS)",
                        "Investment proofs for tax deductions (under 80C, 80D, etc.)"
                    ],
                    processingTime: "Usually 15 - 45 Days (Clearance is dynamic)",
                    fee: "Free (Self-filing)",
                    animationType: "tax",
                    faqs: [
                        { q: "What is the penalty for late ITR filing?", a: "Late filing attracts a penalty of up to ₹5,000 under Section 234F." },
                        { q: "How can I verify my submitted ITR?", a: "You can e-verify using Aadhaar OTP, net banking, or sending a physical copy to CPC Bangalore." }
                    ],
                    contacts: [
                        { type: "E-Filing Helpdesk", value: "1800-103-0025" },
                        { type: "Official URL", value: "incometax.gov.in" }
                    ]
                },
                {
                    name: "GST Services",
                    desc: "Apply for a new Goods and Services Tax registration number (GSTIN), file monthly returns, and check refund claims.",
                    icon: "ph ph-coins",
                    eligibility: [
                        "Businesses with turnover exceeding ₹40 Lakhs (goods) or ₹20 Lakhs (services).",
                        "Mandatory for e-commerce operators, inter-state traders, and voluntary applicants."
                    ],
                    documents: [
                        "PAN Card of the business/promoter",
                        "Partnership deed or incorporation certificate",
                        "Proof of business address (Electricity bill or Lease deed)",
                        "Bank account details (statement or cancelled cheque)"
                    ],
                    processingTime: "5 - 7 Working Days",
                    fee: "Free",
                    animationType: "tax",
                    faqs: [
                        { q: "Is physical verification required for GST?", a: "In most cases, Aadhaar authentication is sufficient. Physical check is conducted only for high-risk profiles." },
                        { q: "What is composition scheme?", a: "A simple tax scheme for small taxpayers with lower tax rates and lesser compliance loads." }
                    ],
                    contacts: [
                        { type: "GST Portal Helpdesk", value: "1800-103-4786" },
                        { type: "Website", value: "gst.gov.in" }
                    ]
                },
                {
                    name: "PAN Services",
                    desc: "Apply for a fresh Permanent Account Number card, request card reprints, or correct existing ledger values.",
                    icon: "ph ph-cardholder",
                    eligibility: [
                        "All citizens, HUFs, corporate bodies, minors, and foreign residents."
                    ],
                    documents: [
                        "Aadhaar Card (serves as identity, address, and date of birth proof)",
                        "Passport size photos (for physical application routing)"
                    ],
                    processingTime: "15 Days (Instant e-PAN: 10 Minutes)",
                    fee: "₹ 107 (Physical card within India), ₹ 1,017 (Outside India)",
                    animationType: "tax",
                    faqs: [
                        { q: "What is e-PAN?", a: "A digitally signed PAN card in PDF format, issued instantly at no cost using Aadhaar e-KYC." },
                        { q: "Can I have multiple PAN cards?", a: "No, possessing more than one PAN card is illegal and attracts a penalty of ₹10,000 under Section 272B." }
                    ],
                    contacts: [
                        { type: "NSDL Helpline", value: "020-27218080" },
                        { type: "UTIITSL desk", value: "utiitsl.com" }
                    ]
                },
                {
                    name: "Property Tax",
                    desc: "Assess municipal residential or commercial properties and compute and clear pending land/house tax balances.",
                    icon: "ph ph-buildings",
                    eligibility: [
                        "Must own residential, commercial, or vacant land within municipal limits."
                    ],
                    documents: [
                        "Previous property tax receipts / Index Copy",
                        "Unique Property Identification Code (PID)",
                        "Ownership deeds or sale deeds"
                    ],
                    processingTime: "Instant (online settlement)",
                    fee: "Variable (Depends on built-up area and zone rates)",
                    animationType: "tax",
                    faqs: [
                        { q: "Is property tax paid annually?", a: "Yes, property tax is computed and cleared annually to local municipal bodies." },
                        { q: "What happens if I delay property tax payments?", a: "Delayed dues attract an interest surcharge (usually 1-2% per month) on the pending tax value." }
                    ],
                    contacts: [
                        { type: "Local Municipal Support", value: "Call local Urban Authority portal" }
                    ]
                },
                {
                    name: "Pension Services",
                    desc: "Enroll in central citizen retirement benefit programs, track EPF balances, and check monthly pension credits.",
                    icon: "ph ph-hand-heart",
                    eligibility: [
                        "Employees provident fund members, or senior citizens aged 60+ (for welfare pensions)."
                    ],
                    documents: [
                        "Universal Account Number (UAN) / EPFO Registration Code",
                        "Aadhaar Card & Bank Account statement",
                        "Life Certificate (Jeevan Pramaan) for retired pensioners"
                    ],
                    processingTime: "7 - 15 Working Days for EPF claims",
                    fee: "Free",
                    animationType: "tax",
                    faqs: [
                        { q: "How can I check my EPF balance?", a: "You can check your balance via the Unified Member portal, SMS, or using the Umang app." },
                        { q: "What is Jeevan Pramaan?", a: "A digital biometric life certificate for pensioners, eliminating the need to physically present oneself at banks." }
                    ],
                    contacts: [
                        { type: "EPFO Helpdesk", value: "1800-118-005" },
                        { type: "Jeevan Pramaan Support", value: "jeevanpramaan.gov.in" }
                    ]
                }
            ]
        },
        "Health & Family": {
            desc: "Register for Ayushman Bharat health insurance, book vaccination slots, view digital health logs, and search hospital facilities.",
            icon: "ph ph-first-aid",
            services: [
                {
                    name: "Ayushman Bharat",
                    desc: "Apply for a golden PM-JAY health coverage card, search empanelled hospitals, and claim cash-free treatment up to ₹5 Lakhs per family.",
                    icon: "ph ph-shield-check",
                    eligibility: [
                        "Identified families under SECC-2011 registry data.",
                        "Families holding eligible ration/priority category cards."
                    ],
                    documents: [
                        "Ration Card / PM Letter copy",
                        "Aadhaar Card of the applicant",
                        "Active mobile number"
                    ],
                    processingTime: "3 - 5 Working Days",
                    fee: "Free (Golden card issuance is free)",
                    animationType: "health",
                    faqs: [
                        { q: "Is there a limit on family size?", a: "No, there is no limit on family size, gender, or age under the PM-JAY health scheme." },
                        { q: "Are pre-existing diseases covered?", a: "Yes, all pre-existing diseases are covered from Day 1 of card activation." }
                    ],
                    contacts: [
                        { type: "Toll Free Helpline", value: "14555 / 1800-111-565" },
                        { type: "Official Portal", value: "pmjay.gov.in" }
                    ]
                },
                {
                    name: "Vaccination",
                    desc: "Book vaccine appointments, secure digital vaccination certifications, and schedule second/booster doses.",
                    icon: "ph ph-syringe",
                    eligibility: [
                        "Open to all citizens based on prevailing health guidelines and age thresholds."
                    ],
                    documents: [
                        "Aadhaar Card, Passport, or Voter ID for verification at center",
                        "Registered mobile number (for CoWIN/OTP log)"
                    ],
                    processingTime: "Instant certification post-jab",
                    fee: "Free (Govt centers), Variable (Private centers)",
                    animationType: "health",
                    faqs: [
                        { q: "Can I download my vaccine certificate online?", a: "Yes, certificates can be downloaded instantly via the CoWIN portal, DigiLocker, or Umang app." },
                        { q: "How can I correct spelling mistakes in my certificate?", a: "Log in to the CoWIN portal, click 'Raise an Issue', and select 'Correction in Certificate' options." }
                    ],
                    contacts: [
                        { type: "CoWIN Helpdesk", value: "+91-11-23978046" },
                        { type: "Support Email", value: "cowinhelpdesk@mohfw.gov.in" }
                    ]
                },
                {
                    name: "Health Records",
                    desc: "Generate your unique Ayushman Bharat Health Account (ABHA ID), link doctor prescriptions, and share medical logs securely.",
                    icon: "ph ph-file-text",
                    eligibility: [
                        "All citizens of India."
                    ],
                    documents: [
                        "Aadhaar Card or Driving License",
                        "Mobile number linked to Aadhaar"
                    ],
                    processingTime: "Instant generation",
                    fee: "Free",
                    animationType: "health",
                    faqs: [
                        { q: "What is ABHA ID?", a: "A unique 14-digit health identity card that serves as the foundation for digital health records." },
                        { q: "Is sharing records safe?", a: "Yes, health records are encrypted and shared only post explicit consent from the ABHA cardholder." }
                    ],
                    contacts: [
                        { type: "ABDM Help Desk", value: "1800-11-4477" },
                        { type: "Official Portal", value: "abdm.gov.in" }
                    ]
                },
                {
                    name: "Hospital Services",
                    desc: "Search public clinical resources, consult empanelled specialists, and schedule diagnostic checkups.",
                    icon: "ph ph-first-aid-kit",
                    eligibility: [
                        "Open to all citizens requiring medical care."
                    ],
                    documents: [
                        "Patient details, previous medical history sheets, and reference prescriptions."
                    ],
                    processingTime: "Same day (scheduling is instant)",
                    fee: "Free (Govt consultations), Variable (Private partners)",
                    animationType: "health",
                    faqs: [
                        { q: "Can I schedule telemedicine consultations?", a: "Yes, via the eSanjeevani portal, patients can video consult government doctors for free." }
                    ],
                    contacts: [
                        { type: "eSanjeevani Helpline", value: "1800-11-2026" }
                    ]
                }
            ]
        },
        "Education & Careers": {
            desc: "Register for national/state scholarships, apply for student credentials, check board results, and access skill training.",
            icon: "ph ph-graduation-cap",
            services: [
                {
                    name: "Scholarships",
                    desc: "File application forms under the National Scholarship Portal (NSP), submit income verification papers, and track merit clearances.",
                    icon: "ph ph-graduation-cap",
                    eligibility: [
                        "Students enrolled in certified schools/universities.",
                        "Annual family income must lie within the specified scholarship category thresholds (e.g. < ₹2.5L)."
                    ],
                    documents: [
                        "Income Certificate signed by Tehsildar",
                        "Caste/Community Certificate (if applicable)",
                        "Previous Year Marksheet / Admission receipt",
                        "Student Bank account passbook (linked to Aadhaar)"
                    ],
                    processingTime: "30 - 60 Working Days (Depends on institution audit)",
                    fee: "Free",
                    animationType: "education",
                    faqs: [
                        { q: "Can I apply for more than one scholarship?", a: "No, a student can apply for and receive only one scholarship under NSP guidelines per academic year." },
                        { q: "What is institute verification?", a: "The designated officer at your school/college must verify your uploaded documents on the portal for the application to proceed." }
                    ],
                    contacts: [
                        { type: "NSP Help Desk", value: "0120-6619540" },
                        { type: "Support Mail", value: "helpdesk@nsp.gov.in" }
                    ]
                },
                {
                    name: "Student Certificates",
                    desc: "Request certified migration certificates, secure duplicates of board mark sheets, and verify academic transcripts.",
                    icon: "ph ph-certificate",
                    eligibility: [
                        "Students who successfully passed exams under designated state boards or national boards (CBSE/ICSE)."
                    ],
                    documents: [
                        "Roll Number and Examination Year details",
                        "Aadhaar Card / School ID proof",
                        "Copy of previous mark sheet (if applying for corrections)"
                    ],
                    processingTime: "5 - 10 Working Days",
                    fee: "₹ 100 - ₹ 300 (Depending on board)",
                    animationType: "education",
                    faqs: [
                        { q: "Can I pull my duplicate marksheet via DigiLocker?", a: "Yes, legally valid electronic copies of certificates are accessible on DigiLocker for most boards." }
                    ],
                    contacts: [
                        { type: "CBSE Support Desk", value: "cbse.gov.in helpdesk" }
                    ]
                },
                {
                    name: "Examination Results",
                    desc: "Access board matriculation scorecards, verify public testing records, and request re-evaluations.",
                    icon: "ph ph-file-text",
                    eligibility: [
                        "Candidates registered for national/state public board exams."
                    ],
                    documents: [
                        "Roll Number, Roll Code, and Date of Birth details."
                    ],
                    processingTime: "Instant display",
                    fee: "Free (Re-evaluation: ₹500/subject)",
                    animationType: "education",
                    faqs: [
                        { q: "How can I request verification of marks?", a: "You must apply online through your board's portal within 15 days of result declaration." }
                    ],
                    contacts: [
                        { type: "National Informatics Center", value: "results.gov.in portal" }
                    ]
                },
                {
                    name: "Skill Development",
                    desc: "Enroll in government vocational training courses (PMKVY), acquire career skills, and secure placement support.",
                    icon: "ph ph-briefcase",
                    eligibility: [
                        "Unemployed youth, school dropouts, or professionals seeking upskilling certifications."
                    ],
                    documents: [
                        "Aadhaar Card & proof of age",
                        "Educational certificate (minimum qualification depends on course)"
                    ],
                    processingTime: "Immediate enrollment",
                    fee: "Free (Government sponsored)",
                    animationType: "education",
                    faqs: [
                        { q: "Are PMKVY courses free?", a: "Yes, the training and assessment fees are completely funded by the Ministry of Skill Development." }
                    ],
                    contacts: [
                        { type: "PMKVY Helpline", value: "1800-123-9626" },
                        { type: "Portal Support", value: "pmkvyofficial.org" }
                    ]
                }
            ]
        },
        "Agriculture & Farmers": {
            desc: "Apply for PM Kisan financial aid, claim crop damage compensation, register soil health parameters, and seek subsidies.",
            icon: "ph ph-plant",
            services: [
                {
                    name: "PM Kisan",
                    desc: "Register for Pradhan Mantri Kisan Samman Nidhi to receive annual direct income support of ₹6,000 in three installments.",
                    icon: "ph ph-user-check",
                    eligibility: [
                        "Landholder farmer families with cultivable land in their names.",
                        "Not under exclusion criteria (e.g. paying income tax, holding constitutional posts, professional career)."
                    ],
                    documents: [
                        "Land Ownership Records (Khata/Khasra/Patta papers)",
                        "Aadhaar Card of the applicant",
                        "Bank Account Passbook (linked with Aadhaar & NPCI enabled)"
                    ],
                    processingTime: "15 - 30 Working Days (Depends on Tehsildar approval)",
                    fee: "Free",
                    animationType: "agriculture",
                    faqs: [
                        { q: "Is Aadhaar linking mandatory for PM-Kisan?", a: "Yes, installments are released only through Aadhaar-based Direct Benefit Transfer (DBT)." },
                        { q: "What if my registration is rejected?", a: "You can check rejection remarks via the PM-Kisan portal and re-upload correct land index papers." }
                    ],
                    contacts: [
                        { type: "PM-Kisan Helpline", value: "155261 / 1800-115-526" },
                        { type: "Nodal Office", value: "pmkisan-ict@gov.in" }
                    ]
                },
                {
                    name: "Crop Insurance",
                    desc: "Enroll in PM Fasal Bima Yojana (PMFBY) to shield crops against natural hazards, droughts, and post-harvest damages.",
                    icon: "ph ph-shield-check",
                    eligibility: [
                        "All farmers growing notified crops in notified areas (both loanee and non-loanee farmers)."
                    ],
                    documents: [
                        "Land records copy (RoR/Patta copy)",
                        "Sowing Certificate signed by local Patwari / Agri inspector",
                        "Bank Passbook copy"
                    ],
                    processingTime: "Claims settled post-harvest audit",
                    fee: "Variable (Premium ranges from 1.5% to 5% of sum insured)",
                    animationType: "agriculture",
                    faqs: [
                        { q: "What is the timeline to report crop damage?", a: "Localized crop damage must be reported within 72 hours to the insurance company or agriculture desk." }
                    ],
                    contacts: [
                        { type: "PMFBY Help Desk", value: "1800-180-1551" },
                        { type: "Portal Address", value: "pmfby.gov.in" }
                    ]
                },
                {
                    name: "Soil Health Card",
                    desc: "Apply for systematic analysis of soil nutrient levels and access fertilizer suggestions tailored for crop health.",
                    icon: "ph ph-sparkles",
                    eligibility: [
                        "All landholding farmers in India."
                    ],
                    documents: [
                        "Aadhaar Card, land registration number, and soil sample collector slip."
                    ],
                    processingTime: "14 - 21 Days (Post soil sample analysis)",
                    fee: "Free",
                    animationType: "agriculture",
                    faqs: [
                        { q: "What parameters are tested in soil analysis?", a: "12 parameters: Macro-nutrients (N, P, K), Secondary nutrients (S), Micro-nutrients (Zn, Fe, Cu, Mn, B), and Physical parameters (pH, EC, OC)." }
                    ],
                    contacts: [
                        { type: "Local Soil Lab", value: "Contact block Krishi Vigyan Kendra" }
                    ]
                },
                {
                    name: "Subsidy Applications",
                    desc: "Apply for financial grants to purchase solar irrigation pumps, advanced tractors, and high-yield crop seeds.",
                    icon: "ph ph-coins",
                    eligibility: [
                        "Active farmers holding cultivable land records."
                    ],
                    documents: [
                        "Land ownership document (RoR)",
                        "Bank details & Aadhaar card",
                        "Quotation for target agricultural machinery (if applicable)"
                    ],
                    processingTime: "30 Working Days",
                    fee: "Free",
                    animationType: "agriculture",
                    faqs: [
                        { q: "What is PM-KUSUM scheme?", a: "A subsidy program providing up to 60% funds to install solar water pumps on farmlands." }
                    ],
                    contacts: [
                        { type: "Krishi Helpline", value: "1800-180-1551" }
                    ]
                }
            ]
        },
        "Utilities & Bills": {
            desc: "Submit requests for power lines, clear residential/commercial electricity and water bills, and book LPG cylinders.",
            icon: "ph ph-lightning",
            services: [
                {
                    name: "Electricity Bills",
                    desc: "Access digital bills, compute domestic load usage, apply for solar grid connections, and make instant billing clearances.",
                    icon: "ph ph-lightning",
                    eligibility: [
                        "Any resident holding a valid consumer account connection code with regional distribution boards."
                    ],
                    documents: [
                        "10-digit consumer connection ID (printed on physical bills)",
                        "Aadhaar card (required only for registration name changes)"
                    ],
                    processingTime: "Instant (online settlement)",
                    fee: "Free (Transaction fee may apply on some bank cards)",
                    animationType: "utilities",
                    faqs: [
                        { q: "How can I check my consumption history?", a: "Log in to the regional DISCOM board portal or view previous statements via the mobile bill portal." }
                    ],
                    contacts: [
                        { type: "DISCOM Customer Support", value: "1912 (Toll Free)" }
                    ]
                },
                {
                    name: "Water Bills",
                    desc: "Clear municipal water supply taxes, monitor water readings, and request new pipeline tap connections.",
                    icon: "ph ph-drop",
                    eligibility: [
                        "Property owners with active water supply connections from Municipal boards."
                    ],
                    documents: [
                        "Municipal Water Connection Number / Consumer ID.",
                        "Previous water bill copy."
                    ],
                    processingTime: "Instant online receipt",
                    fee: "Free",
                    animationType: "utilities",
                    faqs: [
                        { q: "How can I apply for a new water connection?", a: "Submit an online request on the municipal portal with property registration deeds and water layout diagrams." }
                    ],
                    contacts: [
                        { type: "Jal Board Support", value: "Local Municipal helpline" }
                    ]
                },
                {
                    name: "LPG Services",
                    desc: "Book LPG cooking gas cylinders, modify subsidy registration details, and apply for connection transfers.",
                    icon: "ph ph-fire",
                    eligibility: [
                        "Registered consumer of Indane, HP Gas, or Bharat Gas."
                    ],
                    documents: [
                        "17-digit LPG Client ID",
                        "LPG Blue Book copy",
                        "Aadhaar card linked with bank account (for DBTL subsidy)"
                    ],
                    processingTime: "24 - 48 Hours for cylinder dispatch",
                    fee: "Depends on monthly cylinder pricing",
                    animationType: "utilities",
                    faqs: [
                        { q: "What is PM Ujjwala Yojana?", a: "A scheme providing free LPG connections to women from BPL households." }
                    ],
                    contacts: [
                        { type: "LPG Booking Helpline", value: "1800-233-3555" }
                    ]
                },
                {
                    name: "Broadband Services",
                    desc: "Pay state telecom bills, request new landline installations, and check active fiber line connections.",
                    icon: "ph ph-wifi-high",
                    eligibility: [
                        "Broadband/Fiber consumers of state BSNL or private partners."
                    ],
                    documents: [
                        "Broadband Account Number / Landline Billing Number."
                    ],
                    processingTime: "Instant payment processing",
                    fee: "Variable billing charges",
                    animationType: "utilities",
                    faqs: [
                        { q: "How can I report a broadband outage?", a: "Call the customer support center or raise an issue ticket on their subscriber app." }
                    ],
                    contacts: [
                        { type: "BSNL Customer Care", value: "1800-345-1500" }
                    ]
                }
            ]
        },
        "Business & Industry": {
            desc: "Company incorporation, MSME verification, trade licenses, startup registrations, and compliance certificates.",
            icon: "ph ph-briefcase",
            services: [
                {
                    name: "Company Incorporation",
                    desc: "Register a fresh company (Private Limited, OPC, LLP) through SPICe+ web form on MCA portal.",
                    icon: "ph ph-buildings",
                    eligibility: ["Any resident citizen aged 18+ can become a director."],
                    documents: ["PAN card, Aadhaar card, Address Proof, Digital Signature (DSC)"],
                    processingTime: "5 - 7 Working Days",
                    fee: "Variable (Depends on authorized share capital)",
                    animationType: "tax",
                    faqs: [{ q: "What is DIN?", a: "Director Identification Number, required for incorporation." }],
                    contacts: [{ type: "MCA Helpdesk", value: "0124-4832500" }]
                },
                {
                    name: "MSME Verification",
                    desc: "Acquire Udyam Registration certificate for small/medium business benefits.",
                    icon: "ph ph-shield-check",
                    eligibility: ["Micro, Small, and Medium Enterprises satisfying investment criteria."],
                    documents: ["Aadhaar card, PAN card, GSTIN (if applicable)"],
                    processingTime: "1 - 2 Working Days",
                    fee: "Free",
                    animationType: "tax",
                    faqs: [{ q: "Is Udyam registration free?", a: "Yes, it is completely free of charge on the government portal." }],
                    contacts: [{ type: "MSME desk", value: "udyamregistration.gov.in" }]
                }
            ]
        },
        "Law & Justice": {
            desc: "Access e-Courts case status, online FIR filing, police verification certificates, and national legal aid services.",
            icon: "ph ph-gavel",
            services: [
                {
                    name: "e-Courts Case Status",
                    desc: "Search case files, check hearing dates, and download judicial judgments online.",
                    icon: "ph ph-gavel",
                    eligibility: ["Open to all litigants, legal practitioners, and citizens."],
                    documents: ["CNR Number, Case Number, or Party Name details"],
                    processingTime: "Instant search",
                    fee: "Free",
                    animationType: "housing",
                    faqs: [{ q: "What is CNR number?", a: "A unique 16-character alphanumeric code assigned to every case." }],
                    contacts: [{ type: "e-Courts Desk", value: "ecourts.gov.in" }]
                },
                {
                    name: "Online FIR Filing",
                    desc: "Register complaints online for theft, lost documents, or non-cognizable reports.",
                    icon: "ph ph-file-text",
                    eligibility: ["Victim or informant of a crime incident."],
                    documents: ["Incident details, place description, and supporting files"],
                    processingTime: "24 Hours (FIR copy issued post validation)",
                    fee: "Free",
                    animationType: "housing",
                    faqs: [{ q: "Can I file an online FIR for any crime?", a: "Online FIR is mostly restricted to non-heinous crimes (theft, vehicle loss, etc.) depending on state police portals." }],
                    contacts: [{ type: "National Police Portal", value: "Dial 112 / State Police Desk" }]
                }
            ]
        },
        "Welfare & Pensions": {
            desc: "Apply for old age pension, widow support, disability pension, EPFO services, and national welfare cards.",
            icon: "ph ph-hand-heart",
            services: [
                {
                    name: "Old Age Pension",
                    desc: "Apply for state/national senior citizen pension support programs (IGNOAPS).",
                    icon: "ph ph-heart",
                    eligibility: ["Senior citizens aged 60+ belonging to BPL households."],
                    documents: ["Aadhaar card, BPL Ration Card, Age proof, Bank Account details"],
                    processingTime: "30 - 45 Working Days",
                    fee: "Free",
                    animationType: "aadhaar",
                    faqs: [{ q: "How much pension is paid?", a: "Varies by state (ranges from ₹200 to ₹3,000 per month)." }],
                    contacts: [{ type: "Welfare Desk", value: "Contact local Gram Panchayat or Tehsildar" }]
                }
            ]
        },
        "Housing & Property": {
            desc: "Property registration details, land mutations, building plan approvals, housing board allotment schemes.",
            icon: "ph ph-buildings",
            services: [
                {
                    name: "Property Registration",
                    desc: "Register sale deeds, gift deeds, or lease documents with local sub-registrar office.",
                    icon: "ph ph-buildings",
                    eligibility: ["Buyer and seller of property."],
                    documents: ["Sale Deed, Index copy, PAN cards, Stamp Duty proof"],
                    processingTime: "15 - 30 Working Days",
                    fee: "Stamp Duty & Registration fee (variable by state)",
                    animationType: "housing",
                    faqs: [{ q: "Is stamp duty payment mandatory?", a: "Yes, it is legally mandatory to pay stamp duty to validate property registry deeds." }],
                    contacts: [{ type: "Registrar Office", value: "State Revenue Department portal" }]
                }
            ]
        },
        "Ration & Food Security": {
            desc: "Apply for new ration card, check distribution status, grain subsidy, fair price shop locator.",
            icon: "ph ph-shopping-bag",
            services: [
                {
                    name: "New Ration Card",
                    desc: "Apply for NFSA priority household (PHH) or Antyodaya Anna Yojana (AAY) subsidized food cards.",
                    icon: "ph ph-cardholder",
                    eligibility: ["Resident households satisfying state income limits (BPL/NFSA criteria)."],
                    documents: ["Family head Aadhaar card, Photo, Income certificate, Gas connection book"],
                    processingTime: "15 Working Days",
                    fee: "Free (₹5 - ₹10 nominal card charge)",
                    animationType: "ration",
                    faqs: [{ q: "What is NFSA card?", a: "National Food Security Act card providing monthly subsidized grain per member." }],
                    contacts: [{ type: "PDS Helpdesk", value: "1967 (PDS Toll Free)" }]
                }
            ]
        },
        "Visa & Travel": {
            desc: "Indian visa application, OCI card services, international travel guidelines, external affairs support.",
            icon: "ph ph-globe",
            services: [
                {
                    name: "Visa Application",
                    desc: "Request visitor visas, transit credentials, or business travel passes for international routing.",
                    icon: "ph ph-airplane-tilt",
                    eligibility: ["Foreign nationals traveling to India, or Indian passport holders seeking outbound visa guides."],
                    documents: ["Valid Passport, Photograph, Flight itinerary, Invitation letter (if applicable)"],
                    processingTime: "3 - 5 Working Days (e-Visa)",
                    fee: "Variable by nationality",
                    animationType: "visa",
                    faqs: [{ q: "What is e-Visa India?", a: "A electronic travel authorization issued online for tourism, business, or medical travel." }],
                    contacts: [{ type: "Visa Support Helpline", value: "+91-11-24300666" }]
                }
            ]
        }
    };

    // State Variables
    let currentCategoryKey = "Identity & Citizenship";
    let currentServiceObj = null;
    let wizardCurrentStep = 1;
    let recentSearches = JSON.parse(localStorage.getItem("portalRecentSearches") || "[]");
    let favoritesList = JSON.parse(localStorage.getItem("portalFavoritesList") || "[]");
    let savedServices = JSON.parse(localStorage.getItem("portalSavedServices") || "[]");
    let recentlyViewed = JSON.parse(localStorage.getItem("portalRecentlyViewed") || "[]");

    // Elements
    const portalOverlay = document.getElementById("servicePortalOverlay");
    const portalCategoryList = document.getElementById("portalCategoryList");
    const portalFavoritesList = document.getElementById("portalFavoritesList");
    const portalRecentList = document.getElementById("portalRecentList");
    const portalBreadcrumbs = document.getElementById("portalBreadcrumbs");
    
    const portalCategoryTitle = document.getElementById("portalCategoryTitle");
    const portalCategoryDesc = document.getElementById("portalCategoryDesc");
    const portalCategoryHeroIcon = document.getElementById("portalCategoryHeroIcon");
    const portalServicesGrid = document.getElementById("portalServicesGrid");
    
    const portalSearchInput = document.getElementById("portalSearchInput");
    const btnPortalSearchClear = document.getElementById("btnPortalSearchClear");
    const portalRecentSearches = document.getElementById("portalRecentSearches");
    const portalPopularSearches = document.getElementById("portalPopularSearches");
    
    const portalCategoryView = document.getElementById("portalCategoryView");
    const portalServiceDashboardView = document.getElementById("portalServiceDashboardView");
    const portalWizardView = document.getElementById("portalWizardView");
    const portalLoadingView = document.getElementById("portalLoadingView");
    
    // Action Buttons
    const btnPortalFav = document.getElementById("btnPortalFav");
    const btnPortalShare = document.getElementById("btnPortalShare");
    const btnPortalSave = document.getElementById("btnPortalSave");
    const closePortalBtn = document.getElementById("closePortalBtn");
    
    // Initialize Portal Sidebar Categories
    const initPortalCategories = () => {
        if (!portalCategoryList) return;
        portalCategoryList.innerHTML = '';
        Object.keys(citizenServicesData).forEach(catKey => {
            const item = document.createElement('li');
            item.className = `portal-category-item ${catKey === currentCategoryKey ? 'active' : ''}`;
            item.setAttribute('data-category', catKey);
            item.innerHTML = `
                <span>${catKey}</span>
                <span class="count">${citizenServicesData[catKey].services.length}</span>
            `;
            item.addEventListener('click', () => {
                currentCategoryKey = catKey;
                switchView("category");
                renderServices();
                updateSidebarActiveCategory();
            });
            portalCategoryList.appendChild(item);
        });
    };

    const updateSidebarActiveCategory = () => {
        document.querySelectorAll('.portal-category-item').forEach(item => {
            if (item.getAttribute('data-category') === currentCategoryKey) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

    // Render Services Grid inside Category View
    const renderServices = (filterQuery = '') => {
        if (!portalServicesGrid) return;
        portalServicesGrid.innerHTML = '';
        const categoryData = citizenServicesData[currentCategoryKey];
        if (!categoryData) return;
        
        portalCategoryTitle.textContent = currentCategoryKey;
        portalCategoryDesc.textContent = categoryData.desc;
        const iconClass = categoryData.icon || "ph ph-identification-card";
        portalCategoryHeroIcon.innerHTML = `<i class="${iconClass}"></i>`;
        
        const filtered = categoryData.services.filter(s => {
            if (!filterQuery) return true;
            return s.name.toLowerCase().includes(filterQuery) || s.desc.toLowerCase().includes(filterQuery);
        });
        
        if (filtered.length === 0) {
            portalServicesGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1;">
                    <i class="ph ph-warning-circle"></i>
                    <p>No citizen services found matching "${filterQuery}" in this sector.</p>
                </div>
            `;
            return;
        }
        
        filtered.forEach(s => {
            const card = document.createElement('div');
            card.className = 'service-item-card glass-panel';
            card.innerHTML = `
                <div class="card-glow-element"></div>
                <div class="icon-box"><i class="${s.icon || 'ph ph-app-window'}"></i></div>
                <h3>${highlightPortalText(s.name, filterQuery)}</h3>
                <p>${highlightPortalText(s.desc, filterQuery)}</p>
                <div class="card-footer">
                    <span>${s.processingTime}</span>
                    <span class="explore-btn-link">Explore Service <i class="ph ph-arrow-right"></i></span>
                </div>
            `;
            
            // Add click ripple effect
            card.addEventListener('click', (e) => {
                createRipple(e, card);
                setTimeout(() => {
                    openServiceDashboard(s);
                }, 150);
            });
            
            portalServicesGrid.appendChild(card);
        });
        
        updatePortalBreadcrumbs();
    };

    // Keyword Highlight Helper
    const highlightPortalText = (text, query) => {
        if (!query) return text;
        const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<mark class="highlight">$1</mark>');
    };

    // View Switcher (SPA Behavior)
    const switchView = (viewName) => {
        [portalCategoryView, portalServiceDashboardView, portalWizardView, portalLoadingView].forEach(view => {
            if (view) view.classList.add('hidden');
        });
        
        if (viewName === "category") {
            portalCategoryView.classList.remove('hidden');
            currentServiceObj = null;
            updatePortalBreadcrumbs();
            updateActionButtonStates();
        } else if (viewName === "dashboard") {
            portalServiceDashboardView.classList.remove('hidden');
            updatePortalBreadcrumbs();
            updateActionButtonStates();
        } else if (viewName === "wizard") {
            portalWizardView.classList.remove('hidden');
        } else if (viewName === "loading") {
            portalLoadingView.classList.remove('hidden');
        }
    };

    // Breadcrumbs System
    const updatePortalBreadcrumbs = () => {
        if (!portalBreadcrumbs) return;
        portalBreadcrumbs.innerHTML = '';
        
        const homeCrumb = document.createElement('span');
        homeCrumb.className = 'crumb';
        homeCrumb.textContent = 'Home';
        homeCrumb.addEventListener('click', () => {
            togglePortalOverlay(false);
        });
        portalBreadcrumbs.appendChild(homeCrumb);
        
        portalBreadcrumbs.appendChild(createCaret());
        
        const servicesCrumb = document.createElement('span');
        servicesCrumb.className = 'crumb';
        servicesCrumb.textContent = 'Services';
        servicesCrumb.addEventListener('click', () => {
            switchView("category");
        });
        portalBreadcrumbs.appendChild(servicesCrumb);
        
        if (currentCategoryKey) {
            portalBreadcrumbs.appendChild(createCaret());
            const catCrumb = document.createElement('span');
            catCrumb.className = currentServiceObj ? 'crumb' : 'crumb active';
            catCrumb.textContent = currentCategoryKey;
            catCrumb.addEventListener('click', () => {
                switchView("category");
            });
            portalBreadcrumbs.appendChild(catCrumb);
        }
        
        if (currentServiceObj) {
            portalBreadcrumbs.appendChild(createCaret());
            const sCrumb = document.createElement('span');
            sCrumb.className = 'crumb active';
            sCrumb.textContent = currentServiceObj.name;
            portalBreadcrumbs.appendChild(sCrumb);
        }
    };
    
    const createCaret = () => {
        const i = document.createElement('i');
        i.className = 'ph ph-caret-right separator';
        return i;
    };

    // Open Service Dashboard
    const openServiceDashboard = (service) => {
        currentServiceObj = service;
        switchView("loading");
        
        // Populate loading elements
        document.getElementById("loaderServiceName").textContent = service.name;
        const loadingIcon = document.getElementById("loaderIconWrapper").querySelector('i');
        if (loadingIcon) loadingIcon.className = service.icon || "ph ph-spinner";
        
        // Simulating transition and loading screen
        setTimeout(() => {
            switchView("dashboard");
            
            // Populate dashboard content
            document.getElementById("dashServiceName").textContent = service.name;
            document.getElementById("dashServiceDesc").textContent = service.desc;
            document.getElementById("dashServiceCategory").textContent = currentCategoryKey;
            document.getElementById("dashServiceTime").textContent = service.processingTime;
            document.getElementById("dashServiceFee").textContent = service.fee;
            
            // Eligibility List
            const eligibilityList = document.getElementById("dashServiceEligibility");
            eligibilityList.innerHTML = '';
            service.eligibility.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                eligibilityList.appendChild(li);
            });
            
            // Documents List
            const docList = document.getElementById("dashServiceDocuments");
            docList.innerHTML = '';
            service.documents.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                docList.appendChild(li);
            });
            
            // FAQs Accordion
            const faqsContainer = document.getElementById("dashServiceFAQs");
            faqsContainer.innerHTML = '';
            service.faqs.forEach((faq, index) => {
                const faqItem = document.createElement('div');
                faqItem.className = 'faq-accordion-item';
                faqItem.innerHTML = `
                    <button class="faq-accordion-header">
                        <span>${faq.q}</span>
                        <i class="ph ph-caret-down"></i>
                    </button>
                    <div class="faq-accordion-content">
                        <p>${faq.a}</p>
                    </div>
                `;
                
                const header = faqItem.querySelector('.faq-accordion-header');
                const content = faqItem.querySelector('.faq-accordion-content');
                header.addEventListener('click', () => {
                    const isOpen = faqItem.classList.contains('open');
                    faqsContainer.querySelectorAll('.faq-accordion-item').forEach(item => {
                        item.classList.remove('open');
                        item.querySelector('.faq-accordion-content').style.maxHeight = null;
                    });
                    
                    if (!isOpen) {
                        faqItem.classList.add('open');
                        content.style.maxHeight = content.scrollHeight + "px";
                    }
                });
                faqsContainer.appendChild(faqItem);
            });
            
            // Contacts List
            const contactsContainer = document.getElementById("dashServiceContacts");
            contactsContainer.innerHTML = '';
            service.contacts.forEach(contact => {
                const item = document.createElement('div');
                item.className = 'contact-info-item';
                let iconClass = 'ph ph-phone';
                if (contact.type.toLowerCase().includes('email') || contact.value.includes('@')) {
                    iconClass = 'ph ph-envelope';
                } else if (contact.type.toLowerCase().includes('portal') || contact.type.toLowerCase().includes('website') || contact.value.includes('.gov')) {
                    iconClass = 'ph ph-globe';
                }
                item.innerHTML = `
                    <i class="${iconClass}"></i>
                    <div>
                        <span>${contact.type}</span>
                        <strong>${contact.value}</strong>
                    </div>
                `;
                contactsContainer.appendChild(item);
            });
            
            // Recommended Services
            const relatedContainer = document.getElementById("dashRelatedServices");
            relatedContainer.innerHTML = '';
            const allServicesInCat = citizenServicesData[currentCategoryKey].services;
            const related = allServicesInCat.filter(s => s.name !== service.name).slice(0, 3);
            related.forEach(relS => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <i class="${relS.icon || 'ph ph-arrow-square-out'}"></i>
                    <span>${relS.name}</span>
                `;
                li.addEventListener('click', () => {
                    openServiceDashboard(relS);
                });
                relatedContainer.appendChild(li);
            });
            
            // Ingest Animation
            renderHeroAnimation(service.animationType);
            
            // Track recently viewed
            addToRecentlyViewed(service);
            
            // Reset status tracker
            document.getElementById("portalTrackResultBox").classList.add("hidden");
            document.getElementById("portalTrackAppId").value = '';
            
        }, 800);
    };

    // Dynamic Animation Renderer
    const renderHeroAnimation = (animType) => {
        const stage = document.getElementById("serviceAnimationStage");
        if (!stage) return;
        stage.innerHTML = '';
        
        if (animType === "passport") {
            stage.innerHTML = `
                <div class="passport-anim-wrapper">
                    <div class="passport-card-element">
                        <span>REPUBLIC OF INDIA</span>
                        <i class="ph-fill ph-globe"></i>
                        <span>PASSPORT</span>
                    </div>
                </div>
            `;
        } else if (animType === "aadhaar") {
            stage.innerHTML = `
                <div class="aadhaar-anim-wrapper">
                    <div class="aadhaar-anim-photo"><i class="ph-fill ph-user-focus"></i></div>
                    <div class="aadhaar-anim-details">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div class="aadhaar-scan-line"></div>
                </div>
            `;
        } else if (animType === "tax") {
            stage.innerHTML = `
                <div class="anim-graphic-box">
                    <svg class="taxes-anim-svg" viewBox="0 0 140 100">
                        <g class="taxes-grid-lines" stroke="rgba(255,255,255,0.05)" stroke-width="1">
                            <line x1="10" y1="20" x2="130" y2="20" />
                            <line x1="10" y1="50" x2="130" y2="50" />
                            <line x1="10" y1="80" x2="130" y2="80" />
                        </g>
                        <path class="taxes-line-path" fill="none" stroke="var(--accent-color)" stroke-width="3" d="M10,80 Q40,60 70,30 T130,10" />
                        <g class="taxes-dots">
                            <circle cx="10" cy="80" r="4" fill="var(--accent-color)" />
                            <circle cx="40" cy="65" r="4" fill="var(--accent-color)" />
                            <circle cx="70" cy="30" r="4" fill="var(--accent-color)" />
                            <circle cx="130" cy="10" r="4" fill="var(--accent-color)" />
                        </g>
                    </svg>
                </div>
            `;
        } else if (animType === "health") {
            stage.innerHTML = `
                <div class="anim-graphic-box">
                    <svg class="health-anim-svg" viewBox="0 0 150 80">
                        <path class="ecg-line-path" fill="none" stroke="var(--danger-color)" stroke-width="3" d="M0,40 L40,40 L50,20 L60,60 L70,40 L90,40 L100,10 L110,70 L120,40 L150,40" />
                    </svg>
                </div>
            `;
        } else if (animType === "education") {
            stage.innerHTML = `
                <div class="edu-anim-box">
                    <i class="ph-fill ph-graduation-cap"></i>
                </div>
            `;
        } else if (animType === "agriculture") {
            stage.innerHTML = `
                <div class="anim-graphic-box">
                    <svg class="agri-anim-svg" viewBox="0 0 100 100">
                        <rect class="plant-pot" x="38" y="80" width="24" height="15" rx="3" fill="#8B4513" />
                        <path class="plant-stem" fill="none" stroke="var(--success-color)" stroke-width="3" d="M50,80 L50,35" />
                        <path class="plant-leaf-left" d="M50,60 Q35,50 38,42 Q45,47 50,60 Z" fill="var(--success-color)" />
                        <path class="plant-leaf-right" d="M50,48 Q65,38 62,30 Q55,35 50,48 Z" fill="var(--success-color)" />
                    </svg>
                </div>
            `;
        } else if (animType === "utilities") {
            stage.innerHTML = `
                <div class="anim-graphic-box">
                    <svg class="utilities-anim-svg" viewBox="0 0 130 90">
                        <path class="utility-pipe" fill="none" stroke="var(--border-solid)" stroke-width="6" d="M10,45 L120,45" />
                        <path class="utility-flow-line" fill="none" stroke="var(--primary-color)" stroke-width="4" d="M10,45 L120,45" />
                    </svg>
                </div>
            `;
        } else if (animType === "visa") {
            stage.innerHTML = `
                <div class="anim-graphic-box">
                    <svg class="travel-anim-svg" viewBox="0 0 140 100">
                        <path class="travel-path" fill="none" stroke="var(--border-solid)" stroke-width="2" d="M10,80 Q70,90 130,20" />
                        <g class="travel-plane">
                            <path d="M-10,-5 L10,0 L-10,5 L-5,0 Z" fill="var(--accent-color)" />
                        </g>
                    </svg>
                </div>
            `;
        } else if (animType === "ration") {
            stage.innerHTML = `
                <div class="ration-anim-wrapper">
                    <div class="ration-card-3d">
                        <div class="ration-card-face front">
                            <h4>RATION CARD</h4>
                            <span>Union Food Security</span>
                        </div>
                        <div class="ration-card-face back">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            `;
        } else if (animType === "housing") {
            stage.innerHTML = `
                <div class="anim-graphic-box">
                    <svg class="housing-anim-svg" viewBox="0 0 120 100">
                        <line class="house-ground" x1="10" y1="90" x2="110" y2="90" stroke="var(--border-solid)" stroke-width="3" />
                        <rect class="house-walls" x="30" y="50" width="60" height="40" fill="none" stroke="var(--primary-color)" stroke-width="3" />
                        <polygon class="house-roof" points="25,50 60,20 95,50" fill="none" stroke="var(--accent-color)" stroke-width="3" />
                        <rect class="house-door" x="52" y="68" width="16" height="22" fill="var(--border-solid)" />
                    </svg>
                </div>
            `;
        } else {
            stage.innerHTML = `<i class="ph ph-shield-check" style="font-size: 5rem; color: var(--primary-color);"></i>`;
        }
    };

    // Toggle Portal Visibility
    const togglePortalOverlay = (show) => {
        if (!portalOverlay) return;
        if (show) {
            portalOverlay.classList.remove('hidden');
            setTimeout(() => {
                portalOverlay.classList.add('open');
                document.body.classList.add('modal-open');
            }, 10);
            initPortalCategories();
            renderServices();
            renderFavorites();
            renderRecentlyViewed();
            loadRecentSearchTags();
        } else {
            portalOverlay.classList.remove('open');
            setTimeout(() => {
                portalOverlay.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }, 400);
        }
    };

    // Overwrite the clicks for "Explore Service" inside the standard servicesModal
    const attachCategoryClickOverrides = () => {
        const modalGrid = document.getElementById("modalServicesGrid");
        if (!modalGrid) return;
        const cards = modalGrid.querySelectorAll(".service-card");
        cards.forEach(card => {
            const heading = card.querySelector("h3");
            const link = card.querySelector(".card-link");
            if (!heading) return;
            const catName = heading.textContent.trim();
            
            const handleTrigger = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Close standard servicesModal
                const servicesModal = document.getElementById("servicesModal");
                if (servicesModal) {
                    servicesModal.classList.remove('open');
                    document.body.classList.remove('modal-open');
                }
                
                // Set and open portal overlay
                currentCategoryKey = catName;
                togglePortalOverlay(true);
            };
            
            if (link) {
                link.addEventListener('click', handleTrigger);
            }
            card.addEventListener('click', handleTrigger);
        });
    };

    // Run this override initialization on load
    setTimeout(attachCategoryClickOverrides, 500);

    // Watch for other Explore buttons across the page
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('a, button');
        if (target && target.textContent.includes('Explore Service') && !target.closest('#servicePortalOverlay')) {
            e.preventDefault();
            togglePortalOverlay(true);
        }
    });

    if (closePortalBtn) {
        closePortalBtn.addEventListener('click', () => {
            togglePortalOverlay(false);
        });
    }

    // Search Engine inside Portal overlay
    if (portalSearchInput) {
        portalSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query) {
                btnPortalSearchClear.style.display = 'block';
            } else {
                btnPortalSearchClear.style.display = 'none';
            }
            renderServices(query);
        });
        
        portalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const val = portalSearchInput.value.trim();
                if (val) addRecentSearch(val);
            }
        });
    }

    if (btnPortalSearchClear) {
        btnPortalSearchClear.addEventListener('click', () => {
            portalSearchInput.value = '';
            btnPortalSearchClear.style.display = 'none';
            renderServices();
        });
    }

    // Recent Searches tags management
    const loadRecentSearchTags = () => {
        if (!portalRecentSearches) return;
        portalRecentSearches.innerHTML = '';
        if (recentSearches.length === 0) {
            portalRecentSearches.innerHTML = '<span style="color:var(--text-muted);">None yet</span>';
            return;
        }
        recentSearches.slice(0, 4).forEach(term => {
            const tag = document.createElement('span');
            tag.className = 'search-tag';
            tag.textContent = term;
            tag.addEventListener('click', () => {
                portalSearchInput.value = term;
                btnPortalSearchClear.style.display = 'block';
                renderServices(term.toLowerCase());
            });
            portalRecentSearches.appendChild(tag);
        });
    };

    const addRecentSearch = (term) => {
        if (!term) return;
        recentSearches = recentSearches.filter(t => t.toLowerCase() !== term.toLowerCase());
        recentSearches.unshift(term);
        recentSearches = recentSearches.slice(0, 8);
        localStorage.setItem("portalRecentSearches", JSON.stringify(recentSearches));
        loadRecentSearchTags();
    };

    // Preloaded Popular Searches
    const initPopularSearches = () => {
        if (!portalPopularSearches) return;
        portalPopularSearches.innerHTML = '';
        const popular = ["Passport", "Aadhaar update", "Income Tax", "PM Kisan", "Birth Certificate"];
        popular.forEach(term => {
            const tag = document.createElement('span');
            tag.className = 'search-tag';
            tag.textContent = term;
            tag.addEventListener('click', () => {
                portalSearchInput.value = term;
                btnPortalSearchClear.style.display = 'block';
                // Find and switch category if needed
                findAndSetCategoryForSearch(term.toLowerCase());
                renderServices(term.toLowerCase());
            });
            portalPopularSearches.appendChild(tag);
        });
    };
    initPopularSearches();

    const findAndSetCategoryForSearch = (term) => {
        for (const [catKey, catVal] of Object.entries(citizenServicesData)) {
            const match = catVal.services.some(s => s.name.toLowerCase().includes(term) || s.desc.toLowerCase().includes(term));
            if (match) {
                currentCategoryKey = catKey;
                updateSidebarActiveCategory();
                break;
            }
        }
    };

    // Favorites Management
    const renderFavorites = () => {
        if (!portalFavoritesList) return;
        portalFavoritesList.innerHTML = '';
        if (favoritesList.length === 0) {
            portalFavoritesList.innerHTML = '<li style="padding:0.5rem;font-size:0.85rem;color:var(--text-muted);">No favorites added.</li>';
            return;
        }
        favoritesList.forEach(favName => {
            // Find service object
            const sObj = findServiceByName(favName);
            if (!sObj) return;
            const li = document.createElement('li');
            li.className = 'portal-fav-item';
            li.innerHTML = `
                <i class="ph-fill ph-heart"></i>
                <span>${favName}</span>
            `;
            li.addEventListener('click', () => {
                // Set category first
                currentCategoryKey = sObj.catKey;
                updateSidebarActiveCategory();
                openServiceDashboard(sObj);
            });
            portalFavoritesList.appendChild(li);
        });
    };

    const toggleFavorite = () => {
        if (!currentServiceObj) return;
        const name = currentServiceObj.name;
        if (favoritesList.includes(name)) {
            favoritesList = favoritesList.filter(n => n !== name);
            showToast(`${name} removed from favorites`, 'info');
        } else {
            favoritesList.push(name);
            showToast(`${name} added to favorites`, 'success');
        }
        localStorage.setItem("portalFavoritesList", JSON.stringify(favoritesList));
        renderFavorites();
        updateActionButtonStates();
    };

    // Saved Services
    const toggleSaved = () => {
        if (!currentServiceObj) return;
        const name = currentServiceObj.name;
        if (savedServices.includes(name)) {
            savedServices = savedServices.filter(n => n !== name);
            showToast(`${name} removed from saved list`, 'info');
        } else {
            savedServices.push(name);
            showToast(`${name} saved for convenience`, 'success');
        }
        localStorage.setItem("portalSavedServices", JSON.stringify(savedServices));
        updateActionButtonStates();
    };

    // Recently Viewed
    const renderRecentlyViewed = () => {
        if (!portalRecentList) return;
        portalRecentList.innerHTML = '';
        if (recentlyViewed.length === 0) {
            portalRecentList.innerHTML = '<li style="padding:0.5rem;font-size:0.85rem;color:var(--text-muted);">None viewed recently.</li>';
            return;
        }
        recentlyViewed.forEach(recName => {
            const sObj = findServiceByName(recName);
            if (!sObj) return;
            const li = document.createElement('li');
            li.className = 'portal-rec-item';
            li.innerHTML = `
                <i class="ph ph-clock-counter-clockwise"></i>
                <span>${recName}</span>
            `;
            li.addEventListener('click', () => {
                currentCategoryKey = sObj.catKey;
                updateSidebarActiveCategory();
                openServiceDashboard(sObj);
            });
            portalRecentList.appendChild(li);
        });
    };

    const addToRecentlyViewed = (service) => {
        recentlyViewed = recentlyViewed.filter(n => n !== service.name);
        recentlyViewed.unshift(service.name);
        recentlyViewed = recentlyViewed.slice(0, 5);
        localStorage.setItem("portalRecentlyViewed", JSON.stringify(recentlyViewed));
        renderRecentlyViewed();
    };

    // Action button state updates (Fav/Save icons toggles)
    const updateActionButtonStates = () => {
        if (!currentServiceObj) {
            btnPortalFav.style.display = 'none';
            btnPortalSave.style.display = 'none';
            btnPortalShare.style.display = 'none';
            return;
        }
        
        btnPortalFav.style.display = 'flex';
        btnPortalSave.style.display = 'flex';
        btnPortalShare.style.display = 'flex';
        
        if (favoritesList.includes(currentServiceObj.name)) {
            btnPortalFav.classList.add('active');
            btnPortalFav.querySelector('i').className = 'ph-fill ph-heart';
        } else {
            btnPortalFav.classList.remove('active');
            btnPortalFav.querySelector('i').className = 'ph ph-heart';
        }
        
        if (savedServices.includes(currentServiceObj.name)) {
            btnPortalSave.classList.add('active');
            btnPortalSave.querySelector('i').className = 'ph-fill ph-bookmark';
        } else {
            btnPortalSave.classList.remove('active');
            btnPortalSave.querySelector('i').className = 'ph ph-bookmark';
        }
    };

    // Share link feature
    if (btnPortalShare) {
        btnPortalShare.addEventListener('click', () => {
            if (!currentServiceObj) return;
            const shareUrl = `${window.location.origin}${window.location.pathname}?service=${encodeURIComponent(currentServiceObj.name)}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast(`Share link copied: ${currentServiceObj.name}`, 'success');
            }).catch(() => {
                showToast(`Unable to copy link to clipboard.`, 'danger');
            });
        });
    }

    if (btnPortalFav) btnPortalFav.addEventListener('click', toggleFavorite);
    if (btnPortalSave) btnPortalSave.addEventListener('click', toggleSaved);

    // Helper: Find service object by name
    const findServiceByName = (name) => {
        for (const [catKey, catVal] of Object.entries(citizenServicesData)) {
            const found = catVal.services.find(s => s.name === name);
            if (found) {
                return { ...found, catKey: catKey };
            }
        }
        return null;
    };

    // Dashboard Quick Actions Handlers
    const btnDashApplyNow = document.getElementById("btnDashApplyNow");
    const btnDashTrackApp = document.getElementById("btnDashTrackApp");
    const btnDashDownloadForms = document.getElementById("btnDashDownloadForms");
    const btnDashViewGuidelines = document.getElementById("btnDashViewGuidelines");
    const btnDashContactSupport = document.getElementById("btnDashContactSupport");

    if (btnDashApplyNow) {
        btnDashApplyNow.addEventListener('click', () => {
            if (currentServiceObj) openWizardFlow(currentServiceObj);
        });
    }

    if (btnDashTrackApp) {
        btnDashTrackApp.addEventListener('click', () => {
            const trackSection = document.querySelector(".tracking-dashboard-card");
            if (trackSection) {
                trackSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.getElementById("portalTrackAppId").focus();
            }
        });
    }

    if (btnDashDownloadForms) {
        btnDashDownloadForms.addEventListener('click', () => {
            if (!currentServiceObj) return;
            showToast(`Downloading official application PDF manual for ${currentServiceObj.name}...`, 'success');
            const link = document.createElement('a');
            // Minimal 1-page valid PDF data URI
            link.href = 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iagoyIDAgb2JqCiAgPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKICA8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA1OTUgODQyXS9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCiAgPDwvTGVuZ3RoIDU5Pj5zdHJlYW0KQlQKICAvRjEgMjQgVGYKICA3MiA3MTIgVGQKICAoTW9jayBHb3Zlcm5tZW50IEFwcGxpY2F0aW9uIEZvcm0pIFRqCkUKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMTUgMDAwMDAgbiAKdHJhaWxlcgogIDw8L1NpemUgNS9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjMyMgolJUVPRg==';
            link.setAttribute('download', `${currentServiceObj.name.replace(/\s+/g, '_')}_Form.pdf`);
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                link.remove();
                showToast(`Form download completed!`, 'success');
            }, 1200);
        });
    }

    if (btnDashViewGuidelines) {
        btnDashViewGuidelines.addEventListener('click', () => {
            if (!currentServiceObj) return;
            // Re-use standard guidelines preview modal
            const previewModal = document.getElementById('filePreviewModal');
            if (previewModal) {
                document.getElementById('previewTitle').textContent = `${currentServiceObj.name} - Service Guidelines`;
                document.getElementById('previewInfo').textContent = `Official single-window guidelines for ${currentCategoryKey}`;
                
                let eliHtml = '';
                currentServiceObj.eligibility.forEach(e => eliHtml += `<li>${e}</li>`);
                let docHtml = '';
                currentServiceObj.documents.forEach(d => docHtml += `<li>${d}</li>`);
                
                document.getElementById('previewBody').innerHTML = `
                    <div style="color:var(--text-primary); line-height:1.6; font-family:var(--font-body);">
                        <h4 style="color:var(--primary-color); margin-bottom:0.5rem;">Eligibility Criteria</h4>
                        <ul style="padding-left:1.25rem; margin-bottom:1rem;">${eliHtml}</ul>
                        <h4 style="color:var(--primary-color); margin-bottom:0.5rem;">Required Documents</h4>
                        <ul style="padding-left:1.25rem; margin-bottom:1rem;">${docHtml}</ul>
                        <div style="background:rgba(37,99,235,0.05); padding:1rem; border-radius:8px; border-left:4px solid var(--primary-color);">
                            <strong>Security Note:</strong> All files uploaded to this digital registry are protected via biometric encryption hashes and are legally valid credentials.
                        </div>
                    </div>
                `;
                previewModal.classList.add('open');
                document.body.classList.add('modal-open');
            }
        });
    }

    if (btnDashContactSupport) {
        btnDashContactSupport.addEventListener('click', () => {
            if (!currentServiceObj) return;
            showToast(`Connecting with ${currentServiceObj.name} helpdesk...`, 'success');
            // Trigger chatbot interaction automatically as customer support
            const chatbotWindow = document.getElementById("chatbotWindow");
            const chatInputText = document.getElementById("chatInputText");
            const chatSendBtn = document.getElementById("chatSendBtn");
            if (chatbotWindow && chatInputText && chatSendBtn) {
                chatbotWindow.classList.add("open");
                chatInputText.value = `I need help regarding ${currentServiceObj.name}.`;
                chatInputText.focus();
                showToast(`Support chatbot activated. Press send or type your question.`, 'success');
            }
        });
    }

    // Live Application Tracking System inside Portal
    const btnPortalTrackQuery = document.getElementById("btnPortalTrackQuery");
    const portalTrackAppId = document.getElementById("portalTrackAppId");
    
    if (btnPortalTrackQuery && portalTrackAppId) {
        btnPortalTrackQuery.addEventListener('click', () => {
            const queryToken = portalTrackAppId.value.trim();
            if (!queryToken) {
                showToast(`Please enter an Application Token ID.`, 'warning');
                return;
            }
            
            // Search in local registry
            const matchedApp = applications.find(app => app.id === queryToken);
            const statusBox = document.getElementById("portalTrackResultBox");
            
            if (matchedApp) {
                document.getElementById("portalTrackAppName").textContent = matchedApp.name;
                const badge = document.getElementById("portalTrackStatusBadge");
                badge.textContent = matchedApp.status;
                
                // Color badges based on status
                if (matchedApp.status === "Approved") {
                    badge.className = "badge badge-success";
                } else if (matchedApp.status === "Rejected") {
                    badge.className = "badge badge-danger";
                } else {
                    badge.className = "badge badge-warning";
                }
                
                // Progress map
                const timelineSteps = statusBox.querySelectorAll(".timeline-step");
                timelineSteps.forEach(node => {
                    const stepNum = parseInt(node.getAttribute('data-step'));
                    node.classList.remove('active', 'completed');
                    if (stepNum === matchedApp.step) {
                        node.classList.add('active');
                    } else if (stepNum < matchedApp.step) {
                        node.classList.add('completed');
                    }
                });
                
                document.getElementById("portalTrackRemarks").textContent = `Remarks: ${matchedApp.remarks}`;
                statusBox.classList.remove("hidden");
                showToast(`Application record found!`, 'success');
            } else {
                // Mock match fallback for visual fidelity if it matches a format
                if (queryToken.startsWith("APP-2026-")) {
                    document.getElementById("portalTrackAppName").textContent = currentServiceObj ? currentServiceObj.name : "Citizen Service";
                    document.getElementById("portalTrackStatusBadge").textContent = "Under Review";
                    document.getElementById("portalTrackStatusBadge").className = "badge badge-warning";
                    
                    const timelineSteps = statusBox.querySelectorAll(".timeline-step");
                    timelineSteps.forEach(node => {
                        const stepNum = parseInt(node.getAttribute('data-step'));
                        node.classList.remove('active', 'completed');
                        if (stepNum === 3) node.classList.add('active');
                        else if (stepNum < 3) node.classList.add('completed');
                    });
                    
                    document.getElementById("portalTrackRemarks").textContent = "Remarks: Supporting credentials attached. Document screening is in progress.";
                    statusBox.classList.remove("hidden");
                    showToast(`Active application located.`, 'success');
                } else {
                    statusBox.classList.add("hidden");
                    showToast(`No application records matching "${queryToken}" found.`, 'danger');
                }
            }
        });
    }

    // =========================================================================
    // 5-Step Application Wizard Logic
    // =========================================================================
    const btnWizardPrev = document.getElementById("btnWizardPrev");
    const btnWizardNext = document.getElementById("btnWizardNext");
    const btnWizardSubmit = document.getElementById("btnWizardSubmit");
    const btnWizardCancel = document.getElementById("btnWizardCancel");
    const portalWizardForm = document.getElementById("portalWizardForm");
    
    let activeQuizAnswers = {};

    const openWizardFlow = (service) => {
        switchView("wizard");
        document.getElementById("wizardServiceTitle").textContent = `Apply for ${service.name}`;
        wizardCurrentStep = 1;
        activeQuizAnswers = {};
        
        // Reset Form checkboxes, inputs, and outputs
        document.getElementById("chkAgreeGuidelines").checked = false;
        document.getElementById("chkAgreeReview").checked = false;
        document.getElementById("quizValidationFeedback").classList.add("hidden");
        
        // Prefill form details with current logged-in user details if available
        const applyFullName = document.getElementById("applyFullName");
        const applyDob = document.getElementById("applyDob");
        const applyGender = document.getElementById("applyGender");
        const applyAadhaar = document.getElementById("applyAadhaar");
        const applyEmail = document.getElementById("applyEmail");
        const applyPhone = document.getElementById("applyPhone");
        const applyAddress = document.getElementById("applyAddress");
        const applyState = document.getElementById("applyState");
        const applyPinCode = document.getElementById("applyPinCode");
        const applyDeclType = document.getElementById("applyDeclType");

        if (applyFullName) applyFullName.value = currentUser ? (currentUser.displayName || "") : "Aarav Sharma";
        if (applyDob) applyDob.value = "1994-08-15";
        if (applyGender) applyGender.value = "Male";
        if (applyAadhaar) applyAadhaar.value = "543298761204";
        if (applyEmail) applyEmail.value = currentUser ? (currentUser.email || "") : "aarav.sharma@gov.in";
        if (applyPhone) applyPhone.value = "9876543210";
        if (applyAddress) applyAddress.value = "Flat 402, Shanti Vihar, Sector 15";
        if (applyState) applyState.value = "Delhi";
        if (applyPinCode) applyPinCode.value = "110001";
        if (applyDeclType) applyDeclType.value = `Official registration application for ${service.name}`;
        
        // Ingest dynamic components based on service type
        buildWizardQuiz(service);
        buildWizardUploads(service);
        
        updateWizardStepper();
    };

    const updateWizardStepper = () => {
        // Toggle Active pane
        document.querySelectorAll('.wizard-step-pane').forEach(pane => {
            if (parseInt(pane.getAttribute('data-step')) === wizardCurrentStep) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
        
        // Update nodes in stepper
        document.querySelectorAll('.stepper-node').forEach(node => {
            const stepNum = parseInt(node.getAttribute('data-step'));
            node.classList.remove('active', 'completed');
            if (stepNum === wizardCurrentStep) {
                node.classList.add('active');
            } else if (stepNum < wizardCurrentStep) {
                node.classList.add('completed');
            }
        });
        
        // Control buttons
        const navRow = document.getElementById("wizardNavRow");
        if (wizardCurrentStep === 6) {
            navRow.classList.add("hidden");
        } else {
            navRow.classList.remove("hidden");
        }
        
        btnWizardPrev.disabled = wizardCurrentStep === 1;
        
        if (wizardCurrentStep === 5) {
            btnWizardNext.classList.add('hidden');
            btnWizardSubmit.classList.remove('hidden');
        } else {
            btnWizardNext.classList.remove('hidden');
            btnWizardSubmit.classList.add('hidden');
        }
    };

    // Step 2 Quiz Builder
    const buildWizardQuiz = (service) => {
        const container = document.getElementById("wizardQuizContainer");
        if (!container) return;
        container.innerHTML = '';
        
        // Create 3 checks based on eligibility array or defaults
        const questions = service.eligibility.slice(0, 3);
        while (questions.length < 3) {
            questions.push("Are you currently residing in the jurisdiction area?");
        }
        
        questions.forEach((qText, index) => {
            const row = document.createElement('div');
            row.className = 'quiz-question-row';
            row.innerHTML = `
                <p>${qText}</p>
                <div class="quiz-answers-toggle" data-index="${index}">
                    <button type="button" class="btn-yes">Yes</button>
                    <button type="button" class="btn-no">No</button>
                </div>
            `;
            
            const btnYes = row.querySelector('.btn-yes');
            const btnNo = row.querySelector('.btn-no');
            
            btnYes.addEventListener('click', () => {
                btnYes.classList.add('selected');
                btnNo.classList.remove('selected');
                activeQuizAnswers[index] = "yes";
                validateQuizAnswers();
            });
            
            btnNo.addEventListener('click', () => {
                btnNo.classList.add('selected');
                btnYes.classList.remove('selected');
                activeQuizAnswers[index] = "no";
                validateQuizAnswers();
            });
            
            container.appendChild(row);
        });
    };

    const validateQuizAnswers = () => {
        const totalKeys = Object.keys(activeQuizAnswers).length;
        const feedback = document.getElementById("quizValidationFeedback");
        if (totalKeys < 3) {
            feedback.classList.add("hidden");
            return;
        }
        
        const allYes = Object.values(activeQuizAnswers).every(v => v === "yes");
        feedback.classList.remove("hidden");
        
        if (allYes) {
            feedback.className = "quiz-feedback-box pass";
            feedback.innerHTML = `
                <i class="ph ph-check-circle"></i> Eligibility Criteria Cleared! You qualify for dynamic portal submission.
            `;
        } else {
            feedback.className = "quiz-feedback-box fail";
            feedback.innerHTML = `
                <i class="ph ph-warning-circle"></i> Warning: Some checks did not match. Additional verification checks will be conducted post submission.
            `;
        }
    };

    // Step 3 Document Uploads Simulator
    const buildWizardUploads = (service) => {
        const grid = document.getElementById("wizardDocUploadGrid");
        if (!grid) return;
        grid.innerHTML = '';
        
        // Render upload boxes for required documents
        const docs = service.documents.slice(0, 2);
        while (docs.length < 2) {
            docs.push("Supporting Address Proof Document");
        }
        
        docs.forEach((docName, index) => {
            const card = document.createElement('div');
            card.className = 'upload-file-card';
            card.innerHTML = `
                <h4>${docName}</h4>
                <div class="upload-dropzone" data-index="${index}">
                    <i class="ph ph-cloud-arrow-up"></i>
                    <span>Drag & Drop files here, or click to choose from local disk</span>
                </div>
                <div class="upload-progress-row hidden">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill"></div>
                    </div>
                    <div class="progress-text">
                        <span class="pct">0%</span>
                        <span class="status">Uploading file...</span>
                    </div>
                </div>
            `;
            
            const dropzone = card.querySelector('.upload-dropzone');
            const progRow = card.querySelector('.upload-progress-row');
            const fill = card.querySelector('.progress-bar-fill');
            const pct = card.querySelector('.pct');
            const status = card.querySelector('.status');
            
            dropzone.addEventListener('click', () => {
                // Simulate document upload process with progress animation
                dropzone.style.display = 'none';
                progRow.classList.remove('hidden');
                
                let percent = 0;
                const interval = setInterval(() => {
                    percent += Math.floor(Math.random() * 20) + 10;
                    if (percent >= 100) {
                        percent = 100;
                        clearInterval(interval);
                        fill.style.width = '100%';
                        pct.textContent = '100%';
                        status.className = 'status status-done';
                        status.innerHTML = `<i class="ph ph-check"></i> Scanned Document Verified!`;
                        showToast(`Upload completed: ${docName}`, 'success');
                    } else {
                        fill.style.width = `${percent}%`;
                        pct.textContent = `${percent}%`;
                    }
                }, 150);
            });
            
            grid.appendChild(card);
        });
    };

    // Step 4 Review Table Builder
    const buildWizardReviewTable = () => {
        const tbody = document.getElementById("wizardReviewTableBody");
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (!currentServiceObj) return;

        // Grab form input values
        const fullName = document.getElementById("applyFullName")?.value || "Not provided";
        const dob = document.getElementById("applyDob")?.value || "Not provided";
        const gender = document.getElementById("applyGender")?.value || "Not provided";
        const aadhaar = document.getElementById("applyAadhaar")?.value || "Not provided";
        const email = document.getElementById("applyEmail")?.value || "Not provided";
        const phone = document.getElementById("applyPhone")?.value || "Not provided";
        const address = document.getElementById("applyAddress")?.value || "Not provided";
        const state = document.getElementById("applyState")?.value || "Not provided";
        const pinCode = document.getElementById("applyPinCode")?.value || "Not provided";
        const mode = document.getElementById("applyServiceMode")?.value || "Not provided";
        const reason = document.getElementById("applyDeclType")?.value || "Not provided";
        
        const rows = [
            { category: "Service Sector", val: currentCategoryKey },
            { category: "Applied Service", val: `<strong>${currentServiceObj.name}</strong>` },
            { category: "Applicant Full Name", val: fullName },
            { category: "Date of Birth & Gender", val: `${dob} (${gender})` },
            { category: "Aadhaar Card Number", val: aadhaar ? `xxxx-xxxx-${aadhaar.slice(-4)}` : "Not provided" },
            { category: "Contact details", val: `${email} / ${phone}` },
            { category: "Residential Address", val: `${address}, ${state} - ${pinCode}` },
            { category: "Service Delivery Mode", val: mode },
            { category: "Reason / Purpose", val: reason },
            { category: "Eligibility Evaluation", val: Object.values(activeQuizAnswers).every(v => v === "yes") ? "Pass" : "Warning (Post-audit required)" }
        ];
        
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600; width:35%; color:var(--text-secondary);">${r.category}</td>
                <td style="color:var(--text-primary);">${r.val}</td>
            `;
            tbody.appendChild(tr);
        });
    };

    // Navigation buttons binding
    if (btnWizardNext) {
        btnWizardNext.addEventListener('click', () => {
            if (wizardCurrentStep === 1) {
                // Checkbox check
                if (!document.getElementById("chkAgreeGuidelines").checked) {
                    showToast("Please agree to the guidelines first.", "warning");
                    return;
                }
            } else if (wizardCurrentStep === 2) {
                // Check quiz completed
                if (Object.keys(activeQuizAnswers).length < 3) {
                    showToast("Please answer all eligibility evaluation checks.", "warning");
                    return;
                }
            } else if (wizardCurrentStep === 3) {
                // Check form validations
                const formPane = document.querySelector('.wizard-step-pane[data-step="3"]');
                const inputs = formPane.querySelectorAll('input[required], select[required], textarea[required]');
                let isValid = true;
                inputs.forEach(input => {
                    if (!input.value.trim() || !input.checkValidity()) {
                        isValid = false;
                        input.reportValidity();
                    }
                });
                if (!isValid) {
                    showToast("Please fill in all required form details correctly.", "warning");
                    return;
                }
            } else if (wizardCurrentStep === 4) {
                // Check uploads (mock validation)
                const undone = Array.from(document.querySelectorAll('.upload-progress-row')).some(row => row.classList.contains('hidden') || row.querySelector('.pct').textContent !== '100%');
                if (undone) {
                    showToast("Please upload all supporting credentials first.", "warning");
                    return;
                }
                
                // Build step 5 review before navigating
                buildWizardReviewTable();
            }
            
            if (wizardCurrentStep < 6) {
                wizardCurrentStep++;
                updateWizardStepper();
            }
        });
    }

    if (btnWizardPrev) {
        btnWizardPrev.addEventListener('click', () => {
            if (wizardCurrentStep > 1) {
                wizardCurrentStep--;
                updateWizardStepper();
            }
        });
    }

    if (btnWizardCancel) {
        btnWizardCancel.addEventListener('click', () => {
            switchView("dashboard");
        });
    }

    // Submit Application click
    if (btnWizardSubmit) {
        btnWizardSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Check declare terms
            if (!document.getElementById("chkAgreeReview").checked) {
                showToast("Please check declaration agreement statement.", "warning");
                return;
            }
            
            // Create Application Record
            const trackingId = `APP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
            const dateStr = new Date().toISOString().split('T')[0];
            
            const newApp = {
                id: trackingId,
                name: currentServiceObj.name,
                applicant: document.getElementById("applyFullName")?.value || (currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : "Citizen Profile"),
                date: dateStr,
                status: "Under Review",
                step: 2,
                remarks: "Supporting documents uploaded. Database verification screening is in progress."
            };
            
            // Push into applications and sync central state
            applications.unshift(newApp);
            saveState();
            
            // Render updated dashboard tabs if functions exist
            if (typeof renderOverviewTab === 'function') renderOverviewTab();
            if (typeof renderAdminTab === 'function') renderAdminTab();
            
            // Populate receipt details
            document.getElementById("receiptTokenId").textContent = trackingId;
            document.getElementById("receiptServiceName").textContent = currentServiceObj.name;
            document.getElementById("receiptDate").textContent = dateStr;
            
            // Transition into success step
            wizardCurrentStep = 6;
            updateWizardStepper();
            
            showToast(`Application successfully written to registry! ID: ${trackingId}`, 'success');
            addNotification(`Submitted application for ${currentServiceObj.name} (Ref: ${trackingId})`, 'success');
        });
    }

    // Step 5 Receipt Actions
    const btnWizardReceiptClose = document.getElementById("btnWizardReceiptClose");
    const btnWizardReceiptPrint = document.getElementById("btnWizardReceiptPrint");

    if (btnWizardReceiptClose) {
        btnWizardReceiptClose.addEventListener('click', () => {
            switchView("dashboard");
            // Auto open status tracking with result
            const trackAppInput = document.getElementById("portalTrackAppId");
            const btnQuery = document.getElementById("btnPortalTrackQuery");
            const tokenText = document.getElementById("receiptTokenId").textContent;
            if (trackAppInput && btnQuery && tokenText) {
                trackAppInput.value = tokenText;
                btnQuery.click();
                
                // Scroll to tracking card
                const trackCard = document.querySelector(".tracking-dashboard-card");
                if (trackCard) {
                    trackCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }

    if (btnWizardReceiptPrint) {
        btnWizardReceiptPrint.addEventListener('click', () => {
            showToast("Generating official PDF acknowledgment slip...", "success");
            setTimeout(() => {
                showToast("Acknowledgment receipt saved to Downloads!", "success");
            }, 1000);
        });
    }

    // Ripple click micro-interactions helper
    const createRipple = (event, element) => {
        const circle = document.createElement("span");
        const diameter = Math.max(element.clientWidth, element.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - element.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${event.clientY - element.getBoundingClientRect().top - radius}px`;
        circle.classList.add("ripple-effect-portal");

        // Styling for ripple effect inside portal
        circle.style.position = "absolute";
        circle.style.borderRadius = "50%";
        circle.style.transform = "scale(0)";
        circle.style.animation = "ripplePortalAnim 0.6s linear";
        circle.style.backgroundColor = "rgba(37, 99, 235, 0.2)";
        circle.style.pointerEvents = "none";

        // CSS style injection for ripple keyframes if not defined
        if (!document.getElementById("ripplePortalKeyframes")) {
            const style = document.createElement("style");
            style.id = "ripplePortalKeyframes";
            style.innerHTML = `
                @keyframes ripplePortalAnim {
                    to { transform: scale(4); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        element.appendChild(circle);

        setTimeout(() => {
            circle.remove();
        }, 600);
    };

    // Initial page load triggers deep links (Check if URL contains service parameter)
    const initDeepLinks = () => {
        const params = new URLSearchParams(window.location.search);
        const sParam = params.get('service');
        if (sParam) {
            const serviceName = decodeURIComponent(sParam);
            const serviceObj = findServiceByName(serviceName);
            if (serviceObj) {
                currentCategoryKey = serviceObj.catKey;
                togglePortalOverlay(true);
                openServiceDashboard(serviceObj);
            }
        }
    };
    
    // Trigger deep links scanning on load
    setTimeout(initDeepLinks, 1000);

    // --- 18. Appointments System Logic ---
    const DEFAULT_SCHED_APPOINTMENTS = [
        { id: 'APT-2026-489012', service: 'Passport Biometric Verification', date: '2026-06-05', slot: '10:00 AM - 11:00 AM', status: 'Confirmed' }
    ];

    let schedAppointments = JSON.parse(localStorage.getItem('egov-sched-appointments')) || DEFAULT_SCHED_APPOINTMENTS;

    function saveAppointments() {
        localStorage.setItem('egov-sched-appointments', JSON.stringify(schedAppointments));
    }

    function renderAppointmentsTab() {
        const container = document.getElementById('appointmentsListContainer');
        if (!container) return;
        container.innerHTML = '';

        if (schedAppointments.length === 0) {
            container.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No upcoming scheduled appointments.</p>`;
            return;
        }

        schedAppointments.forEach(appt => {
            const card = document.createElement('div');
            card.className = 'appointment-item-card glass-panel';
            card.innerHTML = `
                <div class="appt-info">
                    <h4>${appt.service}</h4>
                    <div class="appt-meta">
                        <span><i class="ph ph-calendar"></i> ${appt.date}</span>
                        <span><i class="ph ph-clock"></i> ${appt.slot}</span>
                        <span><i class="ph ph-info" style="color: var(--success-color);"></i> Status: <strong style="color: var(--success-color);">${appt.status}</strong></span>
                    </div>
                </div>
                <div class="appt-actions">
                    <button class="btn btn-outline btn-sm" onclick="rescheduleAppointment('${appt.id}')">Reschedule</button>
                    <button class="btn btn-outline btn-sm" style="border-color: var(--danger-color); color: var(--danger-color);" onclick="cancelAppointment('${appt.id}')">Cancel</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Time slots grid radio buttons handler
    const slotBtns = document.querySelectorAll('#apptSlotsGrid .slot-radio-btn');
    const selectedSlotInput = document.getElementById('apptSelectedSlot');
    slotBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            slotBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            if (selectedSlotInput) selectedSlotInput.value = btn.getAttribute('data-slot');
        });
    });

    // Booking submit listener
    const bookingForm = document.getElementById('appointmentBookingForm');
    if (bookingForm) {
        // Remove previous listeners
        const newBookingForm = bookingForm.cloneNode(true);
        bookingForm.parentNode.replaceChild(newBookingForm, bookingForm);
        
        // Re-get slot buttons and input inside the cloned form
        const newSlotBtns = newBookingForm.querySelectorAll('#apptSlotsGrid .slot-radio-btn');
        const newSelectedSlotInput = newBookingForm.querySelector('#apptSelectedSlot');
        newSlotBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                newSlotBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                if (newSelectedSlotInput) newSelectedSlotInput.value = btn.getAttribute('data-slot');
            });
        });
        
        newBookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const service = newBookingForm.querySelector('#apptService').value;
            const date = newBookingForm.querySelector('#apptDate').value;
            const slot = newSelectedSlotInput.value;

            if (!service || !date || !slot) {
                addNotification('Please fill in all required fields and pick a slot.', 'error');
                return;
            }

            const newAppt = {
                id: 'APT-2026-' + Math.floor(Math.random() * 900000 + 100000),
                service: service,
                date: date,
                slot: slot,
                status: 'Confirmed'
            };

            schedAppointments.push(newAppt);
            saveAppointments();
            renderAppointmentsTab();
            
            // Reset form
            newBookingForm.reset();
            newSlotBtns.forEach(b => b.classList.remove('selected'));
            newSelectedSlotInput.value = '';
            
            addNotification('Appointment scheduled successfully!', 'success');
        });
    }

    window.rescheduleAppointment = function(id) {
        const appt = schedAppointments.find(a => a.id === id);
        if (!appt) return;

        // Prompt user for rescheduled date (simple mockup selector)
        const currentDate = new Date(appt.date);
        currentDate.setDate(currentDate.getDate() + 7); // Push forward 1 week
        const newDateStr = currentDate.toISOString().split('T')[0];
        
        appt.date = newDateStr;
        appt.slot = "11:00 AM - 12:00 PM"; // Change slot slightly
        saveAppointments();
        renderAppointmentsTab();
        
        addNotification(`Appointment rescheduled to ${newDateStr} at 11:00 AM.`, 'info');
    };

    window.cancelAppointment = function(id) {
        if (confirm("Are you sure you want to cancel this appointment?")) {
            schedAppointments = schedAppointments.filter(a => a.id !== id);
            saveAppointments();
            renderAppointmentsTab();
            addNotification('Appointment cancelled successfully.', 'info');
        }
    };

    // --- 19. Support Center Logic ---
    function renderSupportCenterTab() {
        const faqHeaders = document.querySelectorAll('#faqAccordionContainer .faq-header');
        faqHeaders.forEach(header => {
            // Remove previous event listeners
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            newHeader.addEventListener('click', (e) => {
                const item = newHeader.parentNode;
                const content = item.querySelector('.faq-content');
                const isOpen = item.classList.contains('open');
                
                // Close all other FAQ items
                document.querySelectorAll('#faqAccordionContainer .faq-item').forEach(itm => {
                    itm.classList.remove('open');
                    itm.querySelector('.faq-content').style.maxHeight = null;
                });
                
                if (!isOpen) {
                    item.classList.add('open');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });

        // Ticket filing form listener
        const ticketForm = document.getElementById('supportTicketForm');
        if (ticketForm) {
            // Remove previous listener
            const newForm = ticketForm.cloneNode(true);
            ticketForm.parentNode.replaceChild(newForm, ticketForm);
            
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const ticketId = 'TKT-2026-' + Math.floor(Math.random() * 900000 + 100000);
                addNotification(`Support Ticket raised successfully! Ticket ID: ${ticketId}`, 'success');
                newForm.reset();
            });
        }
        
        // Chat launcher
        const supportLaunchChatBtn = document.getElementById('supportLaunchChatBtn');
        if (supportLaunchChatBtn) {
            const newChatBtn = supportLaunchChatBtn.cloneNode(true);
            supportLaunchChatBtn.parentNode.replaceChild(newChatBtn, supportLaunchChatBtn);
            newChatBtn.addEventListener('click', () => {
                const cbw = document.getElementById('chatbotWindow');
                if (cbw) {
                    cbw.classList.add('open');
                    addNotification('Connected to E-Gov Assistant chat desk.', 'info');
                }
            });
        }
    }

    // --- 20. Profile Security Settings Logic ---
    function renderSecuritySettings() {
        const toggle2fa = document.getElementById('security2faToggle');
        if (toggle2fa) {
            toggle2fa.checked = JSON.parse(localStorage.getItem('egov-2fa-enabled')) || false;
            toggle2fa.onchange = () => {
                localStorage.setItem('egov-2fa-enabled', toggle2fa.checked);
                addNotification(toggle2fa.checked ? 'Two-Factor Authentication (2FA) enabled.' : 'Two-Factor Authentication (2FA) disabled.', 'info');
            };
        }

        const timeoutSelect = document.getElementById('securityTimeoutSelect');
        if (timeoutSelect) {
            timeoutSelect.value = localStorage.getItem('egov-session-timeout') || '30';
            timeoutSelect.onchange = () => {
                localStorage.setItem('egov-session-timeout', timeoutSelect.value);
                addNotification(`Inactivity session timeout set to ${timeoutSelect.value} minutes.`, 'info');
            };
        }

        // Populate Mock Active Devices
        const devicesList = document.getElementById('securityDevicesList');
        if (devicesList) {
            devicesList.innerHTML = `
                <div class="device-item" id="device-item-current">
                    <div class="device-details-box">
                        <i class="ph ph-laptop"></i>
                        <div class="device-item-info">
                            <span class="device-name">Chrome on Windows 11 (Current Session)</span>
                            <span class="device-meta">IP: 192.168.1.104 | Location: Bhopal, India</span>
                        </div>
                    </div>
                    <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.12); color: var(--success-color); padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600;">Active Now</span>
                </div>
                <div class="device-item" id="device-item-mobile">
                    <div class="device-details-box">
                        <i class="ph ph-device-mobile"></i>
                        <div class="device-item-info">
                            <span class="device-name">Safari on iPhone 15 Pro</span>
                            <span class="device-meta">IP: 103.45.2.19 | Location: Indore, India</span>
                        </div>
                    </div>
                    <button class="btn btn-outline btn-sm" style="border-color: var(--danger-color); color: var(--danger-color); padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="revokeDeviceSession('device-item-mobile')">Revoke</button>
                </div>
            `;
        }

        // Populate Mock Security Logs
        const logsBody = document.getElementById('securityLogsBody');
        if (logsBody) {
            logsBody.innerHTML = `
                <tr>
                    <td><strong>2026-05-29 10:52 AM</strong></td>
                    <td>192.168.1.104</td>
                    <td>Bhopal / BSNL Broadband</td>
                    <td>Chrome / Windows</td>
                    <td><span class="badge-status approved">Success</span></td>
                </tr>
                <tr>
                    <td><strong>2026-05-28 08:30 PM</strong></td>
                    <td>192.168.1.104</td>
                    <td>Bhopal / BSNL Broadband</td>
                    <td>Chrome / Windows</td>
                    <td><span class="badge-status approved">Success</span></td>
                </tr>
                <tr>
                    <td><strong>2026-05-28 08:28 PM</strong></td>
                    <td>192.168.1.104</td>
                    <td>Bhopal / BSNL Broadband</td>
                    <td>Chrome / Windows</td>
                    <td><span class="badge-status rejected" style="color: var(--danger-color); border-color: rgba(239, 68, 68, 0.2);">Failed (Wrong PW)</span></td>
                </tr>
                <tr>
                    <td><strong>2026-05-27 11:15 AM</strong></td>
                    <td>103.45.2.19</td>
                    <td>Indore / Jio Mobile</td>
                    <td>Safari / iOS</td>
                    <td><span class="badge-status approved">Success</span></td>
                </tr>
            `;
        }
    }

    window.revokeDeviceSession = function(deviceId) {
        if (confirm("Are you sure you want to revoke this session? The device will be signed out immediately.")) {
            const devEl = document.getElementById(deviceId);
            if (devEl) {
                devEl.remove();
                addNotification('Session revoked successfully.', 'success');
            }
        }
    };

    // --- My Applications Dashboard Logic & Actions ---
    let wizardSelectedFiles = [];

    function renderMyApplicationsTab() {
        const tableBody = document.getElementById('myAppsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const searchQuery = document.getElementById('myAppsSearch') ? document.getElementById('myAppsSearch').value.toLowerCase() : '';
        const categoryFilter = document.getElementById('myAppsCategoryFilter') ? document.getElementById('myAppsCategoryFilter').value : 'all';
        const statusFilter = document.getElementById('myAppsStatusFilter') ? document.getElementById('myAppsStatusFilter').value : 'all';
        const sortBy = document.getElementById('myAppsSort') ? document.getElementById('myAppsSort').value : 'desc';

        const getDept = (name) => {
            if (name.toLowerCase().includes('license') || name.toLowerCase().includes('driving')) return 'Transport';
            if (name.toLowerCase().includes('tax') || name.toLowerCase().includes('finance')) return 'Finance & Revenue';
            if (name.toLowerCase().includes('birth') || name.toLowerCase().includes('health')) return 'Health & Registrar';
            if (name.toLowerCase().includes('passport')) return 'Identity & Civil';
            return 'Identity & Civil';
        };

        let filteredApps = applications.filter(app => {
            const matchesKeyword = app.id.toLowerCase().includes(searchQuery) || app.name.toLowerCase().includes(searchQuery);
            const dept = getDept(app.name);
            const matchesCategory = categoryFilter === 'all' || dept.toLowerCase().includes(categoryFilter.split(' ')[0].toLowerCase());
            
            let statusNormalized = app.status;
            if (statusNormalized === 'In Progress' || statusNormalized === 'Form Submitted') {
                statusNormalized = 'Under Review';
            }
            const matchesStatus = statusFilter === 'all' || statusNormalized.toLowerCase() === statusFilter.toLowerCase();

            return matchesKeyword && matchesCategory && matchesStatus;
        });

        filteredApps.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortBy === 'asc' ? dateA - dateB : dateB - dateA;
        });

        if (filteredApps.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">No matching applications found.</td></tr>`;
            return;
        }

        filteredApps.forEach(app => {
            const dept = getDept(app.name);
            let badgeClass = 'submitted';
            if (app.status === 'Approved') badgeClass = 'approved';
            else if (app.status === 'Rejected') badgeClass = 'rejected';
            else if (app.status === 'Under Review' || app.status === 'In Progress' || app.status === 'Form Submitted' || app.status === 'Submitted') badgeClass = 'inreview';
            else if (app.status === 'Withdrawn') badgeClass = 'rejected';

            let completionDate = 'Pending';
            if (app.status === 'Approved') {
                const d = new Date(app.date);
                d.setDate(d.getDate() + 7);
                completionDate = d.toISOString().split('T')[0];
            } else if (app.status === 'Rejected') {
                const d = new Date(app.date);
                d.setDate(d.getDate() + 4);
                completionDate = d.toISOString().split('T')[0];
            } else if (app.status === 'Withdrawn') {
                completionDate = 'Withdrawn';
            }

            const officers = ['S. K. Verma', 'Priya Sharma', 'Anil Mehta', 'R. N. Iyer'];
            const seed = parseInt(app.id.split('-')[2]) || 0;
            const officer = officers[seed % officers.length];

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${app.id}</strong></td>
                <td>${app.name}</td>
                <td>${dept}</td>
                <td>${app.date}</td>
                <td><span class="badge-status ${badgeClass}">${app.status}</span></td>
                <td>${completionDate}</td>
                <td>${officer}</td>
                <td>
                    <div class="dashboard-action-btns">
                        <button class="btn btn-outline btn-sm" onclick="viewAppTimeline('${app.id}')" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
                            <i class="ph ph-eye"></i> Track
                        </button>
                        ${app.status === 'Approved' ? `
                        <button class="btn btn-primary btn-sm" onclick="generateDigitalCertificate('${app.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            <i class="ph ph-certificate"></i> Cert
                        </button>` : ''}
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Attach search and filters input events
    const myAppsSearch = document.getElementById('myAppsSearch');
    const myAppsCategoryFilter = document.getElementById('myAppsCategoryFilter');
    const myAppsStatusFilter = document.getElementById('myAppsStatusFilter');
    const myAppsSort = document.getElementById('myAppsSort');

    if (myAppsSearch) myAppsSearch.addEventListener('input', renderMyApplicationsTab);
    if (myAppsCategoryFilter) myAppsCategoryFilter.addEventListener('change', renderMyApplicationsTab);
    if (myAppsStatusFilter) myAppsStatusFilter.addEventListener('change', renderMyApplicationsTab);
    if (myAppsSort) myAppsSort.addEventListener('change', renderMyApplicationsTab);

    // Timeline view logic
    window.viewAppTimeline = function(appId) {
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        const drawer = document.getElementById('myAppsTimelineDrawer');
        if (!drawer) return;

        drawer.classList.remove('hidden');
        document.getElementById('drawerAppName').innerText = `${app.name} Application Tracker`;
        document.getElementById('drawerAppMeta').innerText = `ID: ${app.id} | Date Submitted: ${app.date}`;

        let step = app.step || 1;
        if (app.status === 'Approved') {
            step = 5;
        } else if (app.status === 'Rejected') {
            step = 4;
        } else if (app.status === 'Under Review' || app.status === 'In Progress') {
            step = 3;
        } else if (app.status === 'Submitted' || app.status === 'Form Submitted') {
            step = 1;
        }

        // Reset vertical stages
        for (let i = 1; i <= 5; i++) {
            const node = document.getElementById(`drawer-node-${i}`);
            if (node) {
                node.classList.remove('active', 'completed');
                const dot = node.querySelector('.vertical-node-dot');
                if (dot) dot.innerText = i;
                
                const titleSpan = node.querySelector('.vertical-node-title');
                if (i === 4 && titleSpan) {
                    titleSpan.innerText = 'Approval';
                    titleSpan.style.color = '';
                }
            }
        }

        // Highlight active and completed stages
        for (let i = 1; i <= step; i++) {
            const node = document.getElementById(`drawer-node-${i}`);
            if (node) {
                if (i < step) {
                    node.classList.add('completed');
                    const dot = node.querySelector('.vertical-node-dot');
                    if (dot) dot.innerHTML = '<i class="ph-fill ph-check"></i>';
                } else if (i === step) {
                    if (app.status === 'Approved' && step === 5) {
                        node.classList.add('completed');
                        const dot = node.querySelector('.vertical-node-dot');
                        if (dot) dot.innerHTML = '<i class="ph-fill ph-check"></i>';
                    } else {
                        node.classList.add('active');
                    }
                }
            }
        }

        const baseDate = new Date(app.date);
        const formatDate = (d) => d.toISOString().split('T')[0];
        
        let date2 = new Date(baseDate); date2.setDate(baseDate.getDate() + 1);
        let date3 = new Date(baseDate); date3.setDate(baseDate.getDate() + 3);
        let date4 = new Date(baseDate); date4.setDate(baseDate.getDate() + 5);
        let date5 = new Date(baseDate); date5.setDate(baseDate.getDate() + 7);

        document.getElementById('drawer-time-1').innerText = `Filed on ${app.date}`;
        document.getElementById('drawer-time-2').innerText = step >= 2 ? `Completed on ${formatDate(date2)}` : 'Identity screening check';
        document.getElementById('drawer-time-3').innerText = step >= 3 ? `In progress since ${formatDate(date3)}` : 'Assigned officer desk review';
        document.getElementById('drawer-time-4').innerText = step >= 4 ? (app.status === 'Rejected' ? `Rejected on ${formatDate(date4)}` : `Completed on ${formatDate(date4)}`) : 'Final sign-off verification';
        document.getElementById('drawer-time-5').innerText = step >= 5 ? `Document generated on ${formatDate(date5)}` : 'Verified certificate available';

        if (app.status === 'Rejected') {
            const node4 = document.getElementById('drawer-node-4');
            if (node4) {
                node4.classList.remove('completed');
                node4.classList.add('active');
                const dot = node4.querySelector('.vertical-node-dot');
                if (dot) {
                    dot.innerHTML = '<i class="ph ph-x" style="color:var(--danger-color)"></i>';
                    dot.style.borderColor = 'var(--danger-color)';
                }
                const titleSpan = node4.querySelector('.vertical-node-title');
                if (titleSpan) {
                    titleSpan.innerText = 'Rejected';
                    titleSpan.style.color = 'var(--danger-color)';
                }
            }
            const node5 = document.getElementById('drawer-node-5');
            if (node5) node5.style.opacity = '0.5';
        } else {
            const node5 = document.getElementById('drawer-node-5');
            if (node5) node5.style.opacity = '';
        }

        let progressPct = 0;
        if (step === 1) progressPct = 0;
        else if (step === 2) progressPct = 25;
        else if (step === 3) progressPct = 50;
        else if (step === 4) progressPct = 75;
        else if (step === 5) progressPct = 100;
        
        document.getElementById('drawerTimelineProgressLine').style.height = `${progressPct}%`;

        // Render remarks log list
        const remarksList = document.getElementById('drawerRemarksList');
        remarksList.innerHTML = '';
        const remarksTrail = [];
        remarksTrail.push({
            text: "Application submitted successfully through online portal.",
            time: `${app.date} 10:00 AM`
        });

        if (step >= 2) {
            remarksTrail.push({
                text: "Foundational identity check completed. All Aadhaar metadata aligns.",
                time: `${formatDate(date2)} 02:30 PM`
            });
        }
        if (step >= 3) {
            remarksTrail.push({
                text: "Assigned Desk Officer reviews files. Queue status: processing.",
                time: `${formatDate(date3)} 11:15 AM`
            });
        }
        if (step >= 4) {
            if (app.status === 'Rejected') {
                remarksTrail.push({
                    text: `Application rejected. Reason: ${app.remarks || "Information mismatch in submitted credentials."}`,
                    time: `${formatDate(date4)} 04:00 PM`
                });
            } else {
                remarksTrail.push({
                    text: "Officer review verified. Approved and sign-off sent to issuing authority.",
                    time: `${formatDate(date4)} 09:45 AM`
                });
            }
        }
        if (step >= 5 && app.status === 'Approved') {
            remarksTrail.push({
                text: "Digital certificate signed cryptographically. Document synced to Vault.",
                time: `${formatDate(date5)} 03:00 PM`
            });
        }

        remarksTrail.reverse().forEach(rem => {
            const remDiv = document.createElement('div');
            remDiv.className = 'remark-item';
            remDiv.innerHTML = `
                <p class="remark-item-text">${rem.text}</p>
                <span class="remark-item-time">${rem.time}</span>
            `;
            remarksList.appendChild(remDiv);
        });

        const downloadBtn = document.getElementById('drawerDownloadCertBtn');
        const withdrawBtn = document.getElementById('drawerWithdrawBtn');
        const printBtn = document.getElementById('drawerPrintReceiptBtn');

        if (app.status === 'Approved') {
            if (downloadBtn) downloadBtn.style.display = 'inline-flex';
        } else {
            if (downloadBtn) downloadBtn.style.display = 'none';
        }

        if (app.status === 'Submitted' || app.status === 'Under Review' || app.status === 'Form Submitted' || app.status === 'In Progress') {
            if (withdrawBtn) withdrawBtn.style.display = 'inline-flex';
        } else {
            if (withdrawBtn) withdrawBtn.style.display = 'none';
        }

        if (withdrawBtn) {
            withdrawBtn.onclick = function() {
                withdrawApplication(app.id);
            };
        }
        if (printBtn) {
            printBtn.onclick = function() {
                printReceipt(app.id);
            };
        }
        if (downloadBtn) {
            downloadBtn.onclick = function() {
                generateDigitalCertificate(app.id);
            };
        }

        drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', () => {
            const drawer = document.getElementById('myAppsTimelineDrawer');
            if (drawer) drawer.classList.add('hidden');
        });
    }

    // Withdrawal logic
    window.withdrawApplication = function(appId) {
        if (confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) {
            const appIndex = applications.findIndex(a => a.id === appId);
            if (appIndex !== -1) {
                applications[appIndex].status = 'Withdrawn';
                applications[appIndex].remarks = 'Application withdrawn by applicant.';
                saveState();
                addNotification(`Application ${appId} has been withdrawn.`, 'info');
                renderOverviewTab();
                renderMyApplicationsTab();
                const drawer = document.getElementById('myAppsTimelineDrawer');
                if (drawer) drawer.classList.add('hidden');
            }
        }
    };

    // Print Receipt
    window.printReceipt = function(appId) {
        const app = applications.find(a => a.id === appId);
        if (!app) return;
        
        document.getElementById('receiptTokenId').innerText = app.id;
        document.getElementById('receiptServiceName').innerText = app.name;
        document.getElementById('receiptApplicantName').innerText = app.applicant;
        document.getElementById('receiptDate').innerText = app.date;
        document.getElementById('receiptHash').innerText = btoa(app.id).slice(0, 10).toLowerCase();
        
        window.print();
    };

    // Generate Certificate & QR Code
    window.generateDigitalCertificate = function(appId) {
        const app = applications.find(a => a.id === appId);
        if (!app) return;
        
        const certBox = document.getElementById('myAppsDigitalCertificate');
        if (!certBox) return;
        
        let dept = 'Department of Civil Registry';
        if (app.name.toLowerCase().includes('license') || app.name.toLowerCase().includes('driving')) dept = 'Department of Motor Vehicles';
        else if (app.name.toLowerCase().includes('passport')) dept = 'Ministry of External Affairs';
        
        document.getElementById('certDeptName').innerText = dept;
        document.getElementById('certServiceName').innerText = app.name;
        
        const certId = 'CERT-' + appId.split('-')[2];
        document.getElementById('certIdVal').innerText = certId;
        document.getElementById('certRecipientVal').innerText = app.applicant;
        
        const issueDate = new Date(app.date);
        issueDate.setDate(issueDate.getDate() + 7);
        document.getElementById('certDateVal').innerText = issueDate.toISOString().split('T')[0];
        
        const uniqueHash = btoa(app.id + certId).slice(0, 16).toLowerCase();
        document.getElementById('certHashVal').innerText = uniqueHash;
        
        const qrPlaceholder = document.getElementById('certQrPlaceholder');
        if (qrPlaceholder) {
            drawMockQRCode(qrPlaceholder, `https://verify.gov.in/cert?id=${certId}&hash=${uniqueHash}`);
        }
        
        certBox.classList.remove('hidden');
        
        const printBtn = document.getElementById('printCertBtn');
        if (printBtn) {
            printBtn.onclick = function() {
                window.print();
            };
        }
        
        const closeBtn = document.getElementById('closeCertBtn');
        if (closeBtn) {
            closeBtn.onclick = function() {
                certBox.classList.add('hidden');
            };
        }
        
        certBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    function drawMockQRCode(container, dataText) {
        const size = 74;
        let svg = `<svg width="${size}" height="${size}" viewBox="0 0 29 29" style="background:#fff; shape-rendering:crispedges;">`;
        svg += `<rect x="0" y="0" width="7" height="7" fill="#0f172a" />`;
        svg += `<rect x="1" y="1" width="5" height="5" fill="#fff" />`;
        svg += `<rect x="2" y="2" width="3" height="3" fill="#0f172a" />`;
        svg += `<rect x="22" y="0" width="7" height="7" fill="#0f172a" />`;
        svg += `<rect x="23" y="1" width="5" height="5" fill="#fff" />`;
        svg += `<rect x="24" y="2" width="3" height="3" fill="#0f172a" />`;
        svg += `<rect x="0" y="22" width="7" height="7" fill="#0f172a" />`;
        svg += `<rect x="1" y="23" width="5" height="5" fill="#fff" />`;
        svg += `<rect x="2" y="24" width="3" height="3" fill="#0f172a" />`;
        
        let seed = 0;
        for (let i = 0; i < dataText.length; i++) seed += dataText.charCodeAt(i);
        
        for (let r = 0; r < 29; r++) {
            for (let c = 0; c < 29; c++) {
                if (r < 8 && c < 8) continue;
                if (r < 8 && c > 20) continue;
                if (r > 20 && c < 8) continue;
                
                const val = (Math.sin(seed + r * 13 + c * 37) * 10000) % 1 > 0.45;
                if (val) {
                    svg += `<rect x="${c}" y="${r}" width="1" height="1" fill="#0f172a" />`;
                }
            }
        }
        svg += `</svg>`;
        container.innerHTML = svg;
    }

    // Step 1 Prefill
    function prefillStep1() {
        if (!currentUser) return;
        const fullName = currentUser.displayName || currentUser.email.split('@')[0];
        const email = currentUser.email;
        
        const appFullName = document.getElementById('appFullName');
        const appEmail = document.getElementById('appEmail');
        const appMobile = document.getElementById('appMobileNumber');
        const appAddress = document.getElementById('appAddress');
        const appAadhaar = document.getElementById('appAadhaarNumber');
        const appDob = document.getElementById('appDob');
        const appGender = document.getElementById('appGender');
        
        if (appFullName) appFullName.value = fullName;
        if (appEmail) appEmail.value = email;
        
        const profPhone = document.getElementById('profPhone');
        if (appMobile && profPhone) {
            appMobile.value = profPhone.value.replace(/[^0-9]/g, '').slice(-10) || '9876543210';
        }
        
        const profAddress = document.getElementById('profAddress');
        if (appAddress && profAddress) {
            appAddress.value = profAddress.value || '45, Arera Colony, Near Shalimar Lake, Bhopal';
        }
        
        const profAadhaar = document.getElementById('profAadhaar');
        if (appAadhaar && profAadhaar) {
            appAadhaar.value = profAadhaar.value.replace(/[^0-9]/g, '').slice(-12) || '123456789012';
        }

        if (appDob && !appDob.value) appDob.value = '1995-08-15';
        if (appGender && !appGender.value) appGender.value = 'male';
    }

    // Wizard Drag and Drop Setup
    function initWizardDragAndDrop() {
        const dropzone = document.getElementById('dragDropZone');
        const fileInput = document.getElementById('wizardFileInput');
        
        if (!dropzone || !fileInput) return;

        dropzone.onclick = () => {
            fileInput.click();
        };

        fileInput.onchange = (e) => {
            handleWizardFiles(e.target.files);
        };

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleWizardFiles(files);
        }, false);
    }

    function handleWizardFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024;
            
            if (!isValidType) {
                alert(`File "${file.name}" is not a PDF or image!`);
                continue;
            }
            if (!isValidSize) {
                alert(`File "${file.name}" exceeds 5MB size limit!`);
                continue;
            }

            if (wizardSelectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                continue;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const fileObj = {
                    name: file.name,
                    size: formatBytes(file.size),
                    type: file.type.includes('pdf') ? 'pdf' : 'image',
                    dataUrl: e.target.result
                };
                wizardSelectedFiles.push(fileObj);
                renderWizardUploadPreviews();
                saveActiveDraft();
            };
            reader.readAsDataURL(file);
        }
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function renderWizardUploadPreviews() {
        const container = document.getElementById('uploadPreviewsList');
        if (!container) return;
        container.innerHTML = '';

        wizardSelectedFiles.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'preview-thumbnail-card';
            
            let previewHtml = '';
            if (file.type === 'pdf') {
                previewHtml = `<i class="ph-fill ph-file-pdf" style="font-size:2rem; color:var(--danger-color);"></i>`;
            } else {
                previewHtml = `<img src="${file.dataUrl}" alt="${file.name}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" />`;
            }

            card.innerHTML = `
                <div class="preview-thumb-image">
                    ${previewHtml}
                </div>
                <div class="preview-thumb-name" title="${file.name}">${file.name}</div>
                <button type="button" class="preview-thumb-remove" onclick="removeWizardFile(${index})">&times;</button>
            `;
            container.appendChild(card);
        });
    }

    window.removeWizardFile = function(index) {
        wizardSelectedFiles.splice(index, 1);
        renderWizardUploadPreviews();
        saveActiveDraft();
    };

    // Step 4 Review Rendering & Validation checks
    function renderStep4Review() {
        const reviewBody = document.getElementById('wizardReviewBody');
        if (!reviewBody) return false;
        reviewBody.innerHTML = '';

        const validationPanel = document.getElementById('wizardValidationPanel');
        const validationMsg = document.getElementById('wizardValidationMsg');
        if (validationPanel) validationPanel.classList.add('hidden');

        const fields = [];
        let missingFieldsCount = 0;

        const personalFields = [
            { id: 'appFullName', label: 'Full Name' },
            { id: 'appDob', label: 'Date of Birth' },
            { id: 'appGender', label: 'Gender' },
            { id: 'appAadhaarNumber', label: 'Aadhaar Number' },
            { id: 'appMobileNumber', label: 'Mobile Number' },
            { id: 'appEmail', label: 'Email' },
            { id: 'appAddress', label: 'Residential Address' }
        ];

        personalFields.forEach(f => {
            const el = document.getElementById(f.id);
            const val = el ? el.value.trim() : '';
            fields.push({ label: f.label, value: val || '<span style="color:var(--danger-color); font-weight:700;">Missing</span>', isMissing: !val });
            if (!val) missingFieldsCount++;
        });

        const serviceType = appliedServiceInput.value;
        if (serviceType === 'birth') {
            const bp = document.getElementById('birthPlace');
            const bm = document.getElementById('birthMother');
            const bpVal = bp ? bp.value.trim() : '';
            const bmVal = bm ? bm.value.trim() : '';
            fields.push({ label: 'Hospital/Place of Birth', value: bpVal || '<span style="color:var(--danger-color); font-weight:700;">Missing</span>', isMissing: !bpVal });
            fields.push({ label: "Mother's Full Name", value: bmVal || '<span style="color:var(--danger-color); font-weight:700;">Missing</span>', isMissing: !bmVal });
            if (!bpVal || !bmVal) missingFieldsCount++;
        } else if (serviceType === 'license') {
            const lc = document.getElementById('licenseClass');
            const rl = document.getElementById('rtoLocation');
            const lcVal = lc ? lc.value : '';
            const rlVal = rl ? rl.value.trim() : '';
            fields.push({ label: 'Vehicle Class', value: lcVal || '<span style="color:var(--danger-color); font-weight:700;">Missing</span>', isMissing: !lcVal });
            fields.push({ label: 'RTO Office Location', value: rlVal || '<span style="color:var(--danger-color); font-weight:700;">Missing</span>', isMissing: !rlVal });
            if (!lcVal || !rlVal) missingFieldsCount++;
        } else if (serviceType === 'passport') {
            const pe = document.getElementById('passportEmployment');
            const ps = document.getElementById('passportSize');
            const peVal = pe ? pe.value : '';
            const psVal = ps ? ps.value : '';
            fields.push({ label: 'Employment Type', value: peVal || '<span style="color:var(--danger-color); font-weight:700;">Missing</span>', isMissing: !peVal });
            fields.push({ label: 'Booklet Size', value: psVal || '<span style="color:var(--danger-color); font-weight:700;">Missing</span>', isMissing: !psVal });
            if (!peVal || !psVal) missingFieldsCount++;
        }

        let docsText = '';
        if (wizardSelectedFiles.length === 0) {
            docsText = '<span style="color:var(--danger-color); font-weight:700;">No documents uploaded (At least 1 required)</span>';
            missingFieldsCount++;
        } else {
            docsText = wizardSelectedFiles.map(f => f.name).join(', ');
        }
        fields.push({ label: 'Uploaded Proofs', value: docsText });

        fields.forEach(f => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:600; padding:0.65rem; border-bottom:1px solid var(--border-solid); color:var(--text-secondary);">${f.label}</td>
                <td style="padding:0.65rem; border-bottom:1px solid var(--border-solid); color:var(--text-primary);">${f.value}</td>
            `;
            reviewBody.appendChild(row);
        });

        if (missingFieldsCount > 0) {
            if (validationPanel) {
                validationPanel.classList.remove('hidden');
                validationMsg.innerText = `Please review form: ${missingFieldsCount} required field(s) or files are missing or incomplete.`;
            }
            return false;
        }

        return true;
    }

    // Auto save draft logic
    function saveActiveDraft() {
        const serviceType = appliedServiceInput.value;
        if (!serviceType) return;

        const draftData = {
            serviceType: serviceType,
            currentStep: currentWizardStep,
            personal: {
                fullName: document.getElementById('appFullName') ? document.getElementById('appFullName').value : '',
                dob: document.getElementById('appDob') ? document.getElementById('appDob').value : '',
                gender: document.getElementById('appGender') ? document.getElementById('appGender').value : '',
                aadhaar: document.getElementById('appAadhaarNumber') ? document.getElementById('appAadhaarNumber').value : '',
                mobile: document.getElementById('appMobileNumber') ? document.getElementById('appMobileNumber').value : '',
                email: document.getElementById('appEmail') ? document.getElementById('appEmail').value : '',
                address: document.getElementById('appAddress') ? document.getElementById('appAddress').value : ''
            },
            files: wizardSelectedFiles,
            specific: {}
        };

        if (serviceType === 'birth') {
            draftData.specific.birthPlace = document.getElementById('birthPlace') ? document.getElementById('birthPlace').value : '';
            draftData.specific.birthMother = document.getElementById('birthMother') ? document.getElementById('birthMother').value : '';
        } else if (serviceType === 'license') {
            draftData.specific.licenseClass = document.getElementById('licenseClass') ? document.getElementById('licenseClass').value : '';
            draftData.specific.rtoLocation = document.getElementById('rtoLocation') ? document.getElementById('rtoLocation').value : '';
        } else if (serviceType === 'passport') {
            draftData.specific.passportEmployment = document.getElementById('passportEmployment') ? document.getElementById('passportEmployment').value : '';
            draftData.specific.passportSize = document.getElementById('passportSize') ? document.getElementById('passportSize').value : '';
        }

        localStorage.setItem('egov-app-active-draft', JSON.stringify(draftData));
    }

    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => {
            saveActiveDraft();
            addNotification("Application progress saved as draft successfully.", "success");
            alert("Draft saved successfully!");
        });
    }

    if (wizardForm) {
        wizardForm.addEventListener('input', () => {
            saveActiveDraft();
        });
    }

    // Check & Restore Unsaved Drafts
    function checkAndRestoreDraft() {
        const draftStr = localStorage.getItem('egov-app-active-draft');
        if (!draftStr) return;

        try {
            const draft = JSON.parse(draftStr);
            if (draft && draft.serviceType) {
                setTimeout(() => {
                    if (confirm(`You have an unsaved draft for a ${draft.serviceType.toUpperCase()} Certificate application. Would you like to restore it?`)) {
                        restoreDraft(draft);
                    } else {
                        localStorage.removeItem('egov-app-active-draft');
                    }
                }, 1500);
            }
        } catch (e) {
            console.error("Error checking draft:", e);
        }
    }

    function restoreDraft(draft) {
        openWizard(draft.serviceType);
        
        if (document.getElementById('appFullName')) document.getElementById('appFullName').value = draft.personal.fullName;
        if (document.getElementById('appDob')) document.getElementById('appDob').value = draft.personal.dob;
        if (document.getElementById('appGender')) document.getElementById('appGender').value = draft.personal.gender;
        if (document.getElementById('appAadhaarNumber')) document.getElementById('appAadhaarNumber').value = draft.personal.aadhaar;
        if (document.getElementById('appMobileNumber')) document.getElementById('appMobileNumber').value = draft.personal.mobile;
        if (document.getElementById('appEmail')) document.getElementById('appEmail').value = draft.personal.email;
        if (document.getElementById('appAddress')) document.getElementById('appAddress').value = draft.personal.address;

        wizardSelectedFiles = draft.files || [];
        renderWizardUploadPreviews();

        setTimeout(() => {
            if (draft.serviceType === 'birth') {
                if (document.getElementById('birthPlace')) document.getElementById('birthPlace').value = draft.specific.birthPlace || '';
                if (document.getElementById('birthMother')) document.getElementById('birthMother').value = draft.specific.birthMother || '';
            } else if (draft.serviceType === 'license') {
                if (document.getElementById('licenseClass')) document.getElementById('licenseClass').value = draft.specific.licenseClass || '';
                if (document.getElementById('rtoLocation')) document.getElementById('rtoLocation').value = draft.specific.rtoLocation || '';
            } else if (draft.serviceType === 'passport') {
                if (document.getElementById('passportEmployment')) document.getElementById('passportEmployment').value = draft.specific.passportEmployment || '';
                if (document.getElementById('passportSize')) document.getElementById('passportSize').value = draft.specific.passportSize || '';
            }
        }, 150);

        currentWizardStep = draft.currentStep || 1;
        updateWizardStepDisplay();
        
        switchDashboardTab('apply');
        addNotification("Unsaved draft has been restored.", "info");
    }

    // Receipt buttons actions
    const btnReceiptPrint = document.getElementById('btnReceiptPrint');
    if (btnReceiptPrint) {
        btnReceiptPrint.onclick = function() {
            window.print();
        };
    }

    const btnReceiptClose = document.getElementById('btnReceiptClose');
    if (btnReceiptClose) {
        btnReceiptClose.onclick = function() {
            closeWizard();
            switchDashboardTab('my-applications');
        };
    }

    // Initialize dropzone, check drafts
    initWizardDragAndDrop();
    checkAndRestoreDraft();

    // =========================================================================
    // News, Jobs, and Results Interactive Engines
    // =========================================================================
    
    // 1. News Pools
    const newsPools = [
        [
            { source: "PIB", tag: "LAST DATE", text: "Last date of application for Post-Matric Scholarship is June 30, 2026. Submit before portal locks.", time: "10 mins ago" },
            { source: "NDTV", tag: "REGULATION", text: "Ministry of Finance mandates linking Aadhaar with PAN for all personal locker holders by August 15, 2026.", time: "45 mins ago" },
            { source: "PTI", tag: "UPDATE", text: "Digital Land Records survey maps 450,000 villages using drone technology.", time: "2 hours ago" },
            { source: "India Today", tag: "POLICY", text: "Union Cabinet approves ₹12,000 Cr incentive scheme for Green Hydrogen plants.", time: "3 hours ago" },
            { source: "DD News", tag: "EDUCATION", text: "CBSE partners with DigiLocker to issue digital certificates from 1990 onwards.", time: "5 hours ago" }
        ],
        [
            { source: "PTI", tag: "DEADLINE", text: "Last date of application for UPSC Civil Services Prelims is June 15, 2026. Apply online.", time: "2 mins ago" },
            { source: "DD News", tag: "BENEFIT", text: "PM Kisan Samman Nidhi 17th installment release date scheduled for June 25, 2026.", time: "1 hour ago" },
            { source: "PIB", tag: "HEALTH", text: "Ministry of Health launches e-Sanjeevani 2.0 with regional language consultations.", time: "2 hours ago" },
            { source: "NDTV", tag: "LAW", text: "Supreme Court directs all states to implement digital notary verification within 6 months.", time: "4 hours ago" },
            { source: "India Today", tag: "TECH", text: "MeitY launches national cyber safety handbook for government department staff.", time: "6 hours ago" }
        ],
        [
            { source: "PIB", tag: "REGISTRATION", text: "Registration deadline for NEET PG counseling extended to June 20, 2026. Verify documents.", time: "5 mins ago" },
            { source: "India Today", tag: "TRANSPORT", text: "NHAI implements GPS-based toll collection system trial on national highways.", time: "35 mins ago" },
            { source: "PTI", tag: "AGRICULTURE", text: "National Crop Insurance portal lists subsidized insurance schemes for Kharif crops.", time: "2 hours ago" },
            { source: "DD News", tag: "ENERGY", text: "PM Surya Ghar Free Electricity scheme records 10 million registrations nationwide.", time: "3 hours ago" },
            { source: "NDTV", tag: "FINANCE", text: "Reserve Bank of India starts pilot test for offline digital rupee transactions.", time: "5 hours ago" }
        ]
    ];

    // 2. Jobs Pools
    const jobsPools = [
        [
            { title: "Civil Services Examination 2026", dept: "UPSC", desc: "National recruitment drive for Indian Administrative Service (IAS), Police (IPS), and Foreign Service (IFS) officers.", vacancies: "1,050", lastDate: "June 15, 2026", tag: "urgent", ref: "civil" },
            { title: "Primary & Secondary School Teachers", dept: "State Education Board", desc: "Recruitment of graduate and post-graduate teachers for government-run schools across urban zones.", vacancies: "4,500", lastDate: "June 28, 2026", tag: "active", ref: "education" },
            { title: "Junior Engineer (Civil/Electrical)", dept: "Staff Selection Commission (SSC)", desc: "Technical officer recruitment for Central Public Works Department (CPWD) and Military Engineer Services.", vacancies: "1,820", lastDate: "July 10, 2026", tag: "active", ref: "technical" }
        ],
        [
            { title: "Probationary Officers (Scale-I)", dept: "Institute of Banking Personnel Selection (IBPS)", desc: "National selection program for officers and executive assistants in 43 Regional Rural Banks.", vacancies: "8,600", lastDate: "June 30, 2026", tag: "urgent", ref: "banking" },
            { title: "Scientific Assistant & Technician B", dept: "Indian Space Research Organisation (ISRO)", desc: "Technical and scientific laboratory support openings at satellite launching centers.", vacancies: "185", lastDate: "July 05, 2026", tag: "active", ref: "isro" },
            { title: "Executive Trainee (Finance/HR)", dept: "NTPC Limited", desc: "Management trainee placements in major thermal and renewable power plants nationwide.", vacancies: "350", lastDate: "June 24, 2026", tag: "active", ref: "ntpc" }
        ],
        [
            { title: "Assistant Section Officers (ASO)", dept: "Central Secretariat Service", desc: "Recruitment for administrative support staff in various central ministries and departments.", vacancies: "950", lastDate: "July 15, 2026", tag: "active", ref: "secretariat" },
            { title: "Medical Officers (General Duty)", dept: "National Health Mission", desc: "Open positions for medical practitioners at primary healthcare centers and district hospitals.", vacancies: "1,200", lastDate: "June 26, 2026", tag: "urgent", ref: "health" },
            { title: "Technical Graduate Course (TGC-144)", dept: "Indian Army", desc: "Commissioned officer entries for engineering graduates in combat support and signal wings.", vacancies: "40", lastDate: "July 08, 2026", tag: "active", ref: "defense" }
        ]
    ];

    // 3. Results Pools
    const resultsPools = [
        [
            { title: "Civil Services Examination 2025 Final List", dept: "UPSC", desc: "Final recommended list of candidates for IAS, IPS, and IFS appointments based on interviews.", date: "May 30, 2026", tag: "declared", key: "upsc-2025", sample: [{rank: "1", name: "Ananya Iyer", roll: "0841295"}, {rank: "2", name: "Siddharth Verma", roll: "1258490"}, {rank: "3", name: "Meera Nair", roll: "0543298"}] },
            { title: "Combined Graduate Level (CGL) 2025 Tier-I", dept: "Staff Selection Commission (SSC)", desc: "Qualifying scorecard access and cut-off percentage list for Tier-II entry.", date: "June 02, 2026", tag: "declared", key: "ssc-cgl-2025", sample: [{roll: "2201048590", name: "Rahul Dev", score: "148.5"}, {roll: "2201048591", name: "Priya Das", score: "154.2"}] },
            { title: "NEET UG 2026 Official Answer Sheets", dept: "National Testing Agency (NTA)", desc: "Scanned OMR booklets and answer sheets for MBBS/BDS entrance test evaluation.", date: "June 06, 2026", tag: "declared", key: "neet-2026", sample: [{roll: "390401258", name: "Amit Patel", score: "685/720"}, {roll: "390401259", name: "Sneha Reddy", score: "692/720"}] }
        ],
        [
            { title: "Class XII Senior School Certificates", dept: "CBSE Board", desc: "Academic marksheets and certificates for Science, Commerce, and Humanities streams.", date: "May 15, 2026", tag: "declared", key: "cbse-12", sample: [{roll: "11624890", name: "Aarav Sharma", score: "94.8%"}, {roll: "11624891", name: "Diya Roy", score: "92.4%"}] },
            { title: "RRB NTPC (CBT-2) Merit Board", dept: "Railway Recruitment Boards", desc: "Shortlisted candidates directory for document verification and medical review.", date: "June 01, 2026", tag: "declared", key: "rrb-ntpc", sample: [{roll: "142859012", name: "Kunal Sen", rank: "45"}, {roll: "142859013", name: "Ritu Goel", rank: "128"}] },
            { title: "GATE 2026 Graduate Aptitude Test Card", dept: "IIT Delhi", desc: "Official scorecard download containing GATE score, all-India rank, and qualifying marks.", date: "May 28, 2026", tag: "declared", key: "gate-2026", sample: [{roll: "CS26S35012", name: "Vikram Malhotra", score: "782"}, {roll: "CS26S35013", name: "Neha Joshi", score: "815"}] }
        ],
        [
            { title: "Indian Forest Service (IFS) written exam", dept: "UPSC", desc: "List of candidates selected to appear for IFS personality interviews.", date: "June 04, 2026", tag: "declared", key: "upsc-ifs", sample: [{rank: "1", name: "Rohan Kapoor", roll: "004859"}, {rank: "2", name: "Aditi Rao", roll: "005291"}] },
            { title: "State Eligibility Test (SET) 2026 Answer Key", dept: "UGC Board Office", desc: "Provisional keys for public response submission and objection filing.", date: "June 05, 2026", tag: "declared", key: "ugc-set", sample: [] },
            { title: "Sub-Inspector Police Recruitment Tier-I", dept: "Police Recruitment Board", desc: "Physical standard test (PST) qualification list and cut-off indexes.", date: "June 03, 2026", tag: "declared", key: "police-si", sample: [{roll: "SI-90142", name: "Tarun Gill", status: "Qualified"}, {roll: "SI-90143", name: "Vijay Negi", status: "Qualified"}] }
        ]
    ];

    let currentNewsPoolIdx = 0;
    let newsTimer = null;
    let newsTimeRemaining = 60;
    
    function refreshNews(manual = false) {
        const btn = document.getElementById('btnRefreshNews');
        const icon = btn ? btn.querySelector('i') : null;
        if (icon) icon.classList.add('spinning-refresh');
        
        setTimeout(() => {
            if (icon) icon.classList.remove('spinning-refresh');
            
            // Advance to next news pool
            currentNewsPoolIdx = (currentNewsPoolIdx + 1) % newsPools.length;
            const pool = newsPools[currentNewsPoolIdx];
            
            const listEl = document.getElementById('newsList');
            if (listEl) {
                listEl.innerHTML = '';
                pool.forEach(item => {
                    const textLower = item.text.toLowerCase();
                    const isDeadline = textLower.includes("last date") || textLower.includes("deadline") || textLower.includes("closing") || textLower.includes("register by");
                    
                    const newsDiv = document.createElement('div');
                    newsDiv.className = `news-item${isDeadline ? ' high-class-highlight' : ''}`;
                    newsDiv.innerHTML = `
                        <span class="news-tag ${isDeadline ? 'highlight' : ''}">${item.tag}</span>
                        <p>[${item.source}] ${item.text}</p>
                        <span class="news-time">${item.time}</span>
                    `;
                    listEl.appendChild(newsDiv);
                });
                
                // Re-clone for seamless vertical scrolling ticker
                const children = Array.from(listEl.children);
                children.forEach(child => {
                    const clone = child.cloneNode(true);
                    listEl.appendChild(clone);
                });
            }
            
            // Reset countdown timer
            newsTimeRemaining = 60;
            updateNewsTimerBadge();
            
            if (manual) {
                showToast("Live updates and announcement feeds refreshed.", "success");
            }
        }, 600);
    }
    
    function updateNewsTimerBadge() {
        const badge = document.getElementById('newsTimerBadge');
        if (badge) {
            badge.textContent = `Auto-refresh: ${newsTimeRemaining}s`;
        }
    }
    
    function startNewsAutoRefresh() {
        clearInterval(newsTimer);
        newsTimer = setInterval(() => {
            newsTimeRemaining--;
            if (newsTimeRemaining <= 0) {
                refreshNews(false);
            } else {
                updateNewsTimerBadge();
            }
        }, 1000);
    }

    let currentJobsPoolIdx = 0;
    
    function refreshJobs(manual = false) {
        const btn = document.getElementById('btnRefreshJobs');
        const icon = btn ? btn.querySelector('i') : null;
        if (icon) icon.classList.add('spinning-refresh');
        
        setTimeout(() => {
            if (icon) icon.classList.remove('spinning-refresh');
            
            currentJobsPoolIdx = (currentJobsPoolIdx + 1) % jobsPools.length;
            const pool = jobsPools[currentJobsPoolIdx];
            
            const jobsContainer = document.getElementById('jobsGridContainer');
            if (jobsContainer) {
                jobsContainer.innerHTML = '';
                pool.forEach(job => {
                    const card = document.createElement('div');
                    card.className = `job-card ${job.tag}`;
                    card.innerHTML = `
                        <div class="job-header">
                            <span class="job-dept">${job.dept}</span>
                            <span class="job-tag ${job.tag}">${job.tag === 'urgent' ? 'Closing Soon' : 'Active'}</span>
                        </div>
                        <h3>${job.title}</h3>
                        <p>${job.desc}</p>
                        <div class="job-meta-info">
                            <div class="job-meta-item">
                                <i class="ph ph-users"></i>
                                <span>Vacancies: <strong>${job.vacancies}</strong></span>
                            </div>
                            <div class="job-meta-item">
                                <i class="ph ph-calendar"></i>
                                <span>Last Date: <strong style="color:var(--danger-color);">${job.lastDate}</strong></span>
                            </div>
                        </div>
                        <div class="job-footer">
                            <button class="btn btn-primary btn-sm btn-apply-job" style="flex:1;">Apply Online</button>
                            <button class="btn btn-outline btn-sm btn-gazette-job"><i class="ph ph-download"></i> Gazette</button>
                        </div>
                    `;
                    
                    // Attach full-pledge actions
                    card.querySelector('.btn-apply-job').addEventListener('click', () => {
                        handleJobApply(job);
                    });
                    
                    card.querySelector('.btn-gazette-job').addEventListener('click', () => {
                        showToast(`Downloading recruitment gazette notification PDF for ${job.title}...`, 'success');
                    });
                    
                    jobsContainer.appendChild(card);
                });
            }
            
            if (manual) {
                showToast("Job openings and recruitment database updated.", "success");
            }
        }, 600);
    }
    
    function handleJobApply(job) {
        if (!currentUser) {
            showToast("Please login to apply for this vacancy", "error");
            toggleAuthModal(true);
            return;
        }
        
        // Check if there is an associated wizard
        if (job.ref === 'civil') {
            switchDashboardTab('apply');
            openWizard('passport'); // Let's use UPSC/Passport or custom wizard!
            showToast(`Launched online application wizard for ${job.title}.`, 'success');
            const wizardView = document.getElementById('serviceFormWizardView');
            if (wizardView) wizardView.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Otherwise show a nice modal popup or prompt
            showToast(`Initiating unified central application portal for ${job.title}...`, 'success');
            const previewModal = document.getElementById('filePreviewModal');
            if (previewModal) {
                document.getElementById('previewTitle').textContent = `Apply for ${job.title}`;
                document.getElementById('previewInfo').textContent = `Recruitment Board: ${job.dept}`;
                document.getElementById('previewBody').innerHTML = `
                    <div style="color: var(--text-primary); line-height: 1.6;">
                        <h4 style="color: var(--primary-color); margin-bottom: 0.75rem;">1. Application Pre-requisites</h4>
                        <p style="margin-bottom: 1rem;">You are applying for the post of <strong>${job.title}</strong>. Please ensure your Profile Details are updated in the Dashboard.</p>
                        
                        <div style="background: rgba(16, 185, 129, 0.05); padding: 1rem; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 1.5rem;">
                            <strong>User Session Active:</strong> Applying as <strong>${currentUser.displayName || currentUser.email.split('@')[0]}</strong> (${currentUser.email}).
                        </div>
                        
                        <button class="btn btn-primary btn-block" id="btnSubmitJobDirect">
                            Submit Official Application Form
                        </button>
                    </div>
                `;
                previewModal.classList.add('open');
                document.body.classList.add('modal-open');
                
                const btnSubmit = document.getElementById('btnSubmitJobDirect');
                if (btnSubmit) {
                    btnSubmit.addEventListener('click', () => {
                        previewModal.classList.remove('open');
                        document.body.classList.remove('modal-open');
                        
                        // Add to applications list!
                        const newApp = {
                            id: `JOB-2026-${Math.floor(100000 + Math.random() * 900000)}`,
                            name: job.title,
                            applicant: currentUser.displayName || currentUser.email.split('@')[0],
                            date: new Date().toISOString().split('T')[0],
                            status: 'Submitted',
                            step: 1,
                            remarks: 'Online application received. Forwarded to board desks.'
                        };
                        applications.unshift(newApp);
                        
                        // Save in local storage or update dashboard
                        showToast(`Application submitted successfully! Tracking ID: ${newApp.id}`, 'success');
                        
                        // Re-render my applications
                        renderMyApplicationsTab();
                        switchDashboardTab('my-applications');
                        
                        const appSection = document.getElementById('tab-my-applications');
                        if (appSection) appSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    });
                }
            }
        }
    }

    let currentResultsPoolIdx = 0;
    
    function refreshResults(manual = false) {
        const btn = document.getElementById('btnRefreshResults');
        const icon = btn ? btn.querySelector('i') : null;
        if (icon) icon.classList.add('spinning-refresh');
        
        setTimeout(() => {
            if (icon) icon.classList.remove('spinning-refresh');
            
            currentResultsPoolIdx = (currentResultsPoolIdx + 1) % resultsPools.length;
            const pool = resultsPools[currentResultsPoolIdx];
            
            const resultsContainer = document.getElementById('resultsGridContainer');
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
                pool.forEach(res => {
                    const card = document.createElement('div');
                    card.className = `result-card declared`;
                    card.innerHTML = `
                        <div class="result-header">
                            <span class="result-dept">${res.dept}</span>
                            <span class="result-tag declared">Declared</span>
                        </div>
                        <h3>${res.title}</h3>
                        <p>${res.desc}</p>
                        <div class="result-meta-info">
                            <div class="result-meta-item">
                                <i class="ph ph-calendar-blank"></i>
                                <span>Published: <strong>${res.date}</strong></span>
                            </div>
                        </div>
                        <div class="result-footer">
                            <button class="btn btn-primary btn-sm btn-scorecard" style="flex:1;"><i class="ph ph-user-focus"></i> Scorecard</button>
                            <button class="btn btn-outline btn-sm btn-merit-list"><i class="ph ph-list-numbers"></i> Merit List</button>
                        </div>
                    `;
                    
                    // Attach scorecard and merit list handlers
                    card.querySelector('.btn-scorecard').addEventListener('click', () => {
                        handleCheckScorecard(res);
                    });
                    
                    card.querySelector('.btn-merit-list').addEventListener('click', () => {
                        handleViewMeritList(res);
                    });
                    
                    resultsContainer.appendChild(card);
                });
            }
            
            if (manual) {
                showToast("Examination and recruitment result lists refreshed.", "success");
            }
        }, 600);
    }
    
    function handleCheckScorecard(res) {
        const previewModal = document.getElementById('filePreviewModal');
        if (previewModal) {
            document.getElementById('previewTitle').textContent = `Check Scorecard: ${res.title}`;
            document.getElementById('previewInfo').textContent = `Testing Agency: ${res.dept}`;
            
            let formHtml = `
                <div style="color: var(--text-primary); line-height: 1.6;">
                    <p style="margin-bottom: 1.25rem; font-size: 0.9rem;">Please enter your official registration details below to fetch your scores from the central servers.</p>
                    <form id="scorecardFetchForm" onsubmit="return false;">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label for="scoreRollNo" style="display:block; margin-bottom:0.5rem; font-size:0.85rem; font-weight:600;">Roll Number / Ticket ID</label>
                            <input type="text" id="scoreRollNo" required placeholder="e.g. ${res.sample.length > 0 ? res.sample[0].roll : '22010485'}" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid var(--border-color); background:rgba(0,0,0,0.02); color:var(--text-primary); outline:none;">
                        </div>
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label for="scoreDob" style="display:block; margin-bottom:0.5rem; font-size:0.85rem; font-weight:600;">Date of Birth</label>
                            <input type="date" id="scoreDob" required style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid var(--border-color); background:rgba(0,0,0,0.02); color:var(--text-primary); outline:none;">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="btnFetchScore">
                            Fetch Scorecard
                        </button>
                    </form>
                    <div id="scorecardResultDisplay" class="hidden" style="margin-top:1.5rem; padding-top:1.5rem; border-top:1px dashed var(--border-color);">
                        <!-- score display -->
                    </div>
                </div>
            `;
            
            document.getElementById('previewBody').innerHTML = formHtml;
            previewModal.classList.add('open');
            document.body.classList.add('modal-open');
            
            const fetchForm = document.getElementById('scorecardFetchForm');
            if (fetchForm) {
                fetchForm.addEventListener('submit', () => {
                    const roll = document.getElementById('scoreRollNo').value.trim();
                    const resultDisplay = document.getElementById('scorecardResultDisplay');
                    const btnFetch = document.getElementById('btnFetchScore');
                    
                    if (btnFetch) {
                        btnFetch.disabled = true;
                        btnFetch.textContent = "Connecting to National Registry...";
                    }
                    
                    setTimeout(() => {
                        if (btnFetch) {
                            btnFetch.disabled = false;
                            btnFetch.textContent = "Fetch Scorecard";
                        }
                        
                        if (resultDisplay) {
                            resultDisplay.classList.remove('hidden');
                            
                            // Find sample record matching input or pick first
                            const record = res.sample.find(s => s.roll === roll) || res.sample[0];
                            
                            if (record) {
                                let scoreDetail = '';
                                if (res.key.includes('cbse')) {
                                    scoreDetail = `Score: <strong style="color:#10b981; font-size:1.1rem;">${record.score}</strong> (Passed, First Division)`;
                                } else if (res.key.includes('cgl')) {
                                    scoreDetail = `Score: <strong style="color:#10b981; font-size:1.1rem;">${record.score}</strong> / 200 (Qualified for Tier-II)`;
                                } else if (res.key.includes('neet')) {
                                    scoreDetail = `Score: <strong style="color:#10b981; font-size:1.1rem;">${record.score}</strong> (Percentile: 98.4%)`;
                                } else if (res.key.includes('gate')) {
                                    scoreDetail = `GATE Score: <strong style="color:#10b981; font-size:1.1rem;">${record.score}</strong> (Passed)`;
                                } else if (res.key.includes('upsc')) {
                                    scoreDetail = `Recommended Selection: Rank <strong style="color:#10b981; font-size:1.1rem;">#${record.rank}</strong>`;
                                } else {
                                    scoreDetail = `Status: <strong style="color:#10b981; font-size:1.1rem;">${record.status || 'Selected'}</strong>`;
                                }
                                
                                resultDisplay.innerHTML = `
                                    <div style="background: rgba(16, 185, 129, 0.05); padding: 1.25rem; border-radius: 8px; border-left: 4px solid #10b981; text-align: left;">
                                        <h5 style="margin-bottom:0.5rem; color:#10b981; font-weight:600;">Result Found</h5>
                                        <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:0.25rem;">
                                            <div>Candidate Name: <strong>${record.name}</strong></div>
                                            <div>Roll Number: <strong>${record.roll}</strong></div>
                                            <div style="margin-top:0.5rem;">${scoreDetail}</div>
                                        </div>
                                    </div>
                                `;
                            } else {
                                resultDisplay.innerHTML = `
                                    <div style="background: rgba(239, 68, 68, 0.05); padding: 1.25rem; border-radius: 8px; border-left: 4px solid var(--danger-color); text-align: left;">
                                        <h5 style="margin-bottom:0.5rem; color:var(--danger-color); font-weight:600;">Roll Number Not Found</h5>
                                        <p style="font-size:0.85rem; margin:0;">The scorecard for roll number "${roll}" could not be retrieved. Please check credentials or contact the helpline support.</p>
                                    </div>
                                `;
                            }
                        }
                    }, 800);
                });
            }
        }
    }
    
    function handleViewMeritList(res) {
        const previewModal = document.getElementById('filePreviewModal');
        if (previewModal) {
            document.getElementById('previewTitle').textContent = `Merit List: ${res.title}`;
            document.getElementById('previewInfo').textContent = `Recruitment Agency: ${res.dept}`;
            
            let listHtml = `<div style="color:var(--text-primary); font-size:0.9rem; line-height:1.6;">`;
            if (res.sample.length > 0) {
                listHtml += `
                    <p style="margin-bottom:1rem;">Top ranked candidates listed in the official selection board:</p>
                    <table style="width:100%; border-collapse:collapse; margin-bottom:1.5rem; text-align:left;">
                        <thead>
                            <tr style="border-bottom:1px solid var(--border-color); font-weight:700;">
                                <th style="padding:0.5rem;">Rank / Roll</th>
                                <th style="padding:0.5rem;">Candidate Name</th>
                                <th style="padding:0.5rem;">Status / Score</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                res.sample.forEach((item, index) => {
                    const identifier = item.rank ? `Rank #${item.rank}` : item.roll;
                    const performanceVal = item.score || item.status || 'Recommended';
                    listHtml += `
                        <tr style="border-bottom:1px solid rgba(0,0,0,0.05);">
                            <td style="padding:0.5rem;">${identifier}</td>
                            <td style="padding:0.5rem;"><strong>${item.name}</strong></td>
                            <td style="padding:0.5rem; color:#10b981; font-weight:600;">${performanceVal}</td>
                        </tr>
                    `;
                });
                listHtml += `
                        </tbody>
                    </table>
                `;
            } else {
                listHtml += `<p style="margin-bottom:1.5rem;">No candidates records loaded in the draft merit list yet.</p>`;
            }
            listHtml += `
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-primary btn-sm" id="btnDownloadMeritPDF" style="flex:1;">
                        <i class="ph ph-download"></i> Download Full Merit PDF
                    </button>
                </div>
                </div>
            `;
            
            document.getElementById('previewBody').innerHTML = listHtml;
            previewModal.classList.add('open');
            document.body.classList.add('modal-open');
            
            const btnDownload = document.getElementById('btnDownloadMeritPDF');
            if (btnDownload) {
                btnDownload.addEventListener('click', () => {
                    showToast(`Downloading official selection list PDF for ${res.title}...`, 'success');
                });
            }
        }
    }

    // Initialize engines on page load
    refreshNews(false);
    refreshJobs(false);
    refreshResults(false);
    startNewsAutoRefresh();
    
    // Attach buttons click listeners
    const btnNews = document.getElementById('btnRefreshNews');
    if (btnNews) btnNews.addEventListener('click', () => refreshNews(true));
    
    const btnJobs = document.getElementById('btnRefreshJobs');
    if (btnJobs) btnJobs.addEventListener('click', () => refreshJobs(true));
    
    const btnResults = document.getElementById('btnRefreshResults');
    if (btnResults) btnResults.addEventListener('click', () => refreshResults(true));

    // =========================================================================
    // --- WELFARE SCHEME APPLICATION SYSTEM CONTROLLER ---
    // =========================================================================

    const STATE_NAMES = {
        'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh', 'AS': 'Assam', 'BR': 'Bihar',
        'CT': 'Chhattisgarh', 'GA': 'Goa', 'GJ': 'Gujarat', 'HR': 'Haryana',
        'HP': 'Himachal Pradesh', 'JH': 'Jharkhand', 'KA': 'Karnataka', 'KL': 'Kerala',
        'MP': 'Madhya Pradesh', 'MH': 'Maharashtra', 'MN': 'Manipur', 'ML': 'Meghalaya',
        'MZ': 'Mizoram', 'NL': 'Nagaland', 'OR': 'Odisha', 'PB': 'Punjab',
        'RJ': 'Rajasthan', 'SK': 'Sikkim', 'TN': 'Tamil Nadu', 'TG': 'Telangana',
        'TR': 'Tripura', 'UP': 'Uttar Pradesh', 'UT': 'Uttarakhand', 'WB': 'West Bengal',
        'AN': 'Andaman and Nicobar', 'CH': 'Chandigarh', 'DN': 'Dadra and Nagar Haveli',
        'DL': 'Delhi', 'JK': 'Jammu and Kashmir', 'LA': 'Ladakh', 'LD': 'Lakshadweep',
        'PY': 'Puducherry'
    };

    // Global variables for portal state
    let currentWelfareScheme = null;
    let currentWelfareStateCode = '';
    let currentWelfareWizardStep = 1;
    let welfareUploadedFiles = {};

    window.pendingWelfareScheme = null;
    window.pendingWelfareState = '';

    // Cache elements
    const welfareModal = document.getElementById('welfareSchemeModal');
    const closeWelfareModal = document.getElementById('closeWelfareModal');
    
    // Panels
    const detailsPanel = document.getElementById('welfareSchemeDetailsPanel');
    const eligibilityPanel = document.getElementById('welfareSchemeEligibilityPanel');
    const wizardPanel = document.getElementById('welfareSchemeWizardPanel');
    const trackerPanel = document.getElementById('welfareSchemeTrackerPanel');

    // Detail Buttons
    const btnWelfareApplyNow = document.getElementById('btnWelfareApplyNow');
    const btnWelfareCheckEligibility = document.getElementById('btnWelfareCheckEligibility');
    const btnWelfareTrackApp = document.getElementById('btnWelfareTrackApp');
    const btnWelfareDownloadGuidelines = document.getElementById('btnWelfareDownloadGuidelines');
    const btnWelfareContactHelpdesk = document.getElementById('btnWelfareContactHelpdesk');

    // Steppers and Steps
    const welfareStepperNodes = document.querySelectorAll('.welfare-stepper-node');
    const welfareStepPanes = document.querySelectorAll('.welfare-step-pane');
    const btnWelfareWizardPrev = document.getElementById('btnWelfareWizardPrev');
    const btnWelfareWizardNext = document.getElementById('btnWelfareWizardNext');
    const btnWelfareWizardSubmit = document.getElementById('btnWelfareWizardSubmit');
    const welfareWizardForm = document.getElementById('welfareWizardForm');

    // Entry point: find scheme and launch portal details view
    window.applyForScheme = function(title, stateCode = '') {
        const scheme = findSchemeByTitle(title, stateCode);
        if (!scheme) {
            showToast('Scheme definition not found in registry database.', 'error');
            return;
        }

        // Check if citizen is logged in. If not, save targets and open Auth Modal.
        if (!currentUser) {
            window.pendingWelfareScheme = title;
            window.pendingWelfareState = stateCode;
            showToast('Secure authentication required. Please sign in to apply.', 'warning');
            toggleAuthModal(true);
            return;
        }

        openSchemePortal(scheme, stateCode);
    };

    // Helper: Find scheme definition across databases
    function findSchemeByTitle(title, stateCode = '') {
        let scheme = null;
        if (stateCode) {
            const list = localStateSchemes[stateCode.toUpperCase()];
            if (list) {
                scheme = list.find(s => s.title === title);
            }
        }
        if (!scheme) {
            scheme = localNationalSchemes.find(s => s.title === title);
        }
        if (!scheme) {
            // Search all states
            for (const [st, list] of Object.entries(localStateSchemes)) {
                scheme = list.find(s => s.title === title);
                if (scheme) {
                    stateCode = st;
                    break;
                }
            }
        }
        if (scheme) {
            return { ...scheme, stateCode: stateCode };
        }
        return null;
    }

    // Portal Modal open controller
    function openSchemePortal(scheme, stateCode = '') {
        const enriched = getEnrichedScheme(scheme, stateCode);
        currentWelfareScheme = enriched;
        currentWelfareStateCode = stateCode;
        currentWelfareWizardStep = 1;
        welfareUploadedFiles = {};

        // Render Details Info
        document.getElementById('welfareSchemeDesc').textContent = enriched.desc;
        document.getElementById('welfareSchemeCategory').textContent = enriched.badge;
        document.getElementById('welfareSchemeDeadline').textContent = enriched.deadline;
        document.getElementById('welfareSchemeProcessing').textContent = enriched.processingTime;

        // Render Benefits
        const benefitsList = document.getElementById('welfareSchemeBenefits');
        benefitsList.innerHTML = '';
        enriched.benefits.forEach(b => {
            const li = document.createElement('li');
            li.textContent = b;
            benefitsList.appendChild(li);
        });

        // Render Eligibility
        const eligibilityList = document.getElementById('welfareSchemeEligibility');
        eligibilityList.innerHTML = '';
        enriched.eligibilityCriteria.forEach(ec => {
            const li = document.createElement('li');
            li.textContent = ec;
            eligibilityList.appendChild(li);
        });

        // Render Documents
        const docsList = document.getElementById('welfareSchemeDocuments');
        docsList.innerHTML = '';
        enriched.requiredDocuments.forEach(doc => {
            const li = document.createElement('li');
            li.textContent = doc;
            docsList.appendChild(li);
        });

        // Render FAQs Accordion
        const faqsContainer = document.getElementById('welfareSchemeFAQs');
        faqsContainer.innerHTML = '';
        enriched.faqs.forEach((faq, index) => {
            const item = document.createElement('div');
            item.className = 'faq-item-welfare';
            item.innerHTML = `
                <div class="faq-question-welfare">
                    <span>${index + 1}. ${faq.q}</span>
                    <i class="ph ph-caret-down"></i>
                </div>
                <div class="faq-answer-welfare">${faq.a}</div>
            `;
            item.querySelector('.faq-question-welfare').onclick = function() {
                item.classList.toggle('open');
            };
            faqsContainer.appendChild(item);
        });

        // Dynamic Gov Branding Setup
        applyGovBranding(enriched);

        // Pre-fill Personal Info step if profile is available
        prefillPersonalInfo();

        // Switch to details panel
        showWelfarePanel('details');

        // Toggle modal open
        if (welfareModal) {
            welfareModal.classList.add('open');
            document.body.classList.add('modal-open');
        }
    }

    // Dynamic Branding Manager (GoI vs State)
    function applyGovBranding(scheme) {
        const header = document.getElementById('welfareModalHeader');
        const emblemContainer = document.getElementById('welfareEmblem');
        const levelSpan = document.getElementById('welfareGovLevel');
        const titleH2 = document.getElementById('welfareModalTitle');

        if (scheme.level === 'State') {
            header.className = 'modal-header welfare-modal-header state-branding';
            levelSpan.textContent = `GOVERNMENT OF ${STATE_NAMES[scheme.stateCode].toUpperCase()}`;
            titleH2.textContent = scheme.title;
            // State Emblem placeholder
            emblemContainer.innerHTML = `
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="#3b82f6" stroke-width="4" fill="rgba(59, 130, 246, 0.05)"/>
                    <path d="M50 20V80M20 50H80" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
                    <circle cx="50" cy="50" r="15" fill="#3b82f6"/>
                </svg>
            `;
        } else {
            header.className = 'modal-header welfare-modal-header national-branding';
            levelSpan.textContent = 'GOVERNMENT OF INDIA';
            titleH2.textContent = scheme.title;
            // GoI Emblem placeholder
            emblemContainer.innerHTML = `
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="#f97316" stroke-width="4" fill="rgba(249, 115, 22, 0.05)"/>
                    <path d="M50 15 L50 85 M25 35 L75 35 M25 65 L75 65" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
                    <path d="M40 50 L50 40 L60 50 L50 60 Z" fill="#f97316"/>
                </svg>
            `;
        }
    }

    // Modal Close
    function closeWelfarePortal() {
        if (welfareModal) {
            welfareModal.classList.remove('open');
            document.body.classList.remove('modal-open');
        }
        currentWelfareScheme = null;
        currentWelfareStateCode = '';
    }

    if (closeWelfareModal) {
        closeWelfareModal.onclick = closeWelfarePortal;
    }

    // Switch panels view helper
    function showWelfarePanel(panelId) {
        const panels = [detailsPanel, eligibilityPanel, wizardPanel, trackerPanel];
        panels.forEach(p => {
            if (p) {
                if (p.id === `welfareScheme${panelId.charAt(0).toUpperCase() + panelId.slice(1)}Panel`) {
                    p.classList.remove('hidden');
                } else {
                    p.classList.add('hidden');
                }
            }
        });
    }

    // Prefill Step 1 form fields from current citizen profile
    function prefillPersonalInfo() {
        const fullNameInput = document.getElementById('welfareFullName');
        const aadhaarInput = document.getElementById('welfareAadhaar');
        const mobileInput = document.getElementById('welfareMobile');
        const emailInput = document.getElementById('welfareEmail');
        const addressInput = document.getElementById('welfareAddress');
        const stateInput = document.getElementById('welfareState');
        const districtInput = document.getElementById('welfareDistrict');

        if (fullNameInput) fullNameInput.value = currentUser ? (currentUser.displayName || '') : '';
        if (emailInput) emailInput.value = currentUser ? (currentUser.email || '') : '';
        if (mobileInput) mobileInput.value = '9876543210';
        if (aadhaarInput) aadhaarInput.value = '123456789012';
        if (addressInput) addressInput.value = 'House No. 124, Shanti Nagar';
        if (stateInput) {
            // Match scheme state code if State Scheme, else prefill Madhya Pradesh as default demo state
            if (currentWelfareStateCode) {
                stateInput.value = STATE_NAMES[currentWelfareStateCode] || '';
            } else {
                stateInput.value = 'Madhya Pradesh';
            }
        }
        if (districtInput) districtInput.value = 'Bhopal';
    }

    // Details actions wiring
    if (btnWelfareApplyNow) {
        btnWelfareApplyNow.onclick = () => {
            currentWelfareWizardStep = 1;
            updateWelfareWizardStepDisplay();
            showWelfarePanel('wizard');
        };
    }

    if (btnWelfareCheckEligibility) {
        btnWelfareCheckEligibility.onclick = () => {
            renderEligibilityQuiz();
            showWelfarePanel('eligibility');
        };
    }

    if (btnWelfareTrackApp) {
        btnWelfareTrackApp.onclick = () => {
            // Find if application for this scheme exists in local storage
            const app = applications.find(a => a.name === currentWelfareScheme.title && a.isWelfare);
            if (app) {
                openWelfareTracker(app.id);
            } else {
                showToast(`No active application found for ${currentWelfareScheme.title}. You can submit one below.`, 'warning');
                alert(`No active application records found in database for "${currentWelfareScheme.title}". Please apply first.`);
            }
        };
    }

    if (btnWelfareDownloadGuidelines) {
        btnWelfareDownloadGuidelines.onclick = () => {
            const previewModal = document.getElementById('filePreviewModal');
            if (previewModal) {
                document.getElementById('previewTitle').textContent = `${currentWelfareScheme.title} - Policy Guidelines`;
                document.getElementById('previewInfo').textContent = `Official Information Document (Direct Benefit Channel)`;
                document.getElementById('previewBody').innerHTML = `
                    <div style="color: var(--text-primary); line-height: 1.6; font-family: var(--font-body);">
                        <h4 style="color: var(--primary-color); margin-bottom: 0.75rem;">1. Administrative Overview</h4>
                        <p style="margin-bottom: 1rem;">This program operates under the public interest directives for ${currentWelfareScheme.badge}. The scheme is fully funded to guarantee disbursements directly to valid verified accounts.</p>
                        <h4 style="color: var(--primary-color); margin-bottom: 0.75rem;">2. Eligibility & Domicile Bound</h4>
                        <p style="margin-bottom: 1rem;">Citizens must satisfy all constraints, including residential validity checks for state-specific programs. All audits rely on Aadhaar dynamic link authentication.</p>
                        <h4 style="color: var(--primary-color); margin-bottom: 0.75rem;">3. Legal Undertaking</h4>
                        <p>Providing forged documents (residency certificates, BPL cards, income proofs) will lead to immediate rejection, cancelation of benefits, and criminal prosecution under e-governance administrative guidelines.</p>
                    </div>
                `;
                previewModal.classList.add('open');
                document.body.classList.add('modal-open');
            }
        };
    }

    if (btnWelfareContactHelpdesk) {
        btnWelfareContactHelpdesk.onclick = () => {
            alert(`Welfare Scheme Helpline:\n\nDial: 1800-11-2026 (Toll-Free Support desk)\nEmail: support.${currentWelfareScheme.badge.toLowerCase()}@gov.in\nHours: 9:00 AM - 6:00 PM (Monday-Saturday)`);
        };
    }

    // Render Eligibility Quiz checkboxes inside Panel 2
    function renderEligibilityQuiz() {
        const container = document.getElementById('welfareEligibilityQuestions');
        const feedback = document.getElementById('welfareEligibilityFeedback');
        const proceedBtn = document.getElementById('btnWelfareEligibilityProceed');

        container.innerHTML = '';
        feedback.classList.add('hidden');
        proceedBtn.disabled = true;

        const quizItems = [
            `I verify that I satisfy the primary criterion: "${currentWelfareScheme.eligibilityCriteria[0]}".`,
            `I possess all required documents: ${currentWelfareScheme.requiredDocuments.join(', ')}.`,
            `My bank account is linked to my Aadhaar number for DBT transfers.`
        ];

        quizItems.forEach((text, i) => {
            const div = document.createElement('div');
            div.className = 'eligibility-quiz-row';
            div.innerHTML = `
                <input type="checkbox" id="chkQuiz-${i}">
                <label for="chkQuiz-${i}">${text}</label>
            `;
            div.onclick = function(e) {
                if (e.target.tagName !== 'INPUT') {
                    const input = div.querySelector('input');
                    input.checked = !input.checked;
                    input.dispatchEvent(new Event('change'));
                }
            };
            container.appendChild(div);
        });

        // Listen for changes
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => {
                const checkedCount = container.querySelectorAll('input:checked').length;
                if (checkedCount === quizItems.length) {
                    feedback.className = 'eligibility-feedback-box eligible';
                    feedback.innerHTML = '<i class="ph ph-check-circle"></i> Eligible! You satisfy all initial screening checks. You can proceed with the form.';
                    feedback.classList.remove('hidden');
                    proceedBtn.disabled = false;
                } else {
                    feedback.className = 'eligibility-feedback-box not-eligible';
                    feedback.innerHTML = '<i class="ph ph-warning"></i> Action Required: You must satisfy and check all constraints to be eligible.';
                    feedback.classList.remove('hidden');
                    proceedBtn.disabled = true;
                }
            });
        });
    }

    // Eligibility check panel button controls
    document.getElementById('btnWelfareEligibilityBack').onclick = () => {
        showWelfarePanel('details');
    };

    document.getElementById('btnWelfareEligibilityProceed').onclick = () => {
        currentWelfareWizardStep = 1;
        updateWelfareWizardStepDisplay();
        showWelfarePanel('wizard');
    };

    // Wizard Step Navigation & View display
    function updateWelfareWizardStepDisplay() {
        // Toggle Step Panes
        welfareStepPanes.forEach(pane => {
            const stepNum = parseInt(pane.getAttribute('data-step'));
            if (stepNum === currentWelfareWizardStep) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Update stepper nodes styling
        welfareStepperNodes.forEach(node => {
            const stepNum = parseInt(node.getAttribute('data-step'));
            node.classList.remove('active', 'completed');
            if (stepNum === currentWelfareWizardStep) {
                node.classList.add('active');
            } else if (stepNum < currentWelfareWizardStep) {
                node.classList.add('completed');
            }
        });

        // Toggle buttons visibility
        if (currentWelfareWizardStep === 1) {
            btnWelfareWizardPrev.style.display = 'none';
        } else {
            btnWelfareWizardPrev.style.display = '';
        }

        if (currentWelfareWizardStep === 4) {
            btnWelfareWizardNext.style.display = 'none';
            btnWelfareWizardSubmit.style.display = '';
        } else if (currentWelfareWizardStep === 5) {
            // Hide wizard buttons at Step 5 (Submission screen)
            document.getElementById('welfareWizardNavRow').style.display = 'none';
        } else {
            btnWelfareWizardPrev.innerText = "Previous Step";
            btnWelfareWizardNext.style.display = '';
            btnWelfareWizardSubmit.style.display = 'none';
            document.getElementById('welfareWizardNavRow').style.display = '';
        }

        // Step Specific Load hooks
        if (currentWelfareWizardStep === 3) {
            initWelfareUploadsGrid();
        } else if (currentWelfareWizardStep === 4) {
            renderWelfareReviewTables();
        }
    }

    btnWelfareWizardPrev.onclick = () => {
        if (currentWelfareWizardStep > 1) {
            currentWelfareWizardStep--;
            updateWelfareWizardStepDisplay();
        }
    };

    btnWelfareWizardNext.onclick = () => {
        if (validateWelfareStep(currentWelfareWizardStep)) {
            currentWelfareWizardStep++;
            updateWelfareWizardStepDisplay();
        }
    };

    btnWelfareWizardSubmit.onclick = () => {
        const declaration = document.getElementById('chkAgreeWelfareDeclaration');
        if (!declaration || !declaration.checked) {
            showToast('Please check the declaration agreement.', 'warning');
            alert('You must accept the legal declaration before submitting.');
            return;
        }
        submitWelfareApplication();
    };

    // Step Validation Engine
    function validateWelfareStep(step) {
        if (step === 1) {
            const name = document.getElementById('welfareFullName').value.trim();
            const aadhaar = document.getElementById('welfareAadhaar').value.trim();
            const mobile = document.getElementById('welfareMobile').value.trim();
            const email = document.getElementById('welfareEmail').value.trim();
            const address = document.getElementById('welfareAddress').value.trim();
            const state = document.getElementById('welfareState').value;
            const district = document.getElementById('welfareDistrict').value.trim();

            if (!name || !aadhaar || !mobile || !email || !address || !state || !district) {
                showToast('Please complete all required fields.', 'error');
                return false;
            }

            if (aadhaar.length !== 12 || !/^\d{12}$/.test(aadhaar)) {
                showToast('Aadhaar card must be precisely a 12-digit number.', 'error');
                return false;
            }

            if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
                showToast('Mobile number must be a 10-digit number.', 'error');
                return false;
            }

            // State Domicile Constraint Verification
            if (currentWelfareStateCode) {
                const targetStateName = STATE_NAMES[currentWelfareStateCode];
                if (state !== targetStateName) {
                    showToast(`Ineligibility: This state scheme is restricted to residents of ${targetStateName}.`, 'error');
                    alert(`State eligibility check failed: The scheme "${currentWelfareScheme.title}" is sponsored by the ${targetStateName} government. Citizens from other states (${state}) are not eligible.`);
                    return false;
                }
            }
            return true;
        } else if (step === 2) {
            const age = document.getElementById('welfareAge').value;
            const occupation = document.getElementById('welfareOccupation').value;
            const income = document.getElementById('welfareIncome').value;
            const category = document.getElementById('welfareSocialCategory').value;

            if (!age || !occupation || !income || !category) {
                showToast('Please fill out all eligibility details.', 'error');
                return false;
            }

            // Interactive Eligibility Rules Validation
            const parsedAge = parseInt(age);
            const parsedIncome = parseFloat(income);

            // Ayushman Bharat/Low-Income checks
            if (currentWelfareScheme.title.includes('Ayushman Bharat') && parsedIncome > 250000) {
                showToast('Income limit exceeded: Scheme is for low-income groups.', 'error');
                alert('Ayushman Bharat scheme is only open to families with annual income below ₹2.5 Lakhs.');
                return false;
            }

            // APY age bounds checking
            if (currentWelfareScheme.title.includes('Atal Pension') && (parsedAge < 18 || parsedAge > 40)) {
                showToast('Age limit check failed (18-40 years required).', 'error');
                alert('Atal Pension Yojana is restricted to citizens between 18 and 40 years of age.');
                return false;
            }

            // State specific income bounds checks
            if (currentWelfareStateCode) {
                // Check if title mentions gold, marriage, or financial grants (generally limit < 3-5L)
                if (currentWelfareScheme.title.toLowerCase().includes('gold') || currentWelfareScheme.title.toLowerCase().includes('marriage') || currentWelfareScheme.title.toLowerCase().includes('lakshmi')) {
                    if (parsedIncome > 500000) {
                        showToast('Marriage subsidy income threshold exceeded (₹5 Lakhs limit).', 'error');
                        alert('Marriage assistance grants require family income below ₹5 Lakhs.');
                        return false;
                    }
                } else {
                    if (parsedIncome > 300000) {
                        showToast('State welfare subsidy income limit exceeded (₹3 Lakhs limit).', 'error');
                        alert('Most state-sponsored welfare subsidies require family income below ₹3 Lakhs.');
                        return false;
                    }
                }
            }

            return true;
        } else if (step === 3) {
            // Check if all files listed in requiredDocuments are uploaded
            const missingDocs = [];
            currentWelfareScheme.requiredDocuments.forEach(doc => {
                if (!welfareUploadedFiles[doc]) {
                    missingDocs.push(doc);
                }
            });

            if (missingDocs.length > 0) {
                showToast(`Missing documents: ${missingDocs.join(', ')}`, 'error');
                alert(`Please upload all required certificates:\n- ${missingDocs.join('\n- ')}`);
                return false;
            }
            return true;
        }
        return true;
    }

    // Dynamic Upload Slots rendering based on scheme schema
    function initWelfareUploadsGrid() {
        const grid = document.getElementById('welfareUploadGrid');
        if (!grid || grid.children.length > 0) return; // Grid already loaded

        currentWelfareScheme.requiredDocuments.forEach(docName => {
            const card = document.createElement('div');
            card.className = 'welfare-upload-card';
            card.setAttribute('data-doc', docName);
            card.innerHTML = `
                <div class="welfare-upload-icon"><i class="ph ph-file-arrow-up"></i></div>
                <h4>${docName} <span style="color:var(--danger-color);">*</span></h4>
                <p>Drag & drop file here or click to browse</p>
                <input type="file" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer;" accept=".pdf,.jpg,.jpeg,.png">
                <div class="welfare-file-info hidden"></div>
                <div class="welfare-upload-preview hidden"></div>
            `;

            const fileInput = card.querySelector('input[type="file"]');
            const infoDiv = card.querySelector('.welfare-file-info');
            const previewDiv = card.querySelector('.welfare-upload-preview');

            // Wire input change
            fileInput.addEventListener('change', (e) => {
                handleWelfareFileUpload(e.target.files[0], docName, card, infoDiv, previewDiv);
            });

            // Wire drag and drop
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                card.classList.add('dragover');
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove('dragover');
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    fileInput.files = e.dataTransfer.files;
                    handleWelfareFileUpload(e.dataTransfer.files[0], docName, card, infoDiv, previewDiv);
                }
            });

            grid.appendChild(card);
        });
    }

    // Upload files auditor & thumbnail preview generator
    function handleWelfareFileUpload(file, docName, card, infoDiv, previewDiv) {
        if (!file) return;

        // Size verification (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            showToast('File size exceeds 2MB limit.', 'error');
            alert('Error: Scanned file must be under 2MB.');
            return;
        }

        // Store file details
        welfareUploadedFiles[docName] = {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.type
        };

        // Render file info row
        infoDiv.innerHTML = `
            <div class="welfare-file-info-left">
                <i class="ph ph-file-text" style="color:var(--primary-color);"></i>
                <span>${file.name} (${welfareUploadedFiles[docName].size})</span>
            </div>
            <button type="button" class="welfare-file-remove-btn"><i class="ph ph-trash"></i></button>
        `;
        infoDiv.classList.remove('hidden');

        // Delete button listener
        infoDiv.querySelector('.welfare-file-remove-btn').onclick = (e) => {
            e.stopPropagation();
            delete welfareUploadedFiles[docName];
            infoDiv.classList.add('hidden');
            previewDiv.classList.add('hidden');
            card.classList.remove('has-file');
            card.querySelector('input[type="file"]').value = '';
        };

        // Create image thumbnail preview if file is an image
        if (file.type.startsWith('image/')) {
            const imgUrl = URL.createObjectURL(file);
            previewDiv.innerHTML = `<img src="${imgUrl}" alt="upload preview">`;
            previewDiv.classList.remove('hidden');
        } else if (file.type === 'application/pdf') {
            previewDiv.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:rgba(239,68,68,0.1); color:#ef4444; font-size:1.5rem;"><i class="ph-fill ph-file-pdf"></i></div>`;
            previewDiv.classList.remove('hidden');
        } else {
            previewDiv.classList.add('hidden');
        }

        card.classList.add('has-file');
        showToast(`${docName} uploaded successfully.`, 'success');
    }

    // Render wizard Step 4 confirmation sheets
    function renderWelfareReviewTables() {
        const personalTable = document.getElementById('welfareReviewPersonalTable');
        const eligibilityTable = document.getElementById('welfareReviewEligibilityTable');
        const docsList = document.getElementById('welfareReviewDocsList');

        personalTable.innerHTML = `
            <tr><td>Full Name:</td><td>${document.getElementById('welfareFullName').value}</td></tr>
            <tr><td>Aadhaar Card:</td><td>XXXX-XXXX-${document.getElementById('welfareAadhaar').value.slice(-4)}</td></tr>
            <tr><td>Mobile Number:</td><td>${document.getElementById('welfareMobile').value}</td></tr>
            <tr><td>Email Address:</td><td>${document.getElementById('welfareEmail').value}</td></tr>
            <tr><td>Resident State:</td><td>${document.getElementById('welfareState').value}</td></tr>
            <tr><td>District Area:</td><td>${document.getElementById('welfareDistrict').value}</td></tr>
            <tr><td>Address:</td><td>${document.getElementById('welfareAddress').value}</td></tr>
        `;

        eligibilityTable.innerHTML = `
            <tr><td>Age Profile:</td><td>${document.getElementById('welfareAge').value} years</td></tr>
            <tr><td>Occupation Type:</td><td>${document.getElementById('welfareOccupation').value}</td></tr>
            <tr><td>Annual Family Income:</td><td>₹ ${parseFloat(document.getElementById('welfareIncome').value).toLocaleString('en-IN')}</td></tr>
            <tr><td>Social Classification:</td><td>${document.getElementById('welfareSocialCategory').value}</td></tr>
            <tr><td>PwD Category:</td><td>${document.getElementById('welfareSpecialRequirements').checked ? 'Yes' : 'No'}</td></tr>
        `;

        docsList.innerHTML = '';
        Object.entries(welfareUploadedFiles).forEach(([docName, details]) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span><i class="ph ph-file"></i> ${docName}</span>
                <span><i class="ph ph-check"></i> ${details.name} (${details.size})</span>
            `;
            docsList.appendChild(li);
        });
    }

    // Wizard Submission Handler
    function submitWelfareApplication() {
        const appId = 'SCHEME-2026-' + Math.floor(100000 + Math.random() * 900000);
        const dateStr = new Date().toISOString().split('T')[0];

        const applicantName = document.getElementById('welfareFullName').value;
        const stateSelected = document.getElementById('welfareState').value;
        const occupationVal = document.getElementById('welfareOccupation').value;
        const incomeVal = parseFloat(document.getElementById('welfareIncome').value);
        const ageVal = parseInt(document.getElementById('welfareAge').value);

        // Build Application details object
        const newApp = {
            id: appId,
            name: currentWelfareScheme.title,
            applicant: applicantName,
            date: dateStr,
            status: 'Submitted',
            step: 1, // stage 1: Submitted
            remarks: 'Welfare application filed. Baseline screening checks initiated.',
            isWelfare: true,
            details: {
                aadhaar: document.getElementById('welfareAadhaar').value,
                mobile: document.getElementById('welfareMobile').value,
                email: document.getElementById('welfareEmail').value,
                address: document.getElementById('welfareAddress').value,
                state: stateSelected,
                district: document.getElementById('welfareDistrict').value,
                age: ageVal,
                occupation: occupationVal,
                income: incomeVal,
                category: document.getElementById('welfareSocialCategory').value,
                special: document.getElementById('welfareSpecialRequirements').checked,
                uploads: Object.keys(welfareUploadedFiles)
            }
        };

        // 1. Save in applications database
        applications.unshift(newApp);
        saveState();

        // 2. Cache under unique token ID in localStorage for landing page status tracker
        localStorage.setItem(appId, JSON.stringify({
            app_number: appId,
            service_name: currentWelfareScheme.title,
            applicant_name: applicantName,
            submission_date: dateStr,
            status: 'Submitted',
            step: 1, // timeline mapping
            remarks: 'Welfare application filed. Baseline screening checks initiated.',
            category: 'welfare'
        }));

        // Trigger notifications log
        addNotification(`New Welfare Application filed for ${currentWelfareScheme.title}. Token: ${appId}`, 'success');

        // Populate Success Receipt Screen
        document.getElementById('welfareReceiptAppId').textContent = appId;
        document.getElementById('welfareReceiptSchemeName').textContent = currentWelfareScheme.title;
        document.getElementById('welfareReceiptApplicant').textContent = applicantName;
        document.getElementById('welfareReceiptAadhaar').textContent = 'XXXX-XXXX-' + document.getElementById('welfareAadhaar').value.slice(-4);
        document.getElementById('welfareReceiptDate').textContent = dateStr;

        // Render receipt emblem GoI vs State
        const receiptEmblem = document.getElementById('receiptEmblem');
        const receiptGovText = document.getElementById('receiptGovText');
        if (currentWelfareScheme.level === 'State') {
            receiptGovText.textContent = `GOVERNMENT OF ${STATE_NAMES[currentWelfareStateCode].toUpperCase()}`;
            receiptEmblem.innerHTML = `
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="#3b82f6" stroke-width="4" fill="none"/>
                    <path d="M50 20V80M20 50H80" stroke="#3b82f6" stroke-width="3"/>
                </svg>
            `;
        } else {
            receiptGovText.textContent = 'GOVERNMENT OF INDIA';
            receiptEmblem.innerHTML = `
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="#f97316" stroke-width="4" fill="none"/>
                    <path d="M50 15 L50 85 M25 35 L75 35 M25 65 L75 65" stroke="#10b981" stroke-width="3"/>
                </svg>
            `;
        }

        // Render Smart Recommendations
        renderSmartRecommendations(ageVal, incomeVal, occupationVal);

        // Move to final step
        currentWelfareWizardStep = 5;
        updateWelfareWizardStepDisplay();

        // Refresh citizen applications panel view
        renderMyApplicationsTab();
        showToast('Application registered successfully!', 'success');
    }

    // Smart Recommendations Algorithm
    function renderSmartRecommendations(age, income, occupation) {
        const grid = document.getElementById('welfareSmartRecommendationsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const recommendations = [];

        // Farmer rules
        if (occupation === 'Farmer') {
            if (currentWelfareScheme.title !== 'PM Kisan Samman Nidhi') {
                recommendations.push(findSchemeByTitle('PM Kisan Samman Nidhi'));
            }
            // State specific farmer benefits
            if (currentWelfareStateCode === 'AP' && currentWelfareScheme.title !== 'YSR Rythu Bharosa') {
                recommendations.push(findSchemeByTitle('YSR Rythu Bharosa', 'AP'));
            } else if (currentWelfareStateCode === 'TG' && currentWelfareScheme.title !== 'Rythu Bandhu') {
                recommendations.push(findSchemeByTitle('Rythu Bandhu', 'TG'));
            }
        }

        // Student rules
        if (occupation === 'Student') {
            if (currentWelfareScheme.title !== 'National Scholarship Portal') {
                recommendations.push(findSchemeByTitle('National Scholarship Portal'));
            }
            if (currentWelfareStateCode === 'WB' && currentWelfareScheme.title !== 'Kanyashree Prakalpa') {
                recommendations.push(findSchemeByTitle('Kanyashree Prakalpa', 'WB'));
            } else if (currentWelfareStateCode === 'BR' && currentWelfareScheme.title !== 'Student Credit Card') {
                recommendations.push(findSchemeByTitle('Student Credit Card', 'BR'));
            }
        }

        // Low-Income health checks
        if (income <= 250000 && currentWelfareScheme.title !== 'Ayushman Bharat (PM-JAY)') {
            recommendations.push(findSchemeByTitle('Ayushman Bharat (PM-JAY)'));
        }

        // Elderly pension checks
        if (age >= 18 && age <= 40 && currentWelfareScheme.title !== 'Atal Pension Yojana (APY)') {
            recommendations.push(findSchemeByTitle('Atal Pension Yojana (APY)'));
        }

        // If list is empty, push default PM Awas Yojana
        if (recommendations.length === 0) {
            recommendations.push(findSchemeByTitle('Pradhan Mantri Awas Yojana (PMAY)'));
        }

        // Filter nulls and display limit 2 cards
        const finalRecs = recommendations.filter(Boolean).slice(0, 2);

        finalRecs.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'rec-card glass-panel';
            card.innerHTML = `
                <div class="rec-card-header">
                    <h4>${rec.title}</h4>
                    <span class="badge" style="font-size:0.7rem; font-weight:700; background:rgba(37,99,235,0.1); color:var(--primary-color);">${rec.badge}</span>
                </div>
                <p>${rec.desc.slice(0, 85)}...</p>
                <div class="rec-card-footer">
                    <span class="rec-card-class" style="font-size:0.75rem; color:var(--accent-color); font-weight:600;">DBT Enabled</span>
                    <button type="button" class="btn btn-primary btn-sm btn-apply-rec" style="padding:0.25rem 0.5rem; font-size:0.7rem;">Apply Now</button>
                </div>
            `;
            card.querySelector('.btn-apply-rec').onclick = () => {
                closeWelfarePortal();
                setTimeout(() => {
                    applyForScheme(rec.title, rec.stateCode || '');
                }, 500);
            };
            grid.appendChild(card);
        });
    }

    // Receipt buttons actions
    document.getElementById('btnPrintWelfareReceipt').onclick = () => {
        window.print();
    };

    document.getElementById('btnDownloadWelfareReceipt').onclick = () => {
        showToast('Receipt PDF compilation initiated.', 'info');
        // Simulate PDF download
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = '#';
            link.setAttribute('download', `Receipt-${document.getElementById('welfareReceiptAppId').textContent}.pdf`);
            showToast('Acknowledgement PDF downloaded successfully!', 'success');
            alert('Welfare Receipt PDF downloaded to local storage receipts fold!');
        }, 1200);
    };

    document.getElementById('btnWelfareReceiptClose').onclick = () => {
        closeWelfarePortal();
        // Shift tab to applications list
        if (document.getElementById('citizenDashboard') && !document.getElementById('citizenDashboard').classList.contains('hidden')) {
            switchDashboardTab('my-applications');
        }
    };

    // Welfare Status Tracker Timeline View builder (6-Stage)
    function openWelfareTracker(appId) {
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        document.getElementById('trackerSchemeTitle').textContent = app.name;
        document.getElementById('trackerAppMetaText').textContent = `Application ID: ${app.id} | Date Filed: ${app.date}`;

        const baseDate = new Date(app.date);
        const formatDate = (d) => d.toISOString().split('T')[0];

        let d2 = new Date(baseDate); d2.setDate(baseDate.getDate() + 1);
        let d3 = new Date(baseDate); d3.setDate(baseDate.getDate() + 2);
        let d4 = new Date(baseDate); d4.setDate(baseDate.getDate() + 4);
        let d5 = new Date(baseDate); d5.setDate(baseDate.getDate() + 5);
        let d6 = new Date(baseDate); d6.setDate(baseDate.getDate() + 7);

        // Stages definitions mapping
        // Submitted (1) -> Eligibility (2) -> Documents (3) -> Review (4) -> Approved (5) -> Released (6)
        let activeStep = app.step || 1;
        if (app.status === 'Approved') {
            activeStep = 6;
        } else if (app.status === 'Under Review' || app.status === 'In Progress') {
            activeStep = 4;
        }

        // Render Status timestamps
        document.getElementById('time-welfare-1').textContent = `Completed on ${app.date}`;
        document.getElementById('time-welfare-2').textContent = activeStep >= 2 ? `Completed on ${formatDate(d2)}` : 'Pending baseline parameter checks';
        document.getElementById('time-welfare-3').textContent = activeStep >= 3 ? `Completed on ${formatDate(d3)}` : 'Waiting document verification officer desk';
        document.getElementById('time-welfare-4').textContent = activeStep >= 4 ? `Completed on ${formatDate(d4)}` : 'Waiting administrative head review';
        document.getElementById('time-welfare-5').textContent = activeStep >= 5 ? `Completed on ${formatDate(d5)}` : 'Waiting credential issuance';
        document.getElementById('time-welfare-6').textContent = activeStep >= 6 ? `Completed on ${formatDate(d6)}` : 'Benefit release scheduled via DBT';

        // Loop stages highlighting
        for (let i = 1; i <= 6; i++) {
            const node = document.getElementById(`node-welfare-${i}`);
            if (node) {
                node.classList.remove('active', 'completed');
                if (i < activeStep) {
                    node.classList.add('completed');
                    node.querySelector('.node-circle-tracker').innerHTML = '<i class="ph ph-check"></i>';
                } else if (i === activeStep) {
                    node.classList.add('active');
                    // restore icon
                    const icons = ['file-text', 'user-check', 'file-arrow-up', 'shield-check', 'check-square', 'currency-inr'];
                    node.querySelector('.node-circle-tracker').innerHTML = `<i class="ph ph-${icons[i-1]}"></i>`;
                } else {
                    const icons = ['file-text', 'user-check', 'file-arrow-up', 'shield-check', 'check-square', 'currency-inr'];
                    node.querySelector('.node-circle-tracker').innerHTML = `<i class="ph ph-${icons[i-1]}"></i>`;
                }
            }
        }

        showWelfarePanel('tracker');
    }

    document.getElementById('btnWelfareTrackerBack').onclick = () => {
        showWelfarePanel('details');
    };

    // Scheme Details Schema Enrichment Generator
    function getEnrichedScheme(scheme, stateCode = '') {
        const isState = !!stateCode;
        const category = scheme.badge || 'Welfare';
        
        return {
            id: scheme.id || scheme.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title: scheme.title,
            badge: category,
            desc: scheme.desc,
            level: isState ? 'State' : 'National',
            stateCode: stateCode,
            logo: getSchemeIcon(category),
            deadline: scheme.deadline || '2026-12-31',
            processingTime: scheme.processingTime || '15-30 Working Days',
            benefits: scheme.benefits || getFallbackBenefits(category, scheme.title),
            eligibilityCriteria: scheme.eligibilityCriteria || [
                scheme.eligibility || 'Permanent resident of target jurisdiction bounds',
                'Must possess active Aadhaar Card verified to mobile number',
                'Must satisfy low family income threshold checks'
            ],
            requiredDocuments: scheme.requiredDocuments || getFallbackDocuments(category),
            faqs: scheme.faqs || getFallbackFAQs(category, scheme.title)
        };
    }

    function getSchemeIcon(category) {
        const icons = {
            'HEALTH': 'first-aid-kit',
            'AGRICULTURE': 'plant',
            'EDUCATION': 'graduation-cap',
            'HOUSING': 'house',
            'PENSION': 'heart',
            'WOMEN': 'gender-female',
            'EMPLOYMENT': 'briefcase',
            'UTILITIES': 'drop',
            'SENIORS': 'user-focus',
            'LIVELIHOOD': 'hand-coins',
            'SPORTS': 'trophy',
            'NUTRITION': 'cookie',
            'FOOD': 'shopping-bag',
            'MARRIAGE': 'rings'
        };
        return icons[category.toUpperCase()] || 'flag';
    }

    function getFallbackBenefits(category, title) {
        const benefitDict = {
            'HEALTH': [
                'Cashless health treatment cover up to ₹5 Lakhs per family per year.',
                'Coverage of pre-existing illnesses from day one of registration.',
                'Empanelled network access in both government and private corporate hospitals.',
                'Covers pre and post-hospitalization diagnostic testing and medical costs.'
            ],
            'AGRICULTURE': [
                'Direct cash assistance transferred directly to bank accounts via DBT.',
                'Subsidized loans and interest subventions on crop loans.',
                'Priority distribution of certified seeds, fertilizers, and tools.',
                'Crop failure compensation insurance during natural calamities.'
            ],
            'EDUCATION': [
                'Full reimbursement of admission and term tuition fees.',
                'Monthly scholarship allowance to cover books, boarding, and hostels.',
                'Special academic merit rewards and laptops/bicycles for rankers.',
                'Guaranteed education loans up to ₹10 Lakhs without collaterals.'
            ],
            'HOUSING': [
                'Substantial financial grant to build a permanent concrete house.',
                'Home loan interest subsidies for affordable dwelling units.',
                'Complimentary sanitary toilet construct connections.',
                'Free electricity and clean household tap water installation lines.'
            ],
            'PENSION': [
                'Guaranteed monthly pension benefits transferred to bank accounts on 1st.',
                'Free universal health screening cards.',
                'Concession fares on national rails and state passenger buses.',
                'No tax on pension income allocations.'
            ],
            'WOMEN': [
                'Direct cash incentives to elevate financial self-reliance.',
                'Capital subsidies for establishing micro-enterprises and SHGs.',
                'Paid maternity packages and child immunization support.',
                'Free vocational training and skill exchange certifications.'
            ],
            'EMPLOYMENT': [
                'Guaranteed minimum wage labor days per financial year.',
                'Unemployment allowance in case job allocation is delayed past 15 days.',
                'Skill development classes and apprenticeships across industries.',
                'Subsidized toolkits for startup trades.'
            ],
            'UTILITIES': [
                'Up to 200 units of free household electricity monthly.',
                'Free tap water supply connections.',
                'Subsidized cooking gas cylinders.',
                'Zero registration fee for utility lines.'
            ],
            'MARRIAGE': [
                'One-time financial marriage grant for girls from low-income groups.',
                'Free mass wedding ceremony provisions.',
                'Free legal registration assistance and certified documents.'
            ],
            'Default': [
                'Direct Benefit Transfer (DBT) security clearance.',
                'Subsidized administrative assistance across state offices.',
                'Dynamic status tracking and grievance support.'
            ]
        };
        return benefitDict[category.toUpperCase()] || benefitDict['Default'];
    }

    function getFallbackDocuments(category) {
        const docDict = {
            'HEALTH': ['Aadhaar Card', 'Ration Card (BPL/NFSA)', 'Income Certificate', 'Passport Photo'],
            'AGRICULTURE': ['Aadhaar Card', 'Land Revenue Receipt / Patta Book', 'Bank Passbook', 'Self Declaration Form'],
            'EDUCATION': ['Aadhaar Card', 'Marksheet of Previous Class', 'Fee Receipt / Bonafide Certificate', 'Income Certificate'],
            'HOUSING': ['Aadhaar Card', 'Land Allotment Paper / Plot Registry', 'Domicile Certificate', 'Bank Passbook'],
            'PENSION': ['Aadhaar Card', 'Age Proof (Birth Certificate/Marksheet)', 'Income Certificate', 'Bank Passbook'],
            'WOMEN': ['Aadhaar Card', 'Domicile Certificate', 'Ration Card', 'Single Bank Account Details'],
            'EMPLOYMENT': ['Aadhaar Card', 'MGNREGA Job Card / Registration', 'Age Proof', 'Bank Passbook'],
            'Default': ['Aadhaar Card', 'Domicile Certificate', 'Income Certificate', 'Bank Passbook']
        };
        return docDict[category.toUpperCase()] || docDict['Default'];
    }

    function getFallbackFAQs(category, title) {
        return [
            {
                q: `How long does it take for ${title} application to get approved?`,
                a: 'Standard verification takes between 15 to 30 working days. You can track progress in real-time using your application ID.'
            },
            {
                q: 'What should I do if my document upload fails?',
                a: 'Ensure the file size is under 2MB and format is PDF, JPEG, or PNG. Clear your browser cache and retry. If issue persists, contact the helpdesk.'
            },
            {
                q: 'Are there any registration charges or fees?',
                a: 'No, all government welfare scheme applications on this portal are completely free of charge. Do not pay anyone for these services.'
            }
        ];
    }

    // Expose functions globally to integrate with inline handlers
    window.applyForScheme = applyForScheme;
    window.closeWelfarePortal = closeWelfarePortal;
    window.openWelfareTracker = openWelfareTracker;
    window.findSchemeByTitle = findSchemeByTitle;

    // Hook tracking search integration
    const welfareTrackForm = document.getElementById('trackStatusForm');
    if (welfareTrackForm) {
        welfareTrackForm.addEventListener('submit', (e) => {
            const category = document.getElementById('track-category').value;
            const appNumber = document.getElementById('track-app-number').value.trim();

            if (category === 'welfare' && appNumber.startsWith('SCHEME-2026-')) {
                // If it is a welfare scheme and submitted by current user
                const app = applications.find(a => a.id === appNumber);
                if (app) {
                    e.preventDefault(); // Stop normal tracker
                    const stateCode = app.details && app.details.state ? Object.keys(STATE_NAMES).find(key => STATE_NAMES[key] === app.details.state) : '';
                    applyForScheme(app.name, stateCode || '');
                    setTimeout(() => {
                        openWelfareTracker(app.id);
                    }, 500);
                }
            }
        });
    }

    // Hook dashboard tracking button
    const welfareDashTrackApp = document.getElementById('btnDashTrackApp');
    if (welfareDashTrackApp) {
        welfareDashTrackApp.addEventListener('click', () => {
            const title = document.getElementById('wizardServiceTitle') ? document.getElementById('wizardServiceTitle').textContent : '';
            if (title && title !== 'Aadhaar Services') {
                const app = applications.find(a => a.name === title);
                if (app && app.id.startsWith('SCHEME-2026-')) {
                    const stateCode = app.details && app.details.state ? Object.keys(STATE_NAMES).find(key => STATE_NAMES[key] === app.details.state) : '';
                    applyForScheme(app.name, stateCode || '');
                    setTimeout(() => {
                        openWelfareTracker(app.id);
                    }, 500);
                }
            }
        });
    }

    // --- End of Welfare Scheme Portal Logic ---

    // Initialize dropzone, check drafts
    initWizardDragAndDrop();
    checkAndRestoreDraft();

    // Initialize administration gateway modal & manage admins tab
    initAdminSelectionModal();
    initManageAdminsForm();
    initLocationFilters();

    // --- Super Admin Portal & Selection Modal Logic ---
    function initAdminSelectionModal() {
        const adminSelectionModal = document.getElementById('adminSelectionModal');
        const closeAdminSelection = document.getElementById('closeAdminSelection');
        const btnCloseAdminSelection = document.getElementById('btnCloseAdminSelection');
        
        // Modal reset state on close
        const resetModalView = () => {
            const selectionView = document.getElementById('adminGatewaySelectionView');
            const loginView = document.getElementById('adminGatewayLoginView');
            const subtitle = document.getElementById('adminSelectionSubtitle');
            const form = document.getElementById('adminGatewayLoginForm');
            const errorMsg = document.getElementById('adminGatewayLoginError');
            
            if (selectionView) selectionView.classList.remove('hidden');
            if (loginView) loginView.classList.add('hidden');
            if (subtitle) subtitle.textContent = "Choose an administrative portal level to log in.";
            if (form) form.reset();
            if (errorMsg) errorMsg.classList.add('hidden');
        };

        if (closeAdminSelection) {
            closeAdminSelection.addEventListener('click', () => {
                toggleModal(adminSelectionModal, false);
                resetModalView();
            });
        }
        if (btnCloseAdminSelection) {
            btnCloseAdminSelection.addEventListener('click', () => {
                toggleModal(adminSelectionModal, false);
                resetModalView();
            });
        }
        if (adminSelectionModal) {
            adminSelectionModal.addEventListener('click', (e) => {
                if (e.target === adminSelectionModal) {
                    toggleModal(adminSelectionModal, false);
                    resetModalView();
                }
            });
        }

        const btnSelectSectorAdmin = document.getElementById('btnSelectSectorAdmin');
        const btnSelectSuperAdmin = document.getElementById('btnSelectSuperAdmin');
        const btnBackToSelection = document.getElementById('btnBackToSelection');
        const adminGatewaySelectionView = document.getElementById('adminGatewaySelectionView');
        const adminGatewayLoginView = document.getElementById('adminGatewayLoginView');
        const adminSelectedPortalType = document.getElementById('adminSelectedPortalType');
        const adminIdInputLabel = document.getElementById('adminIdInputLabel');
        const adminSelectionSubtitle = document.getElementById('adminSelectionSubtitle');
        const adminGatewayLoginForm = document.getElementById('adminGatewayLoginForm');
        const adminGatewayLoginError = document.getElementById('adminGatewayLoginError');
        const adminGatewayId = document.getElementById('adminGatewayId');

        if (btnSelectSectorAdmin) {
            btnSelectSectorAdmin.addEventListener('click', () => {
                if (adminSelectedPortalType) adminSelectedPortalType.value = 'sector';
                if (adminIdInputLabel) adminIdInputLabel.textContent = 'Sector Admin ID';
                if (adminSelectionSubtitle) adminSelectionSubtitle.textContent = 'Enter your Sector Admin credentials to log in.';
                if (adminGatewayId) adminGatewayId.placeholder = 'e.g. SEC-ADMIN';
                if (adminGatewaySelectionView) adminGatewaySelectionView.classList.add('hidden');
                if (adminGatewayLoginView) adminGatewayLoginView.classList.remove('hidden');
                if (adminGatewayLoginError) adminGatewayLoginError.classList.add('hidden');
            });
        }

        if (btnSelectSuperAdmin) {
            btnSelectSuperAdmin.addEventListener('click', () => {
                if (adminSelectedPortalType) adminSelectedPortalType.value = 'super';
                if (adminIdInputLabel) adminIdInputLabel.textContent = 'Super Admin ID';
                if (adminSelectionSubtitle) adminSelectionSubtitle.textContent = 'Enter your Super Admin credentials to log in.';
                if (adminGatewayId) adminGatewayId.placeholder = 'e.g. SUPER-ADMIN';
                if (adminGatewaySelectionView) adminGatewaySelectionView.classList.add('hidden');
                if (adminGatewayLoginView) adminGatewayLoginView.classList.remove('hidden');
                if (adminGatewayLoginError) adminGatewayLoginError.classList.add('hidden');
            });
        }

        if (btnBackToSelection) {
            btnBackToSelection.addEventListener('click', () => {
                resetModalView();
            });
        }

        if (adminGatewayLoginForm) {
            adminGatewayLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const portalType = adminSelectedPortalType ? adminSelectedPortalType.value : '';
                const adminId = document.getElementById('adminGatewayId').value.trim();
                const password = document.getElementById('adminGatewayPassword').value;

                if (portalType === 'sector') {
                    if ((adminId === 'SEC-ADMIN' || adminId === 'admin@gov.in') && password === 'password123') {
                        toggleModal(adminSelectionModal, false);
                        resetModalView();
                        const mockUser = { email: 'admin@gov.in', displayName: 'Sector Admin' };
                        initDashboardUI(mockUser);
                        addNotification('Logged in to Sector Admin Portal successfully.', 'success');
                    } else {
                        if (adminGatewayLoginError) adminGatewayLoginError.classList.remove('hidden');
                    }
                } else if (portalType === 'super') {
                    if ((adminId === 'SUPER-ADMIN' || adminId === 'super.admin@gov.in') && password === 'password123') {
                        toggleModal(adminSelectionModal, false);
                        resetModalView();
                        const mockUser = { email: 'super.admin@gov.in', displayName: 'Super Admin' };
                        initDashboardUI(mockUser);
                        addNotification('Logged in to National Super Admin Portal successfully.', 'success');
                    } else {
                        if (adminGatewayLoginError) adminGatewayLoginError.classList.remove('hidden');
                    }
                }
            });
        }
    }

    function renderManageAdminsSubtab() {
        const grid = document.getElementById('sectorAdminsGrid');
        const list = document.getElementById('directivesLogList');
        if (!grid || !list) return;

        grid.innerHTML = '';
        sectorAdmins.forEach(admin => {
            const initials = admin.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const sectorClass = admin.sector.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
            const card = document.createElement('div');
            card.className = 'sector-admin-card glass-panel';
            card.innerHTML = `
                <div class="admin-card-header">
                    <div class="admin-card-avatar">${initials}</div>
                    <div class="admin-card-info">
                        <h5 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">${admin.name}</h5>
                        <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">${admin.email}</p>
                    </div>
                </div>
                <div>
                    <span class="admin-badge-sector ${sectorClass}">${admin.sector}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.25rem; margin: 0.25rem 0;">
                    <div><i class="ph ph-calendar"></i> <strong>Term:</strong> ${admin.term}</div>
                    <div><i class="ph ph-scroll"></i> <strong>Directives:</strong> ${admin.directivesCount} issued</div>
                </div>
                <div class="admin-card-stats">
                    <div class="admin-stat-item">
                        <span class="admin-stat-val" style="color: var(--success-color); font-size: 1rem; font-weight: 700; display: block;">${admin.approvalsToday}</span>
                        <span class="admin-stat-lbl" style="font-size: 0.7rem; color: var(--text-secondary);">Approvals Today</span>
                    </div>
                    <div class="admin-stat-item">
                        <span class="admin-stat-val" style="color: var(--error-color); font-size: 1rem; font-weight: 700; display: block;">${admin.rejectionsToday}</span>
                        <span class="admin-stat-lbl" style="font-size: 0.7rem; color: var(--text-secondary);">Rejections Today</span>
                    </div>
                </div>
                <div class="admin-card-actions">
                    <button class="btn btn-outline btn-xs btnEditAdmin" data-id="${admin.id}" style="padding: 0.3rem 0.5rem; font-size: 0.72rem; border-radius: 4px; display: flex; align-items: center; gap: 0.25rem;"><i class="ph ph-pencil-simple"></i> Edit Term</button>
                    <button class="btn btn-outline btn-xs btnSendDirective" data-id="${admin.id}" data-name="${admin.name}" data-sector="${admin.sector}" style="padding: 0.3rem 0.5rem; font-size: 0.72rem; border-radius: 4px; display: flex; align-items: center; gap: 0.25rem;"><i class="ph ph-chat-centered-text"></i> Order</button>
                    <button class="btn btn-outline btn-xs btnRevokeAdmin" data-id="${admin.id}" style="padding: 0.3rem 0.5rem; font-size: 0.72rem; border-radius: 4px; border-color: rgba(239,68,68,0.4); color: var(--error-color); display: flex; align-items: center; gap: 0.25rem;"><i class="ph ph-trash"></i> Revoke</button>
                </div>
            `;
            grid.appendChild(card);
        });

        // Add listeners for action buttons in Grid
        grid.querySelectorAll('.btnEditAdmin').forEach(btn => {
            btn.addEventListener('click', () => {
                const adminId = btn.getAttribute('data-id');
                const admin = sectorAdmins.find(a => a.id === adminId);
                if (admin) {
                    document.getElementById('appointAdminId').value = admin.id;
                    document.getElementById('appointName').value = admin.name;
                    document.getElementById('appointEmail').value = admin.email;
                    document.getElementById('appointSector').value = admin.sector;
                    document.getElementById('appointTerm').value = admin.term;
                    document.getElementById('appointDirectives').value = '';
                    
                    document.getElementById('appointFormTitle').innerText = 'Update Administrator';
                    document.getElementById('appointFormCard').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        grid.querySelectorAll('.btnSendDirective').forEach(btn => {
            btn.addEventListener('click', () => {
                const adminName = btn.getAttribute('data-name');
                const sector = btn.getAttribute('data-sector');
                const promptVal = prompt(`Issue operational directive/guideline to ${adminName} (${sector}):`);
                if (promptVal && promptVal.trim() !== '') {
                    const adminId = btn.getAttribute('data-id');
                    const admin = sectorAdmins.find(a => a.id === adminId);
                    if (admin) {
                        admin.directivesCount = (admin.directivesCount || 0) + 1;
                    }
                    nationalDirectives.unshift({
                        id: 'dir-' + Date.now(),
                        adminName: adminName,
                        sector: sector,
                        text: promptVal.trim(),
                        timestamp: new Date().toLocaleString()
                    });
                    saveSectorAdminsState();
                    renderManageAdminsSubtab();
                    addNotification(`Directive dispatched to ${adminName} successfully.`, 'success');
                    logSystemEvent('Super Admin Command', `Issued directive to ${adminName} (${sector}): "${promptVal.trim()}"`);
                }
            });
        });

        grid.querySelectorAll('.btnRevokeAdmin').forEach(btn => {
            btn.addEventListener('click', () => {
                const adminId = btn.getAttribute('data-id');
                const admin = sectorAdmins.find(a => a.id === adminId);
                if (admin) {
                    if (confirm(`Are you sure you want to revoke the appointment of ${admin.name} for the ${admin.sector} sector?`)) {
                        sectorAdmins = sectorAdmins.filter(a => a.id !== adminId);
                        saveSectorAdminsState();
                        renderManageAdminsSubtab();
                        addNotification(`Appointment for ${admin.name} revoked.`, 'info');
                        logSystemEvent('Super Admin Command', `Revoked appointment of ${admin.name} (${admin.sector}).`);
                    }
                }
            });
        });

        // Render Directives List
        list.innerHTML = '';
        if (nationalDirectives.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-size: 0.82rem; padding: 1rem 0;">No directives issued yet.</p>';
        } else {
            nationalDirectives.forEach(dir => {
                const logItem = document.createElement('div');
                logItem.className = 'directive-log-card';
                logItem.innerHTML = `
                    <div class="directive-log-meta">
                        <span><strong>To:</strong> ${dir.adminName} (${dir.sector})</span>
                        <span>${dir.timestamp}</span>
                    </div>
                    <div class="directive-log-text">${dir.text}</div>
                `;
                list.appendChild(logItem);
            });
        }
    }

    function initManageAdminsForm() {
        const form = document.getElementById('appointAdminForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const adminId = document.getElementById('appointAdminId').value;
            const name = document.getElementById('appointName').value.trim();
            const email = document.getElementById('appointEmail').value.trim();
            const sector = document.getElementById('appointSector').value;
            const term = document.getElementById('appointTerm').value.trim();
            const directive = document.getElementById('appointDirectives').value.trim();

            if (adminId) {
                // Update mode
                const admin = sectorAdmins.find(a => a.id === adminId);
                if (admin) {
                    admin.name = name;
                    admin.email = email;
                    admin.sector = sector;
                    admin.term = term;
                    if (directive !== '') {
                        admin.directivesCount = (admin.directivesCount || 0) + 1;
                        nationalDirectives.unshift({
                            id: 'dir-' + Date.now(),
                            adminName: name,
                            sector: sector,
                            text: directive,
                            timestamp: new Date().toLocaleString()
                        });
                        logSystemEvent('Super Admin Command', `Issued directive to ${name} (${sector}): "${directive}"`);
                    }
                    addNotification(`Updated administrator details for ${name}.`, 'success');
                    logSystemEvent('Super Admin Command', `Updated administrator ${name} (${sector}) details.`);
                }
            } else {
                // Appoint mode
                const existing = sectorAdmins.find(a => a.sector === sector);
                if (existing) {
                    if (!confirm(`An administrator (${existing.name}) is already appointed for ${sector}. Would you like to replace them?`)) {
                        return;
                    }
                    sectorAdmins = sectorAdmins.filter(a => a.id !== existing.id);
                    logSystemEvent('Super Admin Command', `Replaced ${existing.name} with ${name} for ${sector}.`);
                }

                const newAdmin = {
                    id: 'admin-' + Date.now(),
                    name: name,
                    email: email,
                    sector: sector,
                    term: term,
                    approvalsToday: 0,
                    rejectionsToday: 0,
                    directivesCount: directive !== '' ? 1 : 0,
                    status: 'Active'
                };
                sectorAdmins.push(newAdmin);

                if (directive !== '') {
                    nationalDirectives.unshift({
                        id: 'dir-' + Date.now(),
                        adminName: name,
                        sector: sector,
                        text: directive,
                        timestamp: new Date().toLocaleString()
                    });
                    logSystemEvent('Super Admin Command', `Issued directive to ${name} (${sector}): "${directive}"`);
                }
                addNotification(`Successfully appointed ${name} as ${sector} Admin.`, 'success');
                logSystemEvent('Super Admin Command', `Appointed ${name} (${sector}) for term: ${term}.`);
            }

            saveSectorAdminsState();
            form.reset();
            document.getElementById('appointAdminId').value = '';
            document.getElementById('appointFormTitle').innerText = 'Appoint New Admin';
            renderManageAdminsSubtab();
        });

        const btnCancelAppoint = document.getElementById('btnCancelAppoint');
        if (btnCancelAppoint) {
            btnCancelAppoint.addEventListener('click', () => {
                form.reset();
                document.getElementById('appointAdminId').value = '';
                document.getElementById('appointFormTitle').innerText = 'Appoint New Admin';
            });
        }

        const btnShowAppointForm = document.getElementById('btnShowAppointForm');
        if (btnShowAppointForm) {
            btnShowAppointForm.addEventListener('click', () => {
                form.reset();
                document.getElementById('appointAdminId').value = '';
                document.getElementById('appointFormTitle').innerText = 'Appoint New Admin';
                document.getElementById('appointFormCard').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    function applyAdminSidebarView(isAdmin) {
        const sidebar = document.querySelector('.dashboard-sidebar');
        if (sidebar) {
            if (isAdmin) {
                sidebar.classList.add('hidden');
                sidebar.style.display = 'none';
            } else {
                sidebar.classList.remove('hidden');
                sidebar.style.display = '';
            }
        }

        const sidebarButtons = document.querySelectorAll('.sidebar-btn');
        sidebarButtons.forEach(btn => {
            const tab = btn.getAttribute('data-tab');
            if (isAdmin) {
                if (tab === 'admin') {
                    btn.classList.remove('hidden');
                    btn.style.display = '';
                } else {
                    btn.classList.add('hidden');
                    btn.style.display = 'none';
                }
            } else {
                if (tab === 'admin') {
                    btn.classList.add('hidden');
                    btn.style.display = 'none';
                } else {
                    btn.classList.remove('hidden');
                    btn.style.display = '';
                }
            }
        });
        
        // Hide/Show Mode Toggles permanently for Admin, restore for Citizen
        const dashboardModeToggle = document.getElementById('dashboardModeToggle');
        const dashboardModeToggleMobile = document.getElementById('dashboardModeToggleMobile');
        if (dashboardModeToggle) {
            if (isAdmin) dashboardModeToggle.classList.add('hidden');
            else dashboardModeToggle.classList.remove('hidden');
        }
        if (dashboardModeToggleMobile) {
            if (isAdmin) dashboardModeToggleMobile.classList.add('hidden');
            else dashboardModeToggleMobile.classList.remove('hidden');
        }
        
        // Hide/Show location filters in Admin tab based on Role
        const sectorAdminLocationFilters = document.getElementById('sectorAdminLocationFilters');
        if (sectorAdminLocationFilters) {
            if (isAdmin && currentAdminRole !== 'super-admin') {
                sectorAdminLocationFilters.classList.remove('hidden');
            } else {
                sectorAdminLocationFilters.classList.add('hidden');
            }
        }

        // Hide/Show citizen welcome header banner block based on admin mode
        const headerBlock = document.querySelector('.dashboard-header-block');
        if (headerBlock) {
            if (isAdmin) headerBlock.classList.add('hidden');
            else headerBlock.classList.remove('hidden');
        }

        // Hide/Show main site footer based on admin mode
        const footer = document.querySelector('.main-footer');
        if (footer) {
            if (isAdmin) {
                footer.classList.add('hidden');
                footer.style.display = 'none';
            } else {
                footer.classList.remove('hidden');
                footer.style.display = '';
            }
        }

        // Hide/Show chatbot container based on admin mode
        const chatbot = document.querySelector('.chatbot-container');
        if (chatbot) {
            if (isAdmin) {
                chatbot.classList.add('hidden');
                chatbot.style.display = 'none';
            } else {
                chatbot.classList.remove('hidden');
                chatbot.style.display = '';
            }
        }

        // Hide/Show Admin Role Selector based on super-admin privilege
        const roleSelector = document.querySelector('.admin-role-selector');
        if (roleSelector) {
            const email = currentUser ? currentUser.email : '';
            if (isAdmin && email !== 'super.admin@gov.in') {
                roleSelector.classList.add('hidden');
                roleSelector.style.display = 'none';
            } else {
                roleSelector.classList.remove('hidden');
                roleSelector.style.display = '';
            }
        }
    }

    // Initialize State & District dropdown listener hooks
    function initLocationFilters() {
        const stateSelect = document.getElementById('adminStateSelect');
        const districtSelect = document.getElementById('adminDistrictSelect');
        if (stateSelect && districtSelect) {
            const districtMap = {
                'All': ['All Districts'],
                'AP': ['All Districts', 'Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Prakasam', 'Srikakulam', 'Sri Potti Sriramulu Nellore', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa', 'Parvathipuram Manyam', 'Alluri Sitharama Raju', 'Anakapalli', 'Kakinada', 'Konaseema', 'Eluru', 'NTR', 'Bapatla', 'Palnadu', 'Nandyal', 'Sri Sathya Sai', 'Annamayya', 'Tirupati'],
                'AR': ['All Districts', 'Tawang', 'West Kameng', 'East Kameng', 'Papum Pare', 'Kurung Kumey', 'Kra Daadi', 'Lower Subansiri', 'Upper Subansiri', 'West Siang', 'East Siang', 'Siang', 'Upper Siang', 'Lower Siang', 'Lower Dibang Valley', 'Dibang Valley', 'Anjaw', 'Lohit', 'Namsai', 'Changlang', 'Tirap', 'Longding', 'Kamle', 'Pakke Kessang', 'Lepa Rada', 'Shi Yomi', 'Keyi Panyor'],
                'AS': ['All Districts', 'Baksa', 'Barpeta', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Goalpara', 'Golaghat', 'Hailakandi', 'Jorhat', 'Kamrup Metropolitan', 'Kamrup', 'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Dima Hasao', 'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar', 'Tinsukia', 'Udalguri', 'West Karbi Anglong'],
                'BR': ['All Districts', 'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran'],
                'CT': ['All Districts', 'Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada', 'Dhamtari', 'Durg', 'Gariaband', 'Gaurela-Pendra-Marwahi', 'Janjgir-Champa', 'Jashpur', 'Kabirdham', 'Kanker', 'Kondagaon', 'Korba', 'Koriya', 'Mahasamund', 'Manendragarh-Chirmiri-Bharatpur', 'Mohla-Manpur-Ambagarh Chowki', 'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon', 'Sarangarh-Bilaigarh', 'Sakti', 'Sukma', 'Surajpur', 'Surguja', 'Khairagarh-Chhuikhadan-Gandai'],
                'GA': ['All Districts', 'North Goa', 'South Goa'],
                'GJ': ['All Districts', 'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Dahod', 'Dang', 'Devbhumi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad', 'Botad', 'Chhota Udaipur'],
                'HR': ['All Districts', 'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'],
                'HP': ['All Districts', 'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'],
                'JH': ['All Districts', 'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahibganj', 'Seraikela Kharsawan', 'Simdega', 'West Singhbhum'],
                'KA': ['All Districts', 'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir', 'Vijayanagara'],
                'KL': ['All Districts', 'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
                'MP': ['All Districts', 'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa', 'Satna', 'Chhindwara', 'Morena', 'Bhind', 'Shivpuri', 'Guna', 'Datia', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Burhanpur', 'Chhatarpur', 'Damoh', 'Dewas', 'Dhar', 'Dindori', 'Harda', 'Hoshangabad', 'Khandwa', 'Khargone', 'Katni', 'Mandla', 'Mandsaur', 'Narsinghpur', 'Neemuch', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam', 'Sehore', 'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Sidhi', 'Singrauli', 'Tikamgarh', 'Umaria', 'Vidisha', 'Niwari', 'Mauganj', 'Maihar', 'Pandhurna'],
                'MH': ['All Districts', 'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'],
                'MN': ['All Districts', 'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Senapati', 'Tamenglong', 'Thoubal', 'Ukhrul', 'Noney', 'Kamjong', 'Kangpokpi', 'Tengnoupal', 'Pherzawl', 'Kakching', 'Jiribam'],
                'ML': ['All Districts', 'East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills', 'Eastern West Khasi Hills'],
                'MZ': ['All Districts', 'Aizawl', 'Champhai', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Serchhip', 'Hnahthial', 'Khawzawl', 'Saitual'],
                'NL': ['All Districts', 'Dimapur', 'Kohima', 'Mokokchung', 'Mon', 'Phek', 'Tuensang', 'Wokha', 'Zunheboto', 'Longleng', 'Kiphire', 'Peren', 'Noklak', 'Shamator', 'Tseminyu', 'Niuland', 'Chumoukedima'],
                'OR': ['All Districts', 'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'],
                'PB': ['All Districts', 'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa', 'Moga', 'Pathankot', 'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar', 'Sangrur', 'Shahid Bhagat Singh Nagar', 'Sri Muktsar Sahib', 'Tarn Taran'],
                'RJ': ['All Districts', 'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur', 'Anupgarh', 'Balotra', 'Beawar', 'Deeg', 'Didwana-Kuchaman', 'Dudu', 'Gangapur City', 'Kekri', 'Kotputli-Behror', 'Khairthal-Tijara', 'Neem Ka Thana', 'Phalodi', 'Salumbar', 'Sanchore', 'Shahpura'],
                'SK': ['All Districts', 'Gangtok', 'Mangan', 'Namchi', 'Pakyong', 'Soreng', 'Gyalshing'],
                'TN': ['All Districts', 'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'],
                'TG': ['All Districts', 'Adilabad', 'Bhadradri Kothagudem', 'Hanumakonda', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri'],
                'TR': ['All Districts', 'Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'],
                'UP': ['All Districts', 'Agra', 'Aligarh', 'Prayagraj', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Faizabad', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kheri', 'Kushinagar', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi'],
                'UT': ['All Districts', 'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'],
                'WB': ['All Districts', 'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur', 'Kolkata'],
                'AN': ['All Districts', 'Nicobar', 'North and Middle Andaman', 'South Andaman'],
                'CH': ['All Districts', 'Chandigarh'],
                'DN': ['All Districts', 'Dadra', 'Nagar Haveli', 'Daman', 'Diu'],
                'DL': ['All Districts', 'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
                'JK': ['All Districts', 'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Ramban', 'Reasi', 'Samba', 'Shopian', 'Srinagar', 'Udhampur', 'Rajouri'],
                'LA': ['All Districts', 'Kargil', 'Leh'],
                'LD': ['All Districts', 'Lakshadweep'],
                'PY': ['All Districts', 'Karaikal', 'Mahe', 'Puducherry', 'Yanam']
            };
            
            stateSelect.addEventListener('change', () => {
                const stateVal = stateSelect.value;
                const districts = districtMap[stateVal] || ['All Districts'];
                districtSelect.innerHTML = '';
                districts.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d === 'All Districts' ? 'All' : d;
                    opt.textContent = d;
                    districtSelect.appendChild(opt);
                });
                
                // Trigger queue render
                if (window.renderAdminReviewQueue) {
                    window.renderAdminReviewQueue();
                }
            });

            districtSelect.addEventListener('change', () => {
                if (window.renderAdminReviewQueue) {
                    window.renderAdminReviewQueue();
                }
            });
        }
    }

});

