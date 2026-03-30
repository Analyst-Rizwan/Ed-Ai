import type { Lesson } from "@/data/learnData";

export const DBMS_LESSONS: Lesson[] = [
  {
    id: 501, subject: "dbms", title: "Normalisation", duration: "14 min", done: false,
    desc: "1NF, 2NF, 3NF, BCNF — eliminating redundancy and anomalies",
    vizType: "table",
    vizConfig: {
      steps: [
        {
          title: "Unnormalised Table",
          note: "Orders table violates 1NF — repeating groups in 'products' column. Causes update anomalies.",
          query: "-- Unnormalised: all data in one table",
          tables: [{ name:"Orders", columns:["OrderID","Customer","Products","City"],
            rows:[{ OrderID:1, Customer:"Alice", Products:"Mouse,Keyboard", City:"NY" },
                  { OrderID:2, Customer:"Bob",   Products:"Monitor",        City:"LA" }] }]
        },
        {
          title: "1NF — Atomic Values",
          note: "Split repeating 'products' into separate rows. Each cell has one atomic value.",
          query: "-- 1NF: one product per row",
          tables: [{ name:"Orders_1NF", columns:["OrderID","Customer","Product","City"],
            rows:[{ OrderID:1, Customer:"Alice", Product:"Mouse",    City:"NY" },
                  { OrderID:1, Customer:"Alice", Product:"Keyboard", City:"NY" },
                  { OrderID:2, Customer:"Bob",   Product:"Monitor",  City:"LA" }] }]
        },
        {
          title: "3NF — Separate Entities",
          note: "City depends on Customer, not OrderID — partial dependency. Move to Customers table. Now 3NF.",
          tables: [
            { name:"Orders_3NF", columns:["OrderID","CustomerID","Product"],
              rows:[{ OrderID:1, CustomerID:1, Product:"Mouse" },
                    { OrderID:1, CustomerID:1, Product:"Keyboard" },
                    { OrderID:2, CustomerID:2, Product:"Monitor" }] },
            { name:"Customers", columns:["CustomerID","Customer","City"],
              rows:[{ CustomerID:1, Customer:"Alice", City:"NY" },
                    { CustomerID:2, Customer:"Bob",   City:"LA" }] },
          ]
        },
      ]
    },
    content: {
      intro: "Normalisation reduces redundancy and prevents anomalies in relational databases. Follow normal forms to get a clean, maintainable schema.",
      sections: [
        { type: "text", heading: "Normal Forms Summary", body: "<strong>1NF</strong>: atomic values, no repeating groups. <strong>2NF</strong>: 1NF + no partial dependencies. <strong>3NF</strong>: 2NF + no transitive dependencies. <strong>BCNF</strong>: every determinant is a candidate key." },
        { type: "callout", style: "tip", heading: "When to Denormalise", body: "In read-heavy OLAP/analytics databases, intentional denormalisation (adding redundancy) improves query performance. Always normalise first, then denormalise with evidence." },
        { type: "quiz", heading: "Quick Check", q: "Transitive dependency is removed in:", opts: ["1NF","2NF","3NF","BCNF"], ans: 2 },
      ]
    }
  },
  {
    id: 502, subject: "dbms", title: "SQL Joins", duration: "15 min", done: false,
    desc: "INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF joins with visual examples",
    vizType: "table",
    vizConfig: {
      steps: [
        {
          title: "Source Tables",
          note: "Employees and Departments tables. emp_id 3 has no department (dept_id=NULL). Dept 'HR' has no employees.",
          tables: [
            { name:"Employees", columns:["emp_id","name","dept_id"],
              rows:[{ emp_id:1, name:"Alice", dept_id:10 },{ emp_id:2, name:"Bob", dept_id:20 },{ emp_id:3, name:"Carol", dept_id:"NULL" }] },
            { name:"Departments", columns:["dept_id","dept_name"],
              rows:[{ dept_id:10, dept_name:"Engineering" },{ dept_id:20, dept_name:"Marketing" },{ dept_id:30, dept_name:"HR" }] },
          ]
        },
        {
          title: "INNER JOIN",
          note: "INNER JOIN: only rows with matching dept_id in both tables. Carol and HR excluded.",
          query: "SELECT e.name, d.dept_name\nFROM Employees e\nINNER JOIN Departments d ON e.dept_id = d.dept_id;",
          tables: [],
          resultTable: { name:"INNER JOIN Result", columns:["name","dept_name"],
            rows:[{ name:"Alice", dept_name:"Engineering" },{ name:"Bob", dept_name:"Marketing" }] }
        },
        {
          title: "LEFT JOIN",
          note: "LEFT JOIN: all employees, even Carol with NULL dept. HR department excluded (no employees).",
          query: "SELECT e.name, d.dept_name\nFROM Employees e\nLEFT JOIN Departments d ON e.dept_id = d.dept_id;",
          tables: [],
          resultTable: { name:"LEFT JOIN Result", columns:["name","dept_name"],
            rows:[{ name:"Alice", dept_name:"Engineering" },{ name:"Bob", dept_name:"Marketing" },{ name:"Carol", dept_name:"NULL" }] }
        },
      ]
    },
    content: {
      intro: "SQL JOINs combine rows from two or more tables. Knowing which join to use is one of the most important SQL skills.",
      sections: [
        { type: "text", heading: "Join Types", body: "<strong>INNER</strong>: matching rows only. <strong>LEFT</strong>: all left + matching right (nulls for no match). <strong>RIGHT</strong>: all right + matching left. <strong>FULL OUTER</strong>: all rows from both. <strong>CROSS</strong>: cartesian product." },
        { type: "quiz", heading: "Quick Check", q: "LEFT JOIN returns:", opts: ["Only matching rows","All left rows + matching right","All right rows + matching left","All rows from both"], ans: 1 },
      ]
    }
  },
  {
    id: 503, subject: "dbms", title: "ACID Transactions", duration: "13 min", done: false,
    desc: "Atomicity, Consistency, Isolation, Durability — with bank transfer example",
    vizType: "table",
    vizConfig: {
      steps: [
        {
          title: "Before Transfer",
          note: "Alice has $500, Bob has $300. Total = $800.",
          tables: [{ name:"Accounts", columns:["id","name","balance"],
            rows:[{ id:1, name:"Alice", balance:500 },{ id:2, name:"Bob", balance:300 }] }]
        },
        {
          title: "Mid-Transaction",
          note: "Debit Alice $200. If crash happens now — money disappeared! ACID Atomicity prevents this.",
          query: "BEGIN;\nUPDATE accounts SET balance = balance - 200 WHERE id=1;  -- CRASH?",
          tables: [{ name:"Accounts (mid-txn)", columns:["id","name","balance"],
            rows:[{ id:1, name:"Alice", balance:300 },{ id:2, name:"Bob", balance:300 }] }],
          highlightRows:[{ table:"Accounts (mid-txn)", rowIndex:0 }]
        },
        {
          title: "Committed Transaction",
          note: "Both debit and credit committed atomically. Total = $800 preserved (Consistency). Durability: survives crash.",
          query: "BEGIN;\nUPDATE accounts SET balance=balance-200 WHERE id=1;\nUPDATE accounts SET balance=balance+200 WHERE id=2;\nCOMMIT;",
          tables: [{ name:"Accounts (committed)", columns:["id","name","balance"],
            rows:[{ id:1, name:"Alice", balance:300 },{ id:2, name:"Bob", balance:500 }] }]
        },
      ]
    },
    content: {
      intro: "ACID properties guarantee database transactions are processed reliably even in the face of errors and system crashes.",
      sections: [
        { type: "text", heading: "The Four Properties", body: "<strong>Atomicity</strong>: all or nothing. <strong>Consistency</strong>: transaction brings DB from one valid state to another. <strong>Isolation</strong>: concurrent transactions don't interfere. <strong>Durability</strong>: committed data survives crashes." },
        { type: "quiz", heading: "Quick Check", q: "Atomicity means a transaction is:", opts: ["Fast","All-or-nothing","Read-only","Isolated from others"], ans: 1 },
      ]
    }
  },
  {
    id: 504, subject: "dbms", title: "Indexing — B-Tree & Hash", duration: "15 min", done: false,
    desc: "How indexes work, B-tree structure, index on reads vs write cost",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"root", label:"Root: [40]",          sublabel:"B-Tree root node", x:50, y:10, color:"var(--accent)" },
        { id:"l1",   label:"[10,20,30]",           sublabel:"left subtree",     x:25, y:45, color:"var(--green)" },
        { id:"l2",   label:"[50,60,70]",           sublabel:"right subtree",    x:75, y:45, color:"var(--yellow)" },
        { id:"l3",   label:"[10,15,20]",           sublabel:"leaf: actual rows", x:15, y:80, color:"var(--muted)" },
        { id:"l4",   label:"[25,30,35]",           sublabel:"leaf: actual rows", x:40, y:80, color:"var(--muted)" },
        { id:"l5",   label:"[50,55,60]",           sublabel:"leaf: actual rows", x:65, y:80, color:"var(--muted)" },
        { id:"query",label:"WHERE id=55 → O(log n)", sublabel:"3 comparisons",  x:85, y:80, color:"var(--purple)", highlight:true },
      ],
      edges: [
        { from:"root", to:"l1" }, { from:"root", to:"l2" },
        { from:"l1",   to:"l3" }, { from:"l1",   to:"l4" },
        { from:"l2",   to:"l5" }, { from:"l2",   to:"query" },
      ],
      steps: [
        { title:"Full table scan", note:"Without index: SELECT * WHERE id=55 scans ALL rows. O(n) — slow on large tables.", highlightNodes:["root"] },
        { title:"B-Tree traversal", note:"With index: start at root, 55>40 → go right. 55<70 → go left subtree. Reach leaf in O(log n).", highlightEdges:["root->l2","l2->l5"] },
        { title:"Found in 3 comparisons", note:"B-tree of 1M rows → 20 comparisons max. vs 1M comparisons with full scan.", highlightNodes:["query"] },
      ]
    },
    content: {
      intro: "Indexes are the most impactful performance optimisation. Understanding B-trees explains why ranges work but LIKE '%value' doesn't use an index.",
      sections: [
        { type: "text", heading: "When to Index", body: "Index columns in WHERE, JOIN ON, ORDER BY. Don't index columns with low cardinality (boolean), columns rarely queried, or on small tables. Every index slows writes." },
        { type: "callout", style: "warn", heading: "Index Misses", body: "B-tree index won't be used for: LIKE '%value%', full-table aggregate without WHERE, or function on indexed column: WHERE YEAR(created_at)=2024." },
        { type: "quiz", heading: "Quick Check", q: "B-tree index gives query complexity:", opts: ["O(1)","O(log n)","O(n)","O(n²)"], ans: 1 },
      ]
    }
  },
  {
    id: 505, subject: "dbms", title: "Views & Stored Procedures", duration: "12 min", done: false,
    desc: "Creating views, materialized views, stored procedures, triggers",
    vizType: "table",
    vizConfig: {
      steps: [
        { title:"Base tables", note:"Orders and Customers used in many queries. Repeating JOIN logic everywhere is error-prone.",
          tables: [
            { name:"Orders",    columns:["order_id","cust_id","total"],   rows:[{ order_id:1, cust_id:1, total:150 },{ order_id:2, cust_id:2, total:200 }] },
            { name:"Customers", columns:["cust_id","name"],               rows:[{ cust_id:1, name:"Alice" },{ cust_id:2, name:"Bob" }] },
          ]
        },
        { title:"View created", note:"CREATE VIEW order_summary AS SELECT... — encapsulate the JOIN. Query the view like a table.",
          query: "CREATE VIEW order_summary AS\nSELECT c.name, o.total\nFROM Orders o JOIN Customers c USING (cust_id);",
          tables: [],
          resultTable: { name:"order_summary (view)", columns:["name","total"], rows:[{ name:"Alice", total:150 },{ name:"Bob", total:200 }] }
        },
        { title:"Query the view", note:"SELECT * FROM order_summary — the DB executes underlying JOIN transparently. No code duplication.",
          query: "SELECT * FROM order_summary\nWHERE total > 100;",
          tables: [],
          resultTable: { name:"Result", columns:["name","total"], rows:[{ name:"Alice", total:150 },{ name:"Bob", total:200 }] }
        },
      ]
    },
    content: {
      intro: "Views are saved queries that behave like tables. They encapsulate complex logic and provide a security layer.",
      sections: [
        { type: "text", heading: "Materialized Views", body: "Regular views run their query every access. Materialized views store the result physically — fast reads but must be refreshed when base data changes. Great for expensive analytics queries." },
        { type: "quiz", heading: "Quick Check", q: "A view in SQL is:", opts: ["A physical copy of data","A saved query that acts like a table","An index","A temporary table"], ans: 1 },
      ]
    }
  },
  {
    id: 506, subject: "dbms", title: "Query Optimisation & EXPLAIN", duration: "14 min", done: false,
    desc: "Query planner, EXPLAIN ANALYZE, index scans vs seq scans, joins",
    vizType: "table",
    vizConfig: {
      steps: [
        { title:"Slow query", note:"SELECT * FROM orders WHERE customer_name = 'Alice' — full scan on 1M rows without index.",
          query: "EXPLAIN SELECT * FROM orders\nWHERE customer_name = 'Alice';",
          tables: [{ name:"EXPLAIN Output", columns:["Plan","Cost","Rows"],
            rows:[{ Plan:"Seq Scan on orders", Cost:"0..15420", Rows:"1000000" }] }]
        },
        { title:"After adding index", note:"CREATE INDEX ON orders(customer_name). Now planner uses Index Scan — O(log n).",
          query: "CREATE INDEX idx_cust ON orders(customer_name);\nEXPLAIN SELECT * FROM orders WHERE customer_name='Alice';",
          tables: [{ name:"EXPLAIN Output", columns:["Plan","Cost","Rows"],
            rows:[{ Plan:"Index Scan on orders", Cost:"0..8.32", Rows:"5" }] }],
          highlightRows:[{ table:"EXPLAIN Output", rowIndex:0 }]
        },
      ]
    },
    content: {
      intro: "EXPLAIN shows you what the query planner will do. It's the single most important tool for diagnosing slow queries.",
      sections: [
        { type: "code", heading: "Reading EXPLAIN", body: `EXPLAIN ANALYZE SELECT *\nFROM orders\nWHERE customer_id = 42;\n-- Seq Scan / Index Scan\n-- cost=start..total rows=estimate width=bytes\n-- actual time=start..end rows=actual loops=1` },
        { type: "callout", style: "tip", heading: "EXPLAIN ANALYZE", body: "EXPLAIN shows the plan. EXPLAIN ANALYZE actually runs the query and shows real timings. Use ANALYZE to catch planner cost estimate errors." },
        { type: "quiz", heading: "Quick Check", q: "Seq Scan means:", opts: ["Index was used","All rows were scanned","A subquery was used","Statistics were updated"], ans: 1 },
      ]
    }
  },
  {
    id: 507, subject: "dbms", title: "Concurrency Control", duration: "14 min", done: false,
    desc: "Isolation levels, dirty reads, phantom reads, MVCC, locking",
    vizType: "table",
    vizConfig: {
      steps: [
        { title:"Dirty Read Problem", note:"Transaction 1 reads uncommitted data from Transaction 2. If T2 rolls back, T1 has phantom data.",
          tables: [{ name:"Timeline", columns:["Time","T1","T2","Balance"],
            rows:[{ Time:"t1", T1:"BEGIN", T2:"BEGIN", Balance:100 },
                  { Time:"t2", T1:"—", T2:"UPDATE bal=0", Balance:"0 (uncommitted)" },
                  { Time:"t3", T1:"READ bal=0 ⚠️", T2:"ROLLBACK", Balance:100 }] },
          ], highlightRows:[{ table:"Timeline", rowIndex:2 }]
        },
        { title:"READ COMMITTED fixes dirty reads", note:"READ COMMITTED isolation: T1 only sees committed data. Most DBs use this as default.",
          tables: [{ name:"Isolation Levels vs Anomalies", columns:["Level","Dirty Read","Non-Repeatable","Phantom"],
            rows:[
              { Level:"READ UNCOMMITTED", "Dirty Read":"✅ YES", "Non-Repeatable":"YES", Phantom:"YES" },
              { Level:"READ COMMITTED",   "Dirty Read":"❌ NO",  "Non-Repeatable":"YES", Phantom:"YES" },
              { Level:"REPEATABLE READ",  "Dirty Read":"❌ NO",  "Non-Repeatable":"NO",  Phantom:"YES" },
              { Level:"SERIALIZABLE",     "Dirty Read":"❌ NO",  "Non-Repeatable":"NO",  Phantom:"NO"  },
            ] }
          ], highlightRows:[{ table:"Isolation Levels vs Anomalies", rowIndex:1 }]
        },
      ]
    },
    content: {
      intro: "Concurrent transactions can interfere with each other. Isolation levels trade consistency for performance.",
      sections: [
        { type: "text", heading: "MVCC", body: "PostgreSQL and MySQL InnoDB use MVCC (Multi-Version Concurrency Control). Readers see a snapshot from transaction start — no read locks needed. Writers create new versions." },
        { type: "quiz", heading: "Quick Check", q: "READ COMMITTED prevents:", opts: ["Phantom reads","Non-repeatable reads","Dirty reads","Deadlocks"], ans: 2 },
      ]
    }
  },
  {
    id: 508, subject: "dbms", title: "NoSQL Concepts", duration: "13 min", done: false,
    desc: "Document, Key-Value, Columnar, Graph DBs — CAP theorem trade-offs",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"sql",    label:"SQL (RDBMS)",     sublabel:"ACID, joins, schema",    x:50, y:10, color:"var(--accent)" },
        { id:"kv",     label:"Key-Value",        sublabel:"Redis, DynamoDB",        x:15, y:60, color:"var(--green)" },
        { id:"doc",    label:"Document",         sublabel:"MongoDB, Firestore",     x:38, y:60, color:"var(--yellow)" },
        { id:"col",    label:"Columnar",         sublabel:"Cassandra, HBase",       x:62, y:60, color:"var(--orange)" },
        { id:"graph",  label:"Graph",            sublabel:"Neo4j, Amazon Neptune",  x:85, y:60, color:"var(--purple)" },
        { id:"usecase",label:"Right tool for right job", sublabel:"", x:50, y:90, color:"var(--muted)", highlight:true },
      ],
      edges: [
        { from:"sql", to:"kv",  label:"vs", dashed:true },
        { from:"sql", to:"doc", label:"vs", dashed:true },
        { from:"sql", to:"col", label:"vs", dashed:true },
        { from:"sql", to:"graph", label:"vs", dashed:true },
        { from:"kv",  to:"usecase" }, { from:"doc", to:"usecase" },
        { from:"col", to:"usecase" }, { from:"graph", to:"usecase" },
      ],
      steps: [
        { title:"Key-Value stores", note:"Redis, DynamoDB: O(1) get by key. No queries, no joins. Best for: sessions, caching, rate limiting, leaderboards.", highlightNodes:["kv"] },
        { title:"Document stores", note:"MongoDB: flexible JSON/BSON docs. No rigid schema — evolve model easily. Best for: catalogs, user profiles, CMS.", highlightNodes:["doc"] },
        { title:"Columnar stores", note:"Cassandra: wide rows, partitioned by key. Optimised for time-series, write-heavy. Best for: IoT, logs, analytics.", highlightNodes:["col"] },
        { title:"Graph DBs", note:"Neo4j: nodes + edges + properties. Best for: social networks, recommendation, fraud detection (many relationship traversals).", highlightNodes:["graph"] },
      ]
    },
    content: {
      intro: "NoSQL databases sacrifice SQL's generality for scalability, flexibility, or specialised access patterns. Each type is optimised for different use cases.",
      sections: [
        { type: "callout", style: "info", heading: "CAP Theorem", body: "Consistency, Availability, Partition Tolerance — pick 2. Cassandra: AP (available + partition tolerant, eventual consistency). MongoDB: CP (consistent + partition tolerant, lower availability)." },
        { type: "quiz", heading: "Quick Check", q: "MongoDB is best described as a:", opts: ["Key-value store","Document store","Graph database","Columnar store"], ans: 1 },
      ]
    }
  },
  {
    id: 509, subject: "dbms", title: "ER Diagrams & Schema Design", duration: "14 min", done: false,
    desc: "Entities, attributes, relationships, cardinality, primary and foreign keys",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"student",  label:"Student",      sublabel:"PK: student_id\nname, email",      x:15, y:50, color:"var(--accent)" },
        { id:"enroll",   label:"Enrollment",   sublabel:"PK: (student_id,course_id)\ngrade", x:50, y:50, color:"var(--yellow)", shape:"diamond" },
        { id:"course",   label:"Course",        sublabel:"PK: course_id\ntitle, credits",   x:85, y:50, color:"var(--green)" },
        { id:"dept",     label:"Department",    sublabel:"PK: dept_id\nname",               x:85, y:20, color:"var(--orange)" },
      ],
      edges: [
        { from:"student", to:"enroll", label:"enrolls (M)" },
        { from:"course",  to:"enroll", label:"(N) has" },
        { from:"course",  to:"dept",   label:"belongs to (1)" },
      ],
      steps: [
        { title:"Entities", note:"Rectangles = entities. Ovals = attributes. Student, Course, Department are entities.", highlightNodes:["student","course","dept"] },
        { title:"Many-to-Many relationship", note:"A student enrolls in many courses. A course has many students. M:N requires a junction table (Enrollment) with composite PK.", highlightNodes:["enroll"], highlightEdges:["student->enroll","course->enroll"] },
        { title:"One-to-Many", note:"A department has many courses. A course belongs to one department. dept_id is a FK in Course table.", highlightEdges:["course->dept"] },
      ]
    },
    content: {
      intro: "ER diagrams are the blueprint for relational database design. Get the schema right before writing a single SQL statement.",
      sections: [
        { type: "text", heading: "Cardinality Notation", body: "1:1 — one student has one ID card. 1:N — one department has many courses. M:N — students and courses (requires junction table)." },
        { type: "quiz", heading: "Quick Check", q: "A M:N relationship in relational DB requires:", opts: ["Two tables","A junction/bridge table","A view","An index"], ans: 1 },
      ]
    }
  },
  {
    id: 510, subject: "dbms", title: "DB Replication & Sharding", duration: "15 min", done: false,
    desc: "Master-replica, synchronous vs async replication, horizontal sharding",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"primary",  label:"Primary DB",   sublabel:"all writes go here",   x:50, y:10, color:"var(--accent)" },
        { id:"r1",       label:"Replica 1",    sublabel:"read traffic",         x:20, y:60, color:"var(--green)" },
        { id:"r2",       label:"Replica 2",    sublabel:"read traffic",         x:50, y:60, color:"var(--green)" },
        { id:"r3",       label:"Replica 3",    sublabel:"failover candidate",   x:80, y:60, color:"var(--yellow)" },
      ],
      edges: [
        { from:"primary", to:"r1", label:"replicate", animated:true },
        { from:"primary", to:"r2", label:"replicate", animated:true },
        { from:"primary", to:"r3", label:"replicate", animated:true },
      ],
      steps: [
        { title:"Primary-Replica setup", note:"All writes go to Primary. Primary replicates to Replicas. Reads distributed across replicas — 3× read throughput.", highlightNodes:["primary"] },
        { title:"Async replication lag", note:"Async replication: Primary doesn't wait for replicas. Fast writes, but brief lag — read from replica may see stale data.", highlightEdges:["primary->r1","primary->r2"] },
        { title:"Failover", note:"If Primary fails, one Replica is promoted to Primary. Automatic failover (with tools like Patroni) minimises downtime.", highlightNodes:["r3"] },
      ]
    },
    content: {
      intro: "Replication increases read throughput and availability. Sharding increases write throughput and allows horizontal scaling beyond a single machine.",
      sections: [
        { type: "text", heading: "Read Replicas", body: "Route 80%+ of traffic (reads) to replicas. Primary handles writes only. Reduces primary load dramatically." },
        { type: "callout", style: "warn", heading: "Replication Lag", body: "With async replication, replica may be milliseconds behind primary. Don't read from replica immediately after a write if you need to see the write (read-your-writes consistency)." },
        { type: "quiz", heading: "Quick Check", q: "Read replicas primarily help with:", opts: ["Write throughput","Read throughput","Backup","Schema migrations"], ans: 1 },
      ]
    }
  },
  {
    id: 511, subject: "dbms", title: "CAP Theorem Deep Dive", duration: "13 min", done: false,
    desc: "Consistency vs Availability vs Partition Tolerance trade-offs",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"c",   label:"Consistency",        sublabel:"every read sees latest write", x:50, y:10, color:"var(--accent)" },
        { id:"a",   label:"Availability",        sublabel:"every request gets response",  x:15, y:80, color:"var(--green)" },
        { id:"p",   label:"Partition Tolerance", sublabel:"works despite network split",  x:85, y:80, color:"var(--yellow)" },
        { id:"cp",  label:"CP Systems",          sublabel:"MongoDB, Zookeeper, HBase",   x:30, y:45, color:"var(--purple)" },
        { id:"ap",  label:"AP Systems",          sublabel:"Cassandra, CouchDB, DynamoDB",x:70, y:45, color:"var(--orange)" },
      ],
      edges: [
        { from:"c", to:"cp" }, { from:"p", to:"cp" },
        { from:"a", to:"ap" }, { from:"p", to:"ap" },
      ],
      steps: [
        { title:"The impossibility", note:"In a distributed system, network partitions WILL happen. So you can't avoid P — you must choose between C and A when a partition occurs.", highlightNodes:["p"] },
        { title:"CP: Choose consistency", note:"During partition, CP systems reject requests to avoid serving stale data. Banks, inventory systems — wrong data is worse than unavailability.", highlightNodes:["cp","c"] },
        { title:"AP: Choose availability", note:"During partition, AP systems continue serving (possibly stale) data. Social feeds, DNS, shopping carts — stale data is acceptable.", highlightNodes:["ap","a"] },
      ]
    },
    content: {
      intro: "CAP theorem is the theoretical foundation for choosing distributed databases. Every distributed data store makes a CAP trade-off.",
      sections: [
        { type: "callout", style: "info", heading: "PACELC Extension", body: "PACELC extends CAP: even without partitions, there's a latency vs consistency trade-off. Provides a more nuanced model for real-world DB selection." },
        { type: "quiz", heading: "Quick Check", q: "Cassandra chooses to be:", opts: ["CP (Consistent + Partition Tolerant)","AP (Available + Partition Tolerant)","CA (no partition tolerance)","Fully consistent"], ans: 1 },
      ]
    }
  },
  {
    id: 512, subject: "dbms", title: "Window Functions", duration: "14 min", done: false,
    desc: "ROW_NUMBER, RANK, LAG/LEAD, SUM OVER PARTITION BY",
    vizType: "table",
    vizConfig: {
      steps: [
        { title:"Source Data", note:"Sales by employee and month. We want to rank employees by sales within each department.",
          tables: [{ name:"Sales", columns:["emp","dept","month","amount"],
            rows:[{ emp:"Alice", dept:"Eng", month:"Jan", amount:1000 },
                  { emp:"Bob",   dept:"Eng", month:"Jan", amount:1500 },
                  { emp:"Carol", dept:"HR",  month:"Jan", amount:800  },
                  { emp:"Dave",  dept:"HR",  month:"Jan", amount:900  }] }]
        },
        { title:"RANK() OVER PARTITION BY dept", note:"RANK() assigns rank within each department partition. Alice=2 in Eng (Bob=1). Carol=2 in HR (Dave=1).",
          query: "SELECT emp, dept, amount,\n  RANK() OVER (\n    PARTITION BY dept\n    ORDER BY amount DESC\n  ) AS dept_rank\nFROM Sales;",
          tables: [],
          resultTable: { name:"Result", columns:["emp","dept","amount","dept_rank"],
            rows:[{ emp:"Bob",   dept:"Eng", amount:1500, dept_rank:1 },
                  { emp:"Alice", dept:"Eng", amount:1000, dept_rank:2 },
                  { emp:"Dave",  dept:"HR",  amount:900,  dept_rank:1 },
                  { emp:"Carol", dept:"HR",  amount:800,  dept_rank:2 }] },
          highlightRows:[{ table:"Result", rowIndex:0 },{ table:"Result", rowIndex:2 }]
        },
      ]
    },
    content: {
      intro: "Window functions are one of SQL's most powerful features for analytical queries. They operate on a sliding window of rows without collapsing them like GROUP BY.",
      sections: [
        { type: "text", heading: "Key Window Functions", body: "<strong>ROW_NUMBER()</strong>: unique sequential number. <strong>RANK()</strong>: same value = same rank, gaps. <strong>DENSE_RANK()</strong>: same value = same rank, no gaps. <strong>LAG/LEAD</strong>: access previous/next row value." },
        { type: "code", heading: "Running Total", body: `SELECT month, amount,\n    SUM(amount) OVER (\n        ORDER BY month\n        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n    ) AS running_total\nFROM Sales;` },
        { type: "quiz", heading: "Quick Check", q: "PARTITION BY in window functions:", opts: ["Joins two tables","Groups rows for aggregation without collapsing","Creates a new table","Adds an index"], ans: 1 },
      ]
    }
  },
];
