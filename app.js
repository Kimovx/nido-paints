(() => {
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

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
    { name: "دهان مركز", category: "ادوات - تجهيز" },
    { name: "رولة دهان", category: "ادوات - تطبيق" },
    { name: "سبراي", category: "ادوات - رش" },
    { name: "سكينة معجون", category: "ادوات - تجهيز" },
    { name: "فرشة دهان", category: "ادوات - تطبيق" },
    { name: "لزق اصفر", category: "ادوات - حماية" }
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
  let heroAnimationInstance = null;

  const buildProductCardMarkup = ({ imagePath, title, category }) => `
    <article class="product-card">
      <div class="product-image">
        <img src="${imagePath}" alt="${title} من نيدو" />
      </div>
      <h3>${title} <span>${category}</span></h3>
    </article>
  `;

  const setActiveColorStory = (colorName) => {
    const colorStory = colorStories.find(({ name }) => name === colorName);

    if (!colorStory || !activeColorImage) return;

    activeColorImage.src = `assets/colors-categories/${colorStory.file}`;
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
    colorSwatchesHost.addEventListener("scroll", updateColorSwatchFades, { passive: true });
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
      .map(({ name, category }) =>
        buildProductCardMarkup({
          imagePath: `assets/tools-products/${name}.webp`,
          title: name,
          category
        })
      )
      .join("");
  };

  const loadHeroAnimation = (config) => {
    heroAnimationInstance?.destroy();

    heroAnimationInstance = window.lottie.loadAnimation({
      container: lottieHost,
      renderer: "svg",
      loop: true,
      autoplay: true,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
        progressiveLoad: true
      },
      ...config
    });

    return heroAnimationInstance;
  };

  const bootLottie = (attempt = 0) => {
    if (heroAnimationBooted || !lottieHost) return;

    if (!window.lottie) {
      if (attempt < 40) {
        window.setTimeout(() => bootLottie(attempt + 1), 150);
      }

      return;
    }

    heroAnimationBooted = true;
    lottieHost.classList.remove("is-error");

    const markReady = () => {
      lottieHost.classList.add("is-ready");
    };

    const loadEmbeddedAnimation = () => {
      if (!window.NIDO_HERO_ANIMATION) return false;

      const embeddedAnimation = loadHeroAnimation({
        animationData: window.NIDO_HERO_ANIMATION
      });

      embeddedAnimation.addEventListener("DOMLoaded", markReady);
      embeddedAnimation.addEventListener("data_ready", markReady);
      embeddedAnimation.addEventListener("data_failed", () => {
        lottieHost.classList.add("is-error");
      });

      return true;
    };

    if (loadEmbeddedAnimation()) return;

    const animation = loadHeroAnimation({
      path: "./hero.json"
    });

    animation.addEventListener("DOMLoaded", markReady);
    animation.addEventListener("data_ready", markReady);
    animation.addEventListener("data_failed", () => {
      lottieHost.classList.add("is-error");
    });
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    clearInterval(sliderTimer);
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

  renderToolsProducts();
  renderColorSwatches();
  showSlide(0);
  startSlider();

  if (document.readyState !== "loading") {
    bootLottie();
  } else {
    document.addEventListener("DOMContentLoaded", () => bootLottie(), { once: true });
  }

  window.addEventListener("load", () => bootLottie(), { once: true });

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
        behavior: "smooth",
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
        behavior: "smooth"
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
    carousel.addEventListener("scroll", () => {
      requestAnimationFrame(() => updateProductFades(carousel));
    }, { passive: true });
  });

  window.addEventListener("resize", updateAllProductFades);
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
  window.addEventListener("scroll", setHeaderState, { passive: true });

  const mobileScrollMedia = window.matchMedia("(max-width: 620px)");
  const updateScrollFade = () => {
    const remainingScroll = document.documentElement.scrollHeight
      - window.innerHeight - window.scrollY;

    document.body.classList.toggle(
      "can-scroll-down",
      mobileScrollMedia.matches && remainingScroll > 2
    );
  };

  window.addEventListener("scroll", updateScrollFade, { passive: true });
  window.addEventListener("resize", updateScrollFade);
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
