import re

with open('src/components/CalendarWidget.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('AI Studio Build', 'MeowLOCK')
content = content.replace('aistudio.com', 'meowlock.com')

with open('src/components/CalendarWidget.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

