// Client-side Iran Shamsi holidays service

export interface CalendarHoliday {
  shamsiDate: { m: number; d: number };
  titleFa: string;
  titleEn: string;
  isOfficial: boolean;
}

const holidaysCache: Record<number, any[]> = {
  1404: [
    { jm: 1, jd: 1, titleFa: "عید نوروز", titleEn: "Nowruz (New Year)", isOfficial: true },
    { jm: 1, jd: 2, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jm: 1, jd: 3, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jm: 1, jd: 4, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jm: 1, jd: 12, titleFa: "روز جمهوری اسلامی", titleEn: "Islamic Republic Day", isOfficial: true },
    { jm: 1, jd: 13, titleFa: "روز طبیعت (سیزده بدر)", titleEn: "Sizdah Bedar (Nature Day)", isOfficial: true },
    { jm: 3, jd: 14, titleFa: "رحلت امام خمینی", titleEn: "Demise of Imam Khomeini", isOfficial: true },
    { jm: 3, jd: 15, titleFa: "قیام ۱۵ خرداد", titleEn: "Revolt of Khordad 15", isOfficial: true },
    { jm: 11, jd: 22, titleFa: "پیروزی انقلاب اسلامی", titleEn: "Islamic Revolution Day", isOfficial: true },
    { jm: 12, jd: 29, titleFa: "ملی شدن صنعت نفت", titleEn: "Nationalization of Oil Industry", isOfficial: true },
    // Lunar holidays mapped for 1404:
    { jm: 1, jd: 21, titleFa: "شهادت حضرت علی (ع)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },
    { jm: 1, jd: 22, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr", isOfficial: true },
    { jm: 1, jd: 23, titleFa: "تعطیل عید سعید فطر", titleEn: "Eid al-Fitr Holiday", isOfficial: true },
    { jm: 2, jd: 23, titleFa: "شهادت امام جعفر صادق (ع)", titleEn: "Martyrdom of Imam Sadiq", isOfficial: true },
    { jm: 3, jd: 16, titleFa: "عید سعید قربان", titleEn: "Eid al-Adha", isOfficial: true },
    { jm: 3, jd: 24, titleFa: "عید سعید غدیر خم", titleEn: "Eid al-Ghadir", isOfficial: true },
    { jm: 4, jd: 14, titleFa: "تاسوعای حسینی", titleEn: "Tasua", isOfficial: true },
    { jm: 4, jd: 15, titleFa: "عاشورای حسینی", titleEn: "Ashura", isOfficial: true },
    { jm: 4, jd: 24, titleFa: "شهادت امام زین‌العابدین (ع)", titleEn: "Martyrdom of Imam Sajjad", isOfficial: true },
    { jm: 5, jd: 24, titleFa: "اربعین حسینی", titleEn: "Arbaeen", isOfficial: true },
    { jm: 6, jd: 1, titleFa: "رحلت پیامبر (ص) و شهادت امام حسن مجتبی (ع)", titleEn: "Demise of Prophet & Imam Hassan", isOfficial: true },
    { jm: 6, jd: 3, titleFa: "شهادت امام رضا (ع)", titleEn: "Martyrdom of Imam Reza", isOfficial: true },
    { jm: 6, jd: 11, titleFa: "شهادت امام حسن عسکری (ع)", titleEn: "Martyrdom of Imam Askari", isOfficial: true },
    { jm: 6, jd: 20, titleFa: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", titleEn: "Milad of Prophet & Imam Sadiq", isOfficial: true },
    { jm: 8, jd: 14, titleFa: "شهادت حضرت فاطمه زهرا (س)", titleEn: "Martyrdom of Hazrat Fatima", isOfficial: true },
    { jm: 10, jd: 10, titleFa: "ولادت حضرت امام علی (ع)", titleEn: "Birth of Imam Ali", isOfficial: true },
    { jm: 10, jd: 24, titleFa: "مبعث حضرت رسول اکرم (ص)", titleEn: "Mabaas of Prophet", isOfficial: true },
    { jm: 11, jd: 12, titleFa: "ولادت حضرت قائم (عج)", titleEn: "Birth of Imam Mahdi", isOfficial: true },
    { jm: 12, jd: 20, titleFa: "شهادت حضرت علی (ع) (سال دوم)", titleEn: "Martyrdom of Imam Ali", isOfficial: true }
  ],
  1405: [
    { jm: 1, jd: 1, titleFa: "عید نوروز", titleEn: "Nowruz (New Year)", isOfficial: true },
    { jm: 1, jd: 2, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jm: 1, jd: 3, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jm: 1, jd: 4, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { jm: 1, jd: 12, titleFa: "روز جمهوری اسلامی", titleEn: "Islamic Republic Day", isOfficial: true },
    { jm: 1, jd: 13, titleFa: "روز طبیعت (سیزده بدر)", titleEn: "Sizdah Bedar (Nature Day)", isOfficial: true },
    { jm: 3, jd: 14, titleFa: "رحلت امام خمینی", titleEn: "Demise of Imam Khomeini", isOfficial: true },
    { jm: 3, jd: 15, titleFa: "قیام ۱۵ خرداد", titleEn: "Revolt of Khordad 15", isOfficial: true },
    { jm: 11, jd: 22, titleFa: "پیروزی انقلاب اسلامی", titleEn: "Islamic Revolution Day", isOfficial: true },
    { jm: 12, jd: 29, titleFa: "ملی شدن صنعت نفت", titleEn: "Nationalization of Oil Industry", isOfficial: true },
    // Lunar holidays mapped for 1405:
    { jm: 1, jd: 4, titleFa: "شهادت حضرت علی (ع)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },
    { jm: 1, jd: 22, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr", isOfficial: true },
    { jm: 1, jd: 23, titleFa: "تعطیل عید سعید فطر", titleEn: "Eid al-Fitr Holiday", isOfficial: true },
    { jm: 2, jd: 23, titleFa: "شهادت امام جعفر صادق (ع)", titleEn: "Martyrdom of Imam Sadiq", isOfficial: true },
    { jm: 3, jd: 18, titleFa: "عید سعید قربان", titleEn: "Eid al-Adha", isOfficial: true },
    { jm: 3, jd: 26, titleFa: "عید سعید غدیر خم", titleEn: "Eid al-Ghadir", isOfficial: true },
    { jm: 4, jd: 14, titleFa: "تاسوعای حسینی", titleEn: "Tasua", isOfficial: true },
    { jm: 4, jd: 15, titleFa: "عاشورای حسینی", titleEn: "Ashura", isOfficial: true },
    { jm: 4, jd: 24, titleFa: "شهادت امام زین‌العابدین (ع)", titleEn: "Martyrdom of Imam Sajjad", isOfficial: true },
    { jm: 5, jd: 24, titleFa: "اربعین حسینی", titleEn: "Arbaeen", isOfficial: true },
    { jm: 6, jd: 1, titleFa: "رحلت پیامبر (ص) و شهادت امام حسن مجتبی (ع)", titleEn: "Demise of Prophet & Imam Hassan", isOfficial: true },
    { jm: 6, jd: 3, titleFa: "شهادت امام رضا (ع)", titleEn: "Martyrdom of Imam Reza", isOfficial: true },
    { jm: 6, jd: 11, titleFa: "شهادت امام حسن عسکری (ع)", titleEn: "Martyrdom of Imam Askari", isOfficial: true },
    { jm: 6, jd: 20, titleFa: "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)", titleEn: "Milad of Prophet & Imam Sadiq", isOfficial: true },
    { jm: 8, jd: 14, titleFa: "شهادت حضرت فاطمه زهرا (س)", titleEn: "Martyrdom of Hazrat Fatima", isOfficial: true },
    { jm: 10, jd: 10, titleFa: "شهادت حضرت علی (ع) (سال دوم)", titleEn: "Martyrdom of Imam Ali", isOfficial: true },
    { jm: 10, jd: 29, titleFa: "عید سعید فطر (سال دوم)", titleEn: "Eid al-Fitr", isOfficial: true },
    { jm: 10, jd: 30, titleFa: "تعطیل عید فطر (سال دوم)", titleEn: "Eid al-Fitr Holiday", isOfficial: true }
  ]
};

/**
 * Returns holidays for a specific Shamsi year.
 * If year is not pre-seeded, it generates standard constant Solar solar holidays.
 */
export async function getHolidaysClient(year: number): Promise<CalendarHoliday[]> {
  if (holidaysCache[year]) {
    return holidaysCache[year].map(h => ({
      shamsiDate: { m: h.jm, d: h.jd },
      titleFa: h.titleFa,
      titleEn: h.titleEn,
      isOfficial: h.isOfficial
    }));
  }

  // Constant solar-only Iranian national holidays fallback
  const constantSolarHolidays = [
    { m: 1, d: 1, titleFa: "عید نوروز", titleEn: "Nowruz (New Year)", isOfficial: true },
    { m: 1, d: 2, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { m: 1, d: 3, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { m: 1, d: 4, titleFa: "عید نوروز", titleEn: "Nowruz Holiday", isOfficial: true },
    { m: 1, d: 12, titleFa: "روز جمهوری اسلامی", titleEn: "Islamic Republic Day", isOfficial: true },
    { m: 1, d: 13, titleFa: "روز طبیعت (سیزده بدر)", titleEn: "Sizdah Bedar (Nature Day)", isOfficial: true },
    { m: 3, d: 14, titleFa: "رحلت امام خمینی", titleEn: "Demise of Imam Khomeini", isOfficial: true },
    { m: 3, d: 15, titleFa: "قیام ۱۵ خرداد", titleEn: "Revolt of Khordad 15", isOfficial: true },
    { m: 11, d: 22, titleFa: "پیروزی انقلاب اسلامی", titleEn: "Islamic Revolution Day", isOfficial: true },
    { m: 12, d: 29, titleFa: "ملی شدن صنعت نفت", titleEn: "Nationalization of Oil Industry", isOfficial: true }
  ];

  return constantSolarHolidays.map(h => ({
    shamsiDate: { m: h.m, d: h.d },
    titleFa: h.titleFa,
    titleEn: h.titleEn,
    isOfficial: h.isOfficial
  }));
}
