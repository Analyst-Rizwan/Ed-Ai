// frontend/src/data/learnData.ts
// All static content for the Learn page

export type SectionType = "text" | "code" | "callout" | "quiz";
export interface Section {
  heading: string;
  body?: string;
  type: SectionType;
  style?: "info" | "tip" | "warn";
  q?: string;
  opts?: string[];
  ans?: number;
}
export interface Lesson {
  id: number;
  subject: "ds" | "python" | "dbms" | "os" | "cn";
  title: string;
  duration: string;
  done: boolean;
  desc: string;
  content: { intro: string; sections: Section[] };
}

export const LESSONS: Lesson[] = [
  {
    id: 1, subject: "ds", title: "Arrays & Pointers", duration: "12 min", done: true,
    desc: "Contiguous memory, index access, pointer arithmetic",
    content: {
      intro: "Arrays are the foundation of every data structure. Understanding memory layout unlocks everything else.",
      sections: [
        { type: "text", heading: "What is an Array?", body: "An array stores elements in <strong>contiguous memory</strong>. Declare <code>int arr[4]</code> and the system allocates 4 × 4 = 16 bytes in a single block." },
        { type: "code", heading: "Memory Layout", body: `int arr[4] = {10, 20, 30, 40};
// base address = 1000
arr[0] → 1000   arr[1] → 1004
arr[2] → 1008   arr[3] → 1012` },
        { type: "callout", style: "info", heading: "Why O(1) Access?", body: "address = base + index × element_size. Pure arithmetic — no traversal needed." },
        { type: "text", heading: "Insertion & Deletion", body: "Inserting at index i requires shifting every element from i to n-1 one position right → O(n) time." },
        { type: "quiz", heading: "Quick Check", q: "What is the time complexity of accessing arr[5]?", opts: ["O(n)", "O(log n)", "O(1)", "O(n²)"], ans: 2 },
      ]
    }
  },
  {
    id: 2, subject: "ds", title: "Linked Lists", duration: "15 min", done: true,
    desc: "Nodes, pointers, singly vs doubly linked",
    content: {
      intro: "A linked list trades O(1) access for O(1) insertion. Each node holds data and a pointer to the next.",
      sections: [
        { type: "text", heading: "Singly Linked List", body: "Each node: <code>struct Node { int data; Node* next; }</code>. The last node's <code>next</code> is <code>null</code>. Traversal is O(n); there's no index arithmetic." },
        { type: "code", heading: "Node Insertion at Head", body: `void insertAtHead(Node*& head, int val) {
    Node* n = new Node{val, head};
    head = n;   // O(1)
}` },
        { type: "callout", style: "tip", heading: "Doubly Linked List", body: "Add a <code>prev</code> pointer so you can traverse backwards. Deletion of a known node becomes O(1) since you have both neighbours." },
        { type: "quiz", heading: "Quick Check", q: "Accessing the 5th element of a singly linked list is:", opts: ["O(1)", "O(log n)", "O(n)", "O(n²)"], ans: 2 },
      ]
    }
  },
  {
    id: 3, subject: "ds", title: "Stacks & Queues", duration: "11 min", done: true,
    desc: "LIFO, FIFO and their applications",
    content: {
      intro: "Two of the most widely used abstractions — stacks for LIFO and queues for FIFO.",
      sections: [
        { type: "text", heading: "Stack (LIFO)", body: "Last In, First Out. Operations: <strong>push</strong> (add to top) and <strong>pop</strong> (remove from top). Both O(1). Used for: function call stack, undo history, DFS." },
        { type: "text", heading: "Queue (FIFO)", body: "First In, First Out. Operations: <strong>enqueue</strong> (add to rear) and <strong>dequeue</strong> (remove from front). Both O(1) with a doubly linked list. Used for: BFS, task scheduling, print queues." },
        { type: "code", heading: "Python Stack & Queue", body: `stack = []
stack.append(1)   # push
stack.pop()       # pop

from collections import deque
q = deque()
q.append(1)       # enqueue
q.popleft()       # dequeue` },
        { type: "quiz", heading: "Quick Check", q: "Which data structure underpins recursive function calls?", opts: ["Queue", "Stack", "Heap", "Graph"], ans: 1 },
      ]
    }
  },
  {
    id: 4, subject: "ds", title: "Hash Tables", duration: "18 min", done: false,
    desc: "Hashing, collision resolution, load factor",
    content: {
      intro: "Hash tables give average O(1) insert, delete, and lookup — the workhorse of most programming languages' dictionaries and sets.",
      sections: [
        { type: "text", heading: "How Hashing Works", body: "A <strong>hash function</strong> maps a key to an integer index: <code>index = hash(key) % table_size</code>. Good hash functions spread keys uniformly." },
        { type: "callout", style: "warn", heading: "Collisions", body: "Two keys can map to the same index. Solutions: <strong>Chaining</strong> (each slot is a linked list) or <strong>Open Addressing</strong> (probe for the next empty slot)." },
        { type: "text", heading: "Load Factor", body: "α = n / m (items / slots). When α > 0.7 the table is rehashed to roughly double size — O(n) but amortised O(1) per insert." },
        { type: "quiz", heading: "Quick Check", q: "Average-case lookup in a hash table is:", opts: ["O(n)", "O(log n)", "O(1)", "O(n log n)"], ans: 2 },
      ]
    }
  },
  {
    id: 5, subject: "ds", title: "Binary Trees", duration: "20 min", done: false,
    desc: "BST, traversals, height and balance",
    content: {
      intro: "Trees let us represent hierarchical data and, when balanced, keep search at O(log n).",
      sections: [
        { type: "text", heading: "Binary Search Tree (BST)", body: "For every node: all values in the <strong>left subtree are smaller</strong>, all in the <strong>right subtree are larger</strong>. Search, insert, delete are O(h) where h = height." },
        { type: "code", heading: "Three Traversals", body: `# In-order (sorted output for BST)
def inorder(node):
    if node: inorder(node.left); print(node.val); inorder(node.right)

# Pre-order  L→Root→R → copy a tree
# Post-order L→R→Root → delete a tree` },
        { type: "callout", style: "warn", heading: "Degenerate Tree", body: "Inserting sorted data creates a linear chain — O(n) height. AVL and Red-Black trees self-balance to keep h = O(log n)." },
        { type: "quiz", heading: "Quick Check", q: "In-order traversal of a BST produces values in:", opts: ["Random order", "Reverse order", "Sorted order", "Level order"], ans: 2 },
      ]
    }
  },
  {
    id: 6, subject: "ds", title: "Graphs", duration: "22 min", done: false,
    desc: "Adjacency matrix/list, BFS, DFS",
    content: {
      intro: "Graphs model networks — cities, social connections, web pages. Mastering BFS and DFS unlocks most graph problems.",
      sections: [
        { type: "text", heading: "Representation", body: "<strong>Adjacency Matrix</strong>: O(V²) space, O(1) edge lookup. <strong>Adjacency List</strong>: O(V+E) space, better for sparse graphs. Real-world graphs are usually sparse → use adjacency list." },
        { type: "code", heading: "BFS Template", body: `from collections import deque
def bfs(graph, start):
    visited, q = {start}, deque([start])
    while q:
        node = q.popleft()
        for nb in graph[node]:
            if nb not in visited:
                visited.add(nb); q.append(nb)` },
        { type: "callout", style: "tip", heading: "BFS vs DFS", body: "BFS finds the <strong>shortest path</strong> (unweighted). DFS is better for cycle detection, topological sort, and connectivity." },
        { type: "quiz", heading: "Quick Check", q: "BFS uses which data structure internally?", opts: ["Stack", "Queue", "Heap", "Array"], ans: 1 },
      ]
    }
  },
  {
    id: 7, subject: "python", title: "List Comprehensions", duration: "8 min", done: true,
    desc: "Concise list creation and filtering",
    content: {
      intro: "List comprehensions replace verbose for-loops with a single readable expression.",
      sections: [
        { type: "code", heading: "Syntax", body: `# [expression for item in iterable if condition]
squares = [x**2 for x in range(10)]
evens   = [x for x in range(20) if x % 2 == 0]
matrix  = [[i*j for j in range(4)] for i in range(4)]` },
        { type: "callout", style: "tip", heading: "When NOT to use them", body: "If the logic needs more than one condition or nested side effects, a regular for-loop is clearer. Readability > cleverness." },
        { type: "quiz", heading: "Quick Check", q: "[x*2 for x in range(3)] produces:", opts: ["[0,2,4]", "[1,2,3]", "[2,4,6]", "[0,1,2]"], ans: 0 },
      ]
    }
  },
  {
    id: 8, subject: "python", title: "Decorators", duration: "13 min", done: true,
    desc: "Function wrappers and @syntax",
    content: {
      intro: "Decorators let you wrap a function to add behaviour — logging, timing, auth — without modifying its body.",
      sections: [
        { type: "code", heading: "Building a Decorator", body: `def timer(func):
    import time
    def wrapper(*args, **kwargs):
        t = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time()-t:.3f}s")
        return result
    return wrapper

@timer
def slow_fn(): time.sleep(0.5)` },
        { type: "text", heading: "Stacking Decorators", body: "You can stack multiple decorators. They apply bottom-up: <code>@A @B def f()</code> is equivalent to <code>f = A(B(f))</code>." },
        { type: "quiz", heading: "Quick Check", q: "@decorator is syntactic sugar for:", opts: ["decorator = func()", "func = decorator(func)", "class decorator", "None of the above"], ans: 1 },
      ]
    }
  },
  {
    id: 9, subject: "python", title: "Generators & yield", duration: "10 min", done: false,
    desc: "Lazy evaluation and memory efficiency",
    content: {
      intro: "Generators produce values one at a time using yield, never storing the whole sequence in memory.",
      sections: [
        { type: "code", heading: "Generator Function", body: `def count_up(n):
    i = 0
    while i < n:
        yield i   # pauses here
        i += 1

for x in count_up(1_000_000):
    print(x)   # uses constant memory` },
        { type: "callout", style: "info", heading: "Generator Expression", body: "<code>(x**2 for x in range(10))</code> — like a list comprehension but lazy. Use for large or infinite sequences." },
        { type: "quiz", heading: "Quick Check", q: "What keyword makes a function a generator?", opts: ["return", "async", "yield", "generate"], ans: 2 },
      ]
    }
  },
  {
    id: 10, subject: "python", title: "OOP in Python", duration: "17 min", done: false,
    desc: "Classes, inheritance, dunder methods",
    content: {
      intro: "Python's OOP is flexible — everything is an object, and dunder methods let you customise built-in behaviour.",
      sections: [
        { type: "code", heading: "Class & Inheritance", body: `class Animal:
    def __init__(self, name): self.name = name
    def speak(self): raise NotImplementedError

class Dog(Animal):
    def speak(self): return f"{self.name} says Woof"

class Cat(Animal):
    def speak(self): return f"{self.name} says Meow"` },
        { type: "text", heading: "Dunder Methods", body: "<code>__str__</code>, <code>__repr__</code>, <code>__len__</code>, <code>__eq__</code>, <code>__lt__</code> let your objects work with <code>print()</code>, <code>len()</code>, comparison operators, etc." },
        { type: "quiz", heading: "Quick Check", q: "Which method is called by print(obj)?", opts: ["__repr__", "__str__", "__print__", "__format__"], ans: 1 },
      ]
    }
  },
  {
    id: 11, subject: "dbms", title: "Normalisation", duration: "19 min", done: true,
    desc: "1NF to BCNF, eliminating redundancy",
    content: {
      intro: "Normalisation removes data redundancy and prevents update anomalies by decomposing tables into smaller, well-structured ones.",
      sections: [
        { type: "text", heading: "Normal Forms", body: "<strong>1NF</strong>: atomic values, no repeating groups. <strong>2NF</strong>: 1NF + no partial dependencies on composite key. <strong>3NF</strong>: 2NF + no transitive dependencies. <strong>BCNF</strong>: every determinant is a candidate key." },
        { type: "callout", style: "tip", heading: "Practical Rule", body: "If a non-key column depends on another non-key column, you have a transitive dependency → violates 3NF. Move it to its own table." },
        { type: "quiz", heading: "Quick Check", q: "BCNF requires every determinant to be a:", opts: ["Foreign key", "Primary key only", "Candidate key", "Non-key attribute"], ans: 2 },
      ]
    }
  },
  {
    id: 12, subject: "dbms", title: "SQL Joins", duration: "14 min", done: false,
    desc: "INNER, LEFT, RIGHT, FULL joins",
    content: {
      intro: "Joins combine rows from two or more tables based on a related column.",
      sections: [
        { type: "code", heading: "Four Kinds of Joins", body: `-- INNER: only matching rows
SELECT * FROM orders o INNER JOIN customers c ON o.cust_id = c.id;

-- LEFT: all from left + matching right (NULLs if no match)
SELECT * FROM customers c LEFT JOIN orders o ON c.id = o.cust_id;

-- FULL OUTER: all rows from both
SELECT * FROM A FULL OUTER JOIN B ON A.id = B.id;` },
        { type: "callout", style: "info", heading: "CROSS JOIN", body: "Returns the Cartesian product — every row of A paired with every row of B → n×m rows. Rarely intentional!" },
        { type: "quiz", heading: "Quick Check", q: "Which join returns all rows from the LEFT table even with no match?", opts: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "CROSS JOIN"], ans: 1 },
      ]
    }
  },
  {
    id: 13, subject: "dbms", title: "ACID Transactions", duration: "12 min", done: false,
    desc: "Atomicity, Consistency, Isolation, Durability",
    content: {
      intro: "ACID properties guarantee that database transactions are processed reliably — critical for banking, orders, and any multi-step operations.",
      sections: [
        { type: "text", heading: "The Four Properties", body: "<strong>Atomicity</strong>: all-or-nothing. <strong>Consistency</strong>: only valid states. <strong>Isolation</strong>: concurrent transactions don't interfere. <strong>Durability</strong>: committed data survives crashes." },
        { type: "callout", style: "warn", heading: "Isolation Levels", body: "READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE. Higher isolation = fewer anomalies but lower throughput. PostgreSQL defaults to READ COMMITTED." },
        { type: "quiz", heading: "Quick Check", q: "A bank transfer that debits one account and credits another is an example of:", opts: ["Consistency", "Atomicity", "Isolation", "Durability"], ans: 1 },
      ]
    }
  },
  {
    id: 14, subject: "os", title: "Process vs Thread", duration: "11 min", done: true,
    desc: "Concurrency, context switching, scheduling",
    content: {
      intro: "Understanding processes and threads is fundamental to building concurrent applications and interpreting system performance.",
      sections: [
        { type: "text", heading: "Process", body: "A process is an independent program with its own memory space (code, heap, stack, file descriptors). Context switching between processes is expensive — the OS must save/restore the full memory map." },
        { type: "text", heading: "Thread", body: "Threads share the same memory space within a process. Lighter context switch — just save/restore registers and stack pointer. Python GIL limits CPU parallelism for threads; use <code>multiprocessing</code> for CPU-bound tasks." },
        { type: "quiz", heading: "Quick Check", q: "Threads within the same process share:", opts: ["Stack", "Heap memory", "Registers", "Program counter"], ans: 1 },
      ]
    }
  },
  {
    id: 15, subject: "os", title: "Memory Management", duration: "16 min", done: false,
    desc: "Paging, segmentation, virtual memory",
    content: {
      intro: "Virtual memory creates the illusion of unlimited RAM by mapping virtual addresses to physical frames, swapping to disk when needed.",
      sections: [
        { type: "text", heading: "Paging", body: "Memory is split into fixed-size <strong>pages</strong> (typically 4KB). The OS maintains a <strong>page table</strong> mapping virtual page numbers to physical frame numbers. Page faults trigger a swap from disk." },
        { type: "callout", style: "warn", heading: "Thrashing", body: "If a process constantly page-faults, the CPU spends more time swapping than executing. Solution: increase RAM or reduce the working set." },
        { type: "quiz", heading: "Quick Check", q: "A page fault means:", opts: ["A bug in code", "The requested page isn't in RAM", "RAM is full", "CPU cache miss"], ans: 1 },
      ]
    }
  },
  {
    id: 16, subject: "cn", title: "TCP vs UDP", duration: "9 min", done: true,
    desc: "Reliability, ordering, connection model",
    content: {
      intro: "TCP and UDP are the two workhorses of the transport layer — choose based on whether you need reliability or speed.",
      sections: [
        { type: "text", heading: "TCP", body: "<strong>Connection-oriented</strong>. Three-way handshake (SYN→SYN-ACK→ACK). Guarantees delivery, ordering, and error checking via acknowledgements. Used by HTTP, FTP, SSH." },
        { type: "text", heading: "UDP", body: "<strong>Connectionless</strong>. Fire and forget — no handshake, no retransmission. Lower latency. Used by DNS, video streaming, online games, VoIP." },
        { type: "quiz", heading: "Quick Check", q: "Which protocol would you use for live video streaming?", opts: ["TCP", "UDP", "HTTP", "FTP"], ans: 1 },
      ]
    }
  },
  {
    id: 17, subject: "cn", title: "HTTP & HTTPS", duration: "13 min", done: false,
    desc: "Request-response, status codes, TLS",
    content: {
      intro: "HTTP is the protocol of the web. Understanding requests, responses, and status codes is essential for every web developer.",
      sections: [
        { type: "text", heading: "Request-Response Cycle", body: "Client sends: <code>GET /api/users HTTP/1.1</code> with headers. Server responds with a status code + body. Stateless — each request is independent (sessions use cookies/tokens)." },
        { type: "code", heading: "Common Status Codes", body: `200 OK            — success
201 Created        — resource created
400 Bad Request    — client error
401 Unauthorized   — missing/invalid auth
403 Forbidden      — authenticated but not allowed
404 Not Found      — resource doesn't exist
500 Internal Error — server bug` },
        { type: "callout", style: "info", heading: "HTTPS", body: "HTTP + TLS. The TLS handshake establishes a shared secret so all traffic is encrypted. Certificates prove the server's identity." },
        { type: "quiz", heading: "Quick Check", q: "Which status code means 'not authenticated'?", opts: ["400", "401", "403", "404"], ans: 1 },
      ]
    }
  },
];

export interface Concept {
  id: number; cat: string; icon: string; title: string;
  sub: string; tags: string[]; color: string; done: boolean;
}
export const CONCEPTS: Concept[] = [
  { id:1, cat:"ds", icon:"⬡", title:"Array", sub:"Fixed-size, O(1) access, O(n) insert", tags:["Memory","Access"], color:"var(--yellow)", done:true },
  { id:2, cat:"ds", icon:"⬡", title:"Linked List", sub:"Dynamic size, O(n) access, O(1) insert at head", tags:["Pointers"], color:"var(--yellow)", done:true },
  { id:3, cat:"ds", icon:"⬡", title:"Binary Search Tree", sub:"Left < root < right, O(log n) search when balanced", tags:["Trees","Search"], color:"var(--yellow)", done:false },
  { id:4, cat:"ds", icon:"⬡", title:"Hash Map", sub:"Key-value pairs, O(1) average lookup via hashing", tags:["Hashing"], color:"var(--yellow)", done:true },
  { id:5, cat:"algo", icon:"◈", title:"Big-O Notation", sub:"Upper bound on time/space growth as input grows", tags:["Complexity"], color:"var(--green)", done:true },
  { id:6, cat:"algo", icon:"◈", title:"Binary Search", sub:"O(log n) on sorted arrays by halving search space", tags:["Search"], color:"var(--green)", done:true },
  { id:7, cat:"algo", icon:"◈", title:"Merge Sort", sub:"Divide and conquer, O(n log n), stable sort", tags:["Sorting"], color:"var(--green)", done:false },
  { id:8, cat:"algo", icon:"◈", title:"Dynamic Programming", sub:"Optimal substructure + overlapping subproblems → memo", tags:["Optimisation"], color:"var(--green)", done:false },
  { id:9, cat:"python", icon:"◆", title:"List Comprehension", sub:"[expr for x in iterable if condition]", tags:["Syntax"], color:"var(--orange)", done:true },
  { id:10, cat:"python", icon:"◆", title:"Generator", sub:"yield pauses execution; memory-efficient lazy iteration", tags:["Iterators"], color:"var(--orange)", done:false },
  { id:11, cat:"dbms", icon:"◫", title:"ACID Properties", sub:"Atomicity, Consistency, Isolation, Durability", tags:["Transactions"], color:"var(--purple)", done:true },
  { id:12, cat:"dbms", icon:"◫", title:"Normal Forms", sub:"1NF→2NF→3NF→BCNF — eliminate redundancy progressively", tags:["Design"], color:"var(--purple)", done:false },
  { id:13, cat:"os", icon:"◎", title:"Deadlock", sub:"Mutual exclusion + hold & wait + no preemption + circular wait", tags:["Concurrency"], color:"var(--teal)", done:true },
  { id:14, cat:"os", icon:"◎", title:"Virtual Memory", sub:"Illusion of more RAM via paging to disk", tags:["Memory"], color:"var(--teal)", done:false },
];

export const FLASHCARDS = [
  { term:"Binary Search Tree", def:"Each node's left subtree contains smaller values; right larger. Balanced BSTs give O(log n) search." },
  { term:"Big-O Notation", def:"Upper bound on time/space complexity as n grows: O(1) constant, O(n) linear, O(n²) quadratic." },
  { term:"Hash Map", def:"Maps keys to values via a hash function for O(1) average-case lookup. Handles collisions with chaining or open addressing." },
  { term:"Deadlock", def:"Processes wait on each other indefinitely. Requires: mutual exclusion, hold & wait, no preemption, circular wait." },
  { term:"Merge Sort", def:"Divide and conquer — splits array in half, sorts each, merges. O(n log n) time, O(n) space, stable." },
  { term:"ACID", def:"Atomicity (all-or-nothing), Consistency (valid state), Isolation (independent transactions), Durability (persisted)." },
  { term:"TCP vs UDP", def:"TCP: reliable, ordered, connection-oriented. UDP: fast, no guarantees, connectionless. Use TCP for data integrity, UDP for speed." },
  { term:"Virtual Memory", def:"OS maps virtual addresses to physical RAM frames via a page table. Page faults load pages from disk on demand." },
];

export const SUBJECT_COLORS: Record<string, string> = {
  ds: "var(--yellow)", python: "var(--orange)", dbms: "var(--purple)", os: "var(--teal)", cn: "var(--blue)"
};
export const SUBJECT_ICONS: Record<string, string> = {
  ds: "⬡", python: "◆", dbms: "◫", os: "◎", cn: "◌"
};
export const SUBJECT_LABELS: Record<string, string> = {
  ds: "Data Structures", python: "Python", dbms: "DBMS", os: "OS", cn: "Networks"
};
