import type { Lesson } from "@/data/learnData";

export const DS_LESSONS: Lesson[] = [
  {
    id: 1, subject: "ds", title: "Arrays & Dynamic Arrays", duration: "12 min", done: false,
    desc: "Contiguous memory, O(1) access, amortised push, resizing",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `arr = [10, 20, 30, 40, 50]\nprint(arr[2])   # O(1) → 30\n\narr.append(60)  # amortised O(1)\n# Internally: if len==cap, allocate 2× array, copy\nprint(len(arr)) # 6`,
      steps: [
        { line: 0, vars: { arr: "[10,20,30,40,50]", len:5, cap:5 }, output: "", note: "Array of 5 ints. Elements stored contiguously in memory." },
        { line: 1, vars: {}, output: "30\n", note: "arr[2]: base_address + 2×sizeof(int). O(1) random access." },
        { line: 3, vars: { arr: "[10,20,30,40,50,60]", len:6, cap:10 }, output: "", note: "append(60): len < cap so O(1). If len==cap: new array 2×cap, copy all — O(n) but amortised O(1)." },
      ]
    },
    content: {
      intro: "Arrays are the most fundamental data structure — O(1) random access makes them the basis for almost everything else.",
      sections: [
        { type: "text", heading: "Time Complexity", body: "<strong>Access</strong>: O(1). <strong>Search</strong>: O(n). <strong>Insert at end</strong>: O(1) amortised. <strong>Insert at middle</strong>: O(n) (shift). <strong>Delete</strong>: O(n) (shift)." },
        { type: "quiz", heading: "Quick Check", q: "Amortised O(1) append means:", opts: ["Every append is O(1)","Average O(1) across many appends","O(n) always","O(log n) always"], ans: 1 },
      ]
    }
  },
  {
    id: 2, subject: "ds", title: "Linked Lists", duration: "14 min", done: false,
    desc: "Singly and doubly linked, O(1) insert/delete at known position",
    vizType: "memory",
    vizConfig: {
      steps: [
        { title:"Singly linked list: 1→2→3", note:"Each node holds data and a pointer to next. Head points to first node. Last node's next=NULL.",
          cells: [
            { id:"h",  label:"head",  value:"→0x100", type:"stack", address:"0x000", pointsTo:"n1", color:"var(--yellow)" },
            { id:"n1", label:"Node 1", value:"data=1\nnext→0x200", type:"heap", address:"0x100", pointsTo:"n2" },
            { id:"n2", label:"Node 2", value:"data=2\nnext→0x300", type:"heap", address:"0x200", pointsTo:"n3" },
            { id:"n3", label:"Node 3", value:"data=3\nnext=NULL", type:"heap", address:"0x300" },
          ]},
        { title:"Insert before Node 2", note:"newNode.next=n2; n1.next=newNode. O(1) if you have the predecessor pointer.",
          cells: [
            { id:"h",  label:"head",  value:"→0x100", type:"stack", address:"0x000", pointsTo:"n1", color:"var(--yellow)" },
            { id:"n1", label:"Node 1", value:"data=1\nnext→0x400", type:"heap", address:"0x100", pointsTo:"new" },
            { id:"new",label:"Node 1.5", value:"data=1.5\nnext→0x200", type:"heap", address:"0x400", highlight:true, pointsTo:"n2" },
            { id:"n2", label:"Node 2", value:"data=2\nnext→0x300", type:"heap", address:"0x200", pointsTo:"n3" },
            { id:"n3", label:"Node 3", value:"data=3\nnext=NULL", type:"heap", address:"0x300" },
          ]},
      ]
    },
    content: {
      intro: "Linked lists excel at insertions and deletions at known positions — no shifting required like arrays.",
      sections: [
        { type: "text", heading: "When to Use", body: "Use linked list when: frequent insertions/deletions at arbitrary positions. Avoid when: random access needed (O(n) traversal), cache performance matters (non-contiguous memory)." },
        { type: "quiz", heading: "Quick Check", q: "Linked list's main advantage over arrays:", opts: ["Faster search","O(1) insert/delete with known predecessor","Less memory","Better cache performance"], ans: 1 },
      ]
    }
  },
  {
    id: 3, subject: "ds", title: "Stacks & Queues", duration: "12 min", done: false,
    desc: "LIFO stack, FIFO queue, deque, monotonic stack",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `from collections import deque\n\n# Stack (LIFO)\nstack = []\nstack.append(1); stack.append(2); stack.append(3)\nprint(stack.pop())  # 3\n\n# Queue (FIFO)\nqueue = deque()\nqueue.append(1); queue.append(2)\nprint(queue.popleft())  # 1`,
      steps: [
        { line: 3, vars: { stack: "[]" }, output: "", note: "Stack using list. append() is push, pop() is pop. Both O(1)." },
        { line: 4, vars: { stack: "[1,2,3]" }, output: "", note: "Push 1, 2, 3 onto stack." },
        { line: 5, vars: { stack: "[1,2]" }, output: "3\n", note: "LIFO: last in, first out. pop() removes and returns 3." },
        { line: 8, vars: { queue: "deque()" }, output: "", note: "Queue using deque. O(1) append and popleft (unlike list which is O(n) popleft)." },
        { line: 9, vars: { queue: "deque([1,2])" }, output: "", note: "Enqueue 1 then 2." },
        { line: 10, vars: { queue: "deque([2])" }, output: "3\n1\n", note: "FIFO: first in, first out. popleft() returns 1." },
      ]
    },
    content: {
      intro: "Stacks and queues are the two most used abstract data types. They constrain access patterns to solve whole classes of problems.",
      sections: [
        { type: "text", heading: "Monotonic Stack", body: "Stack where elements are always increasing or decreasing. Used for next greater element problems: iterate array, pop stack while top > current. O(n)." },
        { type: "quiz", heading: "Quick Check", q: "A deque is preferred over list for a queue because:", opts: ["deque is faster for indexing","deque.popleft() is O(1) vs list O(n)","deque uses less memory","deque is sorted"], ans: 1 },
      ]
    }
  },
  {
    id: 4, subject: "ds", title: "Hash Tables", duration: "14 min", done: false,
    desc: "Hash functions, collision: chaining & open addressing, load factor",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `d = {}\nd["alice"] = 95\nd["bob"]   = 88\nd["carol"] = 72\n\nprint(d["alice"])     # O(1) average\nprint("bob" in d)     # O(1)\ndel d["carol"]        # O(1)`,
      steps: [
        { line: 0, vars: { d: "{}" }, output: "", note: "Python dict = hash table. Keys are hashed to bucket indices." },
        { line: 1, vars: { d: "{alice:95}" }, output: "", note: "hash('alice') % capacity = bucket index. Store (alice,95) there." },
        { line: 4, vars: { d: "{alice:95,bob:88,carol:72}" }, output: "", note: "Three entries. Load factor = 3/capacity. Python rehashes at 2/3 full." },
        { line: 5, vars: {}, output: "95\n", note: "Lookup: hash('alice') → bucket → return 95. O(1) average, O(n) worst (all collide)." },
        { line: 6, vars: {}, output: "95\nTrue\n", note: "'bob' in d checks if key exists. O(1)." },
      ]
    },
    content: {
      intro: "Hash tables provide O(1) average-case insert, delete, and lookup. They're the most versatile data structure in competitive programming.",
      sections: [
        { type: "text", heading: "Collision Handling", body: "<strong>Chaining</strong>: each bucket is a linked list. <strong>Open Addressing</strong>: probe for next empty slot (linear, quadratic, double hashing). Python uses open addressing." },
        { type: "quiz", heading: "Quick Check", q: "Hash table worst case lookup is:", opts: ["O(1)","O(log n)","O(n) — all keys collide","O(n²)"], ans: 2 },
      ]
    }
  },
  {
    id: 5, subject: "ds", title: "Binary Search Trees", duration: "15 min", done: false,
    desc: "BST property, insert, search, delete, in-order traversal = sorted",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"r",  label:"8",  sublabel:"root", x:50, y:10, color:"var(--accent)" },
        { id:"l",  label:"3",  sublabel:"",      x:25, y:40, color:"var(--green)" },
        { id:"rr", label:"10", sublabel:"",      x:75, y:40, color:"var(--yellow)" },
        { id:"ll", label:"1",  sublabel:"",      x:12, y:75, color:"var(--muted)" },
        { id:"lr", label:"6",  sublabel:"",      x:38, y:75, color:"var(--muted)" },
        { id:"rrl",label:"14", sublabel:"",      x:88, y:75, color:"var(--orange)", highlight:true },
      ],
      edges: [
        { from:"r", to:"l" }, { from:"r", to:"rr" },
        { from:"l", to:"ll" }, { from:"l", to:"lr" },
        { from:"rr", to:"rrl" },
      ],
      steps: [
        { title:"BST Property", note:"Every node: left subtree values < node < right subtree values. This holds at every level.", highlightNodes:["r","l","rr"] },
        { title:"Search for 14", note:"Start at 8: 14>8 → go right. At 10: 14>10 → go right. At 14: found! O(log n) average.", highlightEdges:["r->rr","rr->rrl"], highlightNodes:["rrl"] },
        { title:"In-order traversal = sorted", note:"In-order (left, root, right): 1, 3, 6, 8, 10, 14. BST in-order always produces sorted output.", highlightNodes:["ll","l","lr","r","rr","rrl"] },
      ]
    },
    content: {
      intro: "A BST organises data for O(log n) search, insert, and delete — but only when balanced. An unbalanced BST degrades to O(n).",
      sections: [
        { type: "callout", style: "warn", heading: "Balancing", body: "Insert sorted data into a BST → degenerate into a linked list! Use AVL trees or Red-Black trees for guaranteed O(log n) by self-balancing." },
        { type: "quiz", heading: "Quick Check", q: "BST in-order traversal produces:", opts: ["Pre-order output","Sorted output","Reverse-sorted","Level-order"], ans: 1 },
      ]
    }
  },
  {
    id: 6, subject: "ds", title: "Graphs — Representation", duration: "15 min", done: false,
    desc: "Adjacency list vs matrix, directed vs undirected, weighted edges",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"a", label:"A", x:50, y:10, color:"var(--accent)" },
        { id:"b", label:"B", x:20, y:55, color:"var(--green)" },
        { id:"c", label:"C", x:80, y:55, color:"var(--yellow)" },
        { id:"d", label:"D", x:50, y:90, color:"var(--orange)" },
      ],
      edges: [
        { from:"a", to:"b", label:"4" },
        { from:"a", to:"c", label:"2" },
        { from:"b", to:"d", label:"5" },
        { from:"c", to:"d", label:"1" },
        { from:"b", to:"c", label:"3" },
      ],
      steps: [
        { title:"Weighted graph", note:"4 nodes (vertices), 5 edges. Edge weights represent costs (distance, time, etc.).", highlightNodes:["a","b","c","d"] },
        { title:"Adjacency list (recommended)", note:"A: [(B,4),(C,2)]. B: [(D,5),(C,3)]. C: [(D,1)]. Space: O(V+E). Efficient for sparse graphs.", highlightEdges:["a->b","a->c"] },
        { title:"Find shortest A→D", note:"A→C→D = 2+1=3. A→B→C→D = 4+3+1=8. A→B→D = 4+5=9. Dijkstra's algorithm finds 3 efficiently.", highlightEdges:["a->c","c->d"] },
      ]
    },
    content: {
      intro: "Graphs model relationships — social networks, maps, dependencies. Choosing the right representation affects both space and time complexity.",
      sections: [
        { type: "text", heading: "Matrix vs List", body: "<strong>Adjacency Matrix</strong>: O(1) edge check, O(V²) space — good for dense graphs. <strong>Adjacency List</strong>: O(degree) edge check, O(V+E) space — good for sparse graphs (most real-world graphs)." },
        { type: "quiz", heading: "Quick Check", q: "Adjacency list has space complexity:", opts: ["O(V²)","O(V+E)","O(E²)","O(V)"], ans: 1 },
      ]
    }
  },
  {
    id: 7, subject: "ds", title: "Heaps & Priority Queues", duration: "14 min", done: false,
    desc: "Min-heap, max-heap, heapify, O(log n) insert and extract-min",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"r",  label:"1",  sublabel:"root (min)", x:50, y:10, color:"var(--accent)", highlight:true },
        { id:"l",  label:"3",  sublabel:"",            x:25, y:40, color:"var(--green)" },
        { id:"rr", label:"5",  sublabel:"",            x:75, y:40, color:"var(--yellow)" },
        { id:"ll", label:"4",  sublabel:"",            x:12, y:75, color:"var(--muted)" },
        { id:"lr", label:"7",  sublabel:"",            x:38, y:75, color:"var(--muted)" },
        { id:"rrl",label:"6",  sublabel:"",            x:62, y:75, color:"var(--muted)" },
      ],
      edges: [
        { from:"r",  to:"l"  }, { from:"r",  to:"rr" },
        { from:"l",  to:"ll" }, { from:"l",  to:"lr" },
        { from:"rr", to:"rrl"},
      ],
      steps: [
        { title:"Min-heap property", note:"Parent ≤ both children at every node. Smallest element always at root. O(1) find-min.", highlightNodes:["r"] },
        { title:"Extract-min", note:"Remove root (1). Move last element (6) to root. Sift down: swap with smallest child until heap property restored. O(log n).", highlightNodes:["r","l"] },
        { title:"Insert", note:"Add new element at bottom. Sift up: swap with parent while smaller than parent. O(log n).", highlightNodes:["rrl"] },
      ]
    },
    content: {
      intro: "Heaps provide O(log n) insert and extract-min/max. They're the backbone of Dijkstra's algorithm and heap sort.",
      sections: [
        { type: "code", heading: "Python heapq", body: `import heapq\nh = []\nheapq.heappush(h, 5)\nheapq.heappush(h, 1)\nheapq.heappush(h, 3)\nprint(heapq.heappop(h))  # 1 (min)` },
        { type: "quiz", heading: "Quick Check", q: "Extract-min from a heap takes:", opts: ["O(1)","O(log n)","O(n)","O(n log n)"], ans: 1 },
      ]
    }
  },
  {
    id: 8, subject: "ds", title: "Tries (Prefix Trees)", duration: "14 min", done: false,
    desc: "Character-by-character storage, autocomplete, spell check, O(L) operations",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"root", label:"root",  sublabel:"",               x:50, y:5,  color:"var(--muted)" },
        { id:"c",    label:"c",     sublabel:"",               x:30, y:25, color:"var(--accent)" },
        { id:"t",    label:"t",     sublabel:"",               x:70, y:25, color:"var(--accent)" },
        { id:"ca",   label:"a",     sublabel:"",               x:20, y:50, color:"var(--green)" },
        { id:"co",   label:"o",     sublabel:"",               x:40, y:50, color:"var(--green)" },
        { id:"te",   label:"e",     sublabel:"",               x:70, y:50, color:"var(--yellow)" },
        { id:"cat",  label:"t ✓",   sublabel:"end of 'cat'",   x:20, y:75, color:"var(--purple)", highlight:true },
        { id:"cod",  label:"d ✓",   sublabel:"end of 'code'",  x:40, y:75, color:"var(--purple)", highlight:true },
        { id:"tea",  label:"a ✓",   sublabel:"end of 'tea'",   x:70, y:75, color:"var(--purple)", highlight:true },
      ],
      edges: [
        { from:"root", to:"c" }, { from:"root", to:"t" },
        { from:"c", to:"ca" }, { from:"c", to:"co" }, { from:"t", to:"te" },
        { from:"ca", to:"cat" }, { from:"co", to:"cod" }, { from:"te", to:"tea" },
      ],
      steps: [
        { title:"Trie stores 'cat','code','tea'", note:"Shared prefixes share nodes — 'cat' and 'code' both start with 'c', saving space.", highlightNodes:["root","c","t"] },
        { title:"Search 'cat'", note:"Start at root → c → a → t. t is marked end-of-word. Found in O(len('cat'))=O(3) = O(L).", highlightNodes:["root","c","ca","cat"], highlightEdges:["root->c","c->ca","ca->cat"] },
        { title:"Autocomplete 'co'", note:"Traverse to 'co' node. Return all words under that subtree: 'code'. Efficient prefix matching.", highlightNodes:["c","co","cod"] },
      ]
    },
    content: {
      intro: "Tries are specialised trees for string storage. They enable O(L) search, insertion, and prefix-based autocomplete where L is the key length.",
      sections: [
        { type: "text", heading: "Applications", body: "Autocomplete (Google search), spell checkers, IP routing tables, dictionary implementations, word games (Boggle, Scrabble)." },
        { type: "quiz", heading: "Quick Check", q: "Trie search complexity for a word of length L:", opts: ["O(n)","O(L)","O(log n)","O(1)"], ans: 1 },
      ]
    }
  },
  {
    id: 9, subject: "ds", title: "Segment Trees", duration: "18 min", done: false,
    desc: "Range queries (sum, min, max), point updates, O(log n) both",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"sum",  label:"sum=36",  sublabel:"[0..5]", x:50, y:8,  color:"var(--accent)" },
        { id:"l",    label:"sum=9",   sublabel:"[0..2]", x:25, y:35, color:"var(--green)" },
        { id:"r",    label:"sum=27",  sublabel:"[3..5]", x:75, y:35, color:"var(--yellow)" },
        { id:"ll",   label:"sum=4",   sublabel:"[0..1]", x:12, y:65, color:"var(--muted)" },
        { id:"lm",   label:"[2]=5",   sublabel:"leaf",   x:38, y:65, color:"var(--muted)" },
        { id:"rl",   label:"sum=17",  sublabel:"[3..4]", x:62, y:65, color:"var(--muted)" },
        { id:"rm",   label:"[5]=10",  sublabel:"leaf",   x:88, y:65, color:"var(--purple)", highlight:true },
      ],
      edges: [
        { from:"sum", to:"l" }, { from:"sum", to:"r" },
        { from:"l", to:"ll" }, { from:"l", to:"lm" },
        { from:"r", to:"rl" }, { from:"r", to:"rm" },
      ],
      steps: [
        { title:"Build segment tree", note:"Array [1,3,5,7,10,10]. Each internal node stores sum of its range. Build O(n).", highlightNodes:["sum"] },
        { title:"Range query [3..5]", note:"Query sum of [3..5]. Descend tree, collect nodes whose ranges are inside [3..5]. Returns 27. O(log n).", highlightNodes:["r","rl","rm"] },
        { title:"Point update: arr[5]=20", note:"Update leaf [5]. Propagate changes up: parent [3..5] updated, root updated. O(log n).", highlightNodes:["rm","r","sum"] },
      ]
    },
    content: {
      intro: "Segment trees answer range queries (sum, min, max, gcd) and support point updates, both in O(log n). Essential for competitive programming.",
      sections: [
        { type: "text", heading: "vs Prefix Sum Array", body: "Prefix sum: O(n) build, O(1) range query, but O(n) update. Segment tree: O(n) build, O(log n) query, O(log n) update. Use segment tree when you have both queries and updates." },
        { type: "quiz", heading: "Quick Check", q: "Segment tree range query complexity:", opts: ["O(n)","O(log n)","O(1)","O(n log n)"], ans: 1 },
      ]
    }
  },
  {
    id: 10, subject: "ds", title: "Union-Find (Disjoint Set)", duration: "14 min", done: false,
    desc: "Union by rank, path compression, O(α) amortised — nearly O(1)",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"1", label:"1", sublabel:"parent=itself", x:15, y:30, color:"var(--muted)" },
        { id:"2", label:"2", sublabel:"parent=itself", x:35, y:30, color:"var(--muted)" },
        { id:"3", label:"3", sublabel:"parent=itself", x:55, y:30, color:"var(--muted)" },
        { id:"4", label:"4", sublabel:"parent=itself", x:75, y:30, color:"var(--muted)" },
        { id:"root12", label:"1 (root)", sublabel:"component {1,2}", x:25, y:75, color:"var(--green)", highlight:true },
        { id:"root34", label:"3 (root)", sublabel:"component {3,4}", x:65, y:75, color:"var(--yellow)", highlight:true },
      ],
      edges: [
        { from:"2", to:"root12", label:"union(1,2)" },
        { from:"4", to:"root34", label:"union(3,4)" },
      ],
      steps: [
        { title:"Initially disconnected", note:"4 nodes, each its own component. parent[i]=i for all i.", highlightNodes:["1","2","3","4"] },
        { title:"union(1,2) and union(3,4)", note:"union(1,2): find root of 1 and 2, merge. Path compression flattens tree.", highlightNodes:["root12","root34"] },
        { title:"Query connected(1,4)?", note:"find(1)=1, find(4)=3. 1≠3 → not connected. O(α) ≈ O(1) amortised.", highlightNodes:["root12","root34"] },
      ]
    },
    content: {
      intro: "Union-Find efficiently tracks which elements belong to the same connected component. Used in Kruskal's MST and network connectivity problems.",
      sections: [
        { type: "code", heading: "Implementation", body: `class UF:\n    def __init__(self, n): self.p = list(range(n))\n    def find(self, x):\n        if self.p[x] != x: self.p[x] = self.find(self.p[x])  # path compression\n        return self.p[x]\n    def union(self, x, y): self.p[self.find(x)] = self.find(y)` },
        { type: "quiz", heading: "Quick Check", q: "Path compression in Union-Find makes operations:", opts: ["O(n)","O(log n)","O(α) ≈ nearly O(1)","O(1) exactly"], ans: 2 },
      ]
    }
  },
  {
    id: 11, subject: "ds", title: "AVL Trees & Balancing", duration: "15 min", done: false,
    desc: "Height-balanced BST, rotations, balance factor, O(log n) guaranteed",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"ub_root", label:"1", sublabel:"",      x:50, y:10, color:"var(--red)" },
        { id:"ub_r",    label:"2", sublabel:"",      x:65, y:40, color:"var(--red)" },
        { id:"ub_rr",   label:"3", sublabel:"right-right heavy — ROTATE LEFT", x:80, y:70, color:"var(--red)" },
        { id:"bal_root",label:"2", sublabel:"root after rotation", x:20, y:10, color:"var(--green)", highlight:true },
        { id:"bal_l",   label:"1", sublabel:"",      x:10, y:40, color:"var(--green)" },
        { id:"bal_r",   label:"3", sublabel:"",      x:30, y:40, color:"var(--green)" },
      ],
      edges: [
        { from:"ub_root", to:"ub_r" }, { from:"ub_r", to:"ub_rr" },
        { from:"bal_root", to:"bal_l" }, { from:"bal_root", to:"bal_r" },
      ],
      steps: [
        { title:"Unbalanced BST", note:"Insert 1,2,3 in order → degenerate right-skewed tree. Search O(n).", highlightNodes:["ub_root","ub_r","ub_rr"] },
        { title:"Detect imbalance", note:"AVL: balance factor (height_left - height_right) must be -1, 0, or 1. Node 1 has factor=-2 (right-heavy).", highlightNodes:["ub_root"] },
        { title:"Left rotation → balanced", note:"Rotate left at 1: 2 becomes new root, 1 is left child. Now balanced. Search O(log n) guaranteed.", highlightNodes:["bal_root","bal_l","bal_r"] },
      ]
    },
    content: {
      intro: "AVL trees maintain height balance via rotations after every insert/delete, guaranteeing O(log n) operations — unlike plain BSTs.",
      sections: [
        { type: "text", heading: "Rotations", body: "4 cases: Left-Left → right rotate. Right-Right → left rotate. Left-Right → left rotate then right rotate. Right-Left → right rotate then left rotate." },
        { type: "quiz", heading: "Quick Check", q: "AVL tree balance factor must be:", opts: ["0 only","0 or 1","-1, 0, or 1","Any value"], ans: 2 },
      ]
    }
  },
  {
    id: 12, subject: "ds", title: "Skip Lists & Bloom Filters", duration: "14 min", done: false,
    desc: "Probabilistic data structures: O(log n) search without tree rotations",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"l3",  label:"Level 3", sublabel:"1 ———————→ 14", x:50, y:10, color:"var(--accent)" },
        { id:"l2",  label:"Level 2", sublabel:"1 → 5 → 14",   x:50, y:35, color:"var(--green)" },
        { id:"l1",  label:"Level 1", sublabel:"1→3→5→8→14",   x:50, y:60, color:"var(--yellow)" },
        { id:"query",label:"Search 8",sublabel:"O(log n)",     x:50, y:85, color:"var(--purple)", highlight:true },
      ],
      edges: [
        { from:"l3", to:"l2", label:"drop down" },
        { from:"l2", to:"l1", label:"drop down" },
        { from:"l1", to:"query", animated:true },
      ],
      steps: [
        { title:"Skip list structure", note:"Multiple levels of linked lists. Top level has few nodes (express lane). Bottom has all nodes.", highlightNodes:["l3","l2"] },
        { title:"Search 8", note:"Start at top-left. Skip forward if next ≤ 8. Drop down when next > 8. Reach 8 in O(log n) expected.", highlightEdges:["l3->l2","l2->l1","l1->query"] },
        { title:"Probabilistic balance", note:"Each node added to level k with probability 1/2. No rotations needed — probabilistically balanced.", highlightNodes:["query"] },
      ]
    },
    content: {
      intro: "Skip lists achieve O(log n) search using multiple levels of linked lists and randomness — simpler to implement than balanced trees.",
      sections: [
        { type: "text", heading: "Bloom Filter", body: "Probabilistic set membership: definitively says NO, maybe says YES (false positives possible). Uses k hash functions + bit array. O(k) insert and lookup. Used in: DB query caching, CDN, spell checkers." },
        { type: "quiz", heading: "Quick Check", q: "A Bloom filter can have:", opts: ["False negatives only","False positives only","Both false positives and negatives","No false results"], ans: 1 },
      ]
    }
  },
];
