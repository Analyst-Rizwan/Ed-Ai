import type { Lesson } from "@/data/learnData";

export const LLD_LESSONS: Lesson[] = [
  {
    id: 601, subject: "lld", title: "SOLID Principles", duration: "18 min", done: false,
    desc: "SRP, OCP, LSP, ISP, DIP — the 5 principles of clean OOP design",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"srp", label:"SRP", sublabel:"One reason to change", x:20, y:20, color:"var(--green)" },
        { id:"ocp", label:"OCP", sublabel:"Open/Closed",          x:50, y:20, color:"var(--accent)" },
        { id:"lsp", label:"LSP", sublabel:"Liskov Substitution",  x:80, y:20, color:"var(--yellow)" },
        { id:"isp", label:"ISP", sublabel:"Interface Segregation", x:35, y:70, color:"var(--orange)" },
        { id:"dip", label:"DIP", sublabel:"Depend on abstractions", x:65, y:70, color:"var(--teal)" },
        { id:"solid", label:"SOLID Design", sublabel:"Maintainable code", x:50, y:85, color:"var(--purple)" },
      ],
      edges: [
        { from:"srp",to:"solid" }, { from:"ocp",to:"solid" }, { from:"lsp",to:"solid" },
        { from:"isp",to:"solid" }, { from:"dip",to:"solid" },
      ],
      steps: [
        { title:"SRP", note:"Single Responsibility: Each class has ONE reason to change. User class shouldn't also handle email sending.", highlightNodes:["srp"] },
        { title:"OCP", note:"Open/Closed: Open for extension, closed for modification. Add new behaviour via new subclasses, not editing existing code.", highlightNodes:["ocp"] },
        { title:"LSP", note:"Liskov Substitution: Subclasses must be substitutable for their base class. If Square extends Rectangle, width=height constraint must hold.", highlightNodes:["lsp"] },
        { title:"ISP", note:"Interface Segregation: Many small interfaces > one large interface. Don't force classes to implement methods they don't use.", highlightNodes:["isp"] },
        { title:"DIP", note:"Dependency Inversion: High-level modules depend on abstractions, not concretions. Inject dependencies via interfaces.", highlightNodes:["dip"] },
        { title:"All Together", note:"SOLID principles make codebases easy to extend, test, and maintain. Violating them leads to tightly coupled, fragile designs.", highlightNodes:["srp","ocp","lsp","isp","dip","solid"] },
      ]
    },
    content: {
      intro: "SOLID is the foundation of object-oriented design. Mastering these five principles separates junior from senior developers.",
      sections: [
        { type: "text", heading: "S — Single Responsibility", body: "A class should have only one reason to change. Separate concerns: <code>UserService</code> handles user logic, <code>EmailService</code> handles email — don't merge them." },
        { type: "text", heading: "O — Open/Closed", body: "Open for extension, closed for modification. Add behaviour through subclasses or composition, not by editing existing classes." },
        { type: "callout", style: "tip", heading: "DIP in Practice", body: "Instead of <code>new MySQLDatabase()</code> in your service, inject a <code>Database</code> interface. Swap MySQL for PostgreSQL without touching service code." },
        { type: "quiz", heading: "Quick Check", q: "Which principle says 'depend on abstractions, not concretions'?", opts: ["SRP","OCP","LSP","DIP"], ans: 3 },
      ]
    }
  },
  {
    id: 602, subject: "lld", title: "Creational Patterns", duration: "18 min", done: false,
    desc: "Factory, Builder, Singleton — how and when to use each",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"client",   label:"Client",        sublabel:"calls factory",     x:15, y:50, color:"var(--muted)" },
        { id:"factory",  label:"ShapeFactory",   sublabel:"createShape(type)", x:50, y:20, color:"var(--accent)" },
        { id:"circle",   label:"Circle",         sublabel:"draw()",           x:25, y:80, color:"var(--green)" },
        { id:"rect",     label:"Rectangle",      sublabel:"draw()",           x:50, y:80, color:"var(--yellow)" },
        { id:"triangle", label:"Triangle",       sublabel:"draw()",           x:75, y:80, color:"var(--orange)" },
      ],
      edges: [
        { from:"client", to:"factory", label:"createShape()" },
        { from:"factory", to:"circle",   label:"new", animated:true },
        { from:"factory", to:"rect",     label:"new", animated:true },
        { from:"factory", to:"triangle", label:"new", animated:true },
      ],
      steps: [
        { title:"Before Factory", note:"Client must know about Circle, Rectangle, Triangle — tightly coupled to concrete types.", highlightNodes:["client"] },
        { title:"Factory Pattern", note:"Client asks factory for a Shape. Factory decides which class to instantiate. Client is decoupled from concrete types.", highlightNodes:["factory"], highlightEdges:["client->factory"] },
        { title:"Factory creates product", note:"Factory returns a Shape. Client uses the interface — never `new Circle()` directly.", highlightNodes:["circle","rect","triangle"] },
      ]
    },
    content: {
      intro: "Creational patterns manage object creation in a flexible, decoupled way.",
      sections: [
        { type: "code", heading: "Factory Pattern", body: `class ShapeFactory {\npublic:\n    static Shape* create(string type) {\n        if (type=="circle") return new Circle();\n        if (type=="rect")   return new Rectangle();\n        return nullptr;\n    }\n};` },
        { type: "text", heading: "Singleton", body: "Ensures only one instance exists. Used for loggers, config managers. Implemented with a private constructor + static getInstance(). Thread-safety requires double-checked locking." },
        { type: "callout", style: "warn", heading: "Singleton Anti-Pattern", body: "Singleton introduces global state and makes testing hard. Prefer dependency injection — inject a single instance rather than using a global." },
        { type: "quiz", heading: "Quick Check", q: "Factory Pattern decouples client from:", opts: ["Interfaces","Concrete implementations","The database","Threading"], ans: 1 },
      ]
    }
  },
  {
    id: 603, subject: "lld", title: "Structural Patterns", duration: "16 min", done: false,
    desc: "Adapter, Decorator, Facade — composing objects and interfaces",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"client",  label:"Client",          sublabel:"uses Target",    x:15, y:50, color:"var(--muted)" },
        { id:"adapter", label:"Adapter",          sublabel:"wraps Adaptee",  x:50, y:50, color:"var(--accent)", highlight:true },
        { id:"adaptee", label:"LegacyService",    sublabel:"old interface",  x:85, y:50, color:"var(--red)" },
      ],
      edges: [
        { from:"client",  to:"adapter", label:"Target interface" },
        { from:"adapter", to:"adaptee", label:"translates call", animated:true },
      ],
      steps: [
        { title:"Problem", note:"Client expects a modern interface but only has LegacyService with an incompatible API.", highlightNodes:["client","adaptee"] },
        { title:"Adapter wraps legacy", note:"Adapter implements the Target interface and delegates to LegacyService internally. Client code unchanged.", highlightNodes:["adapter"], highlightEdges:["adapter->adaptee"] },
        { title:"Seamless Integration", note:"Client calls Target methods. Adapter translates to LegacyService calls. Zero changes to either end.", highlightNodes:["client","adapter","adaptee"] },
      ]
    },
    content: {
      intro: "Structural patterns compose objects and classes into larger structures while keeping them flexible and efficient.",
      sections: [
        { type: "text", heading: "Decorator Pattern", body: "Adds behaviour to an object at runtime without subclassing. Wrap object in a decorator that adds functionality: <code>new JSONLogger(new FileLogger())</code>." },
        { type: "text", heading: "Facade Pattern", body: "Provides a simplified interface to a complex subsystem. E.g., <code>Computer.start()</code> hides CPU.boot() + Memory.load() + OS.init()." },
        { type: "quiz", heading: "Quick Check", q: "The Adapter pattern's purpose is:", opts: ["Adding new methods","Making incompatible interfaces compatible","Hiding complexity","Caching results"], ans: 1 },
      ]
    }
  },
  {
    id: 604, subject: "lld", title: "Behavioural Patterns", duration: "16 min", done: false,
    desc: "Observer, Strategy, Command — communication between objects",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"subject", label:"EventEmitter",  sublabel:"publish(event)",   x:50, y:15, color:"var(--accent)" },
        { id:"obs1",    label:"Logger",        sublabel:"onEvent()",        x:20, y:70, color:"var(--green)" },
        { id:"obs2",    label:"Analytics",     sublabel:"onEvent()",        x:50, y:70, color:"var(--yellow)" },
        { id:"obs3",    label:"Notifier",      sublabel:"onEvent()",        x:80, y:70, color:"var(--orange)" },
      ],
      edges: [
        { from:"subject", to:"obs1", label:"notify", animated:true },
        { from:"subject", to:"obs2", label:"notify", animated:true },
        { from:"subject", to:"obs3", label:"notify", animated:true },
      ],
      steps: [
        { title:"Observer registered", note:"Logger, Analytics, Notifier subscribe to EventEmitter. Many observers, one publisher.", highlightNodes:["subject","obs1","obs2","obs3"] },
        { title:"Event fired", note:"subject.publish('userSignup') — all registered observers get notified automatically.", highlightEdges:["subject->obs1","subject->obs2","subject->obs3"] },
        { title:"Decoupled", note:"Publisher doesn't know about observers. Add new observers without touching publisher code — OCP satisfied.", highlightNodes:["obs3"] },
      ]
    },
    content: {
      intro: "Behavioural patterns define how objects communicate and distribute responsibility.",
      sections: [
        { type: "text", heading: "Strategy Pattern", body: "Defines a family of algorithms, encapsulates each, makes them interchangeable. E.g., <code>Sorter</code> can use <code>BubbleStrategy</code> or <code>QuickStrategy</code> — swap without rewriting Sorter." },
        { type: "text", heading: "Command Pattern", body: "Encapsulates a request as an object. Enables undo/redo, queuing, and logging. Each command implements <code>execute()</code> and <code>undo()</code>." },
        { type: "quiz", heading: "Quick Check", q: "Observer pattern is used for:", opts: ["Creating objects","One-to-many event notification","Adapting interfaces","Sorting"], ans: 1 },
      ]
    }
  },
  {
    id: 605, subject: "lld", title: "Design a Parking Lot", duration: "22 min", done: false,
    desc: "OOP design: classes, relationships, parking fee calculation",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"pl",    label:"ParkingLot",   sublabel:"floors, spots",    x:50, y:10, color:"var(--accent)" },
        { id:"floor", label:"ParkingFloor", sublabel:"rows of spots",    x:25, y:40, color:"var(--green)" },
        { id:"spot",  label:"ParkingSpot",  sublabel:"type, occupied",   x:25, y:75, color:"var(--yellow)" },
        { id:"ticket",label:"Ticket",       sublabel:"entry/exit time",  x:75, y:40, color:"var(--orange)" },
        { id:"fee",   label:"FeeCalculator",sublabel:"hourly/flat rate", x:75, y:75, color:"var(--purple)" },
      ],
      edges: [
        { from:"pl",     to:"floor",  label:"has many" },
        { from:"floor",  to:"spot",   label:"has many" },
        { from:"pl",     to:"ticket", label:"issues" },
        { from:"ticket", to:"fee",    label:"uses" },
      ],
      steps: [
        { title:"Identify entities", note:"ParkingLot, ParkingFloor, ParkingSpot, Ticket, Vehicle, FeeCalculator. Start with nouns.", highlightNodes:["pl","floor","spot","ticket","fee"] },
        { title:"Relationships", note:"ParkingLot has many ParkingFloors. Each floor has many ParkingSpots. Each spot is for one vehicle type.", highlightEdges:["pl->floor","floor->spot"] },
        { title:"Fee calculation", note:"On exit: Ticket calculates duration. FeeCalculator applies strategy (hourly vs flat). Strategy pattern enables pluggable pricing.", highlightEdges:["ticket->fee"] },
      ]
    },
    content: {
      intro: "The Parking Lot is the classic LLD interview question. Approach it by identifying entities, defining relationships, and then operations.",
      sections: [
        { type: "text", heading: "Design Steps", body: "1. List requirements. 2. Identify entities (nouns). 3. Define relationships (has-a, is-a). 4. Define operations (verbs). 5. Apply design patterns where appropriate." },
        { type: "code", heading: "Core Classes", body: `class ParkingSpot { SpotType type; bool occupied; Vehicle* v; };\nclass Ticket { time_point entryTime; ParkingSpot* spot; };\nclass ParkingLot {\n    vector<ParkingFloor> floors;\n    Ticket* issueTicket(Vehicle* v);\n    void processExit(Ticket* t);\n};` },
        { type: "quiz", heading: "Quick Check", q: "Which pattern handles variable pricing in parking?", opts: ["Singleton","Observer","Strategy","Decorator"], ans: 2 },
      ]
    }
  },
  {
    id: 606, subject: "lld", title: "Design an LRU Cache", duration: "20 min", done: false,
    desc: "HashMap + Doubly Linked List — O(1) get and put",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"hashmap", label:"HashMap",      sublabel:"key → node ptr",   x:20, y:50, color:"var(--yellow)" },
        { id:"head",    label:"HEAD",          sublabel:"(dummy)",          x:50, y:20, color:"var(--muted)" },
        { id:"mru",     label:"MRU Node",      sublabel:"most recent",      x:70, y:50, color:"var(--green)", highlight:true },
        { id:"lru",     label:"LRU Node",      sublabel:"evict next",       x:50, y:80, color:"var(--red)" },
        { id:"tail",    label:"TAIL",          sublabel:"(dummy)",          x:80, y:80, color:"var(--muted)" },
      ],
      edges: [
        { from:"hashmap", to:"mru",  label:"O(1) lookup" },
        { from:"head",    to:"mru",  label:"prev ←" },
        { from:"mru",     to:"lru",  label:"→ next" },
        { from:"lru",     to:"tail", label:"→ next" },
      ],
      steps: [
        { title:"Data Structure", note:"HashMap gives O(1) key lookup. Doubly linked list maintains access order — most recently used at front, LRU at back.", highlightNodes:["hashmap","head","tail"] },
        { title:"Cache Hit", note:"get(key): HashMap finds node in O(1). Move node to front (MRU position). Return value.", highlightNodes:["mru","hashmap"], highlightEdges:["hashmap->mru"] },
        { title:"Cache Full — Evict LRU", note:"put(key,val) when full: remove node from tail (LRU), delete from HashMap, insert new node at head (MRU).", highlightNodes:["lru"] },
      ]
    },
    content: {
      intro: "LRU Cache is one of the most common system design + LLD questions. The trick is combining a HashMap and a Doubly Linked List for O(1) get and put.",
      sections: [
        { type: "code", heading: "LRU Cache Interface", body: `class LRUCache {\n    int cap;\n    list<pair<int,int>> lst;  // {key,val}\n    unordered_map<int, list<pair<int,int>>::iterator> mp;\npublic:\n    int get(int key);\n    void put(int key, int val);\n};` },
        { type: "text", heading: "Operations", body: "<strong>get(key)</strong>: If in map, move to front, return val. Else return -1. <strong>put(key,val)</strong>: If exists, update+move to front. If full, evict LRU (back). Insert at front." },
        { type: "quiz", heading: "Quick Check", q: "LRU Cache uses HashMap + DLL for:", opts: ["O(n) get","O(1) get and put","O(log n) operations","Thread safety"], ans: 1 },
      ]
    }
  },
  {
    id: 607, subject: "lld", title: "Design a Movie Booking System", duration: "22 min", done: false,
    desc: "BookMyShow-style: theatres, shows, seats, booking flow",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"movie",   label:"Movie",    sublabel:"title, duration",   x:15, y:20, color:"var(--accent)" },
        { id:"theatre", label:"Theatre",  sublabel:"screens",           x:50, y:20, color:"var(--green)" },
        { id:"show",    label:"Show",     sublabel:"movie+screen+time", x:50, y:55, color:"var(--yellow)" },
        { id:"seat",    label:"Seat",     sublabel:"type, status",      x:80, y:80, color:"var(--orange)" },
        { id:"booking", label:"Booking",  sublabel:"user+seats+show",   x:20, y:80, color:"var(--purple)" },
      ],
      edges: [
        { from:"movie",   to:"show",    label:"scheduled in" },
        { from:"theatre", to:"show",    label:"hosts" },
        { from:"show",    to:"seat",    label:"has seats" },
        { from:"booking", to:"show",    label:"for show" },
        { from:"booking", to:"seat",    label:"reserves seats" },
      ],
      steps: [
        { title:"Entities", note:"Movie, Theatre, Screen, Show, Seat, Booking, User, Payment.", highlightNodes:["movie","theatre","show","seat","booking"] },
        { title:"Show = Movie × Screen × Time", note:"A Show is a scheduled screening. Same movie can have multiple shows. Each show has its own seat map.", highlightEdges:["movie->show","theatre->show"] },
        { title:"Booking flow", note:"User selects show → locks seats (for 10min) → pays → confirmed. Concurrency control prevents double-booking.", highlightNodes:["booking","seat"] },
      ]
    },
    content: {
      intro: "BookMyShow-style system requires careful modelling of entities, relationships, and concurrency for seat locking.",
      sections: [
        { type: "text", heading: "Seat Locking", body: "When user starts booking, seats are temporarily LOCKED (not BOOKED). After payment confirmation → BOOKED. If payment fails or times out → AVAILABLE again." },
        { type: "callout", style: "warn", heading: "Race Condition", body: "Two users booking the same seat simultaneously. Solution: optimistic locking (versioning) or pessimistic locking (SELECT FOR UPDATE in SQL)." },
        { type: "quiz", heading: "Quick Check", q: "Seat status transitions are:", opts: ["AVAILABLE → LOCKED → BOOKED","BOOKED → LOCKED → AVAILABLE","AVAILABLE → BOOKED","LOCKED → AVAILABLE"], ans: 0 },
      ]
    }
  },
  {
    id: 608, subject: "lld", title: "Design an Elevator System", duration: "20 min", done: false,
    desc: "Elevator scheduling, state machine, optimal dispatch",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"controller", label:"ElevatorController", sublabel:"dispatches requests", x:50, y:10, color:"var(--accent)" },
        { id:"e1",         label:"Elevator 1",          sublabel:"floor 3, IDLE",     x:20, y:55, color:"var(--green)", highlight:true },
        { id:"e2",         label:"Elevator 2",          sublabel:"floor 7, UP",       x:50, y:55, color:"var(--yellow)" },
        { id:"e3",         label:"Elevator 3",          sublabel:"floor 1, DOWN",     x:80, y:55, color:"var(--orange)" },
        { id:"req",        label:"Request Floor 5↑",    sublabel:"pending",           x:50, y:85, color:"var(--purple)" },
      ],
      edges: [
        { from:"controller", to:"e1", label:"dispatch" },
        { from:"controller", to:"e2", label:"monitor" },
        { from:"controller", to:"e3", label:"monitor" },
        { from:"req", to:"controller", label:"submit" },
      ],
      steps: [
        { title:"Request submitted", note:"User presses Floor 5 UP. Request submitted to ElevatorController.", highlightNodes:["req","controller"] },
        { title:"Controller dispatches", note:"Controller picks closest IDLE elevator (Elevator 1 at floor 3). Assigns request.", highlightNodes:["e1","controller"], highlightEdges:["controller->e1"] },
        { title:"Elevator state machine", note:"Elevator states: IDLE → MOVING_UP/DOWN → OPEN_DOOR → CLOSED_DOOR → IDLE. SCAN algorithm handles multiple requests efficiently.", highlightNodes:["e1"] },
      ]
    },
    content: {
      intro: "Elevator design tests your ability to model a state machine and an optimal dispatch algorithm.",
      sections: [
        { type: "text", heading: "SCAN Algorithm", body: "Like a disk scheduler: elevator travels in one direction, stops at each requested floor, then reverses. Minimises travel distance." },
        { type: "code", heading: "State Machine", body: `enum State { IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN };\nclass Elevator {\n    int floor;\n    State state;\n    queue<int> stops;\n    void move();\n    void openDoor();\n};` },
        { type: "quiz", heading: "Quick Check", q: "SCAN algorithm for elevator is similar to:", opts: ["Round robin","Disk scheduling","Merge sort","BFS"], ans: 1 },
      ]
    }
  },
];
