// Static database of pre-translated Shamsi and Gregorian occasions (official, historical, scientific, and fun/quirky global days)
// All titles are pre-translated into natural, elegant Persian with matching emojis.

export interface OccasionInfo {
  title: string;
  isOfficial: boolean;
  isFun?: boolean;
}

export const SHAMSI_OCCASIONS: Record<string, OccasionInfo[]> = {
  // --- Farvardin (01) ---
  "01-01": [
    { title: "جشن آغاز عید باستانی نوروز 🎉 (سال نو مبارک)", isOfficial: true },
    { title: "روز هرمز، آغاز بهار و شکوفایی طبیعت 🌸", isOfficial: false }
  ],
  "01-02": [{ title: "تعطیلات نوروزی / روز امید و شادباش 🌟", isOfficial: true }],
  "01-03": [{ title: "تعطیلات نوروزی / جشن تاریخی خردادگان 💧", isOfficial: true }],
  "01-04": [{ title: "تعطیلات نوروزی / روز تکریم خانواده و نوروز جوانان 🎈", isOfficial: true }],
  "01-06": [{ title: "روز بزرگداشت زرتشت / جشن اسپندار دهم فروردین 🕯️", isOfficial: false }],
  "01-12": [{ title: "روز جمهوری اسلامی ایران 🇮🇷 (تعطیل رسمی)", isOfficial: true }],
  "01-13": [{ title: "روز طبیعت 🌳 (سیزده بدر - تعطیل رسمی)", isOfficial: true }],
  "01-17": [{ title: "روز جهانی سلامت و بهداشت عمومی 🍎", isOfficial: false }],
  "01-18": [{ title: "جشن فروردین‌گان، بزرگداشت فرورتیان 🕊️", isOfficial: false }],
  "01-20": [{ title: "روز ملی فناوری هسته‌ای ⚛️", isOfficial: false }],
  "01-21": [{ title: "سالروز تاسیس بنیاد مسکن انقلاب اسلامی 🏡", isOfficial: false }],
  "01-25": [{ title: "روز بزرگداشت عطار نیشابوری، شاعر و عارف بزرگ 📜", isOfficial: false }],
  "01-29": [{ title: "روز ارتش جمهوری اسلامی ایران و نیروی زمینی 🎖️", isOfficial: false }],

  // --- Ordibehesht (02) ---
  "02-01": [
    { title: "روز بزرگداشت استاد سخن، حکیم سعدی شیرازی 🖋️", isOfficial: false },
    { title: "روز جهانی خلاقیت و نوآوری 💡", isOfficial: false, isFun: true }
  ],
  "02-02": [{ title: "روز جهانی زمین پاک و دوستی با طبیعت 🌍", isOfficial: false }],
  "02-03": [{ title: "روز بزرگداشت شیخ بهایی و روز ملی کارآفرینی و معمار 📐", isOfficial: false }],
  "02-05": [{ title: "شکست حمله نظامی آمریکا در صحرای طبس 🌪️", isOfficial: false }],
  "02-09": [{ title: "روز ملی شوراها و روز جهانی روانشناس و مشاور 🧠", isOfficial: false }],
  "02-10": [{ title: "روز ملی خلیج همیشه فارس 🌊", isOfficial: false }],
  "02-12": [{ title: "روز معلم (شهادت استاد مرتضی مطهری) 📚", isOfficial: false }],
  "02-15": [{ title: "روز شیراز زیبا، شهر راز، شعر و گل سرخ 🌸", isOfficial: false }],
  "02-17": [{ title: "روز اسناد ملی و میراث مکتوب 📜", isOfficial: false }],
  "02-18": [{ title: "روز جهانی هلال احمر و صلیب سرخ 🔴", isOfficial: false }],
  "02-24": [{ title: "سالروز لغو امتیاز تنباکو با فتوای آیت‌الله شیرازی 🚬", isOfficial: false }],
  "02-25": [{ title: "روز بزرگداشت حکیم ابوالقاسم فردوسی و پاسداشت زبان فارسی 👑", isOfficial: false }],
  "02-27": [{ title: "روز جهانی ارتباطات و روابط عمومی 📢", isOfficial: false }],
  "02-28": [{ title: "روز بزرگداشت حکیم عمر خیام نیشابوری و روز جهانی موزه 🧪", isOfficial: false }],

  // --- Khordad (03) ---
  "03-01": [{ title: "روز بزرگداشت فیلسوف بزرگ ملاصدرا (صدرالمتالهین) 🧠", isOfficial: false }],
  "03-03": [{ title: "روز آزادسازی خرمشهر (روز مقاومت، ایثار و پیروزی) ✌️", isOfficial: false }],
  "03-14": [{ title: "رحلت حضرت امام خمینی (ره) (تعطیل رسمی) 🖤", isOfficial: true }],
  "03-15": [{ title: "قیام خونین ۱۵ خرداد ۱۳۴۲ (تعطیل رسمی) 🕯️", isOfficial: true }],
  "03-16": [{ title: "روز جهانی محیط زیست و احترام به چرخه طبیعت 🦊", isOfficial: false }],
  "03-20": [{ title: "روز جهانی صنایع دستی و هنر انگشتان ایرانی 🎨", isOfficial: false }],
  "03-24": [{ title: "روز جهانی اهدای خون، نجات‌بخش زندگی 🩸", isOfficial: false }],
  "03-27": [{ title: "روز جهانی بیابان‌زدایی 🏜️", isOfficial: false }],
  "03-28": [{ title: "روز جهانی غذاهای سنتی، پیتزا و پاستا 🍕", isOfficial: false, isFun: true }],
  "03-29": [{ title: "درگذشت دکتر علی شریعتی، اندیشمند و نویسنده 📝", isOfficial: false }],
  "03-31": [{ title: "شهادت دکتر مصطفی چمران (روز بسیج اساتید) 🎖️", isOfficial: false }],

  // --- Tir (04) ---
  "04-01": [{ title: "جشن باستانی آب‌پاشان (آب‌ریزگان) و روز اصناف 💧", isOfficial: false }],
  "04-05": [{ title: "روز جهانی مبارزه با مواد مخدر 🚫", isOfficial: false }],
  "04-07": [{ title: "شهادت آیت‌الله دکتر بهشتی و یارانش (روز قوه قضاییه) ⚖️", isOfficial: false }],
  "04-08": [{ title: "روز مبارزه با سلاح‌های شیمیایی و میکروبی ☣️", isOfficial: false }],
  "04-10": [{ title: "روز صنعت و معدن، پیشران پیشرفت اقتصادی ⚙️", isOfficial: false }],
  "04-14": [{ title: "روز ملی قلم و تجلیل از اهالی فکر و اندیشه ✍️", isOfficial: false }],
  "04-15": [{ title: "روز جهانی شوخی، طنز و لبخندهای شاداب 😄", isOfficial: false, isFun: true }],
  "04-25": [{ title: "روز بهزیستی و تامین اجتماعی 🔵", isOfficial: false }],
  "04-26": [{ title: "روز جهانی مهارت‌های جوانان و آموزش‌های نوین 🎓", isOfficial: false }],
  "04-27": [{ title: "سالروز پذیرش قطعنامه ۵۹۸ شورای امنیت توسط ایران 🕊️", isOfficial: false }],

  // --- Mordad (05) ---
  "05-01": [{ title: "جشن چله تابستان (جشن زایش خورشید) و روز فیزیوتراپی ☀️", isOfficial: false }],
  "05-05": [{ title: "سالروز اقامه اولین نماز جمعه پس از انقلاب 🕋", isOfficial: false }],
  "05-08": [{ title: "روز بزرگداشت شهاب‌الدین سهروردی (شیخ اشراق) 📜", isOfficial: false }],
  "05-14": [{ title: "صدور فرمان مشروطیت ایران و روز حقوق بشر اسلامی 📜", isOfficial: false }],
  "05-15": [{ title: "سالروز شهادت خلبان عباس بابایی ✈️", isOfficial: false }],
  "05-17": [{ title: "روز خبرنگار و بزرگداشت راویان حقیقت 🎤", isOfficial: false }],
  "05-22": [{ title: "روز جهانی چپ‌دست‌ها (تفاوت‌های دوست‌داشتنی) ✍️", isOfficial: false, isFun: true }],
  "05-26": [{ title: "سالروز ورود آزادگان سرافراز به میهن اسلامی 🕊️", isOfficial: false }],
  "05-28": [{ title: "سالروز کودتای ۲۸ مرداد و آتش‌سوزی سینما رکس آبادان 🔥", isOfficial: false }],
  "05-30": [{ title: "روز جهانی مسجد 🕌", isOfficial: false }],

  // --- Shahrivar (06) ---
  "06-01": [{ title: "روز پزشک (بزرگداشت ابوعلی سینا، فیلسوف و پزشک نامی) 🩺", isOfficial: false }],
  "06-02": [{ title: "آغاز هفته دولت و تجلیل از تلاشگران عرصه خدمت 👔", isOfficial: false }],
  "06-04": [
    { title: "روز کارمند و جشن باستانی شهریورگان ✨", isOfficial: false },
    { title: "روز جهانی سگ و دوستی صمیمانه با حیوانات 🐶", isOfficial: false, isFun: true }
  ],
  "06-05": [{ title: "روز داروسازی (بزرگداشت زکریای رازی، مکتشف الکل) 🧪", isOfficial: false }],
  "06-08": [{ title: "روز مبارزه با تروریسم (شهادت رجایی و باهنر) 🕯️", isOfficial: false }],
  "06-11": [{ title: "روز صنعت چاپ و نشر کتاب 📚", isOfficial: false }],
  "06-12": [{ title: "روز بهورز و سلامت روستایی 🩺", isOfficial: false }],
  "06-13": [{ title: "روز بزرگداشت ابوریحان بیرونی و روز ملی تعاون 📐", isOfficial: false }],
  "06-17": [{ title: "قیام ۱۷ شهریور (جمعه سیاه) 🕯️", isOfficial: false }],
  "06-19": [{ title: "وفات آیت‌الله سید محمود طالقانی اولین امام جمعه تهران 🖤", isOfficial: false }],
  "06-20": [{ title: "شهادت دومین محراب آیت‌الله مدنی 🕯️", isOfficial: false }],
  "06-21": [{ title: "روز ملی سینما و هنر هفتم 🎬", isOfficial: false }],
  "06-27": [{ title: "روز بزرگداشت استاد شهریار و روز شعر و ادب فارسی 📜", isOfficial: false }],
  "06-31": [{ title: "آغاز هفته دفاع مقدس و رژه نیروهای مسلح 🎖️", isOfficial: false }],

  // --- Mehr (07) ---
  "07-05": [{ title: "روز جهانی جهانگردی و گردشگری ✈️", isOfficial: false }],
  "07-07": [{ title: "روز آتش‌نشانی و ایمنی (بزرگداشت قهرمانان فداکار) 🚒", isOfficial: false }],
  "07-08": [{ title: "روز بزرگداشت جلال‌الدین محمد بلخی (مولوی) 📜", isOfficial: false }],
  "07-09": [{ title: "روز جهانی ناشنوایان و زبان اشاره 🤟", isOfficial: false }],
  "07-13": [{ title: "روز نیروی انتظامی جمهوری اسلامی ایران 👮", isOfficial: false }],
  "07-14": [{ title: "روز دامپزشکی و سلامت حیوانات 🐾", isOfficial: false }],
  "07-16": [{ title: "روز ملی کودک و جشن باستانی مهرگان 🎈", isOfficial: false }],
  "07-20": [{ title: "روز بزرگداشت لسان‌الغیب، حافظ شیرازی 📜", isOfficial: false }],
  "07-23": [{ title: "روز جهانی عصای سفید (بزرگداشت نابینایان) 🦯", isOfficial: false }],
  "07-24": [
    { title: "روز جهانی غذا و خوراکی‌های خوشمزه 🍔", isOfficial: false, isFun: true },
    { title: "روز ملی پیوند اولیا و مربیان 🤝", isOfficial: false }
  ],
  "07-26": [{ title: "روز تربیت بدنی و ورزش 🏃", isOfficial: false }],
  "07-29": [{ title: "روز ملی صادرات و بازرگانی 📈", isOfficial: false }],

  // --- Aban (08) ---
  "08-01": [{ title: "روز آمار و برنامه‌ریزی علمی 📊", isOfficial: false }],
  "08-07": [{ title: "روز بزرگداشت شاهنشاه کوروش بزرگ 👑", isOfficial: false }],
  "08-08": [{ title: "روز نوجوان و رشد فردی (شهادت محمدحسین فهمیده) 🌱", isOfficial: false }],
  "08-10": [{ title: "جشن باستانی آبان‌گان، بزرگداشت آب‌های روان 🌊", isOfficial: false }],
  "08-13": [{ title: "روز دانش‌آموز و تسخیر لانه جاسوسی آمریکا 🎒", isOfficial: false }],
  "08-14": [{ title: "روز فرهنگ عمومی کشور 🗣️", isOfficial: false }],
  "08-18": [{ title: "روز ملی کیفیت و بهره‌وری 🌟", isOfficial: false }],
  "08-24": [{ title: "روز کتاب، کتابخوانی و کتابدار (بزرگداشت علامه طباطبایی) 📚", isOfficial: false }],
  "08-29": [{ title: "روز جهانی فلسفه و اندیشه انتقادی 🧠", isOfficial: false }],

  // --- Azar (09) ---
  "09-01": [{ title: "جشن باستانی آذرگان، بزرگداشت آتش پاک 💥", isOfficial: false }],
  "09-05": [{ title: "روز بسیج مستضعفین (فرمان امام خمینی) 🎖️", isOfficial: false }],
  "09-07": [{ title: "روز نیروی دریایی ارتش مقتدر ⚓", isOfficial: false }],
  "09-09": [{ title: "بزرگداشت شیخ مفید، فقیه عالی‌قدر 📜", isOfficial: false }],
  "09-10": [{ title: "روز مجلس (شهادت آیت‌الله سید حسن مدرس) 🏛️", isOfficial: false }],
  "09-12": [{ title: "روز جهانی معلولان و برابری فرصت‌ها ♿", isOfficial: false }],
  "09-13": [{ title: "روز صنعت بیمه و آینده‌نگری مالی 🛡️", isOfficial: false }],
  "09-16": [{ title: "روز دانشجو و مطالبه‌گری 🎓 (گرامیداشت شهدای ۱۶ آذر)", isOfficial: false }],
  "09-18": [{ title: "معرفی عراق به عنوان آغازگر جنگ توسط سازمان ملل 🕊️", isOfficial: false }],
  "09-25": [{ title: "روز پژوهش و فناوری و اکتشافات علمی 🔬", isOfficial: false }],
  "09-26": [{ title: "روز حمل و نقل و رانندگان جاده‌ها 🚚", isOfficial: false }],
  "09-30": [{ title: "شب یلدای رویایی 🍉 (طولانی‌ترین شب سال - جشن باستانی رفع تاریکی)", isOfficial: false }],

  // --- Dey (10) ---
  "10-01": [{ title: "جشن دیگان / میلاد خورشید و روز نوزایی طبیعت ☀️", isOfficial: false }],
  "10-03": [{ title: "روز ثبت احوال و شناسنامه ایرانی 🪪", isOfficial: false }],
  "10-05": [{ title: "روز ملی ایمنی در برابر زلزله و سالروز زلزله بم 🏚️", isOfficial: false }],
  "10-09": [{ title: "روز بصیرت و میثاق امت با ولایت 🇮🇷", isOfficial: false }],
  "10-13": [{ title: "شهادت سردار سپهبد حاج قاسم سلیمانی (روز مقاومت) 🖤", isOfficial: false }],
  "10-16": [{ title: "سالروز حماسه شهدای هویزه 🕯️", isOfficial: false }],
  "10-19": [{ title: "قیام خونین مردم قم در ۱۹ دی ۱۳۵۶ 🕯️", isOfficial: false }],
  "10-20": [{ title: "سالروز شهادت میرزا تقی خان امیرکبیر، صدراعظم مصلح 🖤", isOfficial: false }],
  "10-27": [{ title: "شهادت نواب صفوی و فدائیان اسلام 🕯️", isOfficial: false }],
  "10-29": [{ title: "روز ملی هوای پاک و زندگی سالم‌تر 🌳", isOfficial: false }],
  "10-30": [
    { title: "روز تجلیل از آتش‌نشانان فداکار (یادبود ساختمان پلاسکو) 🚒", isOfficial: false },
    { title: "روز جهانی پیتزا و دورهمی‌های صمیمانه 🍕", isOfficial: false, isFun: true }
  ],

  // --- Bahman (11) ---
  "11-05": [{ title: "جشن باستانی نوسره (آمادگی برای سده) ✨", isOfficial: false }],
  "11-06": [{ title: "سالروز حماسه آمل و دفاع مردمی 🕯️", isOfficial: false }],
  "11-10": [{ title: "جشن بزرگ سده 💥 (آتش باستانی برافروخته زمستان)", isOfficial: false }],
  "11-12": [{ title: "بازگشت تاریخی امام خمینی (ره) به میهن و آغاز دهه فجر ✈️", isOfficial: false }],
  "11-19": [{ title: "روز نیروی هوایی ارتش جمهوری اسلامی ایران ✈️", isOfficial: false }],
  "11-22": [{ title: "سالروز پیروزی شکوهمند انقلاب اسلامی ایران 🇮🇷 (تعطیل رسمی)", isOfficial: true }],
  "11-25": [{ title: "روز جهانی عشق، دوستی و محبت‌های تصادفی (ولنتاین) ❤️", isOfficial: false, isFun: true }],
  "11-29": [{ title: "جشن سپندارمزگان (روز عشق، زن و زمین پاک در ایران باستان) 💖", isOfficial: false }],

  // --- Esfand (12) ---
  "12-05": [{ title: "روز مهندس (بزرگداشت خواجه نصیرالدین طوسی) 📐", isOfficial: false }],
  "12-08": [{ title: "روز ملی امور تربیتی و تربیت اسلامی 🌱", isOfficial: false }],
  "12-14": [{ title: "روز احسان، نیکوکاری و دستگیری از نیازمندان 🤝", isOfficial: false }],
  "12-15": [{ title: "روز درختکاری و دوستی سبز با طبیعت باستان 🌲", isOfficial: false }],
  "12-20": [{ title: "روز بزرگداشت حکیم نظامی گنجوی، شاعر بزرگ 📜", isOfficial: false }],
  "12-22": [{ title: "روز بزرگداشت شهدا و ترویج ایثار 🕯️", isOfficial: false }],
  "12-25": [{ title: "روز بزرگداشت بانو پروین اعتصامی، اختر چرخ ادب 📜", isOfficial: false }],
  "12-29": [{ title: "سالروز ملی شدن صنعت نفت ایران 🇮🇷 (تعطیل رسمی)", isOfficial: true }],
  "12-30": [{ title: "آخرین روز سال و آمادگی کامل برای نوروز باستانی 🌸", isOfficial: false }]
};

export const GREGORIAN_OCCASIONS: Record<string, OccasionInfo[]> = {
  // --- January (01) ---
  "01-01": [{ title: "آغاز سال نو میلادی 🎉", isOfficial: false }],
  "01-04": [{ title: "روز جهانی اسپاگتی و غذاهای خوشمزه 🍝", isOfficial: false, isFun: true }],
  "01-08": [{ title: "روز جهانی تایپوگرافی و زیبایی خطوط ⌨️", isOfficial: false }],
  "01-11": [{ title: "روز جهانی کلمه جادویی «متشکرم» 🙏", isOfficial: false, isFun: true }],
  "01-15": [{ title: "روز جهانی کلاه شاپو و استایل‌های کلاسیک 🎩", isOfficial: false, isFun: true }],
  "01-21": [{ title: "روز جهانی در آغوش کشیدن و محبت 🫂", isOfficial: false, isFun: true }],
  "01-24": [{ title: "روز جهانی آموزش و یادگیری مستقل 📚", isOfficial: false }],
  "01-28": [{ title: "روز جهانی لگو و خلاقیت با قطعات کوچک 🧱", isOfficial: false, isFun: true }],

  // --- February (02) ---
  "02-02": [{ title: "روز جهانی تالاب‌های طبیعی 🌾", isOfficial: false }],
  "02-04": [{ title: "روز جهانی مبارزه با سرطان و افزایش امید به زندگی 🎗️", isOfficial: false }],
  "02-11": [{ title: "روز جهانی زنان و دختران در عرصه علم 🔬", isOfficial: false }],
  "02-13": [{ title: "روز جهانی رادیو و جادوی صداها 📻", isOfficial: false }],
  "02-14": [{ title: "روز جهانی ولنتاین (روز ابراز عشق و دوستی) ❤️", isOfficial: false, isFun: true }],
  "02-17": [{ title: "روز جهانی کارهای مهربانانه تصادفی 🤝", isOfficial: false, isFun: true }],
  "02-21": [{ title: "روز جهانی زبان مادری و تنوع فرهنگی 🗣️", isOfficial: false }],

  // --- March (03) ---
  "03-03": [{ title: "روز جهانی حیات وحش و دوستی با موجودات زمین 🦁", isOfficial: false }],
  "03-08": [{ title: "روز جهانی حقوق زنان و برابری جنسیتی ♀️", isOfficial: false }],
  "03-14": [{ title: "روز جهانی عدد پی 🥧 (روز جادوی ریاضیات)", isOfficial: false, isFun: true }],
  "03-20": [{ title: "روز جهانی شادی و بهزیستی روانی 😊", isOfficial: false }],
  "03-21": [{ title: "روز جهانی شعر و احساسات لطیف انسانی 📜", isOfficial: false }],
  "03-22": [{ title: "روز جهانی آب شیرین و حفظ سرمایه‌های زمین 💧", isOfficial: false }],

  // --- April (04) ---
  "04-01": [{ title: "روز دروغ اول آوریل و شوخی‌های بانمک 😜", isOfficial: false, isFun: true }],
  "04-07": [{ title: "روز جهانی بهداشت و سلامت عمومی 🩺", isOfficial: false }],
  "04-12": [{ title: "روز فضانوردی و اولین سفر انسان به کیهان 🚀", isOfficial: false }],
  "04-15": [{ title: "روز جهانی هنر و تجلی خلاقیت‌های بشری 🎨", isOfficial: false }],
  "04-22": [{ title: "روز جهانی مادر زمین (گرامیداشت حفظ محیط زیست) 🌍", isOfficial: false }],
  "04-23": [{ title: "روز جهانی کتاب و کپی‌رایت 📚", isOfficial: false }],
  "04-25": [{ title: "روز جهانی پنگوئن‌ها و حیات قطب جنوب 🐧", isOfficial: false, isFun: true }],

  // --- May (05) ---
  "05-01": [{ title: "روز جهانی کار و کارگر 🛠️", isOfficial: false }],
  "05-04": [{ title: "روز جهانی جنگ ستارگان (May the 4th be with you) ⚔️", isOfficial: false, isFun: true }],
  "05-08": [{ title: "روز جهانی صلیب سرخ و هلال احمر 🔴", isOfficial: false }],
  "05-15": [{ title: "روز جهانی خانواده و انسجام کانون زندگی 🏡", isOfficial: false }],
  "05-17": [{ title: "روز جهانی جامعه اطلاعاتی و اینترنت 💻", isOfficial: false }],
  "05-20": [{ title: "روز جهانی زنبور عسل و حیات گیاهان 🐝", isOfficial: false }],
  "05-25": [{ title: "روز جهانی حوله (بزرگداشت نویسنده داگلاس آدامز) 🛁", isOfficial: false, isFun: true }],

  // --- June (06) ---
  "06-01": [{ title: "روز جهانی والدین و تکریم پدر و مادر 🫂", isOfficial: false }],
  "06-03": [{ title: "روز جهانی دوچرخه‌سواری و هوای پاک 🚲", isOfficial: false }],
  "06-05": [{ title: "روز جهانی محیط زیست 🌳", isOfficial: false }],
  "06-08": [{ title: "روز جهانی بهترین دوست 👥", isOfficial: false, isFun: true }],
  "06-18": [{ title: "روز جهانی پیک‌نیک و ناهار در طبیعت 🧺", isOfficial: false, isFun: true }],
  "06-21": [{ title: "روز جهانی موسیقی و آواهای ماندگار 🎵", isOfficial: false }],
  "06-23": [{ title: "روز جهانی المپیک و ورزش همگانی 🏅", isOfficial: false }],

  // --- July (07) ---
  "07-07": [{ title: "روز جهانی شکلات و طعم‌های فوق‌العاده 🍫", isOfficial: false, isFun: true }],
  "07-11": [{ title: "روز جهانی جمعیت و تعادل زیست‌محیطی 👥", isOfficial: false }],
  "07-16": [{ title: "روز جهانی قدردانی از هوش مصنوعی 🤖", isOfficial: false, isFun: true }],
  "07-17": [{ title: "روز جهانی اموجی و زبان تصویری دیجیتال 😀", isOfficial: false, isFun: true }],
  "07-20": [{ title: "روز جهانی شطرنج و نبرد ذهن‌ها ♟️", isOfficial: false }],
  "07-30": [{ title: "روز جهانی دوستی و صلح پایدار 🤝", isOfficial: false }],

  // --- August (08) ---
  "08-01": [{ title: "روز جهانی وبگردی و دنیای اینترنت 🌐", isOfficial: false, isFun: true }],
  "08-08": [{ title: "روز جهانی گربه‌ها و موجودات دوست‌داشتنی ملوس 🐱", isOfficial: false, isFun: true }],
  "08-12": [{ title: "روز جهانی جوانان و ایده‌های نوآورانه 🎓", isOfficial: false }],
  "08-13": [{ title: "روز جهانی چپ‌دست‌ها ✍️", isOfficial: false, isFun: true }],
  "08-19": [{ title: "روز جهانی عکاسی و ثبت لحظات ماندگار 📷", isOfficial: false }],
  "08-31": [{ title: "روز جهانی بازی‌های رومیزی و بردگیم 🎲", isOfficial: false, isFun: true }],

  // --- September (09) ---
  "09-05": [{ title: "روز جهانی امور خیریه و همدلی انسانی 🤝", isOfficial: false }],
  "09-08": [{ title: "روز جهانی باسوادی و ریشه‌کنی جهل 📚", isOfficial: false }],
  "09-12": [{ title: "روز جهانی بازی‌های ویدیویی و سرگرمی دیجیتال 🎮", isOfficial: false, isFun: true }],
  "09-13": [{ title: "روز جهانی برنامه‌نویسان و کدهای جادویی 💻", isOfficial: false, isFun: true }],
  "09-21": [{ title: "روز جهانی صلح و عدم خشونت 🕊️", isOfficial: false }],
  "09-27": [{ title: "روز جهانی گردشگری و کشف افق‌های نو 🗺️", isOfficial: false }],

  // --- October (10) ---
  "10-01": [{ title: "روز جهانی قهوه و صبح‌های پرانرژی ☕", isOfficial: false, isFun: true }],
  "10-04": [{ title: "روز جهانی حیوانات و مهربانی با زیست‌مندان 🐾", isOfficial: false }],
  "10-10": [{ title: "روز جهانی سلامت روان و آرامش ذهن 🧠", isOfficial: false }],
  "10-16": [{ title: "روز جهانی غذا و مبارزه با گرسنگی 🍎", isOfficial: false }],
  "10-25": [{ title: "روز جهانی پاستا و طعم‌های دلنشین ایتالیایی 🍝", isOfficial: false, isFun: true }],
  "10-31": [{ title: "جشن باستانی هالووین 🎃", isOfficial: false, isFun: true }],

  // --- November (11) ---
  "11-01": [{ title: "روز جهانی نویسندگان و تجلی قلم ✍️", isOfficial: false }],
  "11-13": [{ title: "روز جهانی مهربانی و لبخندهای بی‌ریا 🤝", isOfficial: false, isFun: true }],
  "11-14": [{ title: "روز جهانی مبارزه با دیابت و زندگی سالم 🩸", isOfficial: false }],
  "11-19": [{ title: "روز جهانی آقایان و سلامت مردان 👨", isOfficial: false }],
  "11-21": [{ title: "روز جهانی تلویزیون و رسانه‌های جمعی 📺", isOfficial: false }],
  "11-26": [{ title: "روز جهانی کیک و شیرینی‌های خوشمزه 🍰", isOfficial: false, isFun: true }],

  // --- December (12) ---
  "12-05": [{ title: "روز جهانی نینجا و رازآلودگی چابکی 🥷", isOfficial: false, isFun: true }],
  "12-10": [{ title: "روز جهانی حقوق بشر 🕊️", isOfficial: false }],
  "12-11": [{ title: "روز جهانی کوهستان و شکوه قله‌ها 🏔️", isOfficial: false }],
  "12-15": [{ title: "روز جهانی چای داغ و لحظه‌های دنج ☕", isOfficial: false, isFun: true }],
  "12-25": [{ title: "جشن بزرگ کریسمس و میلاد حضرت عیسی (ع) 🎄", isOfficial: false }],
  "12-31": [{ title: "شب سال نو میلادی و شمارش معکوس 🎇", isOfficial: false }]
};
