/* ==========================================================================
   TRANG ĐÀI PHOTO - SYSTEM SCRIPTS
   Description: JavaScript code for scroll effect, light/dark mode toggle,
                hero slider, and the interactive 3D portfolio album.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------------------------
       1. CORE GLOBAL SELECTORS
       -------------------------------------------------------------------------- */
    const header = document.querySelector('.header');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const backToTopBtn = document.getElementById('back-to-top');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileDrawer = document.querySelector('.mobile-drawer');
    const drawerCloseBtn = document.querySelector('.drawer-close');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    /* --------------------------------------------------------------------------
       2. SCROLL EVENTS & HEADER GLASS EFFECT
       -------------------------------------------------------------------------- */
    window.addEventListener('scroll', () => {
        // Sticky Header scroll styling
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Back to top visibility
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    // Back to top click handler
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    /* --------------------------------------------------------------------------
       3. DARK / LIGHT THEME TOGGLE
       -------------------------------------------------------------------------- */
    // Initialize theme based on user choice or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
        document.body.classList.add('light-theme');
        updateThemeToggleIcon(true);
    } else {
        document.body.classList.remove('light-theme');
        updateThemeToggleIcon(false);
    }

    themeToggleBtn.addEventListener('click', () => {
        const isLightTheme = document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
        updateThemeToggleIcon(isLightTheme);
    });

    function updateThemeToggleIcon(isLight) {
        const icon = themeToggleBtn.querySelector('i');
        if (isLight) {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    /* --------------------------------------------------------------------------
       4. MOBILE MENU DRAWER
       -------------------------------------------------------------------------- */
    function toggleDrawer(open) {
        if (open) {
            mobileDrawer.classList.add('open');
            mobileMenuToggle.setAttribute('aria-expanded', 'true');
        } else {
            mobileDrawer.classList.remove('open');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    }

    mobileMenuToggle.addEventListener('click', () => toggleDrawer(true));
    drawerCloseBtn.addEventListener('click', () => toggleDrawer(false));

    // Close drawer when clicking a navigation link
    drawerLinks.forEach(link => {
        link.addEventListener('click', () => toggleDrawer(false));
    });

    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileDrawer.classList.contains('open') && 
            !mobileDrawer.contains(e.target) && 
            !mobileMenuToggle.contains(e.target)) {
            toggleDrawer(false);
        }
    });

    /* --------------------------------------------------------------------------
       5. HERO SECTION BACKGROUND IMAGE SLIDER
       -------------------------------------------------------------------------- */
    const heroSlides = document.querySelectorAll('.hero-slide');
    let currentSlideIndex = 0;
    const slideIntervalTime = 5000; // 5 seconds

    function nextHeroSlide() {
        heroSlides[currentSlideIndex].classList.remove('active');
        currentSlideIndex = (currentSlideIndex + 1) % heroSlides.length;
        heroSlides[currentSlideIndex].classList.add('active');
    }

    if (heroSlides.length > 1) {
        setInterval(nextHeroSlide, slideIntervalTime);
    }

    /* --------------------------------------------------------------------------
       6. INTERACTION SCROLL REVEAL (FADE-UP)
       -------------------------------------------------------------------------- */
    const revealElements = document.querySelectorAll('.reveal-up');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    /* --------------------------------------------------------------------------
       7. 3D INTERACTIVE FLIP BOOK ALBUM (Facebook Reel Reference 4)
       -------------------------------------------------------------------------- */
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const playBtn = document.getElementById('play-btn');
    const book = document.getElementById('myBook');
    
    // Select all pages in the book
    const pages = [
        document.getElementById('p1'),
        document.getElementById('p2'),
        document.getElementById('p3'),
        document.getElementById('p4')
    ];

    let currentPage = 0; // Starts at 0 (Cover showing)
    const maxPage = pages.length;
    let autoFlipInterval = null;

    // Initialize book shift alignment class
    updateBookShifting();

    function updateBookShifting() {
        book.classList.remove('at-cover', 'at-back-cover');
        if (currentPage === 0) {
            book.classList.add('at-cover');
        } else if (currentPage === maxPage) {
            book.classList.add('at-back-cover');
        }
    }

    function goNextPage() {
        if (currentPage < maxPage) {
            pages[currentPage].classList.add('flipped');
            currentPage++;
            updateBookShifting();
        } else {
            // Loop back to the start if at the end
            closeAndResetBook();
        }
    }

    function goPrevPage() {
        if (currentPage > 0) {
            currentPage--;
            pages[currentPage].classList.remove('flipped');
            updateBookShifting();
        }
    }

    function closeAndResetBook() {
        // Stop autoplay if running
        stopAutoplay();
        
        // Reset page-by-page with delay for visual feedback
        let delay = 0;
        for (let i = maxPage - 1; i >= 0; i--) {
            setTimeout(() => {
                pages[i].classList.remove('flipped');
                currentPage = i;
                updateBookShifting();
                if (i === 0) {
                    currentPage = 0;
                    updateBookShifting();
                }
            }, delay);
            delay += 150;
        }
    }

    // Event listeners for book buttons
    nextBtn.addEventListener('click', () => {
        stopAutoplay();
        goNextPage();
    });

    prevBtn.addEventListener('click', () => {
        stopAutoplay();
        goPrevPage();
    });

    // Tap/Click on the pages directly to flip
    pages.forEach((page, index) => {
        page.addEventListener('click', (e) => {
            // Avoid double flipping when clicking buttons or page edges specifically
            e.stopPropagation();
            stopAutoplay();
            
            // If the clicked page is flipped, flip it back
            if (page.classList.contains('flipped')) {
                // If it is the page right before the current active page, we can unflip it
                if (index === currentPage - 1) {
                    goPrevPage();
                }
            } else {
                // If the page is not flipped, and it is the current page, we flip it forward
                if (index === currentPage) {
                    goNextPage();
                }
            }
        });
    });

    // Autoplay function
    function startAutoplay() {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        playBtn.classList.add('active');
        autoFlipInterval = setInterval(() => {
            goNextPage();
        }, 3000);
    }

    function stopAutoplay() {
        if (autoFlipInterval) {
            clearInterval(autoFlipInterval);
            autoFlipInterval = null;
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Auto';
            playBtn.classList.remove('active');
        }
    }

    playBtn.addEventListener('click', () => {
        if (autoFlipInterval) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    });

});
