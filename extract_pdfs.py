import fitz

pdfs = {
    'OS': r'C:\Users\rizwa\Desktop\VIT_MCA_PREP\Operating-System.pdf',
    'DBMS': r'C:\Users\rizwa\Desktop\VIT_MCA_PREP\DBMS.pdf',
    'COA': r'C:\Users\rizwa\Desktop\VIT_MCA_PREP\COA.pdf',
    'CN': r'C:\Users\rizwa\Desktop\VIT_MCA_PREP\computer-network-PW.pdf',
    'CN_SYL': r'C:\Users\rizwa\Desktop\VIT_MCA_PREP\computer-network-syllabus.pdf',
}

for name, path in pdfs.items():
    doc = fitz.open(path)
    print(f'=== {name} === Pages: {len(doc)}')
    toc = doc.get_toc()
    if toc:
        print('TOC:')
        for level, title, page in toc[:40]:
            indent = "  " * level
            print(f'  {indent}L{level}: {title} (p{page})')
    else:
        for i in range(min(4, len(doc))):
            text = doc[i].get_text()[:600]
            print(f'--- Page {i+1} ---')
            print(text)
    print()
    doc.close()
