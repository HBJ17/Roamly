// Roamly Cinematic Scroll & Dynamic Executive Dashboard Engine

document.addEventListener('DOMContentLoaded', function() {
    // 1. Header scroll elevation & dynamic glassmorphism
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // 2. Cinematic Intersection Observer for Scroll Reveals
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.08
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Auto-attach to hero, cards, and grids
    const revealElements = document.querySelectorAll('.reveal-scroll, .reveal-stagger, .travel-hero, .package-card, .card, .stat-card, .dashboard-user-card, .boarding-card');
    revealElements.forEach(el => {
        el.classList.add('reveal-scroll');
        revealObserver.observe(el);
    });

    // 3. Staggered reveal for grid containers
    const grids = document.querySelectorAll('.packages-grid, .overview-grid, .grid-2, .grid-3');
    grids.forEach(grid => {
        grid.classList.add('reveal-stagger');
        revealObserver.observe(grid);
    });

    // 4. Interactive Micro-hover & Ripple on Action Buttons
    const interactiveButtons = document.querySelectorAll('.btn-primary, .btn-accent');
    interactiveButtons.forEach(btn => {
        btn.addEventListener('mousemove', function(e) {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            btn.style.setProperty('--mouse-x', `${x}px`);
            btn.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // 5. Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});
