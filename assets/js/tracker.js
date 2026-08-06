/* ==========================================================================
   TRANG ĐÀI PHOTO - WEB METRICS TRACKER
   Description: Client-side event tracking system saving data to localStorage
                with auto-generated 15-day mock historical data.
   ========================================================================== */

(function() {
    const STORAGE_KEY = 'tdphoto_dashboard_stats';
    const VISITOR_KEY = 'tdphoto_visitor_id';
    const SESSION_KEY = 'tdphoto_session_active';

    // Helper to format Date as YYYY-MM-DD
    function formatDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    // SHA-256 Utility for secure client-side passcode matching
    window.hashPasscode = async function(passcode) {
        const msgUint8 = new TextEncoder().encode(passcode);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Generate Mock History for the last 15 days (excluding today)
    function generateMockHistory() {
        const history = [];
        const today = new Date();
        
        for (let i = 15; i >= 1; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = formatDate(date);

            // Generate realistic random variables with patterns
            // Weekends have slightly higher traffic
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const multiplier = isWeekend ? 1.4 : 1.0;

            const visitors = Math.floor((60 + Math.random() * 80) * multiplier);
            const visits = Math.floor(visitors * (1.2 + Math.random() * 0.4));
            const zalo_clicks = Math.floor(visitors * (0.12 + Math.random() * 0.15));
            const pricing_clicks = Math.floor(visitors * (0.2 + Math.random() * 0.25));

            history.push({
                date: dateStr,
                visits: visits,
                visitors: visitors,
                zalo_clicks: zalo_clicks,
                pricing_clicks: pricing_clicks
            });
        }
        return history;
    }

    // Initialize stats
    function initStats() {
        let stats = localStorage.getItem(STORAGE_KEY);
        const todayStr = formatDate(new Date());

        if (!stats) {
            // Setup fresh stats structure with mock history
            stats = {
                visits: 0,
                visitors: 0,
                zalo_clicks: {
                    total: 0,
                    locations: {
                        "Header": 0,
                        "Mobile Drawer": 0,
                        "Hero Banner": 0,
                        "Pricing Card": 0,
                        "Contact Footer": 0,
                        "Other": 0
                    }
                },
                pricing_clicks: {
                    total: 0,
                    sizes: {
                        "6 × 9": 0,
                        "A6": 0,
                        "A5": 0,
                        "Ảnh Thẻ": 0,
                        "Khác": 0
                    }
                },
                book_flips: 0,
                total_duration_sec: 0,
                session_count: 0,
                events: [],
                daily_history: generateMockHistory()
            };
        } else {
            try {
                stats = JSON.parse(stats);
            } catch (e) {
                console.error("Error parsing stats, resetting", e);
                stats = null;
                initStats();
                return;
            }
        }

        // Ensure daily_history has today's record
        let todayRecord = stats.daily_history.find(d => d.date === todayStr);
        if (!todayRecord) {
            todayRecord = {
                date: todayStr,
                visits: 0,
                visitors: 0,
                zalo_clicks: 0,
                pricing_clicks: 0
            };
            stats.daily_history.push(todayRecord);
            
            // Limit history to 30 days to avoid clogging storage
            if (stats.daily_history.length > 30) {
                stats.daily_history.shift();
            }
        }

        saveStats(stats);
        return stats;
    }

    function getStats() {
        const stats = localStorage.getItem(STORAGE_KEY);
        return stats ? JSON.parse(stats) : initStats();
    }

    function saveStats(stats) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }

    // Add general activity log
    function logEvent(type, detail) {
        const stats = getStats();
        const event = {
            timestamp: new Date().toISOString(),
            type: type,
            detail: detail
        };
        stats.events.unshift(event); // Add to beginning

        // Keep last 50 events
        if (stats.events.length > 50) {
            stats.events.pop();
        }
        saveStats(stats);
    }

    // Update today's metric in daily history
    function updateTodayMetric(metric, value = 1) {
        const stats = getStats();
        const todayStr = formatDate(new Date());
        const todayRecord = stats.daily_history.find(d => d.date === todayStr);
        if (todayRecord) {
            todayRecord[metric] = (todayRecord[metric] || 0) + value;
        }
        saveStats(stats);
    }

    // Run core tracking logic
    function runTracker() {
        const stats = initStats();
        const todayStr = formatDate(new Date());

        // 1. UNIQUE VISITOR TRACKING
        let visitorId = localStorage.getItem(VISITOR_KEY);
        let isNewVisitor = false;
        if (!visitorId) {
            visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(VISITOR_KEY, visitorId);
            isNewVisitor = true;

            stats.visitors += 1;
            saveStats(stats);
            updateTodayMetric('visitors', 1);
            logEvent('new_visitor', 'Khách truy cập mới từ thiết bị mới');
        }

        // 2. SESSION & PAGEVIEW TRACKING
        const isSessionActive = sessionStorage.getItem(SESSION_KEY);
        if (!isSessionActive) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            stats.session_count += 1;
            stats.visits += 1;
            saveStats(stats);
            updateTodayMetric('visits', 1);

            const userAgent = navigator.userAgent;
            let device = "Thiết bị di động";
            if (window.innerWidth > 992) device = "Máy tính để bàn";
            else if (window.innerWidth > 768) device = "Máy tính bảng";

            let browser = "Trình duyệt";
            if (userAgent.indexOf("Chrome") > -1) browser = "Chrome";
            else if (userAgent.indexOf("Safari") > -1) browser = "Safari";
            else if (userAgent.indexOf("Firefox") > -1) browser = "Firefox";
            else if (userAgent.indexOf("Edge") > -1) browser = "Edge";

            logEvent('visit', `Lượt truy cập mới từ ${device} (${browser})`);
        } else {
            // Just increment page views
            stats.visits += 1;
            saveStats(stats);
            updateTodayMetric('visits', 1);
            logEvent('pageview', `Xem trang chủ index.html`);
        }

        // 3. EVENT LISTENERS SETUP
        document.addEventListener('DOMContentLoaded', () => {
            // Track Zalo & Contact clicks
            document.body.addEventListener('click', (e) => {
                const target = e.target.closest('a, button');
                if (!target) return;

                const href = target.getAttribute('href') || '';
                const text = (target.innerText || target.getAttribute('aria-label') || '').trim();

                // Detect Zalo / Phone clicks
                if (href.indexOf('zalo.me') > -1 || href.indexOf('tel:') > -1 || target.classList.contains('zalo-btn') || target.classList.contains('drawer-zalo-btn')) {
                    let location = 'Other';
                    
                    if (target.closest('.header') || target.closest('.header-container')) {
                        location = 'Header';
                    } else if (target.closest('.mobile-drawer') || target.closest('.drawer-nav')) {
                        location = 'Mobile Drawer';
                    } else if (target.closest('.hero') || target.closest('.hero-content')) {
                        location = 'Hero Banner';
                    } else if (target.closest('.pricing-card')) {
                        location = 'Pricing Card';
                    } else if (target.closest('.contact-section') || target.closest('.footer-socials') || target.closest('.footer-bottom')) {
                        location = 'Contact Footer';
                    }

                    const typeText = href.indexOf('tel:') > -1 ? 'Gọi điện thoại' : 'Liên hệ Zalo';

                    const currentStats = getStats();
                    currentStats.zalo_clicks.total += 1;
                    currentStats.zalo_clicks.locations[location] = (currentStats.zalo_clicks.locations[location] || 0) + 1;
                    saveStats(currentStats);
                    
                    updateTodayMetric('zalo_clicks', 1);
                    logEvent('zalo_click', `Click ${typeText} ở vị trí: "${location}" ("${text}")`);
                }

                // Detect Pricing Card clicks
                if (target.classList.contains('card-btn') || target.closest('.pricing-card') && target.tagName === 'A') {
                    const pricingCard = target.closest('.pricing-card');
                    if (pricingCard) {
                        let size = 'Khác';
                        const sizeEl = pricingCard.querySelector('.card-size');
                        if (sizeEl) {
                            size = sizeEl.innerText.trim();
                        } else {
                            // Check A5 or other
                            const h3El = pricingCard.querySelector('h3');
                            if (h3El) size = h3El.innerText.trim();
                        }

                        const currentStats = getStats();
                        currentStats.pricing_clicks.total += 1;
                        
                        // Map size
                        let mappedSize = "Khác";
                        if (size.indexOf("6 × 9") > -1 || size.indexOf("6x9") > -1) mappedSize = "6 × 9";
                        else if (size.indexOf("A6") > -1 || size.indexOf("10 × 15") > -1) mappedSize = "A6";
                        else if (size.indexOf("A5") > -1 || size.indexOf("15 × 21") > -1) mappedSize = "A5";
                        else if (size.toLowerCase().indexOf("ảnh thẻ") > -1 || size.toLowerCase().indexOf("anh the") > -1) mappedSize = "Ảnh Thẻ";

                        currentStats.pricing_clicks.sizes[mappedSize] = (currentStats.pricing_clicks.sizes[mappedSize] || 0) + 1;
                        saveStats(currentStats);

                        updateTodayMetric('pricing_clicks', 1);
                        logEvent('pricing_click', `Xem chi tiết đặt ảnh cỡ: "${size}"`);
                    }
                }
            });

            // Track 3D Book interactions
            const bookControls = ['prev-btn', 'next-btn', 'play-btn'];
            bookControls.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        const currentStats = getStats();
                        currentStats.book_flips += 1;
                        saveStats(currentStats);
                        
                        let action = "Lật trang Album";
                        if (id === 'play-btn') action = btn.classList.contains('active') ? "Tắt tự động lật Album" : "Bật tự động lật Album";
                        else if (id === 'prev-btn') action = "Lật trang trước Album";
                        else if (id === 'next-btn') action = "Lật trang sau Album";

                        logEvent('album_interaction', `Tương tác Album 3D: ${action}`);
                    });
                }
            });

            const book = document.getElementById('myBook');
            if (book) {
                const pages = book.querySelectorAll('.page');
                pages.forEach((page, idx) => {
                    page.addEventListener('click', () => {
                        const currentStats = getStats();
                        currentStats.book_flips += 1;
                        saveStats(currentStats);
                        logEvent('album_interaction', `Click lật trang ${idx + 1} trực tiếp trên cuốn sách`);
                    });
                });
            }
        });

        // 4. SESSION DURATION TRACKING
        let durationBuffer = 0;
        setInterval(() => {
            if (!document.hidden) {
                durationBuffer += 1;
                
                // Write to localStorage every 5 seconds to reduce write frequency
                if (durationBuffer >= 5) {
                    const currentStats = getStats();
                    currentStats.total_duration_sec = (currentStats.total_duration_sec || 0) + durationBuffer;
                    saveStats(currentStats);
                    durationBuffer = 0;
                }
            }
        }, 1000);
    }

    // Run the tracker script immediately
    runTracker();
})();
