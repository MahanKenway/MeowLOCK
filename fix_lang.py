import re

with open('src/components/DataHubWidget.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('آیا مطمئن هستید؟ تمام داده‌ها، Profiles، وظایف و تنظیمات شما برای همیشه حذف خواهند شد.', 'Are you sure? All your data, profiles, tasks, and settings will be permanently deleted.')

with open('src/components/DataHubWidget.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

