/* ==========================================================================
   TRANG ĐÀI PHOTO — INTERACTION LAYER
   No dependencies. Every block guards for missing markup.
   ========================================================================== */

(() => {
    'use strict';

    const doc = document;
    const root = doc.documentElement;
    const body = doc.body;
    const $ = (selector, scope = doc) => scope.querySelector(selector);
    const $$ = (selector, scope = doc) => Array.from(scope.querySelectorAll(selector));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    /* --------------------------------------------------------------------------
       1. THEME SWITCH (with View Transitions when available)
       -------------------------------------------------------------------------- */
    const themeToggle = $('.theme-toggle');
    const themeMeta = $('meta[name="theme-color"]');

    const currentTheme = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    function syncThemeUI() {
        const isDark = currentTheme() === 'dark';
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', String(isDark));
            const use = themeToggle.querySelector('use');
            if (use) use.setAttribute('href', isDark ? '#i-sun' : '#i-moon');
        }
        if (themeMeta) {
            themeMeta.setAttribute('content', isDark ? '#12100E' : '#F3EEE6');
        }
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('td-theme', theme);
        } catch (error) {
            /* Storage may be unavailable in private mode. */
        }
        syncThemeUI();
    }

    themeToggle?.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        if (typeof doc.startViewTransition === 'function' && !reducedMotion.matches) {
            doc.startViewTransition(() => applyTheme(next));
        } else {
            applyTheme(next);
        }
    });

    syncThemeUI();

    /* --------------------------------------------------------------------------
       2. HEADER STATE, SCROLL PROGRESS, BACK TO TOP
       -------------------------------------------------------------------------- */
    const header = $('.site-header');
    const progressBar = $('.scroll-progress span');
    const backToTop = $('#back-to-top');
    const mobileCta = $('.mobile-cta');

    function updateScrollUI() {
        const y = window.scrollY || window.pageYOffset || 0;
        header?.classList.toggle('is-scrolled', y > 24);
        backToTop?.classList.toggle('is-visible', y > 620);
        mobileCta?.classList.toggle('is-visible', y > 560);

        if (progressBar) {
            const scrollable = doc.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollable > 0 ? (y / scrollable) * 100 : 0;
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        updateScrollSpy();
        updateParallax();
    }

    backToTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });

    /* --------------------------------------------------------------------------
       3. MOBILE DRAWER
       -------------------------------------------------------------------------- */
    const drawer = $('#mobile-menu');
    const menuToggle = $('.menu-toggle');
    const drawerClose = $('.drawer-close');
    const drawerLinks = $$('.drawer-link');
    let drawerReturnFocus = null;

    function setDrawer(open) {
        if (!drawer || !menuToggle) return;

        drawer.classList.toggle('is-open', open);
        drawer.setAttribute('aria-hidden', String(!open));
        menuToggle.setAttribute('aria-expanded', String(open));
        body.classList.toggle('menu-open', open);

        if (open) {
            drawerReturnFocus = doc.activeElement;
            drawer.removeAttribute('inert');
            window.setTimeout(() => drawerClose?.focus({ preventScroll: true }), 320);
        } else {
            drawer.setAttribute('inert', '');
            if (drawerReturnFocus && typeof drawerReturnFocus.focus === 'function') {
                drawerReturnFocus.focus({ preventScroll: true });
            }
        }
    }

    menuToggle?.addEventListener('click', () => setDrawer(true));
    drawerClose?.addEventListener('click', () => setDrawer(false));
    drawerLinks.forEach((link) => link.addEventListener('click', () => setDrawer(false)));

    drawer?.addEventListener('click', (event) => {
        if (event.target === drawer) setDrawer(false);
    });

    doc.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && drawer?.classList.contains('is-open')) {
            setDrawer(false);
        }
    });

    window.matchMedia('(min-width: 1025px)').addEventListener?.('change', (event) => {
        if (event.matches && drawer?.classList.contains('is-open')) setDrawer(false);
    });

    /* --------------------------------------------------------------------------
       4. SCROLL REVEALS
       -------------------------------------------------------------------------- */
    const revealElements = $$('[data-reveal]');

    revealElements.forEach((element) => {
        const siblings = Array.from(element.parentElement?.children || [])
            .filter((child) => child.hasAttribute('data-reveal'));
        const index = siblings.indexOf(element);
        if (index > 0) {
            element.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 0.08}s`);
        }
    });

    if ('IntersectionObserver' in window && !reducedMotion.matches) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -8% 0px'
        });

        revealElements.forEach((element) => revealObserver.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add('is-revealed'));
    }

    /* --------------------------------------------------------------------------
       5. COUNT-UP STATISTICS
       -------------------------------------------------------------------------- */
    const stats = $$('.stat-num[data-count]');
    const numberFormatter = new Intl.NumberFormat('vi-VN');

    function runCountUp(element) {
        if (element.dataset.counted === 'true') return;
        element.dataset.counted = 'true';

        const target = Number(element.dataset.count) || 0;
        const suffix = element.dataset.suffix || '';

        if (reducedMotion.matches) {
            element.textContent = numberFormatter.format(target) + suffix;
            return;
        }

        const duration = 1500;
        const startTime = performance.now();

        const frame = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = numberFormatter.format(Math.round(target * eased)) + suffix;
            if (progress < 1) requestAnimationFrame(frame);
        };

        requestAnimationFrame(frame);
    }

    if (stats.length && 'IntersectionObserver' in window) {
        const statObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                runCountUp(entry.target);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.6 });

        stats.forEach((stat) => statObserver.observe(stat));
    } else {
        stats.forEach(runCountUp);
    }

    /* --------------------------------------------------------------------------
       6. HERO MOUSE PARALLAX
       -------------------------------------------------------------------------- */
    const hero = $('.hero');
    const heroVisual = $('.hero-visual');

    if (hero && heroVisual && finePointer.matches && !reducedMotion.matches) {
        let frame = 0;
        let targetX = 0;
        let targetY = 0;
        const heroPhotos = $$('.hero-photo', heroVisual);

        const renderParallax = () => {
            frame = 0;
            heroVisual.style.setProperty('--mx', targetX.toFixed(3));
            heroVisual.style.setProperty('--my', targetY.toFixed(3));

            heroPhotos.forEach((photo) => {
                const depth = Number.parseFloat(photo.dataset.depth) || 10;
                photo.style.setProperty('--rx', `${(targetY * depth * -0.28).toFixed(2)}deg`);
                photo.style.setProperty('--ry', `${(targetX * depth * 0.32).toFixed(2)}deg`);
                photo.style.setProperty('--gx', `${((targetX * 0.5 + 0.5) * 100).toFixed(1)}%`);
                photo.style.setProperty('--gy', `${((targetY * 0.5 + 0.5) * 100).toFixed(1)}%`);
            });
        };

        hero.addEventListener('pointermove', (event) => {
            const rect = hero.getBoundingClientRect();
            targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
            if (!frame) frame = requestAnimationFrame(renderParallax);
        }, { passive: true });

        hero.addEventListener('pointerleave', () => {
            targetX = 0;
            targetY = 0;
            if (!frame) frame = requestAnimationFrame(renderParallax);
        });
    }

    /* --------------------------------------------------------------------------
       6b. GALLERY TILT
       -------------------------------------------------------------------------- */
    const tiltCards = $$('.work-card');

    if (tiltCards.length && finePointer.matches && !reducedMotion.matches) {
        tiltCards.forEach((card) => {
            const media = $('.work-media', card);
            if (!media) return;

            let frame = 0;
            let pointerX = 0.5;
            let pointerY = 0.5;

            const paint = () => {
                frame = 0;
                const rotateX = (0.5 - pointerY) * 12;
                const rotateY = (pointerX - 0.5) * 14;
                media.style.transform =
                    `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
                media.style.setProperty('--gx', `${(pointerX * 100).toFixed(1)}%`);
                media.style.setProperty('--gy', `${(pointerY * 100).toFixed(1)}%`);
            };

            card.addEventListener('pointerenter', () => {
                media.classList.add('is-tilting');
                if (!frame) frame = requestAnimationFrame(paint);
            });

            card.addEventListener('pointermove', (event) => {
                const rect = card.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
                pointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
                if (!frame) frame = requestAnimationFrame(paint);
            });

            card.addEventListener('pointerleave', () => {
                frame = 0;
                media.classList.remove('is-tilting');
                media.style.transform = '';
                media.style.removeProperty('--gx');
                media.style.removeProperty('--gy');
            });
        });
    }

    /* --------------------------------------------------------------------------
       6c. INTERLUDE SPOTLIGHT
       -------------------------------------------------------------------------- */
    const interlude = $('.interlude');

    if (interlude && finePointer.matches && !reducedMotion.matches) {
        let frame = 0;
        let lx = 50;
        let ly = 50;

        const paintLight = () => {
            frame = 0;
            interlude.style.setProperty('--lx', `${lx.toFixed(1)}%`);
            interlude.style.setProperty('--ly', `${ly.toFixed(1)}%`);
        };

        interlude.addEventListener('pointermove', (event) => {
            const rect = interlude.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            lx = ((event.clientX - rect.left) / rect.width) * 100;
            ly = ((event.clientY - rect.top) / rect.height) * 100;
            if (!frame) frame = requestAnimationFrame(paintLight);
        }, { passive: true });
    }

    /* --------------------------------------------------------------------------
       7. SCROLL PARALLAX
       -------------------------------------------------------------------------- */
    const parallaxElements = $$('[data-parallax]');

    function updateParallax() {
        if (reducedMotion.matches || !parallaxElements.length) return;

        const viewport = window.innerHeight;

        parallaxElements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.bottom < -240 || rect.top > viewport + 240) return;

            const speed = Number.parseFloat(element.dataset.parallax) || 0;
            const offset = (rect.top + rect.height / 2 - viewport / 2) * speed;
            element.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
        });
    }

    /* --------------------------------------------------------------------------
       8. SCROLL SPY
       -------------------------------------------------------------------------- */
    const navLinks = $$('.primary-nav a');
    const spyTargets = navLinks
        .map((link) => {
            const href = link.getAttribute('href') || '';
            if (!href.startsWith('#')) return null;
            const section = doc.getElementById(href.slice(1));
            return section ? { link, section } : null;
        })
        .filter(Boolean);

    function updateScrollSpy() {
        if (!spyTargets.length) return;

        const line = window.innerHeight * 0.36;
        let activeLink = null;

        spyTargets.forEach(({ link, section }) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= line && rect.bottom > line) activeLink = link;
        });

        navLinks.forEach((link) => link.classList.toggle('is-active', link === activeLink));
    }

    /* --------------------------------------------------------------------------
       9. GALLERY FILTERS
       -------------------------------------------------------------------------- */
    const filterButtons = $$('.filter');
    const workCards = $$('.work-card');
    const worksGrid = $('#works-grid');

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const category = button.dataset.filter || 'all';

            filterButtons.forEach((item) => {
                const isActive = item === button;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });

            workCards.forEach((card) => {
                const matches = category === 'all' || card.dataset.category === category;
                card.classList.toggle('is-hidden', !matches);
            });

            worksGrid?.classList.toggle('is-filtered', category !== 'all');
        });
    });

    /* --------------------------------------------------------------------------
       10. LIGHTBOX
       -------------------------------------------------------------------------- */
    const lightbox = $('#lightbox');
    const lightboxImage = $('#lb-image');
    const lightboxTitle = $('#lb-title');
    const lightboxMeta = $('#lb-meta');
    const lightboxIndex = $('#lb-index');
    const lightboxTotal = $('#lb-total');
    let lightboxList = [];
    let lightboxPosition = 0;

    const visibleCards = () => workCards.filter((card) => !card.classList.contains('is-hidden'));

    function preloadAround(position) {
        if (!lightboxList.length) return;

        [-1, 1].forEach((step) => {
            const card = lightboxList[(position + step + lightboxList.length) % lightboxList.length];
            const source = card?.dataset.full;
            if (source) {
                const preloader = new Image();
                preloader.src = source;
            }
        });
    }

    function renderLightbox(position) {
        if (!lightboxList.length || !lightboxImage) return;

        lightboxPosition = (position + lightboxList.length) % lightboxList.length;
        const card = lightboxList[lightboxPosition];
        const thumb = card.querySelector('img');
        const source = card.dataset.full || thumb?.getAttribute('src') || '';

        lightboxImage.setAttribute('src', source);
        lightboxImage.setAttribute('alt', thumb?.getAttribute('alt') || '');
        if (lightboxTitle) lightboxTitle.textContent = card.dataset.title || '';
        if (lightboxMeta) lightboxMeta.textContent = card.dataset.meta || '';
        if (lightboxIndex) lightboxIndex.textContent = String(lightboxPosition + 1).padStart(2, '0');
        if (lightboxTotal) lightboxTotal.textContent = String(lightboxList.length).padStart(2, '0');

        preloadAround(lightboxPosition);
    }

    function openLightbox(card) {
        if (!lightbox || typeof lightbox.showModal !== 'function') return;

        lightboxList = visibleCards();
        const position = lightboxList.indexOf(card);
        if (position < 0) return;

        renderLightbox(position);
        if (!lightbox.open) lightbox.showModal();
        body.classList.add('lightbox-open');
    }

    function closeLightbox() {
        if (lightbox?.open) lightbox.close();
    }

    workCards.forEach((card) => {
        card.addEventListener('click', () => openLightbox(card));
    });

    $('.lightbox-close')?.addEventListener('click', closeLightbox);
    $('.lightbox-prev')?.addEventListener('click', () => renderLightbox(lightboxPosition - 1));
    $('.lightbox-next')?.addEventListener('click', () => renderLightbox(lightboxPosition + 1));

    lightbox?.addEventListener('click', (event) => {
        const target = event.target;
        if (target === lightbox || target.classList?.contains('lightbox-inner')) {
            closeLightbox();
        }
    });

    lightbox?.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeLightbox();
    });

    lightbox?.addEventListener('close', () => {
        body.classList.remove('lightbox-open');
    });

    lightbox?.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') renderLightbox(lightboxPosition - 1);
        if (event.key === 'ArrowRight') renderLightbox(lightboxPosition + 1);
    });

    /* --------------------------------------------------------------------------
       10b. 3D ALBUM FLIP BOOK
       -------------------------------------------------------------------------- */
    const albumBook = $('#myBook');

    if (albumBook) {
        const albumPages = $$('.book-page', albumBook);
        const albumPrev = $('#prev-btn');
        const albumNext = $('#next-btn');
        const albumPlay = $('#play-btn');
        const albumLabel = $('#book-label');
        const albumProgress = $('#book-progress');
        const albumNextLabel = albumNext?.querySelector('span');
        const albumViewport = albumBook.closest('.book-viewport');
        const albumBackLink = $('.cover-zalo', albumBook);
        const albumLabels = ['Bìa trước', 'Ảnh 01 – 02', 'Ảnh 03 – 04', 'Ảnh 05 – 06', 'Bìa sau'];
        const albumSpreads = albumPages.length;
        const autoDelay = 3800;

        let albumIndex = 0;
        let albumTimer = null;
        let pointerStart = null;
        let swipeGuard = 0;

        const syncAlbum = () => {
            const atStart = albumIndex === 0;
            const atEnd = albumIndex === albumSpreads;

            albumBook.classList.toggle('is-closed', atStart);
            albumBook.classList.toggle('is-closed-end', atEnd);
            albumBook.dataset.page = String(albumIndex);

            if (albumPrev) albumPrev.disabled = atStart;
            if (albumNextLabel) albumNextLabel.textContent = atEnd ? 'Về bìa' : 'Trang tiếp';
            if (albumNext) albumNext.setAttribute('aria-label', atEnd ? 'Về bìa trước' : 'Trang tiếp');
            if (albumLabel) albumLabel.textContent = albumLabels[albumIndex] || '';
            if (albumBackLink) {
                const linkVisible = atEnd;
                albumBackLink.tabIndex = linkVisible ? 0 : -1;
                albumBackLink.setAttribute('aria-hidden', linkVisible ? 'false' : 'true');
            }
            if (albumProgress) {
                albumProgress.style.width = `${(albumIndex / albumSpreads) * 100}%`;
            }
        };

        const setAutoState = (active) => {
            if (!albumPlay) return;
            albumPlay.setAttribute('aria-pressed', active ? 'true' : 'false');
            albumPlay.setAttribute('aria-label', active ? 'Tạm dừng tự động lật' : 'Tự động lật trang');
        };

        const stopAuto = () => {
            if (albumTimer) {
                clearInterval(albumTimer);
                albumTimer = null;
            }
            setAutoState(false);
        };

        const resetAlbum = () => {
            stopAuto();
            if (!albumIndex) return;
            albumPages.forEach((page) => page.classList.remove('is-flipped'));
            albumIndex = 0;
            syncAlbum();
        };

        const goNext = ({ auto = false } = {}) => {
            if (albumIndex < albumSpreads) {
                albumPages[albumIndex].classList.add('is-flipped');
                albumIndex += 1;
                syncAlbum();
            } else if (!auto) {
                resetAlbum();
            }
        };

        const goPrev = () => {
            if (albumIndex > 0) {
                albumIndex -= 1;
                albumPages[albumIndex].classList.remove('is-flipped');
                syncAlbum();
            }
        };

        const startAuto = () => {
            if (!albumPlay) return;
            if (albumIndex >= albumSpreads) resetAlbum();
            setAutoState(true);
            albumTimer = setInterval(() => {
                if (albumIndex >= albumSpreads) {
                    stopAuto();
                    return;
                }
                goNext({ auto: true });
            }, autoDelay);
        };

        syncAlbum();

        albumNext?.addEventListener('click', () => {
            stopAuto();
            goNext();
        });

        albumPrev?.addEventListener('click', () => {
            stopAuto();
            goPrev();
        });

        albumPlay?.addEventListener('click', () => {
            if (albumTimer) {
                stopAuto();
            } else {
                startAuto();
            }
        });

        albumPages.forEach((page, index) => {
            page.addEventListener('click', (event) => {
                if (performance.now() < swipeGuard) return;
                if (event.target.closest('a, button')) return;
                stopAuto();
                if (page.classList.contains('is-flipped')) {
                    if (index === albumIndex - 1) goPrev();
                } else if (index === albumIndex) {
                    goNext();
                }
            });
        });

        albumBook.addEventListener('keydown', (event) => {
            if (event.target.closest('a, button')) return;

            if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                stopAuto();
                goNext();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                stopAuto();
                goPrev();
            } else if (event.key === 'Home') {
                event.preventDefault();
                resetAlbum();
            }
        });

        if (albumViewport) {
            albumViewport.addEventListener('pointerdown', (event) => {
                if (event.pointerType === 'mouse') return;
                pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
            }, { passive: true });

            albumViewport.addEventListener('pointerup', (event) => {
                if (!pointerStart || pointerStart.id !== event.pointerId) return;
                const dx = event.clientX - pointerStart.x;
                const dy = event.clientY - pointerStart.y;
                pointerStart = null;

                if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
                swipeGuard = performance.now() + 500;
                stopAuto();
                if (dx < 0) goNext();
                else goPrev();
            }, { passive: true });

            albumViewport.addEventListener('pointercancel', () => {
                pointerStart = null;
            }, { passive: true });
        }
    }

    /* --------------------------------------------------------------------------
       11. PRICING IMAGE PREVIEW
       -------------------------------------------------------------------------- */
    const pricePreview = $('.price-preview');
    const pricePreviewImage = pricePreview?.querySelector('img');
    const priceRows = $$('.pricing-card');

    if (pricePreview && pricePreviewImage && finePointer.matches && !reducedMotion.matches) {
        priceRows.forEach((row) => {
            row.addEventListener('pointerenter', () => {
                const source = row.dataset.preview;
                if (source) pricePreviewImage.setAttribute('src', source);
                pricePreview.classList.add('is-active');
            });

            row.addEventListener('pointermove', (event) => {
                const margin = 120;
                const x = Math.min(Math.max(event.clientX, margin), window.innerWidth - margin);
                const y = Math.min(Math.max(event.clientY, 130), window.innerHeight - 130);
                pricePreview.style.left = `${x}px`;
                pricePreview.style.top = `${y}px`;
            });

            row.addEventListener('pointerleave', () => {
                pricePreview.classList.remove('is-active');
            });
        });

        window.addEventListener('scroll', () => {
            pricePreview.classList.remove('is-active');
        }, { passive: true });
    }

    /* --------------------------------------------------------------------------
       12. TESTIMONIAL SLIDER
       -------------------------------------------------------------------------- */
    const slides = $$('.testimonial-slide');
    const dots = $$('.dot');
    const testimonialShell = $('.testimonial-shell');
    const testimonialTrack = $('.testimonial-track');
    let slideIndex = 0;
    let slideTimer = 0;

    function goToSlide(index, byUser = false) {
        if (!slides.length) return;

        slideIndex = (index + slides.length) % slides.length;

        slides.forEach((slide, position) => {
            slide.classList.toggle('is-active', position === slideIndex);
        });

        dots.forEach((dot, position) => {
            const isActive = position === slideIndex;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-pressed', String(isActive));
        });

        if (byUser) restartSlider();
    }

    function stopSlider() {
        if (slideTimer) {
            window.clearInterval(slideTimer);
            slideTimer = 0;
        }
    }

    function restartSlider() {
        stopSlider();
        if (slides.length > 1 && !reducedMotion.matches) {
            slideTimer = window.setInterval(() => goToSlide(slideIndex + 1), 7000);
        }
    }

    dots.forEach((dot) => {
        dot.addEventListener('click', () => goToSlide(Number(dot.dataset.slideTo) || 0, true));
    });

    $('.testimonial-prev')?.addEventListener('click', () => goToSlide(slideIndex - 1, true));
    $('.testimonial-next')?.addEventListener('click', () => goToSlide(slideIndex + 1, true));

    testimonialShell?.addEventListener('pointerenter', stopSlider);
    testimonialShell?.addEventListener('pointerleave', restartSlider);
    testimonialShell?.addEventListener('focusin', stopSlider);
    testimonialShell?.addEventListener('focusout', restartSlider);

    if (testimonialTrack) {
        let swipeStart = 0;

        testimonialTrack.addEventListener('touchstart', (event) => {
            swipeStart = event.touches[0]?.clientX ?? 0;
        }, { passive: true });

        testimonialTrack.addEventListener('touchend', (event) => {
            const delta = (event.changedTouches[0]?.clientX ?? 0) - swipeStart;
            if (Math.abs(delta) > 45) goToSlide(slideIndex + (delta < 0 ? 1 : -1), true);
        }, { passive: true });
    }

    restartSlider();

    /* --------------------------------------------------------------------------
       13. MAGNETIC BUTTONS
       -------------------------------------------------------------------------- */
    if (finePointer.matches && !reducedMotion.matches) {
        $$('.magnetic').forEach((element) => {
            element.addEventListener('pointermove', (event) => {
                const rect = element.getBoundingClientRect();
                const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
                const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
                element.style.setProperty('--tx', `${(x * 6).toFixed(2)}px`);
                element.style.setProperty('--ty', `${(y * 4).toFixed(2)}px`);
            });

            element.addEventListener('pointerleave', () => {
                element.style.setProperty('--tx', '0px');
                element.style.setProperty('--ty', '0px');
            });
        });
    }

    /* --------------------------------------------------------------------------
       14. CUSTOM CURSOR
       -------------------------------------------------------------------------- */
    const cursor = $('.cursor');

    if (cursor && finePointer.matches && !reducedMotion.matches) {
        const cursorDot = $('.cursor-dot', cursor);
        const cursorRing = $('.cursor-ring', cursor);
        let pointerX = window.innerWidth / 2;
        let pointerY = window.innerHeight / 2;
        let ringX = pointerX;
        let ringY = pointerY;
        let cursorVisible = false;

        body.classList.add('cursor-ready');

        const followCursor = () => {
            ringX += (pointerX - ringX) * 0.16;
            ringY += (pointerY - ringY) * 0.16;
            if (cursorRing) {
                cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
            }
            requestAnimationFrame(followCursor);
        };
        requestAnimationFrame(followCursor);

        window.addEventListener('pointermove', (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;

            if (!cursorVisible) {
                cursorVisible = true;
                cursor.classList.add('is-visible');
            }

            if (cursorDot) {
                cursorDot.style.transform = `translate(${pointerX}px, ${pointerY}px) translate(-50%, -50%)`;
            }
        }, { passive: true });

        doc.addEventListener('pointerover', (event) => {
            const target = event.target.closest('a, button, [data-cursor]');
            body.classList.remove('cursor-link', 'cursor-view');
            if (!target) return;

            if (target.dataset.cursor === 'view' || target.classList.contains('work-card')) {
                body.classList.add('cursor-view');
            } else {
                body.classList.add('cursor-link');
            }
        });

        doc.addEventListener('pointerout', (event) => {
            if (!event.relatedTarget) body.classList.remove('cursor-link', 'cursor-view');
        });

        doc.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
        doc.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
        doc.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
        doc.addEventListener('mouseenter', () => cursor.classList.add('is-visible'));
    }

    /* --------------------------------------------------------------------------
       15. SMOOTH SCROLL FOR IN-PAGE LINKS
       -------------------------------------------------------------------------- */
    $$('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (!href || href === '#' || href.length < 2) return;

            const target = doc.getElementById(href.slice(1));
            if (!target) return;

            event.preventDefault();

            if (href === '#top') {
                window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
            } else {
                target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
            }

            if (drawer?.classList.contains('is-open')) setDrawer(false);

            if (history.replaceState) {
                history.replaceState(null, '', href);
            }
        });
    });

    /* --------------------------------------------------------------------------
       16. INITIALISE
       -------------------------------------------------------------------------- */
    updateScrollUI();

    let scrollFrame = 0;
    window.addEventListener('scroll', () => {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
            scrollFrame = 0;
            updateScrollUI();
        });
    }, { passive: true });

    window.addEventListener('resize', () => {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
            scrollFrame = 0;
            updateScrollUI();
        });
    });

    window.addEventListener('load', updateScrollUI);
})();
