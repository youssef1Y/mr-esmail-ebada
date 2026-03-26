

## إضافة إعلانات Google AdSense على صفحات الفيديوهات

### المتطلبات الأساسية
لاستخدام Google AdSense، تحتاج حساب AdSense معتمد من جوجل. بعد الموافقة، جوجل بتديك كود إعلاني (Publisher ID + Ad Slot ID) بتحطه في الموقع.

### ⚠️ ملاحظة مهمة
- Google AdSense **لا يدعم** إعلانات pre-roll أو mid-roll داخل مشغل فيديو مخصص (custom player) — ده بيحتاج Google Ad Manager + IMA SDK وده نظام مختلف تماماً
- AdSense بيدعم **إعلانات بانر** (Display Ads) اللي بتظهر حوالين الفيديو وفي الصفحة
- لو عايز إعلانات فيديو فعلية (قبل/أثناء الفيديو)، هتحتاج Google Ad Manager وده أعقد بكتير

### الخطة (إعلانات بانر AdSense)

**Step 1: إضافة كود AdSense الأساسي في `index.html`**
- إضافة سكريبت AdSense في `<head>` باستخدام Publisher ID بتاعك

**Step 2: إنشاء مكون `AdBanner.tsx`**
- مكون قابل لإعادة الاستخدام بيعرض وحدة إعلانية AdSense
- بيدعم أحجام مختلفة (responsive, rectangle, leaderboard)

**Step 3: إضافة الإعلانات في صفحة الفيديو**
- بانر تحت مشغل الفيديو مباشرة
- بانر بين قائمة الفيديوهات (كل 3-4 فيديوهات)
- بانر في أسفل الصفحة

**Step 4: إخفاء الإعلانات للمشتركين (اختياري)**
- الطلاب المشتركين ممكن يشوفوا المحتوى بدون إعلانات كميزة إضافية

### ما تحتاجه منك
- **Publisher ID** من حساب AdSense (مثل `ca-pub-XXXXXXXXXXXXXXXX`)
- **Ad Slot IDs** للوحدات الإعلانية المختلفة

### الملفات المتأثرة
- `index.html` — إضافة سكريبت AdSense
- `src/components/AdBanner.tsx` — مكون جديد
- `src/pages/SubjectVideos.tsx` — إضافة البانرات
- `src/components/VideoPlayer.tsx` — بانر تحت المشغل

