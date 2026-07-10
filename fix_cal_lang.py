import re

with open('src/components/CalendarWidget.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'نامعتبر': 'Invalid',
    'ماه قبل': 'Previous Month',
    'ماه بعد': 'Next Month',
    'تقویم شمسی': 'Solar Calendar',
    'مبدل تاریخ': 'Date Converter',
    'برنامه‌ها (': 'Events (',
    'برنامه‌های ': 'Events for ',
    ' افزودن برنامه مطالعاتی': ' Add Study Plan',
    'تعطیل رسمی': 'Official Holiday',
    'هیچ برنامه‌ای برای این روز ثبت نشده است.': 'No events scheduled for this day.',
    ' تبدیل میلادی به شمسی': ' Gregorian to Solar',
    'تاریخ شمسی معادل:': 'Equivalent Solar Date:',
    ' تبدیل شمسی به میلادی': ' Solar to Gregorian',
    'سال شمسی': 'Solar Year',
    'ماه': 'Month',
    'روز': 'Day',
    'لیست برنامه‌های شما': 'Your Events List',
    'خروجی تقویم استاندارد': 'Standard Calendar Export',
    ' دانلود تقویم (.ics)': ' Download Calendar (.ics)',
    'آیا می‌خواهید تمام رویدادها را حذف کنید؟': 'Are you sure you want to delete all events?',
    'حذف همه': 'Delete All',
    'برنامه‌ای برای نمایش وجود ندارد': 'No events to display',
    'یک روز را در تقویم انتخاب کنید تا برنامه مطالعاتی بسازید': 'Select a day in the calendar to create a study plan',
    'حذف برنامه': 'Delete Event',
    'همگام‌سازی مستقیم با گوگل کلندر': 'Sync Directly with Google Calendar',
    'برنامه‌های مطالعاتی، امتحانات و اوقات فراغت خود را مستقیماً با تقویم گوگل تلفن همراه و دسکتاپ خود هماهنگ کنید.': 'Sync your study plans, exams, and leisure time directly with your mobile and desktop Google Calendar.',
    'گوگل کلندر با موفقیت متصل شد': 'Google Calendar successfully connected',
    'برنامه‌ها با موفقیت همگام‌سازی شدند!': 'Events synced successfully!',
    ' بروزرسانی مجدد': ' Sync Again',
    'قطع اتصال': 'Disconnect',
    'اتصال به حساب گوگل': 'Connect to Google Account',
    'اتصال خودکار مقدور نیست؟': 'Auto-connect not possible?',
    ' دانلود تقویم (.ics) و ایمپورت دستی در گوگل': ' Download Calendar (.ics) and import manually to Google',
    'افزودن برنامه برای ': 'Add Event for ',
    'عنوان برنامه مطالعاتی': 'Study Plan Title',
    'مثال: مرور فصل ۳ هندسه یا زیست‌شناسی': 'Example: Review Geometry Chapter 3 or Biology',
    'دسته‌بندی': 'Category',
    'مطالعه (Study)': 'Study',
    'امتحان (Exam)': 'Exam',
    'شخصی (Personal)': 'Personal',
    'ساعت برگزاری (اختیاری)': 'Time (Optional)',
    'توضیحات و یادداشت': 'Description & Notes',
    'نکات کلیدی، فصل‌های مورد مطالعه، تمرین‌ها و غیره...': 'Key points, chapters to study, exercises, etc...',
    'ثبت در تقویم 🌟': 'Save to Calendar 🌟',
    'گوگل کلندر': 'Google Calendar',
    'تقویم': 'Calendar',
}

for persian, english in replacements.items():
    content = content.replace(persian, english)

with open('src/components/CalendarWidget.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

