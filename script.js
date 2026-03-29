document.addEventListener('DOMContentLoaded', function () {

    // ── Hamburger / mobile nav ───────────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');

    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', function () {
            const isOpen = mobileNav.classList.toggle('open');
            const bars   = hamburger.querySelectorAll('span');
            if (isOpen) {
                bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                bars[1].style.opacity   = '0';
                bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
                document.body.style.overflow = 'hidden';
            } else {
                bars[0].style.transform = '';
                bars[1].style.opacity   = '';
                bars[2].style.transform = '';
                document.body.style.overflow = '';
            }
        });

        // Close on link click
        mobileNav.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                mobileNav.classList.remove('open');
                const bars = hamburger.querySelectorAll('span');
                bars[0].style.transform = '';
                bars[1].style.opacity   = '';
                bars[2].style.transform = '';
                document.body.style.overflow = '';
            });
        });
    }

    // ── Smooth scroll for anchor links ──────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                var offset = 64;
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.pageYOffset - offset,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ── Scroll-in animations (IntersectionObserver) ─────────────
    if ('IntersectionObserver' in window) {
        var fadeObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });

        document.querySelectorAll('.fade-up').forEach(function (el) {
            fadeObserver.observe(el);
        });
    } else {
        // Fallback: show all immediately
        document.querySelectorAll('.fade-up').forEach(function (el) {
            el.classList.add('visible');
        });
    }

    // ── Active nav link based on current page ───────────────────
    var currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href) return;
        // Match /blog links
        if (href.indexOf('/blog') !== -1 && currentPath.indexOf('/blog') !== -1) {
            link.classList.add('active');
        }
        // Match home
        if ((href === '/' || href === '/index.html') &&
            (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('index.html'))) {
            link.classList.add('active');
        }
    });

});
