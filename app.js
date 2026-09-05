(() => {
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  const saveData = () => connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || "");
  const scheduleIdleTask = (callback, timeout = 1200) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(callback, { timeout });
    else window.setTimeout(callback, Math.min(timeout, 250));
  };
  const frameThrottle = (callback) => {
    let pending = false;
    return () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; callback(); });
    };
  };

  const header = qs(".site-header");
  const menuToggle = qs(".menu-toggle");
  const nav = qs(".nav");
  const slides = qsa(".hero-slide");
  const dots = qsa(".slider-dot");
  const lottieHost = qs("#lottie-bg");
  const toolsProductsHost = qs("#tools-products-list");
  const colorSwatchesHost = qs("#color-swatches");
  const activeColorImage = qs("#active-color-image");
  const activeColorTag = qs("#active-color-tag");
  const backToTop = qs(".back-to-top");
  const fixedContactActions = qs(".fixed-contact-actions");

  const toolProducts = [
    { name: "دهان مركز", category: "ادوات - تجهيز", width: 640, height: 853 },
    { name: "رولة دهان", category: "ادوات - تطبيق", width: 640, height: 718 },
    { name: "سبراي", category: "ادوات - رش", width: 640, height: 849 },
    { name: "سكينة معجون", category: "ادوات - تجهيز", width: 640, height: 531 },
    { name: "فرشة دهان", category: "ادوات - تطبيق", width: 640, height: 640 },
    { name: "لزق اصفر", category: "ادوات - حماية", width: 640, height: 715 }
  ];

  const colorStories = [
    {
      name: "فانيليا لاتيه",
      file: "01_فانيليا-لاتيه.webp",
      hex: "#b49c85",
      tag: "ناعم وراقي"
    },
    {
      name: "ازرق",
      file: "02_ازرق.webp",
      hex: "#4d6fa3",
      tag: "هادئ وعصري"
    },
    {
      name: "ابيض",
      file: "03_ابيض.webp",
      hex: "#d7d7d3",
      tag: "نقي وواسع"
    },
    {
      name: "بريز",
      file: "04_بريز.webp",
      hex: "#c4b0a0",
      tag: "دافئ ومرن"
    },
    {
      name: "زيتي",
      file: "05_زيتي.webp",
      hex: "#7f8163",
      tag: "هادئ ودافئ"
    },
    {
      name: "لبني",
      file: "06_لبني.webp",
      hex: "#8faec4",
      tag: "خفيف ومنعش"
    },
    {
      name: "زيتوني",
      file: "07_زيتوني.webp",
      hex: "#6b7450",
      tag: "طبيعي ومميز"
    },
    {
      name: "نبيتي",
      file: "08_نبيتي.webp",
      hex: "#6d3944",
      tag: "جريء وفخم"
    }
  ];

  let activeSlide = 0;
  let sliderTimer = null;
  let heroAnimationBooted = false;
  let heroVideo = null;
  let heroVisible = false;

  const buildProductCardMarkup = ({ imagePath, title, category, width, height }) => `
    <article class="product-card">
      <div class="product-image">
        <img src="${imagePath.replace('assets/', 'assets/optimized/').replace('.webp', '-640.webp')}"
          srcset="${imagePath.replace('assets/', 'assets/optimized/').replace('.webp', '-320.webp').replaceAll(' ', '%20')} 320w, ${imagePath.replace('assets/', 'assets/optimized/').replace('.webp', '-640.webp').replaceAll(' ', '%20')} 640w"
          sizes="(max-width: 620px) 78vw, 320px" loading="lazy" decoding="async" width="${width}" height="${height}" alt="${title} من نيدو" />
      </div>
      <h3>${title} <span>${category}</span></h3>
    </article>
  `;

  const setActiveColorStory = (colorName) => {
    const colorStory = colorStories.find(({ name }) => name === colorName);

    if (!colorStory || !activeColorImage) return;

    const colorPath = `assets/optimized/colors-categories/${colorStory.file.replace('.webp', '')}`;
    activeColorImage.srcset = `${colorPath}-640.webp 640w, ${colorPath}-1280.webp 1280w`;
    activeColorImage.src = `${colorPath}-1280.webp`;
    activeColorImage.alt = `مشهد بلون ${colorStory.name} من نيدو`;

    if (activeColorTag) activeColorTag.textContent = colorStory.tag;

    qsa(".color-swatch", colorSwatchesHost).forEach((button) => {
      const isActive = button.dataset.colorName === colorStory.name;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      button.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  };

  const updateColorSwatchFades = () => {
    if (!colorSwatchesHost) return;

    const first = colorSwatchesHost.firstElementChild;
    const last = colorSwatchesHost.lastElementChild;
    if (!first || !last) return;

    const viewport = colorSwatchesHost.getBoundingClientRect();
    const firstRect = first.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();

    colorSwatchesHost.classList.toggle(
      "can-scroll-left",
      Math.min(firstRect.left, lastRect.left) < viewport.left - 2
    );
    colorSwatchesHost.classList.toggle(
      "can-scroll-right",
      Math.max(firstRect.right, lastRect.right) > viewport.right + 2
    );
  };

  if (colorSwatchesHost) {
    colorSwatchesHost.addEventListener("scroll", frameThrottle(updateColorSwatchFades), { passive: true });
    new ResizeObserver(updateColorSwatchFades).observe(colorSwatchesHost);
  }

  const renderColorSwatches = () => {
    if (!colorSwatchesHost) return;

    colorSwatchesHost.innerHTML = colorStories
      .map(
        ({ name, hex }, index) => `
          <button
            class="color-swatch${index === 0 ? " active" : ""}"
            type="button"
            role="tab"
            aria-selected="${index === 0}"
            tabindex="${index === 0 ? "0" : "-1"}"
            aria-label="اختيار لون ${name}"
            data-color-name="${name}"
          >
            <span class="color-swatch-dot" style="--swatch-color: ${hex}"></span>
          </button>
        `
      )
      .join("");

    qsa(".color-swatch", colorSwatchesHost).forEach((button) => {
      button.addEventListener("click", () => {
        setActiveColorStory(button.dataset.colorName);
      });
    });

    setActiveColorStory(colorStories[0].name);
    updateColorSwatchFades();
  };

  const renderToolsProducts = () => {
    if (!toolsProductsHost) return;

    toolsProductsHost.innerHTML = toolProducts
      .map(({ name, category, width, height }) =>
        buildProductCardMarkup({
          imagePath: `assets/tools-products/${name}.webp`,
          title: name,
          category, width, height
        })
      )
      .join("");
  };

  const shouldAnimate = () => heroVisible && !document.hidden && !reducedMotion.matches && !saveData();

  const deferUntilNearViewport = (selector, callback, { rootMargin = "240px 0px" } = {}) => {
    const target = qs(selector);
    if (!target) {
      callback();
      return;
    }

    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      cleanup();
      callback();
    };

    const isNearViewport = () => {
      const rect = target.getBoundingClientRect();
      const margin = Math.max(window.innerHeight * 0.35, 180);
      return rect.top <= window.innerHeight + margin && rect.bottom >= -margin;
    };

    const onViewportChange = frameThrottle(() => {
      if (isNearViewport()) run();
    });

    let observer = null;
    const cleanup = () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
    };

    if (!("IntersectionObserver" in window)) {
      window.addEventListener("scroll", onViewportChange, { passive: true });
      window.addEventListener("resize", onViewportChange, { passive: true });
      onViewportChange();
      scheduleIdleTask(run, 1600);
      return;
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        run();
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(target);
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange, { passive: true });
    onViewportChange();
  };

  const bootLottie = async () => {
    if (heroAnimationBooted || !lottieHost || !shouldAnimate()) return;
    heroAnimationBooted = true;
    try {
      heroVideo = document.createElement("video");
      heroVideo.className = "hero-video";
      heroVideo.src = "assets/hero.webm";
      heroVideo.muted = true;
      heroVideo.loop = true;
      heroVideo.playsInline = true;
      heroVideo.preload = "metadata";
      heroVideo.setAttribute("aria-hidden", "true");

      heroVideo.addEventListener("canplay", () => {
        lottieHost.classList.add("is-ready");
        syncHeroPlayback();
      }, { once: true });
      heroVideo.addEventListener("error", () => lottieHost.classList.add("is-error"), { once: true });

      lottieHost.replaceChildren(heroVideo);
      heroVideo.load();
      syncHeroPlayback();
    } catch (error) {
      lottieHost.classList.add("is-error");
      console.warn("Hero video unavailable", error);
    }
  };

  const showSlide = (index) => {
    if (!slides.length) return;

    activeSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeSlide;
      slide.classList.toggle("active", isActive);

      const copy = qs(".hero-copy", slide);
      copy?.classList.toggle("visible", isActive);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === activeSlide);
    });
  };

  const startSlider = () => {
    clearInterval(sliderTimer);
    if (!shouldAnimate() || slides.length < 2) return;
    sliderTimer = setInterval(() => {
      showSlide(activeSlide + 1);
    }, 6500);
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      startSlider();
    });
  });

  deferUntilNearViewport(".products-section", () => {
    renderToolsProducts();
    updateAllProductFades();
  }, { rootMargin: "320px 0px" });

  renderColorSwatches();

  showSlide(0);
  const syncHeroPlayback = () => {
    if (shouldAnimate()) {
      bootLottie();
      heroVideo?.play()?.catch(() => {
        lottieHost?.classList.add("is-error");
      });
      startSlider();
    } else {
      heroVideo?.pause();
      clearInterval(sliderTimer);
    }
  };

  // Let text, navigation, and styles render before starting decorative media.
  const observeHero = () => {
    const hero = qs(".hero-slider");
    if (!hero) return;
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      syncHeroPlayback();
    }, { threshold: 0 }).observe(hero);
  };
  const scheduleHero = () => scheduleIdleTask(observeHero, 1500);
  if (document.readyState === "complete") scheduleHero();
  else window.addEventListener("load", scheduleHero, { once: true });
  document.addEventListener("visibilitychange", syncHeroPlayback);
  reducedMotion.addEventListener("change", syncHeroPlayback);
  connection?.addEventListener("change", syncHeroPlayback);
  window.addEventListener("pagehide", () => {
    heroVideo?.pause();
    clearInterval(sliderTimer);
  });
  window.addEventListener("pageshow", syncHeroPlayback);

  const closeMenu = () => {
    nav?.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "فتح القائمة");
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("open") ?? false;

    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "إغلاق القائمة" : "فتح القائمة");
  });

  const mobileMenuMedia = window.matchMedia("(max-width: 920px)");
  mobileMenuMedia.addEventListener("change", ({ matches }) => {
    if (!matches) closeMenu();
  });

  qsa(".nav a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!nav?.classList.contains("open")) return;
    if (header?.contains(event.target)) return;

    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const target = targetId ? qs(targetId) : null;

      if (!target) return;

      event.preventDefault();
      closeMenu();

      target.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });
    });
  });

  qsa(".product-nav button").forEach((button) => {
    button.addEventListener("click", () => {
      const sliderName = button.dataset.slider;
      const direction = button.dataset.dir === "next" ? 1 : -1;
      const carousel = qs(`[data-product-slider="${sliderName}"]`);
      const card = qs(".product-card", carousel);

      if (!carousel || !card) return;

      const gap = Number.parseFloat(getComputedStyle(carousel).gap) || 0;
      const distance = card.getBoundingClientRect().width + gap;
      const rtlFactor = getComputedStyle(carousel).direction === "rtl" ? -1 : 1;

      carousel.scrollBy({
        left: direction * distance * rtlFactor,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });

      setTimeout(() => updateProductFades(carousel), 280);
    });
  });

  const updateProductFades = (carousel) => {
    const wrapper = carousel?.closest(".product-carousel-wrap");
    const cards = qsa(".product-card", carousel);

    if (!wrapper || !carousel || cards.length === 0) return;

    const carouselRect = carousel.getBoundingClientRect();
    const firstRect = cards[0].getBoundingClientRect();
    const lastRect = cards[cards.length - 1].getBoundingClientRect();
    const isRtl = getComputedStyle(carousel).direction === "rtl";
    const tolerance = 2;

    const canScrollStart = isRtl
      ? firstRect.right > carouselRect.right + tolerance
      : firstRect.left < carouselRect.left - tolerance;

    const canScrollEnd = isRtl
      ? lastRect.left < carouselRect.left - tolerance
      : lastRect.right > carouselRect.right + tolerance;

    wrapper.classList.toggle("can-scroll-start", canScrollStart);
    wrapper.classList.toggle("can-scroll-end", canScrollEnd);
  };

  const updateAllProductFades = () => {
    qsa(".product-carousel").forEach(updateProductFades);
  };

  qsa(".product-carousel").forEach((carousel) => {
    carousel.addEventListener("scroll", frameThrottle(() => updateProductFades(carousel)), { passive: true });
  });

  window.addEventListener("resize", frameThrottle(updateAllProductFades));
  window.addEventListener("load", updateAllProductFades);
  updateAllProductFades();

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12
    }
  );

  qsa(".reveal").forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    revealObserver.observe(element);
  });

  const setHeaderState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
    backToTop?.classList.toggle("is-visible", window.scrollY > 520);
    fixedContactActions?.classList.toggle("is-visible", window.scrollY > 520);
  };

  setHeaderState();
  window.addEventListener("scroll", frameThrottle(setHeaderState), { passive: true });

  const mobileScrollMedia = window.matchMedia("(max-width: 620px)");
  const updateScrollFade = () => {
    if (!mobileScrollMedia.matches) {
      document.body.classList.remove("can-scroll-down");
      return;
    }
    const remainingScroll = document.documentElement.scrollHeight
      - window.innerHeight - window.scrollY;

    document.body.classList.toggle(
      "can-scroll-down",
      mobileScrollMedia.matches && remainingScroll > 2
    );
  };

  window.addEventListener("scroll", frameThrottle(updateScrollFade), { passive: true });
  window.addEventListener("resize", frameThrottle(updateScrollFade));
  window.addEventListener("load", updateScrollFade);
  mobileScrollMedia.addEventListener("change", updateScrollFade);
  new ResizeObserver(updateScrollFade).observe(document.body);
  updateScrollFade();

  backToTop?.addEventListener("click", (event) => {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth"
    });
  });

})();
