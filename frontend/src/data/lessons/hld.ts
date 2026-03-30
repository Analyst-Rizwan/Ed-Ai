import type { Lesson } from "@/data/learnData";

export const HLD_LESSONS: Lesson[] = [
  {
    id: 701, subject: "hld", title: "System Design Fundamentals", duration: "16 min", done: false,
    desc: "Scalability, reliability, availability, latency, throughput",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"req",  label:"Requirements",    sublabel:"Functional + Non-func", x:50, y:10, color:"var(--accent)" },
        { id:"cap",  label:"Capacity Est.",   sublabel:"QPS, storage, bandwidth", x:20, y:40, color:"var(--green)" },
        { id:"api",  label:"API Design",      sublabel:"REST / GraphQL / gRPC",   x:80, y:40, color:"var(--yellow)" },
        { id:"db",   label:"DB Schema",       sublabel:"SQL vs NoSQL",            x:20, y:80, color:"var(--purple)" },
        { id:"hld",  label:"HLD Diagram",     sublabel:"Components + interactions", x:80, y:80, color:"var(--orange)" },
      ],
      edges: [
        { from:"req", to:"cap" }, { from:"req", to:"api" },
        { from:"cap", to:"db" }, { from:"api", to:"hld" }, { from:"db", to:"hld" },
      ],
      steps: [
        { title:"Start with requirements", note:"Clarify functional requirements (what the system does) and non-functional (scale, latency, availability).", highlightNodes:["req"] },
        { title:"Capacity estimation", note:"Estimate: QPS = users × actions/day ÷ 86400. Storage = records × record_size. Bandwidth = QPS × payload.", highlightNodes:["cap"] },
        { title:"Design components", note:"API gateway, load balancer, app servers, cache, DB, CDN. Draw the flow from client to data.", highlightNodes:["api","db","hld"] },
      ]
    },
    content: {
      intro: "System design interviews test your ability to design large-scale systems. The process is as important as the output.",
      sections: [
        { type: "text", heading: "Key Non-Functional Requirements", body: "<strong>Availability</strong>: 99.99% = 52min downtime/year. <strong>Latency</strong>: p99 response time. <strong>Consistency</strong>: eventual vs strong. <strong>Scalability</strong>: vertical (bigger server) vs horizontal (more servers)." },
        { type: "callout", style: "tip", heading: "CAP Theorem", body: "A distributed system can guarantee at most 2 of: Consistency, Availability, Partition Tolerance. Networks partition — so choose between CP (bank) or AP (social feed)." },
        { type: "quiz", heading: "Quick Check", q: "Horizontal scaling means:", opts: ["Bigger CPU","More servers","Faster disk","More RAM"], ans: 1 },
      ]
    }
  },
  {
    id: 702, subject: "hld", title: "Load Balancing & Reverse Proxy", duration: "15 min", done: false,
    desc: "Round robin, least connections, consistent hashing, Nginx",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"client", label:"Clients",      sublabel:"millions of users", x:15, y:50, color:"var(--muted)" },
        { id:"lb",     label:"Load Balancer",sublabel:"Nginx / HAProxy",   x:50, y:50, color:"var(--accent)", highlight:true },
        { id:"s1",     label:"Server 1",     sublabel:"handling 1000 req", x:80, y:20, color:"var(--green)" },
        { id:"s2",     label:"Server 2",     sublabel:"handling 1000 req", x:80, y:50, color:"var(--green)" },
        { id:"s3",     label:"Server 3",     sublabel:"handling 1000 req", x:80, y:80, color:"var(--green)" },
      ],
      edges: [
        { from:"client", to:"lb", label:"all traffic" },
        { from:"lb", to:"s1", label:"round robin", animated:true },
        { from:"lb", to:"s2", label:"round robin", animated:true },
        { from:"lb", to:"s3", label:"round robin", animated:true },
      ],
      steps: [
        { title:"All traffic hits LB", note:"Single entry point. Load balancer distributes to healthy servers behind it. Clients only see one IP.", highlightNodes:["client","lb"] },
        { title:"Round Robin distribution", note:"Requests go to S1, S2, S3, S1, S2... in order. Equal distribution for uniform workloads.", highlightEdges:["lb->s1","lb->s2","lb->s3"] },
        { title:"Health checking", note:"LB pings servers every N seconds. Removes unhealthy servers. Adds them back when healthy — zero downtime deployments.", highlightNodes:["s2"] },
      ]
    },
    content: {
      intro: "Load balancers distribute traffic across servers, preventing any single server from being overwhelmed and enabling horizontal scaling.",
      sections: [
        { type: "text", heading: "Algorithms", body: "<strong>Round Robin</strong>: sequential distribution. <strong>Least Connections</strong>: send to server with fewest active connections. <strong>Consistent Hashing</strong>: same client → same server (session affinity)." },
        { type: "callout", style: "info", heading: "Layer 4 vs Layer 7", body: "L4 LB routes by IP/port (faster). L7 LB routes by HTTP headers/URL (smarter — can route /api to one farm and /static to CDN)." },
        { type: "quiz", heading: "Quick Check", q: "Consistent hashing is used for:", opts: ["Sorting requests","Session affinity / cache sharding","DNS resolution","SSL termination"], ans: 1 },
      ]
    }
  },
  {
    id: 703, subject: "hld", title: "Caching Strategies", duration: "16 min", done: false,
    desc: "Redis, CDN, cache-aside, write-through, cache invalidation",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"client", label:"Client",    sublabel:"request",         x:10, y:50, color:"var(--muted)" },
        { id:"app",    label:"App Server",sublabel:"checks cache",    x:40, y:50, color:"var(--accent)" },
        { id:"cache",  label:"Redis Cache",sublabel:"TTL: 300s",      x:70, y:25, color:"var(--yellow)", highlight:true },
        { id:"db",     label:"Database",  sublabel:"source of truth", x:70, y:75, color:"var(--purple)" },
      ],
      edges: [
        { from:"client", to:"app",   label:"GET /user/1" },
        { from:"app",    to:"cache", label:"cache lookup", animated:true },
        { from:"app",    to:"db",    label:"cache miss → DB", dashed:true },
        { from:"db",     to:"cache", label:"populate cache", dashed:true },
      ],
      steps: [
        { title:"Cache hit", note:"App checks Redis first. If key exists → return immediately. 1ms vs 10ms for DB. 10× faster.", highlightNodes:["cache"], highlightEdges:["app->cache"] },
        { title:"Cache miss", note:"Key not in cache. App queries DB (slow). Stores result in cache with TTL. Next request is a hit.", highlightEdges:["app->db","db->cache"] },
        { title:"Cache invalidation", note:"On data update: either delete the cache key (lazy invalidation) or update it immediately (eager). Invalidation is the hardest part.", highlightNodes:["cache","db"] },
      ]
    },
    content: {
      intro: "Caching is the single most impactful optimisation in distributed systems. A well-placed cache can reduce DB load by 90%.",
      sections: [
        { type: "text", heading: "Cache Patterns", body: "<strong>Cache-Aside (Lazy)</strong>: app checks cache first, populates on miss. <strong>Write-Through</strong>: write to cache and DB together. <strong>Write-Behind</strong>: write to cache, async flush to DB." },
        { type: "callout", style: "warn", heading: "Cache Stampede", body: "Many requests miss cache simultaneously (after expiry) and all hit the DB at once. Fix: lock-based refresh, probabilistic early expiry, or cache warming." },
        { type: "quiz", heading: "Quick Check", q: "Cache-aside means:", opts: ["DB updates cache","App updates both","App checks cache, populates on miss","Cache is always ahead of DB"], ans: 2 },
      ]
    }
  },
  {
    id: 704, subject: "hld", title: "Database Sharding", duration: "17 min", done: false,
    desc: "Horizontal partitioning, shard key, consistent hashing, hot shards",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"router", label:"Query Router",  sublabel:"routes by shard key", x:50, y:10, color:"var(--accent)" },
        { id:"s1",     label:"Shard 1",       sublabel:"users A–H",           x:20, y:60, color:"var(--green)" },
        { id:"s2",     label:"Shard 2",       sublabel:"users I–P",           x:50, y:60, color:"var(--yellow)" },
        { id:"s3",     label:"Shard 3",       sublabel:"users Q–Z",           x:80, y:60, color:"var(--orange)" },
      ],
      edges: [
        { from:"router", to:"s1", label:"user_id % 3 = 0", animated:true },
        { from:"router", to:"s2", label:"user_id % 3 = 1", animated:true },
        { from:"router", to:"s3", label:"user_id % 3 = 2", animated:true },
      ],
      steps: [
        { title:"Single DB bottleneck", note:"One DB can't handle 1B users. Sharding splits data across multiple DBs — each owns a partition.", highlightNodes:["router"] },
        { title:"Shard key routing", note:"user_id % 3 determines shard. Router sends query to correct shard only. N shards = N× throughput.", highlightEdges:["router->s1","router->s2","router->s3"] },
        { title:"Hot shard problem", note:"If 'users A-H' includes celebrities, Shard 1 is overwhelmed. Use consistent hashing or virtual nodes to redistribute evenly.", highlightNodes:["s1"] },
      ]
    },
    content: {
      intro: "Sharding splits a large database horizontally across multiple machines. Choosing the right shard key is critical.",
      sections: [
        { type: "text", heading: "Shard Key Selection", body: "Good shard key: high cardinality, even distribution, commonly used in queries. Avoid: sharding on a low-cardinality field (e.g., country = hot shards) or one that changes frequently." },
        { type: "callout", style: "warn", heading: "Cross-Shard Queries", body: "JOINs across shards are expensive — requires scatter-gather. Denormalise or co-locate related data on the same shard." },
        { type: "quiz", heading: "Quick Check", q: "A hot shard is:", opts: ["A shard with encryption","A shard overwhelmed with traffic","A backup shard","A shard near users geographically"], ans: 1 },
      ]
    }
  },
  {
    id: 705, subject: "hld", title: "Message Queues", duration: "15 min", done: false,
    desc: "Kafka, RabbitMQ, async decoupling, pub/sub, at-least-once delivery",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"producer", label:"Producer",   sublabel:"publishes events",  x:15, y:50, color:"var(--green)" },
        { id:"kafka",    label:"Kafka Topic", sublabel:"ordered log",       x:50, y:50, color:"var(--accent)", highlight:true },
        { id:"c1",       label:"Consumer 1", sublabel:"email service",     x:85, y:25, color:"var(--yellow)" },
        { id:"c2",       label:"Consumer 2", sublabel:"analytics service", x:85, y:75, color:"var(--orange)" },
      ],
      edges: [
        { from:"producer", to:"kafka", label:"publish", animated:true },
        { from:"kafka",    to:"c1",    label:"subscribe", animated:true },
        { from:"kafka",    to:"c2",    label:"subscribe", animated:true },
      ],
      steps: [
        { title:"Tight coupling problem", note:"Without a queue: if Email service is down, Order service fails. Services are tightly coupled.", highlightNodes:["producer"] },
        { title:"Decoupled with Kafka", note:"Order service publishes event to Kafka topic. Returns immediately. Email service processes events asynchronously.", highlightNodes:["kafka"], highlightEdges:["producer->kafka"] },
        { title:"Multiple consumers", note:"Analytics and Email both consume from the same topic — independently, at their own pace. Fan-out for free.", highlightEdges:["kafka->c1","kafka->c2"] },
      ]
    },
    content: {
      intro: "Message queues decouple services, enable async processing, and provide a buffer against traffic spikes.",
      sections: [
        { type: "text", heading: "Kafka vs RabbitMQ", body: "<strong>Kafka</strong>: log-based, ordered, replayable, high-throughput (millions/sec), durable. <strong>RabbitMQ</strong>: traditional queue, smart routing, lower latency, acknowledgement-based." },
        { type: "callout", style: "info", heading: "At-Least-Once Delivery", body: "Kafka guarantees at-least-once — a message may be delivered multiple times if consumer crashes. Make consumers idempotent (same message twice = same result)." },
        { type: "quiz", heading: "Quick Check", q: "Message queues primarily solve:", opts: ["Faster DB writes","Tight service coupling","SQL joins","Authentication"], ans: 1 },
      ]
    }
  },
  {
    id: 706, subject: "hld", title: "Design URL Shortener", duration: "22 min", done: false,
    desc: "bit.ly clone: hashing, redirection, analytics, scaling",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"client", label:"User",          sublabel:"POST /shorten",       x:10, y:50, color:"var(--muted)" },
        { id:"api",    label:"API Server",    sublabel:"generate short ID",   x:35, y:50, color:"var(--accent)" },
        { id:"cache",  label:"Redis",         sublabel:"shortId → longUrl",    x:60, y:25, color:"var(--yellow)" },
        { id:"db",     label:"DB",            sublabel:"id, shortUrl, longUrl",x:60, y:75, color:"var(--purple)" },
        { id:"redir",  label:"Redirector",   sublabel:"GET /:shortId → 301", x:85, y:50, color:"var(--green)" },
      ],
      edges: [
        { from:"client", to:"api",   label:"POST long URL" },
        { from:"api",    to:"db",    label:"store mapping" },
        { from:"client", to:"redir", label:"GET /abc123", animated:true },
        { from:"redir",  to:"cache", label:"lookup", animated:true },
        { from:"redir",  to:"db",    label:"miss → DB", dashed:true },
      ],
      steps: [
        { title:"Shorten", note:"POST /shorten with longUrl. API generates 7-char Base62 ID (62^7 ≈ 3.5T combinations). Stores in DB.", highlightNodes:["api","db"] },
        { title:"Redirect", note:"GET /abc123 → Redirector looks up in Redis cache (O(1)). Returns 301 redirect to long URL.", highlightEdges:["client->redir","redir->cache"] },
        { title:"Scale", note:"Redirect is read-heavy (100:1 read/write). Cache aggressively. Shard DB by shortId. CDN edge nodes for global low latency.", highlightNodes:["cache"] },
      ]
    },
    content: {
      intro: "URL shortener is a perfect HLD question — clear scope, interesting scaling challenges, and maps to real architectural patterns.",
      sections: [
        { type: "text", heading: "ID Generation", body: "Options: (1) MD5 hash of URL, take first 7 chars — collision risk. (2) Auto-increment + Base62 encode — simple but sequential IDs leak count. (3) Twitter Snowflake ID — 64-bit, sortable, distributed." },
        { type: "code", heading: "Capacity Estimation", body: `Write: 100M URLs/day = 1160 QPS\nRead: 10B clicks/day = 115,740 QPS\nStorage: 100M/day × 365 × 5yr × 500B = ~90TB\nCache: 80/20 rule → cache 20% of hot URLs` },
        { type: "quiz", heading: "Quick Check", q: "A 301 redirect means:", opts: ["Temporary","Permanent (browser caches it)","Error","Server-side redirect"], ans: 1 },
      ]
    }
  },
  {
    id: 707, subject: "hld", title: "Design a Social Media Feed", duration: "22 min", done: false,
    desc: "Instagram/Twitter feed: fan-out on write vs read, ranking",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"user",    label:"User A posts",  sublabel:"1M followers",       x:15, y:50, color:"var(--accent)" },
        { id:"queue",   label:"Kafka",          sublabel:"post event",         x:40, y:50, color:"var(--yellow)" },
        { id:"fanout",  label:"Fan-out Service",sublabel:"push to followers",  x:65, y:50, color:"var(--orange)" },
        { id:"feed1",   label:"Feed Cache 1",   sublabel:"user B's feed",      x:85, y:25, color:"var(--green)" },
        { id:"feed2",   label:"Feed Cache 2",   sublabel:"user C's feed",      x:85, y:75, color:"var(--green)" },
      ],
      edges: [
        { from:"user",   to:"queue",  label:"publish", animated:true },
        { from:"queue",  to:"fanout", label:"consume" },
        { from:"fanout", to:"feed1",  label:"push post", animated:true },
        { from:"fanout", to:"feed2",  label:"push post", animated:true },
      ],
      steps: [
        { title:"Fan-out on write", note:"When User A posts, immediately push post ID to all followers' feed caches. Read is O(1). Write is expensive for celebrities.", highlightNodes:["user","fanout"] },
        { title:"Celebrity problem", note:"User A has 1M followers — pushing to 1M feed caches takes too long. Hybrid: fan-out for regular users, fan-in for celebrities.", highlightNodes:["feed1","feed2","fanout"] },
        { title:"Feed ranking", note:"Feed isn't just chronological. ML model scores posts by: recency, engagement, relationship strength. Computed score determines order.", highlightNodes:["feed1"] },
      ]
    },
    content: {
      intro: "Social feed design is one of the most complex HLD problems due to the celebrity problem and real-time ranking requirements.",
      sections: [
        { type: "text", heading: "Fan-out Approaches", body: "<strong>Fan-out on Write</strong>: push to followers at post time. Fast reads, slow writes. <strong>Fan-out on Read</strong>: pull from followees at read time. Slow reads, fast writes. <strong>Hybrid</strong>: write fan-out for regular users, read fan-in for celebrities." },
        { type: "quiz", heading: "Quick Check", q: "The celebrity problem in feed design is:", opts: ["Post quality drops","1M+ fan-out is too expensive on write","Celebrities bypass moderation","Feed is unsorted"], ans: 1 },
      ]
    }
  },
  {
    id: 708, subject: "hld", title: "Design Real-Time Chat", duration: "22 min", done: false,
    desc: "WebSockets, presence, message ordering, WhatsApp architecture",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"ua",    label:"User A",      sublabel:"WebSocket",          x:10, y:50, color:"var(--green)" },
        { id:"ws1",   label:"Chat Server 1",sublabel:"holds A's socket",  x:35, y:50, color:"var(--accent)" },
        { id:"kafka", label:"Kafka",        sublabel:"message bus",        x:60, y:50, color:"var(--yellow)", highlight:true },
        { id:"ws2",   label:"Chat Server 2",sublabel:"holds B's socket",  x:85, y:25, color:"var(--accent)" },
        { id:"ub",    label:"User B",       sublabel:"WebSocket",         x:100,y:25, color:"var(--green)" },
        { id:"db",    label:"Message DB",   sublabel:"Cassandra",         x:85, y:75, color:"var(--purple)" },
      ],
      edges: [
        { from:"ua",    to:"ws1",   label:"WS connection" },
        { from:"ws1",   to:"kafka", label:"publish msg", animated:true },
        { from:"kafka", to:"ws2",   label:"route to receiver", animated:true },
        { from:"ws2",   to:"ub",    label:"push msg", animated:true },
        { from:"kafka", to:"db",    label:"persist" },
      ],
      steps: [
        { title:"WebSocket connection", note:"HTTP is stateless — can't push. WebSocket upgrades to persistent bi-directional connection. User A stays connected to Server 1.", highlightNodes:["ua","ws1"] },
        { title:"Message routing", note:"Server 1 doesn't know which server holds User B's socket. Publish to Kafka → Server 2 subscribes and delivers to B.", highlightEdges:["ws1->kafka","kafka->ws2"] },
        { title:"Persistence", note:"Kafka also persists to Cassandra (writes at high scale). Offline users load history from DB. Delivered = read from DB, not server.", highlightEdges:["kafka->db"] },
      ]
    },
    content: {
      intro: "Real-time chat requires WebSockets for push, a message bus for routing, and a scalable DB for history and offline delivery.",
      sections: [
        { type: "text", heading: "Key Components", body: "<strong>WebSocket gateway</strong>: maintains persistent connections. <strong>Kafka</strong>: routes messages between chat servers. <strong>Cassandra</strong>: stores messages (optimised for time-series writes). <strong>Redis</strong>: presence (online/offline status)." },
        { type: "callout", style: "info", heading: "Message Ordering", body: "Within a conversation, use a sequence number. Cassandra stores by (conversation_id, sequence) — efficient range scans for chat history." },
        { type: "quiz", heading: "Quick Check", q: "WebSockets are used in chat because:", opts: ["They're faster than HTTP","They allow server-push without polling","They're easier to implement","They don't need authentication"], ans: 1 },
      ]
    }
  },
];
