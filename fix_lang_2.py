import re

with open('src/components/WeatherWidget.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('تهران', 'Tehran')
with open('src/components/WeatherWidget.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/SpaceExplorer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('ضد تحریم', 'Anti-Censorship')
with open('src/components/SpaceExplorer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

