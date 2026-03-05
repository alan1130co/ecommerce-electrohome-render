content = open('electrohome/application/user/views.py', 'rb').read()
content = content.decode('latin-1')
replacements = [
    ('Â¡', '!'),
    ('Ã³', 'o'),
    ('Ã©', 'e'),
    ('Ã¡', 'a'),
    ('Ãº', 'u'),
    ('Ã±', 'n'),
    ('Ã"', 'O'),
    ('Ãš', 'U'),
    ('Â', ''),
]
for old, new in replacements:
    content = content.replace(old, new)
open('electrohome/application/user/views.py', 'w', encoding='utf-8').write(content)
print('Listo')
