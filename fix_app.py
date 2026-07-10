import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's use regex to find and remove the entire block
pattern = r"\s*\{/\* API Keys Configuration \*/\}.*?(?=\s*\{/\* Sidebar Info card \*/\})"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

