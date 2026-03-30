import type { Lesson } from "@/data/learnData";

export const CPP_LESSONS: Lesson[] = [
  {
    id: 201, subject: "cpp", title: "C++ vs C — What's New", duration: "10 min", done: false,
    desc: "Classes, references, namespaces, bool, new/delete vs malloc/free",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 10;\n    int& ref = x;   // reference\n    ref = 99;\n    cout << x << endl; // 99\n}`,
      steps: [
        { line: 4, vars: { x: 10 }, output: "", note: "x=10 allocated on stack." },
        { line: 5, vars: { x: 10, ref: "alias of x" }, output: "", note: "int& ref = x — ref is an alias, not a copy. No new memory allocated." },
        { line: 6, vars: { x: 99, ref: "alias of x" }, output: "", note: "ref = 99 modifies x directly. References can't be rebound." },
        { line: 7, vars: { x: 99 }, output: "99\n", note: "cout << x prints 99. cout is C++'s type-safe stream output." },
      ]
    },
    content: {
      intro: "C++ is a superset of C adding OOP, references, templates, exception handling, and a rich standard library.",
      sections: [
        { type: "text", heading: "Key Additions Over C", body: "<strong>References</strong>: aliases for existing variables (safer than pointers). <strong>Classes</strong>: data + behaviour. <strong>Templates</strong>: generic programming. <strong>Exceptions</strong>: structured error handling. <strong>STL</strong>: standard containers and algorithms." },
        { type: "callout", style: "tip", heading: "new vs malloc", body: "<code>new</code> calls the constructor; <code>delete</code> calls the destructor. Always pair new with delete." },
        { type: "quiz", heading: "Quick Check", q: "A C++ reference is:", opts: ["A pointer with extra steps","An alias for an existing variable","A copy of a variable","A null-safe pointer"], ans: 1 },
      ]
    }
  },
  {
    id: 202, subject: "cpp", title: "Classes & Objects", duration: "14 min", done: false,
    desc: "Class definition, access specifiers, this pointer, member functions",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `class Counter {\n    int count = 0;\npublic:\n    void inc() { count++; }\n    int get() { return count; }\n};\n\nCounter c;\nc.inc(); c.inc();\ncout << c.get(); // 2`,
      steps: [
        { line: 0, vars: {}, output: "", note: "Class definition. count is private by default." },
        { line: 7, vars: { "c.count": 0 }, output: "", note: "Counter c — object created on stack. count initialised to 0." },
        { line: 8, vars: { "c.count": 1 }, output: "", note: "c.inc() — count++ inside the method. 'this' pointer refers to c." },
        { line: 8, vars: { "c.count": 2 }, output: "", note: "Second c.inc() — count=2." },
        { line: 9, vars: { "c.count": 2 }, output: "2\n", note: "c.get() returns 2." },
      ]
    },
    content: {
      intro: "Classes bundle data and behaviour. Access specifiers (public/private/protected) enforce encapsulation.",
      sections: [
        { type: "text", heading: "Access Specifiers", body: "<strong>private</strong>: accessible only within the class. <strong>public</strong>: accessible anywhere. <strong>protected</strong>: accessible in subclasses. Default for class is private; for struct is public." },
        { type: "quiz", heading: "Quick Check", q: "Default access in a C++ class is:", opts: ["public","protected","private","internal"], ans: 2 },
      ]
    }
  },
  {
    id: 203, subject: "cpp", title: "Constructors & Destructors", duration: "14 min", done: false,
    desc: "Constructor overloading, initialiser lists, RAII, destructor",
    vizType: "memory",
    vizConfig: {
      steps: [
        { title: "Object created", note: "Widget w(42) calls constructor. Memory allocated on stack, constructor runs.",
          cells: [{ id:"w", label:"w (Widget)", value:"val=42", type:"stack", address:"0x1000", highlight:true }] },
        { title: "Out of scope", note: "Widget goes out of scope → destructor called automatically. RAII: Resource Acquisition Is Initialisation.",
          cells: [{ id:"w", label:"w (destroyed)", value:"~Widget()", type:"stack", address:"0x1000", color:"var(--red)" }] },
      ]
    },
    content: {
      intro: "Constructors initialise objects. Destructors clean up resources. Together they implement RAII — the cornerstone of safe C++ resource management.",
      sections: [
        { type: "code", heading: "Constructor + Destructor", body: `class File {\n    FILE* f;\npublic:\n    File(const char* path) { f = fopen(path,"r"); }\n    ~File() { if(f) fclose(f); }\n};` },
        { type: "callout", style: "tip", heading: "RAII", body: "Resource Acquisition Is Initialisation: acquire in constructor, release in destructor. Guarantees cleanup even when exceptions occur." },
        { type: "quiz", heading: "Quick Check", q: "The destructor is called:", opts: ["Manually always","When object goes out of scope","Only on crash","Never automatically"], ans: 1 },
      ]
    }
  },
  {
    id: 204, subject: "cpp", title: "Inheritance & Polymorphism", duration: "16 min", done: false,
    desc: "Virtual functions, vtable, override, abstract classes",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"animal", label:"Animal", sublabel:"speak() virtual", x:50, y:20, color:"var(--accent)" },
        { id:"dog",    label:"Dog",    sublabel:"speak() override", x:25, y:70, color:"var(--green)" },
        { id:"cat",    label:"Cat",    sublabel:"speak() override", x:75, y:70, color:"var(--yellow)" },
      ],
      edges: [
        { from:"dog", to:"animal", label:"inherits" },
        { from:"cat", to:"animal", label:"inherits" },
      ],
      steps: [
        { title: "Base class", note: "Animal has virtual speak(). The 'virtual' keyword enables runtime polymorphism via vtable.", highlightNodes:["animal"] },
        { title: "Dog inherits", note: "Dog extends Animal and overrides speak(). 'override' keyword catches typos at compile time.", highlightNodes:["dog"], highlightEdges:["dog->animal"] },
        { title: "Runtime dispatch", note: "Animal* a = new Dog(); a->speak(); — vtable lookup calls Dog::speak() at runtime, not Animal::speak().", highlightNodes:["animal","dog"] },
      ]
    },
    content: {
      intro: "Inheritance lets you define IS-A relationships. Virtual functions enable runtime polymorphism — the same interface, different behaviour.",
      sections: [
        { type: "code", heading: "Virtual + Override", body: `class Animal { public: virtual string speak()=0; };\nclass Dog: public Animal { public: string speak() override { return "Woof"; } };` },
        { type: "callout", style: "warn", heading: "Virtual Destructor", body: "Always make the base class destructor virtual: <code>virtual ~Animal()</code>. Without it, <code>delete animal_ptr</code> won't call the derived destructor." },
        { type: "quiz", heading: "Quick Check", q: "Pure virtual function makes the class:", opts: ["Sealed","Abstract (cannot instantiate)","Final","Static"], ans: 1 },
      ]
    }
  },
  {
    id: 205, subject: "cpp", title: "Templates", duration: "15 min", done: false,
    desc: "Function and class templates, type deduction, specialisation",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `template<typename T>\nT maxVal(T a, T b) { return a > b ? a : b; }\n\nint    r1 = maxVal(3, 7);       // T=int\ndouble r2 = maxVal(1.5, 2.7);  // T=double\nstring r3 = maxVal("a","z");    // T=string`,
      steps: [
        { line: 0, vars: {}, output: "", note: "template<typename T> — T is a placeholder type resolved at compile time." },
        { line: 3, vars: { r1: 7 }, output: "", note: "Compiler generates maxVal<int>(3,7). No runtime overhead — compile-time code generation." },
        { line: 4, vars: { r1: 7, r2: 2.7 }, output: "", note: "maxVal<double>(1.5,2.7). Type deduced from arguments." },
        { line: 5, vars: { r1: 7, r2: 2.7, r3: "z" }, output: "", note: "maxVal<string> works because string has operator>." },
      ]
    },
    content: {
      intro: "Templates let you write type-generic code. The compiler generates specialised versions at compile time — zero runtime overhead.",
      sections: [
        { type: "callout", style: "info", heading: "Class Templates", body: "<code>template&lt;typename T&gt; class Stack { T data[100]; int top=0; };</code> — type-safe stack for any type." },
        { type: "quiz", heading: "Quick Check", q: "Template specialisation happens at:", opts: ["Link time","Runtime","Compile time","Load time"], ans: 2 },
      ]
    }
  },
  {
    id: 206, subject: "cpp", title: "STL Containers", duration: "16 min", done: false,
    desc: "vector, list, deque, set, map, unordered_map",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `vector<int> v = {3,1,4,1,5};\nv.push_back(9);\nstd::sort(v.begin(), v.end());\n// v: {1,1,3,4,5,9}\n\nmap<string,int> score;\nscore["Alice"] = 92;\ncout << score["Alice"];`,
      steps: [
        { line: 0, vars: { v: "{3,1,4,1,5}" }, output: "", note: "vector: dynamic array. O(1) amortised push_back. Contiguous memory." },
        { line: 1, vars: { v: "{3,1,4,1,5,9}" }, output: "", note: "push_back appends. May reallocate if capacity exceeded." },
        { line: 2, vars: { v: "{1,1,3,4,5,9}" }, output: "", note: "std::sort uses introsort — O(n log n) worst case." },
        { line: 5, vars: {}, output: "", note: "map<string,int> is a red-black tree. O(log n) insert/lookup. Keys sorted." },
        { line: 6, vars: { "score[Alice]": 92 }, output: "92\n", note: "score['Alice']=92. unordered_map gives O(1) average but unsorted." },
      ]
    },
    content: {
      intro: "The STL provides battle-tested containers that eliminate the need to implement common data structures from scratch.",
      sections: [
        { type: "text", heading: "Choosing a Container", body: "<strong>vector</strong>: default choice, random access O(1). <strong>list</strong>: O(1) insert/delete anywhere, no random access. <strong>set/map</strong>: sorted, O(log n). <strong>unordered_map</strong>: O(1) average, no order." },
        { type: "quiz", heading: "Quick Check", q: "std::map lookup complexity is:", opts: ["O(1)","O(log n)","O(n)","O(n log n)"], ans: 1 },
      ]
    }
  },
  {
    id: 207, subject: "cpp", title: "Smart Pointers", duration: "16 min", done: false,
    desc: "unique_ptr, shared_ptr, weak_ptr — RAII memory management",
    vizType: "memory",
    vizConfig: {
      steps: [
        { title: "unique_ptr — sole owner", note: "unique_ptr<int> p = make_unique<int>(42). Heap memory owned exclusively by p. Freed when p goes out of scope.",
          cells: [
            { id:"p",   label:"unique_ptr p", value:"owns →", type:"stack", address:"0x100", pointsTo:"h", color:"var(--green)" },
            { id:"h",   label:"int heap",     value:"42",      type:"heap",  address:"0x5000", highlight:true },
          ]},
        { title: "shared_ptr — reference counted", note: "shared_ptr<int> a=make_shared<int>(10); auto b=a; — ref count=2. Freed when count reaches 0.",
          cells: [
            { id:"a",  label:"shared_ptr a", value:"rc=2", type:"stack", address:"0x200", pointsTo:"sh", color:"var(--accent)" },
            { id:"b",  label:"shared_ptr b", value:"rc=2", type:"stack", address:"0x204", pointsTo:"sh", color:"var(--accent)" },
            { id:"sh", label:"int heap (rc=2)", value:"10", type:"heap", address:"0x6000", highlight:true },
          ]},
        { title: "weak_ptr — non-owning observer", note: "weak_ptr<int> w=a; — doesn't increment ref count. Use lock() to safely access. Breaks shared_ptr cycles.",
          cells: [
            { id:"a2", label:"shared_ptr a", value:"rc=1", type:"stack", address:"0x200", pointsTo:"sh2", color:"var(--accent)" },
            { id:"w",  label:"weak_ptr w",   value:"(no rc)", type:"stack", address:"0x208", color:"var(--muted)" },
            { id:"sh2",label:"int heap (rc=1)", value:"10", type:"heap", address:"0x6000" },
          ]},
      ]
    },
    content: {
      intro: "Smart pointers replace manual new/delete, automatically freeing memory when no longer needed. They're the C++11 solution to memory leaks and dangling pointers.",
      sections: [
        { type: "code", heading: "Smart Pointer Usage", body: `auto p = make_unique<Widget>(42);  // sole owner\nauto s = make_shared<Widget>(10);  // shared ownership\nweak_ptr<Widget> w = s;            // non-owning` },
        { type: "callout", style: "tip", heading: "Rule of Zero", body: "If you use smart pointers, you usually don't need to define destructor, copy constructor, or assignment operator. Let the compiler generate them." },
        { type: "quiz", heading: "Quick Check", q: "shared_ptr frees memory when:", opts: ["Out of scope once","ref count reaches 0","Explicitly called","Program exits"], ans: 1 },
      ]
    }
  },
  {
    id: 208, subject: "cpp", title: "Move Semantics", duration: "14 min", done: false,
    desc: "lvalue vs rvalue, std::move, move constructor, perfect forwarding",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `vector<int> a = {1,2,3,4,5};\nvector<int> b = std::move(a);\n// a is now empty (moved-from state)\n// b owns the original data\ncout << b.size(); // 5\ncout << a.size(); // 0`,
      steps: [
        { line: 0, vars: { "a.size": 5 }, output: "", note: "a owns a heap buffer of 5 ints. Copying would allocate new buffer and copy all 5." },
        { line: 1, vars: { "a.size": 0, "b.size": 5 }, output: "", note: "std::move(a) casts a to rvalue. Move constructor of b STEALS a's buffer — O(1), no copy." },
        { line: 4, vars: {}, output: "5\n", note: "b.size()=5. b now owns the data." },
        { line: 5, vars: {}, output: "5\n0\n", note: "a.size()=0. a is in a valid but unspecified state." },
      ]
    },
    content: {
      intro: "Move semantics eliminate unnecessary copies of expensive resources like vectors and strings. A game-changer for C++ performance.",
      sections: [
        { type: "text", heading: "lvalue vs rvalue", body: "lvalue: has a name, can take its address. rvalue: temporary, no name. std::move() converts lvalue to rvalue, enabling move instead of copy." },
        { type: "quiz", heading: "Quick Check", q: "std::move on a vector:", opts: ["Copies all elements","Transfers ownership O(1)","Deletes the vector","Sorts it"], ans: 1 },
      ]
    }
  },
  {
    id: 209, subject: "cpp", title: "Exception Handling", duration: "12 min", done: false,
    desc: "try/catch/throw, exception hierarchy, noexcept, stack unwinding",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `try {\n    int x = -1;\n    if (x < 0) throw invalid_argument("negative!");\n    cout << sqrt(x);\n} catch (const invalid_argument& e) {\n    cerr << "Error: " << e.what();\n} catch (...) {\n    cerr << "Unknown error";\n}`,
      steps: [
        { line: 1, vars: { x: -1 }, output: "", note: "x=-1 set." },
        { line: 2, vars: { x: -1 }, output: "", note: "x<0 — throw invalid_argument. Stack unwinds back to matching catch." },
        { line: 4, vars: {}, output: "", note: "catch(const invalid_argument& e) matches. RAII destructors called during unwind." },
        { line: 5, vars: {}, output: "Error: negative!\n", note: "e.what() returns the error message string." },
      ]
    },
    content: {
      intro: "Exceptions provide structured error handling. When an exception is thrown, the stack unwinds — all local objects' destructors are called (RAII safety).",
      sections: [
        { type: "callout", style: "warn", heading: "Exception Overhead", body: "Exceptions have near-zero cost when not thrown. Catching is expensive. Don't use exceptions for control flow — only for truly exceptional conditions." },
        { type: "quiz", heading: "Quick Check", q: "catch(...) catches:", opts: ["Only std::exception","Only runtime_error","Any exception","Only integers"], ans: 2 },
      ]
    }
  },
  {
    id: 210, subject: "cpp", title: "Lambda Expressions", duration: "12 min", done: false,
    desc: "Lambda syntax, capture by value/reference, std::function",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `int base = 10;\nauto adder = [base](int x) { return base + x; };\ncout << adder(5);  // 15\n\nvector<int> v = {5,3,8,1};\nstd::sort(v.begin(), v.end(),\n    [](int a, int b){ return a < b; });`,
      steps: [
        { line: 0, vars: { base: 10 }, output: "", note: "base = 10. A local variable." },
        { line: 1, vars: { base: 10, adder: "λ" }, output: "", note: "[base] captures base by value. adder is a callable object." },
        { line: 2, vars: {}, output: "15\n", note: "adder(5) = base + 5 = 15. Captured base = 10 (copy)." },
        { line: 6, vars: {}, output: "15\n{1,3,5,8}", note: "Lambda as sort comparator. [](int a, int b) takes no captures." },
      ]
    },
    content: {
      intro: "Lambdas are anonymous functions. They're the backbone of modern C++ algorithms and functional-style programming.",
      sections: [
        { type: "text", heading: "Capture Modes", body: "<code>[=]</code> capture all by value. <code>[&]</code> capture all by reference. <code>[x]</code> capture x by value. <code>[&x]</code> capture x by reference. Prefer explicit captures." },
        { type: "quiz", heading: "Quick Check", q: "[&] in a lambda capture means:", opts: ["Capture all by value","Capture all by reference","Capture nothing","Bitwise AND"], ans: 1 },
      ]
    }
  },
  {
    id: 211, subject: "cpp", title: "STL Algorithms", duration: "13 min", done: false,
    desc: "sort, find, transform, accumulate, any_of, ranges",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `vector<int> v = {1,2,3,4,5};\n// Sum all elements\nint sum = accumulate(v.begin(),v.end(),0);\n// Transform: double each element\ntransform(v.begin(),v.end(),v.begin(),[](int x){return x*2;});\n// v = {2,4,6,8,10}`,
      steps: [
        { line: 0, vars: { v: "{1,2,3,4,5}" }, output: "", note: "Vector initialised." },
        { line: 2, vars: { sum: 15 }, output: "", note: "accumulate(begin,end,0) = 1+2+3+4+5=15. Third arg is initial value." },
        { line: 4, vars: { v: "{2,4,6,8,10}" }, output: "", note: "transform applies lambda element-wise. O(n)." },
      ]
    },
    content: {
      intro: "STL algorithms work on iterators so they're container-agnostic. Prefer algorithms over raw loops — they're clearer and often better optimised.",
      sections: [
        { type: "callout", style: "tip", heading: "C++20 Ranges", body: "<code>auto evens = v | views::filter([](int x){ return x%2==0; });</code> — lazy ranges compose algorithms without intermediate copies." },
        { type: "quiz", heading: "Quick Check", q: "std::transform applies a function:", opts: ["Once to the container","To each element","Only to sorted data","To adjacent pairs"], ans: 1 },
      ]
    }
  },
  {
    id: 212, subject: "cpp", title: "Multithreading Basics", duration: "15 min", done: false,
    desc: "std::thread, mutex, lock_guard, condition_variable",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"main",  label:"Main Thread",    sublabel:"launches threads", x:50, y:15, color:"var(--accent)" },
        { id:"t1",    label:"Thread 1",        sublabel:"task A",         x:25, y:55, color:"var(--green)" },
        { id:"t2",    label:"Thread 2",        sublabel:"task B",         x:75, y:55, color:"var(--yellow)" },
        { id:"mutex", label:"Mutex",           sublabel:"shared resource", x:50, y:85, color:"var(--red)" },
      ],
      edges: [
        { from:"main", to:"t1", label:"spawn" },
        { from:"main", to:"t2", label:"spawn" },
        { from:"t1",   to:"mutex", label:"lock" },
        { from:"t2",   to:"mutex", label:"lock", dashed:true },
      ],
      steps: [
        { title: "Main spawns threads", note: "std::thread t1(taskA); std::thread t2(taskB); — both run concurrently.", highlightNodes:["main","t1","t2"] },
        { title: "Thread 1 locks mutex", note: "t1 acquires the mutex. t2 blocks until t1 releases — prevents data race.", highlightNodes:["t1","mutex"], highlightEdges:["t1->mutex"] },
        { title: "join() waits", note: "t1.join(); t2.join(); — main waits for both threads to complete before continuing.", highlightNodes:["main"] },
      ]
    },
    content: {
      intro: "C++11 introduced a portable threading library. Threads share memory — mutexes prevent data races.",
      sections: [
        { type: "code", heading: "Thread + Mutex", body: `mutex m;\nvoid task() { lock_guard<mutex> lg(m); /* safe */ }\nthread t1(task), t2(task);\nt1.join(); t2.join();` },
        { type: "callout", style: "warn", heading: "Data Race = UB", body: "Two threads reading/writing the same variable without synchronisation is undefined behaviour. Always protect shared state with a mutex." },
        { type: "quiz", heading: "Quick Check", q: "lock_guard<mutex> releases the lock:", opts: ["When unlock() is called","When it goes out of scope","After 1 second","Never automatically"], ans: 1 },
      ]
    }
  },
  {
    id: 213, subject: "cpp", title: "RAII & Rule of Five", duration: "13 min", done: false,
    desc: "Destructor, copy ctor, copy assign, move ctor, move assign",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `class Buffer {\n    int* data;\n    int  size;\npublic:\n    Buffer(int n): size(n), data(new int[n]{}) {}\n    ~Buffer() { delete[] data; }          // destructor\n    Buffer(const Buffer& o): size(o.size),\n        data(new int[o.size]) { /* copy */ }\n    Buffer(Buffer&& o): data(o.data),\n        size(o.size) { o.data=nullptr; }   // move\n};`,
      steps: [
        { line: 4, vars: { size: "n", data: "heap ptr" }, output: "", note: "Constructor: allocates n ints on heap." },
        { line: 5, vars: {}, output: "", note: "Destructor: delete[] frees the heap array. Called automatically." },
        { line: 6, vars: {}, output: "", note: "Copy constructor: allocates new buffer and copies data. Deep copy." },
        { line: 8, vars: {}, output: "", note: "Move constructor: steals other's pointer. Sets o.data=nullptr to prevent double-free." },
      ]
    },
    content: {
      intro: "The Rule of Five: if you define any of destructor, copy ctor, copy assign, move ctor, or move assign — define all five.",
      sections: [
        { type: "callout", style: "tip", heading: "Rule of Zero", body: "Use smart pointers and STL containers so the compiler generates all five automatically. Prefer Rule of Zero over Rule of Five." },
        { type: "quiz", heading: "Quick Check", q: "The Rule of Five applies when your class:", opts: ["Uses templates","Manages a raw resource","Has virtual functions","Uses std::string"], ans: 1 },
      ]
    }
  },
  {
    id: 214, subject: "cpp", title: "Modern C++17/20 Features", duration: "14 min", done: false,
    desc: "structured bindings, if constexpr, concepts, std::optional, std::variant",
    vizType: "codeStep",
    vizConfig: {
      language: "cpp",
      code: `// C++17: structured bindings\nauto [x, y] = make_pair(3, 4);\n\n// C++17: std::optional\noptional<int> findUser(int id) {\n    if (id == 1) return 42;\n    return nullopt;\n}\nif (auto u = findUser(1)) cout << *u; // 42`,
      steps: [
        { line: 1, vars: { x: 3, y: 4 }, output: "", note: "Structured binding: auto [x,y] unpacks a pair/tuple/struct directly." },
        { line: 4, vars: {}, output: "", note: "optional<int> — either holds an int or is empty (nullopt). No null pointer needed." },
        { line: 7, vars: { u: 42 }, output: "42\n", note: "if(auto u = findUser(1)) — checks if optional has value. *u dereferences it." },
      ]
    },
    content: {
      intro: "Modern C++ (17/20) dramatically improves expressiveness and safety with features borrowed from functional programming.",
      sections: [
        { type: "text", heading: "Key C++20 Additions", body: "<strong>Concepts</strong>: constrain templates (<code>template&lt;Sortable T&gt;</code>). <strong>Coroutines</strong>: co_await, co_yield for async code. <strong>Ranges</strong>: composable lazy algorithms. <strong>Modules</strong>: replace #include." },
        { type: "quiz", heading: "Quick Check", q: "std::optional solves:", opts: ["Null pointer dereference","Missing values without null pointers","Thread safety","Memory leaks"], ans: 1 },
      ]
    }
  },
];
