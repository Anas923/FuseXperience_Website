(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  var isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    // Hero word-by-word from below shadow reveal
    var words = document.querySelectorAll('#heroHeadline .word');
    if (words.length && !isReduced) {
      gsap.set(words, { visibility: 'visible', opacity: 0, y: 60 });
      gsap.set('#heroCta', { opacity: 0, y: 20 });
      var heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      heroTl.to(words, { opacity: 1, y: 0, duration: 0.9, stagger: 0.05 }, 0.3);
      heroTl.to('#heroCta', { opacity: 1, y: 0, duration: 0.8 }, '>-0.3');
    } else {
      gsap.set('.word', { visibility: 'visible', opacity: 1, y: 0 });
      gsap.set('#heroCta', { opacity: 1, y: 0 });
    }

    // Sticky nav
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top -80px',
      onToggle: function (self) {
        document.getElementById('nav')?.classList.toggle('nav--scrolled', self.isActive);
      },
    });

    // Funnel pinned sequence (desktop only)
    if (!isReduced && window.innerWidth > 768) {
      var stages = document.querySelectorAll('.funnel__stage');
      if (stages.length) {
        var funnelTl = gsap.timeline({
          scrollTrigger: { trigger: '#funnel', pin: true, scrub: 1, start: 'top top', end: '+=500%' },
        });
        var current = 0;
        var pp = 1 / (stages.length - 1);
        gsap.set(stages, { autoAlpha: 0 });
        gsap.set(stages[0], { autoAlpha: 1 });

        for (var i = 0; i < stages.length - 1; i++) {
          (function (idx) {
            funnelTl.to(stages[idx], { autoAlpha: 0, ease: 'power2.inOut' }, current)
              .to(stages[idx + 1], { autoAlpha: 1, ease: 'power2.inOut' }, current + pp * 0.2);
            current += pp;
          })(i);
        }

        // Wire to ring
        if (window.__fuseRing && window.__fuseRing.setProgress) {
          ScrollTrigger.create({
            trigger: '#funnel', start: 'top top', end: 'bottom top', scrub: 1,
            onUpdate: function (self) { window.__fuseRing.setProgress(Math.min(1, self.progress * 1.2)); },
          });
        }
      }
    } else {
      gsap.set('.funnel__stage', { autoAlpha: 1 });
    }

    // Capture cards stagger
    if (!isReduced) {
      ScrollTrigger.batch('.capture-card', {
        batchMax: 4,
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out', overwrite: true });
        },
        start: 'top 85%',
      });
      gsap.set('.capture-card', { opacity: 0, y: 24, scale: 0.98 });
    } else {
      gsap.set('.capture-card', { opacity: 1, y: 0, scale: 1 });
    }

    // Timeline draw
    if (!isReduced) {
      var nodes = document.querySelectorAll('.timeline__node');
      var progressLine = document.getElementById('timelineProgress');
      if (nodes.length) {
        var tlTl = gsap.timeline({
          scrollTrigger: { trigger: '#post-purchase', start: 'top center', end: 'bottom center', scrub: 1 },
        });
        tlTl.to(progressLine, { scaleY: 1, duration: 1, ease: 'none', transformOrigin: 'top center' });
        nodes.forEach(function (n, idx) {
          tlTl.to(n, { opacity: 1, duration: 0.3 }, idx * 0.15 + 0.1);
          gsap.set(n, { opacity: 0.4 });
        });
      }
    } else {
      gsap.set('.timeline__node', { opacity: 1 });
      gsap.set('#timelineProgress', { scaleY: 1 });
    }

    // Kinetic closing lines
    if (!isReduced) {
      var phrases = document.querySelectorAll('.kinetic__phrase');
      if (phrases.length) {
        ScrollTrigger.create({
          trigger: '#kinetic', start: 'top center', end: 'bottom center', scrub: 1,
          onUpdate: function (self) {
            var prog = self.progress * phrases.length;
            phrases.forEach(function (p, idx) {
              p.classList.toggle('is-active', idx <= prog);
              p.classList.toggle('is-ember', idx <= prog - 0.3);
            });
          },
        });
      }
    } else {
      document.querySelectorAll('.kinetic__phrase').forEach(function (p) { p.classList.add('is-active'); });
    }

    // Magnetic buttons
    if (!('ontouchstart' in window) && !isReduced) {
      document.querySelectorAll('.btn--primary').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
          var rect = btn.getBoundingClientRect();
          var x = e.clientX - rect.left - rect.width / 2;
          var y = e.clientY - rect.top - rect.height / 2;
          var dist = Math.min(8, Math.sqrt(x * x + y * y));
          var angle = Math.atan2(y, x);
          btn.style.transform = 'translate(' + Math.cos(angle) * dist + 'px, ' + Math.sin(angle) * dist + 'px)';
        });
        btn.addEventListener('mouseleave', function () { btn.style.transform = 'translate(0, 0)'; });
      });
    }
  }

  if (window.__smoothScroll && window.__lenis) {
    requestAnimationFrame(init);
  } else {
    init();
  }
})();
