صفحة NIDO Paints العربية
========================

افتح ملف index.html مباشرة في المتصفح، أو شغل المجلد من أي خادم ملفات ثابت.

المحتوى الحالي:
- واجهة عربية بالكامل باتجاه RTL.
- هيدر شفاف فوق الهيرو ويتحول لخلفية واضحة بعد التمرير.
- سلايدر رئيسي يعتمد على Lottie مع طبقة تعتيم ناعمة وشعار NIDO في المنتصف.
- يتم استخدام `assets/optimized/hero-data.js` مع صور الهيرو المحسنة داخل `assets/optimized/hero/`.
- تصنيفات المنتجات: دهانات، ادوات باستخدام صور التصنيفات المحلية.
- قسم المنتجات: سلايدر للدهانات وسلايدر للادوات باستخدام الصور المحسنة داخل `assets/optimized`.
- منتجات مختارة، قسم إلهام، قسم شراكة، وقسم تواصل بالبيانات الرسمية.

ملاحظات:
- صور المنتجات والشعار من مجلد assets.
- صور الديكور وخط Google وملف Lottie Web من روابط خارجية، لذلك تحتاج اتصال إنترنت لظهورها عند فتح الصفحة.


Performance / asset maintenance
-------------------------------
The page serves only the optimized assets that are still referenced by the site.
Regenerate delivery assets with Python 3 + Pillow: python scripts/optimize_assets.py
No build step or package manager is required to serve the site.

Measured file sizes (not a Lighthouse score):
- Hero data + five WebP images: 800,209 bytes, previously 13,957,888 bytes (~94% less).
- Largest variants of the 29 referenced local image families: 1,490,964 bytes,
  previously 9,145,887 bytes (~84% less). Mobile can select smaller variants.
- Below-fold inline images use native lazy loading, async decoding and dimensions.
- Lottie and hero data are loaded after window load during idle time, only while
  the hero is visible and motion/data preferences permit it. The existing gradient
  remains visible when animation is disabled or the external player cannot load.
- Scroll handlers coalesce work per animation frame; desktop skips mobile fade measurements.

Hosting: enable Brotli/gzip for HTML, CSS, JS and JSON. Use ETag/Last-Modified
revalidation for these stable filenames, including optimized assets; do not use
long-lived immutable caching unless filenames are versioned on every change.
These server settings depend on the deployment host and are not enabled by this repo.
Google Fonts, the Lottie player and the lifestyle photo still require internet.

Verification: node --check app.js; git diff --check; Chrome desktop/mobile checks
for hero playback/offscreen pause, reduced-motion no-download behavior, responsive
layout, mobile menu, tool images and color switching. Recheck on the deployed host
with Lighthouse/DevTools to measure actual network timings and Core Web Vitals.
