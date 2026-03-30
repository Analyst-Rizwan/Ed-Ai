import type { Lesson } from "@/data/learnData";

export const C_LESSONS: Lesson[] = [
  {
    id: 101, subject: "c", title: "Introduction to C & Compilation", duration: "10 min", done: false,
    desc: "The C compilation pipeline: preprocessor → compiler → assembler → linker",
    vizType: "codeStep",
    vizConfig: {
      language: "c",
      code: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
      steps: [
        { line: 0, vars: {}, output: "", note: "#include pulls in stdio.h — the preprocessor pastes the header here before compilation." },
        { line: 2, vars: {}, output: "", note: "main() is the OS entry point. Execution begins here." },
        { line: 3, vars: {}, output: "Hello, World!\n", note: "printf() writes to stdout. \\n is a newline escape sequence." },
        { line: 4, vars: {}, output: "Hello, World!\n", note: "return 0 signals successful exit to the OS." },
      ]
    },
    content: {
      intro: "C is a systems language from the 1970s. Almost every OS kernel, embedded system, and high-performance library is written in C.",
      sections: [
        { type: "text", heading: "The Compilation Pipeline", body: "<strong>Preprocessor</strong>: expands #include/#define. <strong>Compiler</strong>: .c → .s (assembly). <strong>Assembler</strong>: .s → .o (object). <strong>Linker</strong>: .o + libraries → executable." },
        { type: "code", heading: "Compile & Run", body: `gcc -Wall -o hello hello.c\n./hello  # Hello, World!` },
        { type: "callout", style: "tip", heading: "Flags to Know", body: "<code>-Wall</code> enables all warnings. <code>-g</code> adds debug info. <code>-O2</code> optimises. Always use -Wall." },
        { type: "quiz", heading: "Quick Check", q: "Which step turns .c into assembly?", opts: ["Preprocessor","Compiler","Assembler","Linker"], ans: 1 },
      ]
    }
  },
  {
    id: 102, subject: "c", title: "Data Types & Variables", duration: "11 min", done: false,
    desc: "int, char, float, double — sizes, ranges, type promotion",
    vizType: "codeStep",
    vizConfig: {
      language: "c",
      code: `int   a = 42;\nchar  c = 'Z';\nfloat f = 3.14f;\ndouble d = 3.14159265;\nprintf("%d %c %.2f %.5f", a, c, f, d);`,
      steps: [
        { line: 0, vars: { a: 42 }, output: "", note: "int: 4 bytes, range −2,147,483,648 to 2,147,483,647." },
        { line: 1, vars: { a: 42, c: "'Z'=90" }, output: "", note: "char: 1 byte. 'Z' stored as ASCII 90." },
        { line: 2, vars: { a: 42, c: "'Z'", f: "3.14" }, output: "", note: "float: 4 bytes, ~7 decimal digits. Suffix 'f' marks float literal." },
        { line: 3, vars: { a: 42, c: "'Z'", f: "3.14", d: "3.14159265" }, output: "", note: "double: 8 bytes, ~15 decimal digits. Preferred for math." },
        { line: 4, vars: {}, output: "42 Z 3.14 3.14159\n", note: "Format specifiers: %d=int, %c=char, %.2f=2 decimal places." },
      ]
    },
    content: {
      intro: "C has a small set of primitive types. Understanding sizes and ranges prevents overflow bugs.",
      sections: [
        { type: "callout", style: "warn", heading: "Integer Overflow", body: "<code>int x = 2147483647; x++;</code> gives −2147483648. Wraps silently — use <code>&lt;stdint.h&gt;</code> for guaranteed sizes." },
        { type: "quiz", heading: "Quick Check", q: "sizeof(double) is:", opts: ["2 bytes","4 bytes","8 bytes","16 bytes"], ans: 2 },
      ]
    }
  },
  {
    id: 103, subject: "c", title: "Control Flow", duration: "10 min", done: false,
    desc: "if/else, switch, for, while, do-while, break and continue",
    vizType: "codeStep",
    vizConfig: {
      language: "c",
      code: `int sum = 0;\nfor (int i=1; i<=5; i++) {\n    if (i % 2 == 0) continue;\n    sum += i;\n}\n// sum = 1+3+5 = 9`,
      steps: [
        { line: 0, vars: { sum: 0 }, output: "", note: "Initialise sum to 0." },
        { line: 1, vars: { sum: 0, i: 1 }, output: "", note: "Loop starts: i=1, i<=5 true." },
        { line: 2, vars: { sum: 0, i: 2 }, output: "", note: "i=2 is even — continue skips to next iteration." },
        { line: 3, vars: { sum: 9 }, output: "", note: "After all iterations: sum = 1+3+5 = 9." },
      ]
    },
    content: {
      intro: "Control flow lets your program make decisions and repeat operations.",
      sections: [
        { type: "callout", style: "tip", heading: "switch vs if-else", body: "switch is faster for many integer checks — the compiler can build a jump table." },
        { type: "quiz", heading: "Quick Check", q: "do-while guarantees:", opts: ["Zero iterations","At least one iteration","Exactly two","Infinite loop"], ans: 1 },
      ]
    }
  },
  {
    id: 104, subject: "c", title: "Functions & Scope", duration: "12 min", done: false,
    desc: "Function prototypes, pass-by-value, stack frames, scope rules",
    vizType: "codeStep",
    vizConfig: {
      language: "c",
      code: `int square(int x) { return x*x; }\n\nint main() {\n    int n = 5;\n    int r = square(n); // r = 25\n    printf("%d\\n", r);\n}`,
      steps: [
        { line: 3, vars: { n: 5 }, output: "", note: "n=5 on main's stack frame." },
        { line: 4, vars: { n: 5, r: "?" }, output: "", note: "Call square(5). New stack frame created for square()." },
        { line: 0, vars: { x: 5 }, output: "", note: "x=5 is a COPY of n. Changing x won't affect n." },
        { line: 0, vars: { x: 5, ret: 25 }, output: "", note: "Returns 25. Square's stack frame destroyed." },
        { line: 4, vars: { n: 5, r: 25 }, output: "", note: "r=25 in main." },
      ]
    },
    content: {
      intro: "Each function call creates a stack frame. Understanding this prevents most subtle bugs.",
      sections: [
        { type: "text", heading: "Pass by Value", body: "C copies arguments. To modify caller's variable, pass a pointer: <code>void inc(int* x) { (*x)++; }</code>" },
        { type: "quiz", heading: "Quick Check", q: "C passes function arguments by:", opts: ["Reference","Value (copy)","Pointer always","Register"], ans: 1 },
      ]
    }
  },
  {
    id: 105, subject: "c", title: "Arrays & Strings", duration: "13 min", done: false,
    desc: "Array declaration, indexing, strings as char arrays, null terminator",
    vizType: "codeStep",
    vizConfig: {
      language: "c",
      code: `char name[6] = "Hello";\n// [H][e][l][l][o][\\0]\nprintf("%zu\\n", strlen(name)); // 5\nname[0] = 'J';\nprintf("%s\\n", name); // Jello`,
      steps: [
        { line: 0, vars: { name: "Hello" }, output: "", note: "char array of size 6: 5 chars + null terminator '\\0'. Strings in C are char arrays." },
        { line: 2, vars: { name: "Hello" }, output: "5\n", note: "strlen() counts until '\\0'. The '\\0' itself is not counted." },
        { line: 3, vars: { name: "Jello" }, output: "5\n", note: "Arrays are mutable. name[0]='J' changes the first character in-place." },
        { line: 4, vars: { name: "Jello" }, output: "5\nJello\n", note: "%s prints until '\\0'. The array name decays to &name[0]." },
      ]
    },
    content: {
      intro: "Strings in C are char arrays ending with '\\0'. Elegant but error-prone.",
      sections: [
        { type: "callout", style: "warn", heading: "Buffer Overflow", body: "Writing past an array's end is UB — the #1 C security vulnerability. Use strncpy, not strcpy." },
        { type: "quiz", heading: "Quick Check", q: "What terminates a C string?", opts: ["Space","Newline","Null byte \\0","EOF"], ans: 2 },
      ]
    }
  },
  {
    id: 106, subject: "c", title: "Pointers Fundamentals", duration: "18 min", done: false,
    desc: "Address-of &, dereference *, pointer types, NULL pointer",
    vizType: "memory",
    vizConfig: {
      steps: [
        { title: "Declare a variable", note: "int x=42 allocates 4 bytes on the stack at address 0x1000.",
          cells: [{ id:"x", label:"x", value:"42", type:"stack", address:"0x1000" }] },
        { title: "Take its address", note: "int* p=&x — p stores the ADDRESS of x (0x1000), not its value.",
          cells: [
            { id:"x", label:"x", value:"42", type:"stack", address:"0x1000" },
            { id:"p", label:"p (ptr)", value:"0x1000", type:"stack", address:"0x1004", pointsTo:"x", highlight:true, color:"var(--yellow)" },
          ]},
        { title: "Dereference: *p = 99", note: "*p=99 writes through the pointer — changes x because p points to x's address.",
          cells: [
            { id:"x", label:"x", value:"99", type:"stack", address:"0x1000", highlight:true },
            { id:"p", label:"p (ptr)", value:"0x1000", type:"stack", address:"0x1004", pointsTo:"x", color:"var(--yellow)" },
          ]},
      ]
    },
    content: {
      intro: "Pointers are C's most powerful feature — they let you manipulate memory directly and build dynamic data structures.",
      sections: [
        { type: "text", heading: "& and *", body: "<code>&x</code> = address of x. <code>*p</code> = value at address p. Think of a pointer as a sticky note with a house address." },
        { type: "callout", style: "warn", heading: "NULL Pointer", body: "Always initialise: <code>int* p = NULL;</code>. Dereferencing NULL crashes — but that's better than silent corruption from an uninitialised pointer." },
        { type: "quiz", heading: "Quick Check", q: "Given int x=5; int* p=&x; *p equals:", opts: ["Address of x","5","Address of p","Undefined"], ans: 1 },
      ]
    }
  },
  {
    id: 107, subject: "c", title: "Pointer Arithmetic", duration: "15 min", done: false,
    desc: "Array-pointer equivalence, ptr+n, iterating with pointers",
    vizType: "memory",
    vizConfig: {
      steps: [
        { title: "Array in memory", note: "int arr[4]={10,20,30,40}. Contiguous — each element 4 bytes apart.",
          cells: [
            { id:"a0", label:"arr[0]", value:"10", type:"stack", address:"0x100" },
            { id:"a1", label:"arr[1]", value:"20", type:"stack", address:"0x104" },
            { id:"a2", label:"arr[2]", value:"30", type:"stack", address:"0x108" },
            { id:"a3", label:"arr[3]", value:"40", type:"stack", address:"0x10C" },
          ]},
        { title: "arr decays to &arr[0]", note: "int* p=arr; p points to arr[0].",
          cells: [
            { id:"a0", label:"arr[0]", value:"10", type:"stack", address:"0x100", highlight:true },
            { id:"a1", label:"arr[1]", value:"20", type:"stack", address:"0x104" },
            { id:"a2", label:"arr[2]", value:"30", type:"stack", address:"0x108" },
            { id:"a3", label:"arr[3]", value:"40", type:"stack", address:"0x10C" },
            { id:"p", label:"p", value:"0x100", type:"stack", address:"0x110", pointsTo:"a0", color:"var(--yellow)" },
          ]},
        { title: "p+2 → arr[2]", note: "p+2 jumps 2×4=8 bytes → address 0x108 = arr[2] = 30.",
          cells: [
            { id:"a0", label:"arr[0]", value:"10", type:"stack", address:"0x100" },
            { id:"a2", label:"arr[2]", value:"30", type:"stack", address:"0x108", highlight:true },
            { id:"p2", label:"p+2", value:"0x108", type:"stack", address:"0x110", pointsTo:"a2", color:"var(--accent)", highlight:true },
          ]},
      ]
    },
    content: {
      intro: "Arrays and pointers are deeply intertwined in C.",
      sections: [
        { type: "code", heading: "Iterating with Pointers", body: `for (int* p=arr; p<arr+5; p++) printf("%d ", *p);` },
        { type: "quiz", heading: "Quick Check", q: "If p=&arr[0], *(p+3) equals:", opts: ["arr[1]","arr[3]","arr[0]+3","Undefined"], ans: 1 },
      ]
    }
  },
  {
    id: 108, subject: "c", title: "Dynamic Memory", duration: "16 min", done: false,
    desc: "malloc, calloc, realloc, free — heap allocation and memory leaks",
    vizType: "memory",
    vizConfig: {
      steps: [
        { title: "Before malloc", note: "Stack has pointer p (uninitialised). Heap is empty.",
          cells: [{ id:"p", label:"p", value:"???", type:"stack", address:"0x1000" }] },
        { title: "After malloc(3×int)", note: "malloc(12) allocates 12 bytes on heap. p holds the heap address.",
          cells: [
            { id:"p",  label:"p", value:"0x5000", type:"stack", address:"0x1000", pointsTo:"h0", color:"var(--yellow)" },
            { id:"h0", label:"[0]", value:"?", type:"heap", address:"0x5000" },
            { id:"h1", label:"[1]", value:"?", type:"heap", address:"0x5004" },
            { id:"h2", label:"[2]", value:"?", type:"heap", address:"0x5008" },
          ]},
        { title: "After p[0]=10, p[1]=20, p[2]=30", note: "Values written into heap memory.",
          cells: [
            { id:"p",  label:"p", value:"0x5000", type:"stack", address:"0x1000", pointsTo:"h0", color:"var(--yellow)" },
            { id:"h0", label:"[0]", value:"10", type:"heap", address:"0x5000", highlight:true },
            { id:"h1", label:"[1]", value:"20", type:"heap", address:"0x5004", highlight:true },
            { id:"h2", label:"[2]", value:"30", type:"heap", address:"0x5008", highlight:true },
          ]},
        { title: "After free(p)", note: "free(p) releases heap memory. p is now a dangling pointer — set p=NULL!",
          cells: [{ id:"p", label:"p (dangling!)", value:"0x5000 ⚠️", type:"stack", address:"0x1000", color:"var(--red)" }] },
      ]
    },
    content: {
      intro: "Dynamic memory allows allocating memory at runtime — essential for data structures of unknown size.",
      sections: [
        { type: "code", heading: "malloc / free Pattern", body: `int* arr = malloc(n * sizeof(int));\nif (!arr) { /* handle failure */ }\n// use arr...\nfree(arr); arr = NULL;` },
        { type: "callout", style: "warn", heading: "Memory Leaks", body: "Forgetting free() leaks memory. Run valgrind to detect leaks." },
        { type: "quiz", heading: "Quick Check", q: "calloc() vs malloc() — calloc:", opts: ["Allocates on stack","Zero-initialises memory","Allocates 2× size","Uses GC"], ans: 1 },
      ]
    }
  },
  {
    id: 109, subject: "c", title: "Structures & Unions", duration: "14 min", done: false,
    desc: "struct, union, typedef, struct padding and alignment",
    vizType: "memory",
    vizConfig: {
      steps: [
        { title: "Struct layout", note: "struct { char c; int x; } — 3 padding bytes after c for int alignment.",
          cells: [
            { id:"c",   label:"c (char)",    value:"'A'", type:"stack", address:"0x100" },
            { id:"pad", label:"[3 padding]",  value:"---", type:"stack", address:"0x101", color:"var(--red)" },
            { id:"x",   label:"x (int)",      value:"42",  type:"stack", address:"0x104", highlight:true },
          ]},
        { title: "Union shares memory", note: "union { int i; float f; } — both share the SAME 4 bytes.",
          cells: [{ id:"u", label:"union (4 bytes)", value:"int=3 / float=3.0", type:"stack", address:"0x200", highlight:true, color:"var(--purple)" }] },
      ]
    },
    content: {
      intro: "Structs group related data. Unions let multiple fields share one memory block.",
      sections: [
        { type: "code", heading: "typedef struct", body: `typedef struct { char name[32]; int age; } Student;\nStudent s = {"Alice", 20};\nprintf("%s %d\\n", s.name, s.age);` },
        { type: "callout", style: "tip", heading: "Struct Padding", body: "sizeof(struct) may be larger than sum-of-fields due to alignment padding. Use offsetof() to inspect." },
        { type: "quiz", heading: "Quick Check", q: "A union's size is:", opts: ["Sum of all fields","Size of largest field","Size of smallest","Number of fields"], ans: 1 },
      ]
    }
  },
  {
    id: 110, subject: "c", title: "File I/O", duration: "12 min", done: false,
    desc: "fopen, fgets, fwrite, fclose — text vs binary mode",
    vizType: "codeStep",
    vizConfig: {
      language: "c",
      code: `FILE* f = fopen("data.txt", "r");\nif (!f) { perror("fopen"); return 1; }\nchar buf[128];\nwhile (fgets(buf, sizeof(buf), f))\n    printf("%s", buf);\nfclose(f);`,
      steps: [
        { line: 0, vars: { f: "FILE*" }, output: "", note: "fopen returns FILE pointer. 'r'=read 'w'=write 'a'=append 'rb'=binary read." },
        { line: 1, vars: {}, output: "", note: "NULL check — file may not exist. perror() prints OS error message." },
        { line: 3, vars: { buf: "line1\n" }, output: "line1\n", note: "fgets reads up to 127 chars or newline. Returns NULL at EOF." },
        { line: 5, vars: {}, output: "line1\n", note: "fclose flushes buffers and frees the FILE struct." },
      ]
    },
    content: {
      intro: "File I/O in C uses FILE pointers with buffered streams for efficient system call batching.",
      sections: [
        { type: "callout", style: "warn", heading: "Always Check Return Values", body: "fopen returns NULL on failure. fwrite returns item count — if less than requested, disk may be full." },
        { type: "quiz", heading: "Quick Check", q: "fgets returns NULL when:", opts: ["Buffer full","EOF reached","Newline found","Error"], ans: 1 },
      ]
    }
  },
  {
    id: 111, subject: "c", title: "Preprocessor & Macros", duration: "10 min", done: false,
    desc: "#define, #ifdef, include guards, inline vs macro pitfalls",
    vizType: "codeStep",
    vizConfig: {
      language: "c",
      code: `#define MAX(a,b) ((a)>(b)?(a):(b))\n#define PI 3.14159\n\nint x = MAX(3, 7);\n// expands to: ((3)>(7)?(3):(7)) = 7`,
      steps: [
        { line: 0, vars: {}, output: "", note: "#define MAX — textual substitution. Called before compilation by the preprocessor." },
        { line: 1, vars: {}, output: "", note: "#define PI — simple constant. Prefer const float for type safety." },
        { line: 3, vars: { x: 7 }, output: "", note: "MAX(3,7) expands to ((3)>(7)?(3):(7)) = 7. Extra parens prevent operator precedence bugs." },
      ]
    },
    content: {
      intro: "The preprocessor runs before compilation — powerful but error-prone. Prefer const and inline where possible.",
      sections: [
        { type: "code", heading: "Include Guard", body: `#ifndef MYHEADER_H\n#define MYHEADER_H\n// declarations\n#endif` },
        { type: "callout", style: "warn", heading: "Macro Pitfall", body: "#define SQ(x) x*x — SQ(1+2) = 1+2*1+2=5, not 9! Always wrap: ((x)*(x))." },
        { type: "quiz", heading: "Quick Check", q: "Include guards prevent:", opts: ["Runtime errors","Double header inclusion","Linker errors","Stack overflow"], ans: 1 },
      ]
    }
  },
  {
    id: 112, subject: "c", title: "Bitwise Operations", duration: "13 min", done: false,
    desc: "AND, OR, XOR, NOT, shifts — flags, masks, fast arithmetic",
    vizType: "codeStep",
    vizConfig: {
      language: "c",
      code: `unsigned flags = 0;\nflags |= (1<<2);   // set bit 2 → 0b100\nif (flags & (1<<2)) printf("Bit 2 set!\\n");\nflags &= ~(1<<2);  // clear bit 2 → 0`,
      steps: [
        { line: 0, vars: { flags: "0b00000000" }, output: "", note: "flags=0. Using unsigned to avoid sign-extension issues with shifts." },
        { line: 1, vars: { flags: "0b00000100" }, output: "", note: "1<<2=0b100. OR sets bit: 00000000 | 00000100 = 00000100." },
        { line: 2, vars: { flags: "0b00000100" }, output: "Bit 2 set!\n", note: "AND with mask: non-zero = true." },
        { line: 3, vars: { flags: "0b00000000" }, output: "Bit 2 set!\n", note: "~(1<<2)=0b11111011. AND clears bit 2." },
      ]
    },
    content: {
      intro: "Bitwise operations are essential in embedded systems, networking, and performance-critical code.",
      sections: [
        { type: "text", heading: "Operators", body: "<code>&</code> AND | <code>|</code> OR | <code>^</code> XOR | <code>~</code> NOT | <code>&lt;&lt;</code> left shift | <code>&gt;&gt;</code> right shift. Left shift×n = ×2ⁿ." },
        { type: "quiz", heading: "Quick Check", q: "5 & 3 (0101 & 0011) =", opts: ["7","1","6","4"], ans: 1 },
      ]
    }
  },
  {
    id: 113, subject: "c", title: "Linked List Implementation", duration: "20 min", done: false,
    desc: "Build a singly linked list in C with malloc and struct",
    vizType: "memory",
    vizConfig: {
      steps: [
        { title: "Empty list", note: "head=NULL. No nodes allocated.",
          cells: [{ id:"h", label:"head", value:"NULL", type:"stack", address:"0x100" }] },
        { title: "Insert node (10)", note: "malloc(sizeof(Node)) on heap. head points to new node.",
          cells: [
            { id:"h",  label:"head",     value:"0x5000", type:"stack", address:"0x100", pointsTo:"n1", color:"var(--yellow)" },
            { id:"n1", label:"Node:10",  value:"next→NULL", type:"heap", address:"0x5000", highlight:true },
          ]},
        { title: "Insert node (20) at head", note: "new->next=head; head=new. O(1) prepend.",
          cells: [
            { id:"h",  label:"head",    value:"0x6000", type:"stack", address:"0x100", pointsTo:"n2", color:"var(--yellow)" },
            { id:"n2", label:"Node:20", value:"next→0x5000", type:"heap", address:"0x6000", highlight:true, pointsTo:"n1" },
            { id:"n1", label:"Node:10", value:"next→NULL",   type:"heap", address:"0x5000" },
          ]},
      ]
    },
    content: {
      intro: "Building a linked list in C teaches pointer manipulation, dynamic memory, and struct composition.",
      sections: [
        { type: "code", heading: "Node + insertHead", body: `typedef struct Node { int val; struct Node* next; } Node;\nvoid insertHead(Node** head, int val) {\n    Node* n = malloc(sizeof(Node));\n    n->val=val; n->next=*head; *head=n;\n}` },
        { type: "quiz", heading: "Quick Check", q: "To modify head inside a function you pass:", opts: ["Node*","Node**","int","Nothing"], ans: 1 },
      ]
    }
  },
  {
    id: 114, subject: "c", title: "Debugging & UB", duration: "12 min", done: false,
    desc: "Undefined behaviour, segfaults, valgrind, sanitizers",
    vizType: "codeStep",
    vizConfig: {
      language: "c",
      code: `// BUG 1: use-after-free\nfree(p);\nint x = *p;    // UB!\n\n// BUG 2: off-by-one\nint arr[5];\narr[5] = 99;   // out of bounds UB\n\n// DETECT: -fsanitize=address,undefined`,
      steps: [
        { line: 1, vars: {}, output: "", note: "free(p) releases memory. p is now a dangling pointer." },
        { line: 2, vars: {}, output: "CRASH/garbage", note: "*p after free = undefined behaviour. May crash or read garbage." },
        { line: 5, vars: {}, output: "", note: "arr[5] — valid indices are 0-4. Index 5 is out of bounds." },
        { line: 6, vars: {}, output: "CORRUPTION", note: "May overwrite adjacent stack variables. Sanitizers catch this at runtime." },
        { line: 8, vars: {}, output: "ASan report", note: "Compile with -fsanitize=address to catch use-after-free and OOB instantly." },
      ]
    },
    content: {
      intro: "C gives ultimate control, but undefined behaviour is silent and deadly. Know the pitfalls and use sanitizers.",
      sections: [
        { type: "text", heading: "Common UB", body: "Signed integer overflow, null dereference, out-of-bounds access, use-after-free, uninitialised reads. The compiler assumes UB never happens." },
        { type: "callout", style: "tip", heading: "Sanitizers", body: "<code>-fsanitize=address,undefined</code> catches many UB cases at runtime. Faster than valgrind for daily dev." },
        { type: "quiz", heading: "Quick Check", q: "Undefined Behaviour means:", opts: ["Compile error","Runtime exception","Anything can happen","Linker error"], ans: 2 },
      ]
    }
  },
];
