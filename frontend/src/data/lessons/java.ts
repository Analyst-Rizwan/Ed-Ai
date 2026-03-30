import type { Lesson } from "@/data/learnData";

export const JAVA_LESSONS: Lesson[] = [
  {
    id: 301, subject: "java", title: "JVM Architecture & Memory Model", duration: "15 min", done: false,
    desc: "Stack, Heap, Metaspace, GC regions, class loading",
    vizType: "memory",
    vizConfig: {
      steps: [
        { title:"JVM Memory Areas", note:"JVM divides memory into: Stack (per-thread frames), Heap (objects), Metaspace (class metadata), PC Register.",
          cells: [
            { id:"stack", label:"Thread Stack",   value:"method frames",   type:"stack", address:"Stack" },
            { id:"heap",  label:"Heap (Young+Old)",value:"all objects",    type:"heap",  address:"Heap" },
            { id:"meta",  label:"Metaspace",       value:"class metadata", type:"heap",  address:"Metaspace" },
          ]},
        { title:"Object allocation", note:"new Object() allocates in Young Generation (Eden space). Most objects die young.",
          cells: [
            { id:"eden", label:"Eden (Young Gen)", value:"new Object()", type:"heap", address:"0x1000", highlight:true },
            { id:"old",  label:"Old Gen",           value:"long-lived",   type:"heap", address:"0x8000" },
          ]},
        { title:"GC collection", note:"Minor GC clears Eden, promotes survivors to Old Gen. Major GC clears Old Gen (slow — avoid). G1, ZGC are concurrent.",
          cells: [
            { id:"eden2", label:"Eden", value:"cleared", type:"heap", address:"0x1000", color:"var(--red)" },
            { id:"surv",  label:"Survivor", value:"promoted", type:"heap", address:"0x4000", highlight:true },
            { id:"old2",  label:"Old Gen", value:"old objects", type:"heap", address:"0x8000" },
          ]},
      ]
    },
    content: {
      intro: "Understanding the JVM memory model is critical for diagnosing memory leaks, tuning GC performance, and understanding why Java behaves differently from C/C++.",
      sections: [
        { type: "text", heading: "GC Generations", body: "Objects are allocated in Eden. Surviving minor GCs move to Survivor space, then Old Gen. Long-lived objects in Old Gen are collected infrequently (expensive)." },
        { type: "callout", style: "tip", heading: "GC Tuning", body: "For low-latency apps: use G1GC (<code>-XX:+UseG1GC</code>) or ZGC (<code>-XX:+UseZGC</code>). Tune heap size with <code>-Xms</code> and <code>-Xmx</code>." },
        { type: "quiz", heading: "Quick Check", q: "New objects in the JVM are allocated in:", opts: ["Old Gen","Metaspace","Eden (Young Gen)","Stack"], ans: 2 },
      ]
    }
  },
  {
    id: 302, subject: "java", title: "OOP in Java", duration: "14 min", done: false,
    desc: "Classes, interfaces, abstract classes, encapsulation, polymorphism",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"iface",    label:"<<interface>>\nPayable",   sublabel:"pay()",     x:50, y:10, color:"var(--yellow)" },
        { id:"abstract", label:"<<abstract>>\nEmployee",  sublabel:"name, id",  x:50, y:45, color:"var(--accent)" },
        { id:"ftemp",    label:"FullTimeEmployee",         sublabel:"salary",   x:25, y:80, color:"var(--green)" },
        { id:"ptemp",    label:"PartTimeEmployee",         sublabel:"hours",    x:75, y:80, color:"var(--orange)" },
      ],
      edges: [
        { from:"abstract", to:"iface",    label:"implements", dashed:true },
        { from:"ftemp",    to:"abstract", label:"extends" },
        { from:"ptemp",    to:"abstract", label:"extends" },
      ],
      steps: [
        { title:"Interface contract", note:"Payable interface declares pay() method. Any class implementing it MUST provide the implementation.", highlightNodes:["iface"] },
        { title:"Abstract class", note:"Employee is abstract — can have both implemented and abstract methods. Cannot instantiate directly.", highlightNodes:["abstract"], highlightEdges:["abstract->iface"] },
        { title:"Concrete classes", note:"FullTimeEmployee and PartTimeEmployee extend Employee, implement pay() differently. Runtime polymorphism.", highlightNodes:["ftemp","ptemp"] },
      ]
    },
    content: {
      intro: "Java is built on OOP. Interface vs abstract class is one of the most common Java design decisions.",
      sections: [
        { type: "text", heading: "Interface vs Abstract Class", body: "<strong>Interface</strong>: only abstract methods (Java 8+: default methods). A class can implement multiple interfaces. <strong>Abstract class</strong>: can have fields and implementations; only single inheritance." },
        { type: "quiz", heading: "Quick Check", q: "Java supports multiple inheritance via:", opts: ["Multiple classes","Abstract classes","Interfaces","Generics"], ans: 2 },
      ]
    }
  },
  {
    id: 303, subject: "java", title: "Collections Framework", duration: "15 min", done: false,
    desc: "List, Set, Map hierarchy, ArrayList vs LinkedList, HashMap internals",
    vizType: "codeStep",
    vizConfig: {
      language: "java",
      code: `List<String> list = new ArrayList<>();\nlist.add("Alice"); list.add("Bob");\n\nMap<String, Integer> scores = new HashMap<>();\nscores.put("Alice", 95);\nscores.put("Bob",   88);\nSystem.out.println(scores.get("Alice")); // 95`,
      steps: [
        { line: 0, vars: { "list.size": 0 }, output: "", note: "ArrayList: dynamic array. O(1) get by index, O(n) insert at middle." },
        { line: 1, vars: { "list.size": 2 }, output: "", note: "add() appends. If capacity exceeded, array doubles (amortised O(1))." },
        { line: 3, vars: {}, output: "", note: "HashMap: array of buckets + linked lists/trees. O(1) average put/get." },
        { line: 4, vars: { scores: "{Alice:95}" }, output: "", note: "put() calls hashCode() on key, maps to bucket index." },
        { line: 6, vars: {}, output: "95\n", note: "get('Alice') hashes key → finds bucket → equals check → returns 95." },
      ]
    },
    content: {
      intro: "The Java Collections Framework provides implementations of common data structures, standardised by interfaces like List, Set, and Map.",
      sections: [
        { type: "text", heading: "Choosing a Collection", body: "<strong>ArrayList</strong>: fast get, slow insert-middle. <strong>LinkedList</strong>: O(1) insert/delete at ends, slow random access. <strong>HashSet</strong>: unique, O(1). <strong>TreeSet</strong>: sorted, O(log n)." },
        { type: "quiz", heading: "Quick Check", q: "HashMap's average complexity for get() is:", opts: ["O(log n)","O(1)","O(n)","O(n log n)"], ans: 1 },
      ]
    }
  },
  {
    id: 304, subject: "java", title: "Generics & Type Safety", duration: "13 min", done: false,
    desc: "Type parameters, wildcards, bounded types, type erasure",
    vizType: "codeStep",
    vizConfig: {
      language: "java",
      code: `class Box<T> {\n    private T value;\n    Box(T v) { value = v; }\n    T get() { return value; }\n}\n\nBox<Integer> intBox = new Box<>(42);\nBox<String>  strBox = new Box<>("Hello");\nSystem.out.println(intBox.get() + 1); // 43`,
      steps: [
        { line: 0, vars: {}, output: "", note: "Box<T> — T is a type parameter. One class works for any type safely." },
        { line: 6, vars: { "intBox.value": 42 }, output: "", note: "Box<Integer> — compiler enforces Integer only. No cast needed." },
        { line: 7, vars: { "strBox.value": "Hello" }, output: "", note: "Box<String> — completely separate type. Generics prevent runtime ClassCastException." },
        { line: 8, vars: {}, output: "43\n", note: "intBox.get() returns Integer. +1 auto-unboxes to int. Type-safe, no cast." },
      ]
    },
    content: {
      intro: "Generics add compile-time type safety. Without them, you'd use Object and cast everywhere — error-prone and verbose.",
      sections: [
        { type: "text", heading: "Type Erasure", body: "Generics are a compile-time feature. At runtime, <code>Box&lt;Integer&gt;</code> and <code>Box&lt;String&gt;</code> are both just <code>Box</code>. This is type erasure — no runtime type info for type parameters." },
        { type: "quiz", heading: "Quick Check", q: "Generics in Java are enforced at:", opts: ["Runtime","Compile time only (type erasure)","Load time","Link time"], ans: 1 },
      ]
    }
  },
  {
    id: 305, subject: "java", title: "Streams & Functional Style", duration: "15 min", done: false,
    desc: "Stream API, filter, map, reduce, collect, lazy evaluation",
    vizType: "codeStep",
    vizConfig: {
      language: "java",
      code: `List<Integer> nums = List.of(1,2,3,4,5,6,7,8);\n\nint sumOfEvenSquares = nums.stream()\n    .filter(n -> n % 2 == 0)     // {2,4,6,8}\n    .map(n -> n * n)             // {4,16,36,64}\n    .reduce(0, Integer::sum);    // 120\n\nSystem.out.println(sumOfEvenSquares); // 120`,
      steps: [
        { line: 2, vars: { stream: "[1..8]" }, output: "", note: "stream() creates a lazy pipeline. Nothing executes yet." },
        { line: 3, vars: { stream: "[2,4,6,8]" }, output: "", note: "filter() is intermediate — lazy. Adds filter to pipeline." },
        { line: 4, vars: { stream: "[4,16,36,64]" }, output: "", note: "map() is intermediate — transforms each element." },
        { line: 5, vars: { result: 120 }, output: "", note: "reduce() is terminal — triggers pipeline execution. Sums all elements." },
        { line: 7, vars: {}, output: "120\n", note: "Result printed. Stream consumed — cannot reuse." },
      ]
    },
    content: {
      intro: "Java 8 Streams bring functional programming to Java. Pipelines are lazy — computation only happens at the terminal operation.",
      sections: [
        { type: "text", heading: "Lazy Evaluation", body: "Stream pipeline: source → intermediate ops (filter, map, flatMap, sorted) → terminal op (collect, reduce, forEach, count). Intermediates are lazy — they build a pipeline but don't execute until a terminal op is called." },
        { type: "quiz", heading: "Quick Check", q: "Stream operations are executed when:", opts: ["stream() is called","filter() is invoked","A terminal operation is called","collect() template is defined"], ans: 2 },
      ]
    }
  },
  {
    id: 306, subject: "java", title: "Multithreading & Concurrency", duration: "18 min", done: false,
    desc: "Thread lifecycle, synchronized, volatile, ExecutorService, CompletableFuture",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"new",       label:"NEW",         sublabel:"Thread t = new Thread()", x:15, y:50, color:"var(--muted)" },
        { id:"runnable",  label:"RUNNABLE",     sublabel:"t.start()",              x:38, y:50, color:"var(--green)", highlight:true },
        { id:"running",   label:"RUNNING",      sublabel:"CPU executing",          x:60, y:50, color:"var(--accent)" },
        { id:"blocked",   label:"BLOCKED",      sublabel:"waiting for lock",       x:50, y:80, color:"var(--red)" },
        { id:"terminated",label:"TERMINATED",   sublabel:"run() returned",         x:83, y:50, color:"var(--muted)" },
      ],
      edges: [
        { from:"new",      to:"runnable",   label:"start()" },
        { from:"runnable", to:"running",    label:"scheduler" },
        { from:"running",  to:"blocked",    label:"wait for lock" },
        { from:"blocked",  to:"runnable",   label:"lock acquired" },
        { from:"running",  to:"terminated", label:"completes" },
      ],
      steps: [
        { title:"Thread creation", note:"new Thread(runnable) creates thread in NEW state. t.start() → RUNNABLE. Thread waits for OS scheduler.", highlightNodes:["new","runnable"] },
        { title:"Running and blocking", note:"Scheduler picks RUNNABLE thread → RUNNING. If it needs a synchronized lock held by another thread → BLOCKED.", highlightNodes:["running","blocked"] },
        { title:"Synchronization", note:"synchronized(obj) { } grants mutex lock. Only one thread runs inside at a time. ReentrantLock offers more control.", highlightEdges:["blocked->runnable"] },
      ]
    },
    content: {
      intro: "Java has built-in thread support. The java.util.concurrent package provides high-level abstractions that are safer than raw threads.",
      sections: [
        { type: "code", heading: "ExecutorService", body: `ExecutorService pool = Executors.newFixedThreadPool(4);\nFuture<Integer> f = pool.submit(() -> heavyComputation());\nint result = f.get(); // blocks until done\npool.shutdown();` },
        { type: "callout", style: "warn", heading: "volatile vs synchronized", body: "<code>volatile</code> ensures visibility across threads but NOT atomicity. <code>synchronized</code> ensures both visibility and mutual exclusion. Don't use volatile for compound operations like i++." },
        { type: "quiz", heading: "Quick Check", q: "volatile guarantees:", opts: ["Atomicity","Visibility only","Mutual exclusion","Both atomicity and visibility"], ans: 1 },
      ]
    }
  },
  {
    id: 307, subject: "java", title: "Exception Handling", duration: "12 min", done: false,
    desc: "Checked vs unchecked, try-with-resources, custom exceptions",
    vizType: "codeStep",
    vizConfig: {
      language: "java",
      code: `// try-with-resources (Java 7+)\ntry (BufferedReader br = new BufferedReader(\n         new FileReader("data.txt"))) {\n    String line = br.readLine();\n    System.out.println(line);\n} catch (IOException e) {\n    e.printStackTrace();\n}  // br.close() called automatically`,
      steps: [
        { line: 1, vars: { br: "opened" }, output: "", note: "try-with-resources: br implements AutoCloseable. JVM calls close() in finally block automatically." },
        { line: 3, vars: { line: "Hello" }, output: "", note: "readLine() throws IOException (checked) — must catch or declare throws." },
        { line: 4, vars: {}, output: "Hello\n", note: "Prints the line." },
        { line: 5, vars: {}, output: "", note: "If IOException thrown, catch block handles it. br still closed." },
        { line: 7, vars: {}, output: "", note: "br.close() called automatically — no finally needed." },
      ]
    },
    content: {
      intro: "Java has two exception types: checked (must handle) and unchecked (RuntimeException). try-with-resources eliminates resource leak bugs.",
      sections: [
        { type: "text", heading: "Checked vs Unchecked", body: "<strong>Checked</strong>: IOException, SQLException — compiler forces you to handle or declare. <strong>Unchecked</strong>: NullPointerException, ArrayIndexOutOfBounds — programmer error, don't catch routinely." },
        { type: "quiz", heading: "Quick Check", q: "try-with-resources requires the resource to implement:", opts: ["Closeable only","AutoCloseable","Runnable","Serializable"], ans: 1 },
      ]
    }
  },
  {
    id: 308, subject: "java", title: "Design Patterns in Java", duration: "16 min", done: false,
    desc: "Builder, Iterator, Dependency Injection, Spring IoC container",
    vizType: "codeStep",
    vizConfig: {
      language: "java",
      code: `// Builder pattern\nUser user = new User.Builder()\n    .name("Alice")\n    .age(25)\n    .email("a@test.com")\n    .build();\n\n// Prevents telescoping constructors:\n// User(String, int, String, String, String, ...)`,
      steps: [
        { line: 1, vars: {}, output: "", note: "Builder starts. No partial object created yet." },
        { line: 2, vars: { name: "Alice" }, output: "", note: "name() sets name on builder and returns 'this' for chaining." },
        { line: 3, vars: { name: "Alice", age: 25 }, output: "", note: "age() sets age." },
        { line: 5, vars: { user: "User{Alice,25}" }, output: "", note: "build() validates all required fields and constructs the immutable User object." },
      ]
    },
    content: {
      intro: "Java's verbose nature makes design patterns especially useful. Builder, Iterator, and DI are the most commonly asked about in interviews.",
      sections: [
        { type: "text", heading: "Dependency Injection", body: "Instead of <code>new OrderService(new EmailService())</code> inside a class, inject dependencies: <code>OrderService(EmailService emailSvc)</code>. Spring autowires them for you." },
        { type: "quiz", heading: "Quick Check", q: "The Builder pattern solves:", opts: ["Sorting objects","Telescoping constructors with many optional params","Lazy loading","Thread safety"], ans: 1 },
      ]
    }
  },
  {
    id: 309, subject: "java", title: "JDBC & Database Connectivity", duration: "14 min", done: false,
    desc: "JDBC API, connection pools, PreparedStatement, SQL injection prevention",
    vizType: "codeStep",
    vizConfig: {
      language: "java",
      code: `String sql = "SELECT * FROM users WHERE id = ?";\ntry (PreparedStatement ps = conn.prepareStatement(sql)) {\n    ps.setInt(1, userId);\n    ResultSet rs = ps.executeQuery();\n    while (rs.next()) {\n        System.out.println(rs.getString("name"));\n    }\n}`,
      steps: [
        { line: 0, vars: {}, output: "", note: "? placeholder in PreparedStatement. SQL is pre-compiled — injection impossible." },
        { line: 2, vars: { userId: 42 }, output: "", note: "setInt sets parameter. User input never concatenated into SQL string." },
        { line: 3, vars: { rs: "ResultSet" }, output: "", note: "executeQuery sends the prepared query to DB. Returns ResultSet cursor." },
        { line: 4, vars: {}, output: "Alice\n", note: "rs.next() advances cursor. getString retrieves column value by name." },
      ]
    },
    content: {
      intro: "JDBC is Java's low-level database API. Always use PreparedStatement — never string concatenation for SQL.",
      sections: [
        { type: "callout", style: "warn", heading: "SQL Injection", body: "<code>\"SELECT * FROM users WHERE id = \" + userId</code> — if userId is <code>1 OR 1=1</code>, attacker gets all rows. Use PreparedStatement always." },
        { type: "quiz", heading: "Quick Check", q: "PreparedStatement prevents SQL injection because:", opts: ["It encrypts queries","Parameters are never concatenated into SQL","It uses stored procedures","It limits query length"], ans: 1 },
      ]
    }
  },
  {
    id: 310, subject: "java", title: "Spring Boot Basics", duration: "16 min", done: false,
    desc: "IoC, @RestController, @Service, @Repository, auto-configuration",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"client", label:"HTTP Client",      sublabel:"GET /users",         x:10, y:50, color:"var(--muted)" },
        { id:"ctrl",   label:"@RestController",  sublabel:"maps HTTP→method",   x:35, y:50, color:"var(--accent)" },
        { id:"svc",    label:"@Service",          sublabel:"business logic",    x:60, y:50, color:"var(--green)" },
        { id:"repo",   label:"@Repository",       sublabel:"DB access",         x:85, y:50, color:"var(--yellow)" },
      ],
      edges: [
        { from:"client", to:"ctrl", label:"HTTP GET", animated:true },
        { from:"ctrl",   to:"svc",  label:"getUsers()" },
        { from:"svc",    to:"repo", label:"findAll()" },
      ],
      steps: [
        { title:"Request enters Controller", note:"@RestController maps GET /users to a method. Spring deserialises HTTP request.", highlightNodes:["client","ctrl"] },
        { title:"Service layer", note:"@Service contains business logic. @Autowired injects UserRepository — Spring creates and manages all beans.", highlightEdges:["ctrl->svc"] },
        { title:"Repository queries DB", note:"@Repository implements JPA/JDBC. Spring Data auto-generates SQL for findAll(), findById(), etc.", highlightEdges:["svc->repo"] },
      ]
    },
    content: {
      intro: "Spring Boot is Java's most popular web framework. It uses IoC (Inversion of Control) — Spring creates and injects your dependencies automatically.",
      sections: [
        { type: "code", heading: "Minimal REST API", body: `@RestController\n@RequestMapping("/users")\npublic class UserController {\n    @Autowired UserService svc;\n    @GetMapping\n    public List<User> all() { return svc.findAll(); }\n}` },
        { type: "quiz", heading: "Quick Check", q: "Spring Boot's @Autowired does:", opts: ["Generates SQL","Injects dependencies automatically","Maps HTTP routes","Handles exceptions"], ans: 1 },
      ]
    }
  },
  {
    id: 311, subject: "java", title: "Java I/O & NIO", duration: "13 min", done: false,
    desc: "File, InputStream, Readers, NIO2 Path API, Files utility class",
    vizType: "codeStep",
    vizConfig: {
      language: "java",
      code: `// NIO2 (Java 7+) — preferred\nPath path = Paths.get("data.txt");\nList<String> lines = Files.readAllLines(path);\nlines.forEach(System.out::println);\n\n// Write file\nFiles.writeString(path, "Hello Java NIO2");`,
      steps: [
        { line: 1, vars: { path: "data.txt" }, output: "", note: "Paths.get() creates a Path object. Works cross-platform (/ vs \\)." },
        { line: 2, vars: { lines: "[line1, line2]" }, output: "", note: "Files.readAllLines() reads entire file into List<String>. UTF-8 by default." },
        { line: 3, vars: {}, output: "line1\nline2\n", note: "forEach with method reference. Equivalent to n -> System.out.println(n)." },
        { line: 5, vars: {}, output: "", note: "Files.writeString() creates or overwrites file. Atomic on most platforms." },
      ]
    },
    content: {
      intro: "NIO2 (Java 7+) is the modern file I/O API. Prefer it over the old File class — cleaner, more powerful, and exception-friendly.",
      sections: [
        { type: "callout", style: "tip", heading: "NIO vs Old I/O", body: "Old: <code>new File(), FileReader, BufferedReader</code>. New NIO2: <code>Path, Files, Paths</code>. NIO2 has better exception messages, atomic operations, and file watching." },
        { type: "quiz", heading: "Quick Check", q: "Files.readAllLines() reads:", opts: ["First line only","All lines into List<String>","Line by line lazily","Binary bytes"], ans: 1 },
      ]
    }
  },
  {
    id: 312, subject: "java", title: "Java 17+ Features", duration: "14 min", done: false,
    desc: "Records, Sealed classes, Pattern matching instanceof, Switch expressions",
    vizType: "codeStep",
    vizConfig: {
      language: "java",
      code: `// Record (Java 16+) — immutable data class\nrecord Point(int x, int y) {}\nPoint p = new Point(3, 4);\nSystem.out.println(p.x()); // 3\n\n// Pattern matching instanceof (Java 16+)\nObject obj = "Hello";\nif (obj instanceof String s) {\n    System.out.println(s.length()); // 5\n}`,
      steps: [
        { line: 1, vars: {}, output: "", note: "record Point — compiler auto-generates: constructor, getters x()/y(), equals(), hashCode(), toString(). 1 line vs 30." },
        { line: 2, vars: { "p.x": 3, "p.y": 4 }, output: "", note: "Point is immutable — no setters. Perfect for DTOs and value types." },
        { line: 3, vars: {}, output: "3\n", note: "p.x() returns 3 — getter auto-generated by record." },
        { line: 6, vars: { obj: "Hello" }, output: "", note: "Old style: if (obj instanceof String) { String s = (String) obj; ... }. New: binding variable s is created inline." },
        { line: 7, vars: { s: "Hello" }, output: "5\n", note: "s is already typed as String here. No cast needed." },
      ]
    },
    content: {
      intro: "Java has modernised significantly. Records eliminate boilerplate. Pattern matching makes code cleaner and safer.",
      sections: [
        { type: "text", heading: "Sealed Classes", body: "<code>sealed interface Shape permits Circle, Rectangle, Triangle</code> — restricts which classes can implement the interface. Enables exhaustive switch expressions." },
        { type: "quiz", heading: "Quick Check", q: "A Java record automatically provides:", opts: ["Mutable setters","equals/hashCode/toString + constructor + getters","Database mapping","Thread safety"], ans: 1 },
      ]
    }
  },
  {
    id: 313, subject: "java", title: "Testing with JUnit 5", duration: "13 min", done: false,
    desc: "@Test, @BeforeEach, assertions, Mockito, parameterized tests",
    vizType: "codeStep",
    vizConfig: {
      language: "java",
      code: `@Test\nvoid addReturnsCorrectSum() {\n    Calculator calc = new Calculator();\n    int result = calc.add(2, 3);\n    assertEquals(5, result, "2+3 should be 5");\n}\n\n@ParameterizedTest\n@ValueSource(ints = {1, 2, 3, 4, 5})\nvoid isPositive(int n) {\n    assertTrue(n > 0);\n}`,
      steps: [
        { line: 0, vars: {}, output: "", note: "@Test marks this method as a test case. JUnit runs it automatically." },
        { line: 2, vars: { calc: "Calculator" }, output: "", note: "Arrange: create system under test." },
        { line: 3, vars: { result: 5 }, output: "", note: "Act: call the method being tested." },
        { line: 4, vars: {}, output: "✅ PASS", note: "Assert: assertEquals(expected, actual). Test passes if 5 == 5." },
        { line: 7, vars: {}, output: "", note: "@ParameterizedTest runs test once per value. Eliminates copy-paste tests." },
      ]
    },
    content: {
      intro: "Unit testing is non-negotiable in professional Java. JUnit 5 + Mockito is the standard stack.",
      sections: [
        { type: "code", heading: "Mockito — Mock Dependencies", body: `@Mock UserRepository repo;\n@InjectMocks UserService service;\n\nwhen(repo.findById(1)).thenReturn(Optional.of(new User("Alice")));\nUser u = service.getUser(1);\nassertEquals("Alice", u.getName());` },
        { type: "quiz", heading: "Quick Check", q: "Mockito.when() is used to:", opts: ["Run tests in parallel","Stub dependency behaviour","Assert values","Generate test data"], ans: 1 },
      ]
    }
  },
  {
    id: 314, subject: "java", title: "CompletableFuture & Async Java", duration: "15 min", done: false,
    desc: "Asynchronous pipelines, thenApply, thenCompose, allOf, exceptionally",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"start",  label:"CompletableFuture\nsupplyAsync()", sublabel:"runs in fork-join pool", x:15, y:50, color:"var(--accent)" },
        { id:"apply",  label:"thenApply()",                      sublabel:"transform result",       x:40, y:50, color:"var(--green)" },
        { id:"compose",label:"thenCompose()",                    sublabel:"chain another future",   x:65, y:50, color:"var(--yellow)" },
        { id:"result", label:"Result",                            sublabel:"final value",            x:88, y:50, color:"var(--purple)", highlight:true },
        { id:"err",    label:"exceptionally()",                   sublabel:"handle errors",          x:50, y:80, color:"var(--red)" },
      ],
      edges: [
        { from:"start",   to:"apply",   label:"async result", animated:true },
        { from:"apply",   to:"compose", label:"mapped value",  animated:true },
        { from:"compose", to:"result",  label:"final",         animated:true },
        { from:"apply",   to:"err",     label:"on exception",  dashed:true },
        { from:"err",     to:"result",  label:"fallback",      dashed:true },
      ],
      steps: [
        { title:"Start async task", note:"supplyAsync() runs a task in ForkJoinPool.commonPool(). Returns immediately without blocking.", highlightNodes:["start"] },
        { title:"Transform result", note:"thenApply() transforms result when it arrives — like Stream.map() but async.", highlightEdges:["start->apply"] },
        { title:"Chain dependent task", note:"thenCompose() chains another async operation (like flatMap). Avoids nested futures.", highlightEdges:["apply->compose","compose->result"] },
      ]
    },
    content: {
      intro: "CompletableFuture enables non-blocking async programming in Java. It's the foundation of reactive Java before Project Loom.",
      sections: [
        { type: "code", heading: "Async Pipeline", body: `CompletableFuture.supplyAsync(() -> fetchUser(id))\n    .thenApply(user -> enrichUser(user))\n    .thenAccept(user -> saveUser(user))\n    .exceptionally(ex -> { log(ex); return null; });` },
        { type: "quiz", heading: "Quick Check", q: "CompletableFuture.allOf() completes when:", opts: ["Any one future completes","All futures complete","First failure","Is called manually"], ans: 1 },
      ]
    }
  },
];
