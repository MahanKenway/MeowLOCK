import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('🎯 Current Focus | تمرکز فعلی', '🎯 Current Focus')
content = content.replace('title="Mark Task Completed | ثبت به عنوان انجام شده"', 'title="Mark Task Completed"')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

