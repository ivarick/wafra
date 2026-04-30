with open("main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if line == '"\n' and new_lines and new_lines[-1].endswith(':\n'):
        new_lines[-1] = new_lines[-1].replace(':\n', ':\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('أيام.\n'):
        new_lines[-1] = new_lines[-1].replace('أيام.\n', 'أيام.\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('بعيد.\n'):
        new_lines[-1] = new_lines[-1].replace('بعيد.\n', 'بعيد.\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('برك.\n'):
        new_lines[-1] = new_lines[-1].replace('برك.\n', 'برك.\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('btata.\n'):
        new_lines[-1] = new_lines[-1].replace('btata.\n', 'btata.\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('iyam.\n'):
        new_lines[-1] = new_lines[-1].replace('iyam.\n', 'iyam.\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('champ.\n'):
        new_lines[-1] = new_lines[-1].replace('champ.\n', 'champ.\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('mhbous.\n'):
        new_lines[-1] = new_lines[-1].replace('mhbous.\n', 'mhbous.\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('saisons :\n'):
        new_lines[-1] = new_lines[-1].replace('saisons :\n', 'saisons :\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('mars.\n'):
        new_lines[-1] = new_lines[-1].replace('mars.\n', 'mars.\\n"')
        i += 1
        continue
    if line == '"\n' and new_lines and new_lines[-1].endswith('octobre.\n'):
        new_lines[-1] = new_lines[-1].replace('octobre.\n', 'octobre.\\n"')
        i += 1
        continue
    
    new_lines.append(line)
    i += 1

with open("main.py", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Syntax fixed")
