import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Play, Square, Flame, Trash2, FolderOpen, X, Plus, Minus, AlertTriangle, Download, Activity, MousePointer2, Hand, Lock, Unlock, Sparkles } from "lucide-react";
import InlineAITutor from "@/components/InlineAITutor";
import "@/components/InlineAITutor.css";
import "./SystemDesignSimulator.css";

// ─── Types ────────────────────────────────────────────────────────────────
const HISTORY_LEN = 60;

interface MetricsHistory {
  rps: number[]; p95Latency: number[]; errorRate: number[];
  queueDepth: number[]; saturation: number[];
}

interface NodeMetrics {
  rps: number; latency: number; cpu: number;
  errorRate: number; queueDepth: number;
}

interface SysNode {
  id: string; type: string; label: string; x: number; y: number;
  config: Record<string, number>;
  health: number; // 0.0–1.0 graceful degradation
  metrics: NodeMetrics;
  history: MetricsHistory;
  ingressQueue: number; // pipeline: requests waiting to enter
  processing: number;   // pipeline: requests being processed
}

const emptyHistory = (): MetricsHistory => ({
  rps: [], p95Latency: [], errorRate: [], queueDepth: [], saturation: [],
});
const emptyMetrics = (): NodeMetrics => ({ rps: 0, latency: 0, cpu: 0, errorRate: 0, queueDepth: 0 });

const pushHist = (arr: number[], val: number) => {
  const next = [...arr, val];
  return next.length > HISTORY_LEN ? next.slice(-HISTORY_LEN) : next;
};

type CBState = "closed" | "open" | "half-open";
interface Connection {
  id: string; from: string; to: string;
  maxConnections: number; activeConnections: number; // #8 connection pooling
  throughput: number; // #16 edge throughput
  partitioned: boolean; // #13 network partition
  cbState: CBState; cbFailCount: number; cbCooldown: number; // #10 circuit breaker
}

// #6 LB strategies
const LB_STRATEGIES = ["round-robin", "least-conn", "random", "weighted", "ip-hash"] as const;

// #17 Auto-diagnostics
interface DiagnosticHint { severity: "info" | "warn" | "error"; message: string; }

const runDiagnostics = (nodes: SysNode[], connections: Connection[]): DiagnosticHint[] => {
  const hints: DiagnosticHint[] = [];
  const apis = nodes.filter(n => n.type === "api");
  const caches = nodes.filter(n => n.type === "cache");
  const dbs = nodes.filter(n => n.type === "db");
  const lbs = nodes.filter(n => n.type === "lb");

  // Single point of failure
  if (apis.length === 1) hints.push({ severity: "warn", message: "⚠️ Single API server — no redundancy" });
  if (dbs.length > 0 && dbs.every(d => (d.config.replicas || 1) <= 1))
    hints.push({ severity: "warn", message: "⚠️ Database has no replicas — single point of failure" });

  // No cache between API and DB
  const apiIds = new Set(apis.map(a => a.id));
  const dbIds = new Set(dbs.map(d => d.id));
  const directApiToDb = connections.some(c => apiIds.has(c.from) && dbIds.has(c.to));
  const apiToCache = connections.some(c => apiIds.has(c.from) && caches.some(ca => ca.id === c.to));
  if (directApiToDb && !apiToCache && caches.length === 0)
    hints.push({ severity: "warn", message: "⚠️ No cache layer between API and DB — high latency" });

  // Saturation warnings
  nodes.forEach(n => {
    if (n.metrics.cpu > 90) hints.push({ severity: "error", message: `🔴 ${n.label} at ${n.metrics.cpu}% CPU — critical` });
    else if (n.metrics.cpu > 70) hints.push({ severity: "warn", message: `🟡 ${n.label} at ${n.metrics.cpu}% — consider scaling` });
    if (n.metrics.queueDepth > 500) hints.push({ severity: "error", message: `🔴 ${n.label} queue depth ${n.metrics.queueDepth} — backlog growing` });
    if (n.health < 0.5) hints.push({ severity: "error", message: `🔴 ${n.label} health at ${Math.round(n.health*100)}%` });
  });

  // Circuit breakers open
  connections.filter(c => c.cbState === "open").forEach(c => {
    const from = nodes.find(n => n.id === c.from);
    const to = nodes.find(n => n.id === c.to);
    hints.push({ severity: "error", message: `🔴 Circuit breaker OPEN: ${from?.label} → ${to?.label}` });
  });

  // Good patterns
  if (lbs.length > 0 && apis.length > 1)
    hints.push({ severity: "info", message: "✅ Load balanced across multiple servers" });
  if (caches.length > 0 && apiToCache)
    hints.push({ severity: "info", message: "✅ Cache layer reduces DB load" });
  const queues = nodes.filter(n => n.type === "queue");
  if (queues.length > 0)
    hints.push({ severity: "info", message: "✅ Async queue decouples writes — good pattern" });

  return hints;
};

// ─── Chaos Scenarios (#20) ────────────────────────────────────────────────
interface ChaosScenario {
  id: string; name: string; icon: string; desc: string;
  apply: (nodes: SysNode[], tick: number) => SysNode[];
}

const CHAOS_SCENARIOS: ChaosScenario[] = [
  {
    id: "blackfriday", name: "Black Friday", icon: "🛒",
    desc: "10× traffic spike over 30 ticks",
    apply: (nodes, tick) => nodes.map(n =>
      n.type === "client" ? { ...n, config: { ...n.config, instances: (n.config.instances || 1000) * Math.min(10, 1 + tick * 0.3) } } : n
    ),
  },
  {
    id: "cache_avalanche", name: "Cache Avalanche", icon: "💥",
    desc: "Cache dies — all requests hit DB",
    apply: (nodes) => nodes.map(n =>
      n.type === "cache" ? { ...n, health: 0.05 } : n
    ),
  },
  {
    id: "slow_db", name: "Slow Database", icon: "🐌",
    desc: "DB latency increases 5× gradually",
    apply: (nodes, tick) => nodes.map(n =>
      n.type === "db" ? { ...n, health: Math.max(0.1, 1 - tick * 0.03) } : n
    ),
  },
  {
    id: "partition", name: "Network Partition", icon: "🔌",
    desc: "Random server health drops to 20%",
    apply: (nodes) => {
      const servers = nodes.filter(n => n.type === "api");
      if (!servers.length) return nodes;
      const victim = servers[Math.floor(Math.random() * servers.length)].id;
      return nodes.map(n => n.id === victim ? { ...n, health: 0.2 } : n);
    },
  },
  {
    id: "memory_leak", name: "Memory Leak", icon: "🧠",
    desc: "One server degrades from 100% → 0% over 60 ticks",
    apply: (nodes, tick) => {
      const servers = nodes.filter(n => n.type === "api" || n.type === "worker");
      if (!servers.length) return nodes;
      const victim = servers[0].id;
      return nodes.map(n => n.id === victim ? { ...n, health: Math.max(0, 1 - tick / 60) } : n);
    },
  },
];

// ─── Component catalog (categorized) ──────────────────────────────────────
interface CompDef { type: string; icon: string; label: string; color: string; cost: number; cat: string; defaults: Record<string, number>; }

const CATEGORIES = [
  { id: "traffic", name: "Traffic & Edge", icon: "🌐" },
  { id: "network", name: "Network", icon: "🔗" },
  { id: "compute", name: "Compute", icon: "⚡" },
  { id: "storage", name: "Storage", icon: "💾" },
  { id: "messaging", name: "Messaging", icon: "📨" },
  { id: "fintech", name: "Fintech & Banking", icon: "🏦" },
  { id: "security", name: "Security", icon: "🔒" },
];

const COMPONENTS: CompDef[] = [
  // ── Traffic & Edge ──────────────────────────────────────────────────
  { type: "client",      icon: "👤", label: "Client",          color: "#6366f1", cost: 0,   cat: "traffic", defaults: { instances: 1000, readRatio: 80 } },
  { type: "api_gateway", icon: "🛡️", label: "API Gateway",     color: "#7c3aed", cost: 150, cat: "traffic", defaults: { maxRPS: 20000, rateLimit: 10000 } },
  { type: "cdn",         icon: "🌐", label: "CDN",             color: "#06b6d4", cost: 80,  cat: "traffic", defaults: { cacheHitRate: 90 } },
  { type: "dns",         icon: "📡", label: "DNS",             color: "#14b8a6", cost: 20,  cat: "traffic", defaults: { maxRPS: 100000 } },
  { type: "ingress",     icon: "🚪", label: "Ingress",         color: "#a78bfa", cost: 40,  cat: "traffic", defaults: { maxConn: 20000 } },
  { type: "lb",          icon: "⚖️", label: "Load Balancer",   color: "#8b5cf6", cost: 120, cat: "traffic", defaults: { strategy: 0, maxConn: 10000 } },
  { type: "waf",         icon: "🔰", label: "WAF",             color: "#f43f5e", cost: 90,  cat: "traffic", defaults: { maxRPS: 50000 } },

  // ── Network ─────────────────────────────────────────────────────────
  { type: "api_gw_net",  icon: "🛡️", label: "API Gateway (Network)", color: "#7c3aed", cost: 150, cat: "network", defaults: { maxRPS: 15000 } },
  { type: "dns_server",  icon: "📡", label: "DNS Server",      color: "#14b8a6", cost: 30,  cat: "network", defaults: { maxRPS: 50000 } },
  { type: "discovery",   icon: "🔎", label: "Discovery Service",color: "#8b5cf6", cost: 40,  cat: "network", defaults: { maxRPS: 5000 } },
  { type: "edge_router", icon: "🔀", label: "Edge Router",     color: "#64748b", cost: 60,  cat: "network", defaults: { maxConn: 100000 } },
  { type: "firewall",    icon: "🧱", label: "Firewall Rule",   color: "#dc2626", cost: 45,  cat: "network", defaults: { maxConn: 100000 } },
  { type: "health_svc",  icon: "💚", label: "Health Check Svc", color: "#22c55e", cost: 15,  cat: "network", defaults: { maxRPS: 1000 } },
  { type: "lb_l4l7",     icon: "⚖️", label: "Load Balancer (L4/L7)", color: "#8b5cf6", cost: 130, cat: "network", defaults: { strategy: 0, maxConn: 50000 } },
  { type: "nat_gw",      icon: "↗️", label: "NAT Gateway",     color: "#0ea5e9", cost: 50,  cat: "network", defaults: { maxConn: 50000 } },
  { type: "net_iface",   icon: "🔌", label: "Network Interface",color: "#94a3b8", cost: 10,  cat: "network", defaults: { maxConn: 10000 } },
  { type: "rate_limit",  icon: "🚦", label: "Rate Limiter",    color: "#ef4444", cost: 25,  cat: "network", defaults: { maxRPS: 5000, rateLimit: 1000 } },
  { type: "registry_db", icon: "📋", label: "Registry Database",color: "#6366f1", cost: 80,  cat: "network", defaults: { replicas: 2, maxConn: 50 } },
  { type: "rev_proxy",   icon: "🔄", label: "Reverse Proxy",   color: "#7c3aed", cost: 30,  cat: "network", defaults: { maxConn: 50000 } },
  { type: "route_policy", icon: "📜", label: "Routing Policy",  color: "#f59e0b", cost: 10,  cat: "network", defaults: { maxRPS: 100000 } },
  { type: "route_rule",  icon: "🔃", label: "Routing Rule",    color: "#f97316", cost: 10,  cat: "network", defaults: { maxRPS: 100000 } },
  { type: "route_table", icon: "📑", label: "Routing Table",   color: "#0ea5e9", cost: 15,  cat: "network", defaults: { maxRPS: 100000 } },
  { type: "sec_group",   icon: "🛡️", label: "Security Group",  color: "#64748b", cost: 10,  cat: "network", defaults: { maxConn: 100000 } },
  { type: "svc_mesh",    icon: "🕸️", label: "Service Mesh",    color: "#06b6d4", cost: 60,  cat: "network", defaults: { maxRPS: 50000 } },
  { type: "sidecar",     icon: "🔗", label: "Sidecar Proxy",   color: "#a855f7", cost: 15,  cat: "network", defaults: { maxRPS: 10000 } },
  { type: "subnet",      icon: "📦", label: "Subnet",          color: "#14b8a6", cost: 10,  cat: "network", defaults: { maxConn: 50000 } },
  { type: "vpc",         icon: "🏗️", label: "VPC",             color: "#3b82f6", cost: 20,  cat: "network", defaults: { maxConn: 100000 } },
  { type: "vpn_gw",      icon: "🌍", label: "VPN Gateway",     color: "#0ea5e9", cost: 80,  cat: "network", defaults: { maxConn: 5000 } },
  { type: "waf_module",  icon: "🛡️", label: "WAF Module",      color: "#f43f5e", cost: 50,  cat: "network", defaults: { maxRPS: 30000 } },

  // ── Compute ─────────────────────────────────────────────────────────
  { type: "alert_eng",   icon: "🔔", label: "Alerting Engine",  color: "#f97316", cost: 40,  cat: "compute", defaults: { instances: 1, maxRPS: 500 } },
  { type: "analytics",   icon: "📊", label: "Analytics Service",color: "#38bdf8", cost: 80,  cat: "compute", defaults: { instances: 2, maxRPS: 1000 } },
  { type: "api",         icon: "⚡", label: "App Server",      color: "#f59e0b", cost: 50,  cat: "compute", defaults: { instances: 3, maxRPS: 1000, rateLimit: 500 } },
  { type: "auth",        icon: "🔐", label: "Auth Service",    color: "#e11d48", cost: 60,  cat: "compute", defaults: { instances: 2, maxRPS: 2000 } },
  { type: "config",      icon: "🔧", label: "Config Service",  color: "#94a3b8", cost: 20,  cat: "compute", defaults: { instances: 1, maxRPS: 500 } },
  { type: "dist_trace",  icon: "🔬", label: "Distributed Tracing", color: "#a855f7", cost: 60, cat: "compute", defaults: { instances: 2, maxRPS: 5000 } },
  { type: "feat_flags",  icon: "🚩", label: "Feature Flags",   color: "#22c55e", cost: 15,  cat: "compute", defaults: { instances: 1, maxRPS: 2000 } },
  { type: "health_mon",  icon: "💚", label: "Health Check Mon", color: "#10b981", cost: 20,  cat: "compute", defaults: { instances: 1, maxRPS: 500 } },
  { type: "log_agg",     icon: "📋", label: "Log Aggregation",  color: "#6366f1", cost: 60,  cat: "compute", defaults: { instances: 2, maxRPS: 5000 } },
  { type: "log_agent",   icon: "📝", label: "Log Collector Agent",color: "#8b5cf6", cost: 10, cat: "compute", defaults: { instances: 1, maxRPS: 2000 } },
  { type: "metrics_agent",icon: "📉", label: "Metrics Collector",color: "#0ea5e9", cost: 15, cat: "compute", defaults: { instances: 1, maxRPS: 3000 } },
  { type: "media_proc",  icon: "🎞️", label: "Media Processor", color: "#c084fc", cost: 100, cat: "compute", defaults: { instances: 3, concurrency: 4 } },
  { type: "notif",       icon: "🔔", label: "Notification Svc",color: "#fb923c", cost: 40,  cat: "compute", defaults: { instances: 2, maxRPS: 3000 } },
  { type: "scheduler",   icon: "⏰", label: "Scheduler",       color: "#d946ef", cost: 30,  cat: "compute", defaults: { instances: 1, maxRPS: 100 } },
  { type: "search_svc",  icon: "🔍", label: "Search Service",  color: "#0ea5e9", cost: 80,  cat: "compute", defaults: { instances: 2, maxRPS: 2000 } },
  { type: "secrets",     icon: "🔑", label: "Secrets Manager", color: "#f59e0b", cost: 30,  cat: "compute", defaults: { instances: 1, maxRPS: 500 } },
  { type: "serverless",  icon: "⚡", label: "Serverless",      color: "#facc15", cost: 20,  cat: "compute", defaults: { maxRPS: 5000 } },
  { type: "svc_disc",    icon: "🧭", label: "Service Discovery",color: "#14b8a6", cost: 25,  cat: "compute", defaults: { instances: 2, maxRPS: 5000 } },
  { type: "worker",      icon: "⚙️", label: "Worker",          color: "#a855f7", cost: 50,  cat: "compute", defaults: { instances: 2, concurrency: 10 } },

  // ── Storage ─────────────────────────────────────────────────────────
  { type: "cache",       icon: "💾", label: "Cache",            color: "#ef4444", cost: 100, cat: "storage", defaults: { maxMemMB: 512, ttl: 300, hitRate: 80 } },
  { type: "data_lake",   icon: "🌊", label: "Data Lake",       color: "#06b6d4", cost: 200, cat: "storage", defaults: { maxIOPS: 2000 } },
  { type: "data_wh",     icon: "🏛️", label: "Data Warehouse",  color: "#6366f1", cost: 350, cat: "storage", defaults: { maxRPS: 200 } },
  { type: "db",          icon: "🗄️", label: "Database",        color: "#22c55e", cost: 200, cat: "storage", defaults: { replicas: 2, maxConn: 100 } },
  { type: "graph_db",    icon: "🕸️", label: "Graph DB",        color: "#10b981", cost: 250, cat: "storage", defaults: { replicas: 2, maxConn: 80 } },
  { type: "kv_store",    icon: "🔑", label: "KV Store",        color: "#f97316", cost: 80,  cat: "storage", defaults: { maxRPS: 10000 } },
  { type: "storage",     icon: "📦", label: "Object Store",    color: "#64748b", cost: 30,  cat: "storage", defaults: { maxIOPS: 5000 } },
  { type: "search",      icon: "🔍", label: "Search Index",    color: "#0ea5e9", cost: 150, cat: "storage", defaults: { shards: 3, replicas: 1 } },
  { type: "tsdb",        icon: "📈", label: "Time Series DB",  color: "#14b8a6", cost: 120, cat: "storage", defaults: { replicas: 2, maxRPS: 5000 } },
  { type: "ts_metrics",  icon: "📉", label: "TS Metrics Store",color: "#0ea5e9", cost: 100, cat: "storage", defaults: { replicas: 2, maxRPS: 8000 } },
  { type: "vector_db",   icon: "🧠", label: "Vector DB",       color: "#8b5cf6", cost: 180, cat: "storage", defaults: { shards: 2, maxRPS: 1000 } },

  // ── Messaging ───────────────────────────────────────────────────────
  { type: "queue",       icon: "📨", label: "Message Queue",   color: "#f97316", cost: 60,  cat: "messaging", defaults: { partitions: 4, maxLag: 1000 } },
  { type: "pubsub",      icon: "📢", label: "Pub/Sub",         color: "#f59e0b", cost: 50,  cat: "messaging", defaults: { maxRPS: 10000 } },
  { type: "stream",      icon: "🌊", label: "Stream",          color: "#06b6d4", cost: 70,  cat: "messaging", defaults: { partitions: 8, maxRPS: 20000 } },

  // ── Fintech & Banking ───────────────────────────────────────────────
  { type: "fraud_det",   icon: "🚨", label: "Fraud Detection", color: "#dc2626", cost: 200, cat: "fintech", defaults: { instances: 2, maxRPS: 1000 } },
  { type: "hsm",         icon: "🔐", label: "HSM",             color: "#e11d48", cost: 500, cat: "fintech", defaults: { instances: 1, maxRPS: 100 } },
  { type: "ledger",      icon: "📒", label: "Ledger Service",  color: "#16a34a", cost: 150, cat: "fintech", defaults: { instances: 2, maxRPS: 800 } },
  { type: "payment_gw",  icon: "💳", label: "Payment Gateway", color: "#059669", cost: 300, cat: "fintech", defaults: { instances: 3, maxRPS: 500, rateLimit: 200 } },

  // ── Security ────────────────────────────────────────────────────────
  { type: "auth_server",  icon: "🔐", label: "Auth Server",     color: "#e11d48", cost: 80,  cat: "security", defaults: { instances: 2, maxRPS: 3000 } },
  { type: "cert_mgr",    icon: "📜", label: "Certificate Mgr", color: "#f59e0b", cost: 20,  cat: "security", defaults: { instances: 1, maxRPS: 200 } },
  { type: "encryption",  icon: "🔒", label: "Encryption Svc",  color: "#7c3aed", cost: 40,  cat: "security", defaults: { instances: 2, maxRPS: 5000 } },
  { type: "identity",    icon: "🪪", label: "Identity Provider",color: "#6366f1", cost: 60,  cat: "security", defaults: { instances: 2, maxRPS: 2000 } },
  { type: "key_vault",   icon: "🗝️", label: "Key Vault",       color: "#f97316", cost: 50,  cat: "security", defaults: { instances: 1, maxRPS: 500 } },
  { type: "oauth",       icon: "🔑", label: "OAuth Server",    color: "#22c55e", cost: 45,  cat: "security", defaults: { instances: 2, maxRPS: 3000 } },
  { type: "token_svc",   icon: "🎫", label: "Token Service",   color: "#14b8a6", cost: 35,  cat: "security", defaults: { instances: 2, maxRPS: 5000 } },
  { type: "waf_sec",     icon: "🛡️", label: "WAF (Security)",  color: "#f43f5e", cost: 90,  cat: "security", defaults: { maxRPS: 50000 } },
];

// #18 Cost estimation — uses COMPONENTS catalog cost field
const getCost = (type: string): number => COMPONENTS.find(c => c.type === type)?.cost || 0;

// ─── Templates (educational) ──────────────────────────────────────────────
interface Template {
  id: string; name: string; icon: string; desc: string;
  difficulty: "Easy" | "Medium" | "Hard";
  learn: string; // what students should observe
  chaos?: string; // suggested chaos scenario
  nodes: Omit<SysNode,"id"|"metrics"|"health"|"history"|"ingressQueue"|"processing">[];
  conns: [number,number][];
}

const TEMPLATES: Template[] = [
  {
    id: "url_shortener", name: "URL Shortener", icon: "🔗", difficulty: "Easy",
    desc: "Bitly-style short URL service with cache and database",
    learn: "Observe how cache hit rate affects DB load. Try lowering cache hitRate to see latency spike.",
    chaos: "cache_avalanche",
    nodes: [
      { type: "client", label: "Users", x: 80, y: 200, config: { instances: 2000, readRatio: 95 } },
      { type: "lb", label: "Load Balancer", x: 280, y: 200, config: { strategy: 0, maxConn: 20000 } },
      { type: "api", label: "API Server", x: 480, y: 200, config: { instances: 2, maxRPS: 2000, rateLimit: 1500 } },
      { type: "cache", label: "URL Cache", x: 680, y: 100, config: { maxMemMB: 256, ttl: 3600, hitRate: 95 } },
      { type: "db", label: "URL Database", x: 680, y: 300, config: { replicas: 1, maxConn: 50 } },
    ],
    conns: [[0,1],[1,2],[2,3],[2,4]],
  },
  {
    id: "chat", name: "Chat App", icon: "💬", difficulty: "Medium",
    desc: "WhatsApp-style messaging with presence, delivery tracking, and media",
    learn: "Watch how message queue handles burst writes. Try increasing user count — observe queue backlog growth.",
    nodes: [
      { type: "client", label: "Users", x: 60, y: 220, config: { instances: 20000, readRatio: 50 } },
      { type: "lb", label: "WebSocket LB", x: 260, y: 220, config: { strategy: 0, maxConn: 100000 } },
      { type: "api", label: "Chat Service", x: 460, y: 120, config: { instances: 6, maxRPS: 5000, rateLimit: 4000 } },
      { type: "api", label: "Presence Svc", x: 460, y: 320, config: { instances: 3, maxRPS: 10000 } },
      { type: "cache", label: "Session Cache", x: 660, y: 320, config: { maxMemMB: 2048, ttl: 30, hitRate: 90 } },
      { type: "queue", label: "Message Queue", x: 460, y: 440, config: { partitions: 16, maxLag: 500 } },
      { type: "db", label: "Message DB", x: 660, y: 120, config: { replicas: 3, maxConn: 200 } },
      { type: "storage", label: "Media Store", x: 660, y: 440, config: { maxIOPS: 5000 } },
      { type: "notif", label: "Push Notifs", x: 860, y: 220, config: { instances: 2, maxRPS: 3000 } },
    ],
    conns: [[0,1],[1,2],[1,3],[2,6],[3,4],[2,5],[5,7],[2,8]],
  },
  {
    id: "payment", name: "Payment System", icon: "💳", difficulty: "Medium",
    desc: "Stripe-like payment processing with fraud detection and ledger",
    learn: "Notice how fraud detection adds latency. Try partition between fraud_det and ledger to see failed transactions.",
    chaos: "slow_db",
    nodes: [
      { type: "client", label: "Merchants", x: 60, y: 200, config: { instances: 500, readRatio: 30 } },
      { type: "api_gateway", label: "API Gateway", x: 260, y: 200, config: { maxRPS: 5000, rateLimit: 2000 } },
      { type: "auth", label: "Auth Service", x: 260, y: 60, config: { instances: 2, maxRPS: 3000 } },
      { type: "payment_gw", label: "Payment Svc", x: 480, y: 200, config: { instances: 3, maxRPS: 500, rateLimit: 200 } },
      { type: "fraud_det", label: "Fraud Engine", x: 480, y: 60, config: { instances: 2, maxRPS: 1000 } },
      { type: "ledger", label: "Ledger", x: 700, y: 200, config: { instances: 2, maxRPS: 800 } },
      { type: "db", label: "Transaction DB", x: 700, y: 60, config: { replicas: 3, maxConn: 200 } },
      { type: "queue", label: "Event Bus", x: 480, y: 340, config: { partitions: 8, maxLag: 100 } },
      { type: "notif", label: "Webhooks", x: 700, y: 340, config: { instances: 2, maxRPS: 2000 } },
    ],
    conns: [[0,1],[1,2],[1,3],[3,4],[3,5],[5,6],[3,7],[7,8]],
  },
  {
    id: "youtube", name: "YouTube", icon: "🎬", difficulty: "Hard",
    desc: "Video streaming with CDN, transcoding workers, and search",
    learn: "Watch transcoder queue depth. Increase users to see CDN cache hit rate importance. Try 'Black Friday' chaos.",
    chaos: "blackfriday",
    nodes: [
      { type: "client", label: "Users", x: 60, y: 220, config: { instances: 5000, readRatio: 90 } },
      { type: "cdn", label: "Video CDN", x: 260, y: 100, config: { cacheHitRate: 95 } },
      { type: "lb", label: "Load Balancer", x: 260, y: 340, config: { strategy: 0, maxConn: 50000 } },
      { type: "api", label: "API Servers", x: 480, y: 220, config: { instances: 5, maxRPS: 3000, rateLimit: 2500 } },
      { type: "cache", label: "Metadata Cache", x: 480, y: 80, config: { maxMemMB: 2048, ttl: 600, hitRate: 85 } },
      { type: "db", label: "Metadata DB", x: 700, y: 220, config: { replicas: 3, maxConn: 200 } },
      { type: "queue", label: "Upload Queue", x: 480, y: 380, config: { partitions: 8, maxLag: 5000 } },
      { type: "worker", label: "Transcoder", x: 700, y: 380, config: { instances: 4, concurrency: 2 } },
      { type: "storage", label: "Video Store", x: 700, y: 80, config: { maxIOPS: 10000 } },
      { type: "search", label: "Search Index", x: 900, y: 220, config: { shards: 4, replicas: 2 } },
    ],
    conns: [[0,1],[0,2],[2,3],[3,4],[3,5],[3,6],[6,7],[7,8],[1,8],[3,9]],
  },
  {
    id: "uber", name: "Uber", icon: "🚗", difficulty: "Hard",
    desc: "Ride-sharing with real-time location, matching, and notifications",
    learn: "Location service handles massive read throughput. Watch how low TTL cache prevents stale data but increases DB load.",
    chaos: "partition",
    nodes: [
      { type: "client", label: "Riders/Drivers", x: 60, y: 220, config: { instances: 10000, readRatio: 70 } },
      { type: "lb", label: "Gateway LB", x: 260, y: 220, config: { strategy: 0, maxConn: 100000 } },
      { type: "api", label: "Trip Service", x: 480, y: 120, config: { instances: 6, maxRPS: 5000 } },
      { type: "api", label: "Location Svc", x: 480, y: 320, config: { instances: 8, maxRPS: 20000 } },
      { type: "cache", label: "Location Cache", x: 680, y: 320, config: { maxMemMB: 4096, ttl: 5, hitRate: 60 } },
      { type: "db", label: "Trip DB", x: 680, y: 120, config: { replicas: 3, maxConn: 500 } },
      { type: "queue", label: "Events Queue", x: 480, y: 440, config: { partitions: 16, maxLag: 100 } },
      { type: "notif", label: "Push Notifs", x: 680, y: 440, config: { instances: 3, maxRPS: 5000 } },
    ],
    conns: [[0,1],[1,2],[1,3],[2,5],[3,4],[3,6],[2,6],[6,7]],
  },
  {
    id: "twitter", name: "Twitter/X", icon: "🐦", difficulty: "Hard",
    desc: "Social feed with fan-out, timeline cache, and search indexing",
    learn: "Fan-out queue is the bottleneck. Notice how 50K users creates massive write amplification through the queue.",
    chaos: "memory_leak",
    nodes: [
      { type: "client", label: "Users", x: 60, y: 200, config: { instances: 50000, readRatio: 85 } },
      { type: "cdn", label: "Media CDN", x: 260, y: 60, config: { cacheHitRate: 92 } },
      { type: "lb", label: "API Gateway", x: 260, y: 200, config: { strategy: 0, maxConn: 200000 } },
      { type: "api", label: "Tweet Service", x: 480, y: 120, config: { instances: 10, maxRPS: 10000 } },
      { type: "api", label: "Timeline Svc", x: 480, y: 300, config: { instances: 8, maxRPS: 50000 } },
      { type: "cache", label: "Timeline Cache", x: 700, y: 300, config: { maxMemMB: 8192, ttl: 60, hitRate: 95 } },
      { type: "db", label: "Tweet DB", x: 700, y: 120, config: { replicas: 5, maxConn: 1000 } },
      { type: "queue", label: "Fan-out Queue", x: 480, y: 440, config: { partitions: 32, maxLag: 500 } },
      { type: "search", label: "Search Index", x: 700, y: 440, config: { shards: 6, replicas: 2 } },
    ],
    conns: [[0,1],[0,2],[2,3],[2,4],[3,6],[4,5],[3,7],[7,8],[7,4]],
  },
  {
    id: "netflix", name: "Netflix", icon: "🎥", difficulty: "Hard",
    desc: "Streaming platform with microservices, recommendation engine, and CDN",
    learn: "Observe microservice chain depth. Each hop adds latency. Try partitioning the recommendation service edge.",
    nodes: [
      { type: "client", label: "Viewers", x: 40, y: 220, config: { instances: 30000, readRatio: 95 } },
      { type: "cdn", label: "Video CDN", x: 240, y: 80, config: { cacheHitRate: 98 } },
      { type: "api_gateway", label: "API Gateway", x: 240, y: 220, config: { maxRPS: 100000, rateLimit: 80000 } },
      { type: "api", label: "Catalog Svc", x: 460, y: 120, config: { instances: 4, maxRPS: 5000 } },
      { type: "api", label: "Playback Svc", x: 460, y: 320, config: { instances: 6, maxRPS: 10000 } },
      { type: "cache", label: "Session Cache", x: 680, y: 320, config: { maxMemMB: 4096, ttl: 300, hitRate: 92 } },
      { type: "db", label: "Content DB", x: 680, y: 120, config: { replicas: 3, maxConn: 300 } },
      { type: "analytics", label: "Recommend ML", x: 460, y: 450, config: { instances: 4, maxRPS: 2000 } },
      { type: "storage", label: "Video Store", x: 680, y: 450, config: { maxIOPS: 20000 } },
      { type: "stream", label: "Event Stream", x: 900, y: 220, config: { partitions: 16, maxRPS: 50000 } },
    ],
    conns: [[0,1],[0,2],[2,3],[2,4],[3,6],[4,5],[3,7],[1,8],[4,8],[3,9]],
  },
  {
    id: "ecommerce", name: "E-Commerce", icon: "🛒", difficulty: "Hard",
    desc: "Amazon-style marketplace with cart, payments, inventory, and search",
    learn: "Run 'Black Friday' chaos to see cascading failures. Watch how inventory DB becomes the bottleneck.",
    chaos: "blackfriday",
    nodes: [
      { type: "client", label: "Shoppers", x: 40, y: 240, config: { instances: 15000, readRatio: 80 } },
      { type: "cdn", label: "Asset CDN", x: 240, y: 80, config: { cacheHitRate: 95 } },
      { type: "api_gateway", label: "API Gateway", x: 240, y: 240, config: { maxRPS: 50000, rateLimit: 40000 } },
      { type: "api", label: "Product Svc", x: 460, y: 100, config: { instances: 5, maxRPS: 5000 } },
      { type: "api", label: "Cart Service", x: 460, y: 240, config: { instances: 4, maxRPS: 3000 } },
      { type: "api", label: "Order Service", x: 460, y: 380, config: { instances: 4, maxRPS: 2000 } },
      { type: "cache", label: "Product Cache", x: 680, y: 100, config: { maxMemMB: 4096, ttl: 120, hitRate: 90 } },
      { type: "db", label: "Inventory DB", x: 680, y: 240, config: { replicas: 3, maxConn: 300 } },
      { type: "payment_gw", label: "Payments", x: 680, y: 380, config: { instances: 3, maxRPS: 500, rateLimit: 200 } },
      { type: "search", label: "Product Search", x: 900, y: 100, config: { shards: 4, replicas: 2 } },
      { type: "queue", label: "Order Events", x: 900, y: 380, config: { partitions: 8, maxLag: 200 } },
    ],
    conns: [[0,1],[0,2],[2,3],[2,4],[2,5],[3,6],[4,7],[5,8],[3,9],[5,10]],
  },
  {
    id: "notif_system", name: "Notification System", icon: "🔔", difficulty: "Medium",
    desc: "Multi-channel notification system (push, email, SMS) with priorities",
    learn: "Watch how different channel workers drain the queue at different rates. Priority queue prevents SMS from starving push.",
    nodes: [
      { type: "client", label: "Services", x: 60, y: 200, config: { instances: 500, readRatio: 10 } },
      { type: "api", label: "Notif API", x: 280, y: 200, config: { instances: 3, maxRPS: 5000, rateLimit: 4000 } },
      { type: "queue", label: "Priority Queue", x: 500, y: 200, config: { partitions: 12, maxLag: 1000 } },
      { type: "worker", label: "Push Worker", x: 720, y: 80, config: { instances: 4, concurrency: 50 } },
      { type: "worker", label: "Email Worker", x: 720, y: 200, config: { instances: 2, concurrency: 20 } },
      { type: "worker", label: "SMS Worker", x: 720, y: 320, config: { instances: 1, concurrency: 5 } },
      { type: "db", label: "Notif Log DB", x: 500, y: 360, config: { replicas: 2, maxConn: 100 } },
      { type: "cache", label: "User Prefs", x: 500, y: 60, config: { maxMemMB: 512, ttl: 300, hitRate: 95 } },
    ],
    conns: [[0,1],[1,2],[2,3],[2,4],[2,5],[1,6],[1,7]],
  },
  {
    id: "logging", name: "Logging Pipeline", icon: "📋", difficulty: "Medium",
    desc: "ELK-style centralized logging with collection, processing, and search",
    learn: "Log collectors generate massive throughput. Watch how search index shards handle the write volume.",
    nodes: [
      { type: "client", label: "App Servers", x: 60, y: 200, config: { instances: 100, readRatio: 5 } },
      { type: "stream", label: "Log Stream", x: 280, y: 200, config: { partitions: 16, maxRPS: 100000 } },
      { type: "worker", label: "Log Processor", x: 500, y: 100, config: { instances: 4, concurrency: 20 } },
      { type: "worker", label: "Alerting", x: 500, y: 300, config: { instances: 2, concurrency: 10 } },
      { type: "search", label: "Log Index", x: 720, y: 100, config: { shards: 8, replicas: 1 } },
      { type: "storage", label: "Archive Store", x: 720, y: 300, config: { maxIOPS: 10000 } },
      { type: "tsdb", label: "Metrics DB", x: 500, y: 420, config: { replicas: 2, maxRPS: 5000 } },
    ],
    conns: [[0,1],[1,2],[1,3],[2,4],[2,5],[3,6]],
  },
];

// ─── Canvas element types ─────────────────────────────────────────────────
type ToolType = "select" | "hand" | "connect" | "line" | "text";

interface CanvasLine {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
}

interface CanvasText {
  id: string;
  x: number; y: number;
  text: string;
}

let nodeIdCounter = 0;
const mkId = () => `node-${++nodeIdCounter}`;
let lineIdCounter = 0;
const mkLineId = () => `line-${++lineIdCounter}`;
let textIdCounter = 0;
const mkTextId = () => `text-${++textIdCounter}`;

// ─── Main Component ───────────────────────────────────────────────────────
const SystemDesignSimulator = () => {
  const [nodes, setNodes] = useState<SysNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showChaos, setShowChaos] = useState(false);
  const [activeChaos, setActiveChaos] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const simInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const chaosTick = useRef(0);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [aiTutorOpen, setAiTutorOpen] = useState(false);

  // ── Tool state ──────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<ToolType>("select");

  // ── Zoom & Pan state ────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  // ── Canvas lines ────────────────────────────────────────────────────
  const [canvasLines, setCanvasLines] = useState<CanvasLine[]>([]);
  const [drawingLine, setDrawingLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const isDrawingLine = useRef(false);

  // ── Canvas texts ────────────────────────────────────────────────────
  const [canvasTexts, setCanvasTexts] = useState<CanvasText[]>([]);
  const [editingText, setEditingText] = useState<{ id: string | null; x: number; y: number; text: string } | null>(null);
  const textDragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

  // ── Keyboard shortcuts for tools ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingText) return; // don't switch tools while typing
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      switch (e.key.toLowerCase()) {
        case "v": case "1": setActiveTool("select"); break;
        case "h": case "2": setActiveTool("hand"); break;
        case "c": case "3": setActiveTool("connect"); break;
        case "l": case "4": setActiveTool("line"); break;
        case "t": case "5": setActiveTool("text"); break;
        case "delete": case "backspace":
          if (selected) {
            // Delete selected element (line, text, or node)
            if (selected.startsWith("line-")) {
              setCanvasLines(prev => prev.filter(l => l.id !== selected));
              setSelected(null);
            } else if (selected.startsWith("text-")) {
              setCanvasTexts(prev => prev.filter(t => t.id !== selected));
              setSelected(null);
            }
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, editingText]);

  // ── Helper: screen coords to canvas coords ─────────────────────────
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: clientX, y: clientY };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [zoom, pan]);

  // ── Zoom handler (wheel) ────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(5, Math.max(0.1, zoom * factor));
    const newPanX = mx - (mx - pan.x) * (newZoom / zoom);
    const newPanY = my - (my - pan.y) * (newZoom / zoom);
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [zoom, pan]);

  // ── Pan handlers (hand tool + middle mouse) ─────────────────────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse button always pans
    if (e.button === 1 || activeTool === "hand") {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...pan };
      return;
    }

    // Line tool: start drawing
    if (activeTool === "line") {
      const pt = screenToCanvas(e.clientX, e.clientY);
      isDrawingLine.current = true;
      setDrawingLine({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
      return;
    }

    // Text tool: place text
    if (activeTool === "text") {
      const pt = screenToCanvas(e.clientX, e.clientY);
      setEditingText({ id: null, x: pt.x, y: pt.y, text: "" });
      return;
    }
  }, [activeTool, pan, screenToCanvas]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
      return;
    }
    if (isDrawingLine.current && drawingLine) {
      const pt = screenToCanvas(e.clientX, e.clientY);
      setDrawingLine(prev => prev ? { ...prev, x2: pt.x, y2: pt.y } : null);
      return;
    }
  }, [drawingLine, screenToCanvas]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    if (isDrawingLine.current && drawingLine) {
      isDrawingLine.current = false;
      const dx = drawingLine.x2 - drawingLine.x1;
      const dy = drawingLine.y2 - drawingLine.y1;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        const newLine: CanvasLine = {
          id: mkLineId(),
          x1: drawingLine.x1, y1: drawingLine.y1,
          x2: drawingLine.x2, y2: drawingLine.y2,
        };
        setCanvasLines(prev => [...prev, newLine]);
      }
      setDrawingLine(null);
      return;
    }
  }, [drawingLine]);

  // ── Text commit ─────────────────────────────────────────────────────
  const commitText = useCallback(() => {
    if (!editingText || !editingText.text.trim()) {
      setEditingText(null);
      return;
    }
    if (editingText.id) {
      // Editing existing
      setCanvasTexts(prev => prev.map(t =>
        t.id === editingText.id ? { ...t, text: editingText.text } : t
      ));
    } else {
      // New text
      const newText: CanvasText = {
        id: mkTextId(),
        x: editingText.x,
        y: editingText.y,
        text: editingText.text,
      };
      setCanvasTexts(prev => [...prev, newText]);
    }
    setEditingText(null);
  }, [editingText]);

  // ── Factory helper ────────────────────────────────────────────────
  const mkNode = (type: string, label: string, x: number, y: number, config: Record<string, number>): SysNode => ({
    id: mkId(), type, label, x, y, config,
    health: 1.0,
    metrics: emptyMetrics(),
    history: emptyHistory(),
    ingressQueue: 0,
    processing: 0,
  });

  // ── Drop from toolbox ─────────────────────────────────────────────
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("component-type");
    const comp = COMPONENTS.find(c => c.type === type);
    if (!comp || !canvasRef.current) return;
    const pt = screenToCanvas(e.clientX, e.clientY);
    const x = pt.x - 60;
    const y = pt.y - 30;
    const node = mkNode(type, comp.label, x, y, { ...comp.defaults });
    setNodes(prev => [...prev, node]);
    setSelected(node.id);
    setActiveTool("select");
  }, [screenToCanvas]);

  // ── Node drag (zoom-aware) ─────────────────────────────────────────
  const startDrag = (id: string, e: React.MouseEvent) => {
    if (activeTool !== "select" && activeTool !== "hand") return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    dragRef.current = { id, ox: e.clientX / zoom - node.x, oy: e.clientY / zoom - node.y };
    setSelected(id);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        setNodes(prev => prev.map(n =>
          n.id === dragRef.current!.id
            ? { ...n, x: e.clientX / zoom - dragRef.current!.ox, y: e.clientY / zoom - dragRef.current!.oy }
            : n
        ));
        return;
      }
      if (textDragRef.current) {
        setCanvasTexts(prev => prev.map(t =>
          t.id === textDragRef.current!.id
            ? { ...t, x: e.clientX / zoom - textDragRef.current!.ox, y: e.clientY / zoom - textDragRef.current!.oy }
            : t
        ));
        return;
      }
    };
    const onUp = () => { dragRef.current = null; textDragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [zoom]);

  // ── Connection logic ──────────────────────────────────────────────
  const mkConn = (from: string, to: string): Connection => ({
    id: `conn-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
    from, to, maxConnections: 100, activeConnections: 0,
    throughput: 0, partitioned: false,
    cbState: "closed", cbFailCount: 0, cbCooldown: 0,
  });

  const handlePortClick = (nodeId: string, isOut: boolean) => {
    if (isOut) {
      setConnecting(nodeId);
    } else if (connecting && connecting !== nodeId) {
      const exists = connections.some(c => c.from === connecting && c.to === nodeId);
      if (!exists) {
        setConnections(prev => [...prev, mkConn(connecting, nodeId)]);
      }
      setConnecting(null);
    }
  };

  // ── Delete node ───────────────────────────────────────────────────
  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    if (selected === id) setSelected(null);
  };

  // ── Load template ─────────────────────────────────────────────────
  const loadTemplate = (t: Template) => {
    const newNodes: SysNode[] = t.nodes.map((n) => ({
      ...n, id: mkId(),
      health: 1.0,
      metrics: emptyMetrics(),
      history: emptyHistory(),
      ingressQueue: 0,
      processing: 0,
    }));
    const newConns: Connection[] = t.conns.map(([fi, ti]) =>
      mkConn(newNodes[fi].id, newNodes[ti].id)
    );
    setNodes(newNodes);
    setConnections(newConns);
    setSelected(null);
    setShowTemplates(false);
  };

  // ── Chaos control ─────────────────────────────────────────────────
  const applyChaos = (scenarioId: string) => {
    setActiveChaos(scenarioId);
    chaosTick.current = 0;
    setShowChaos(false);
  };
  const stopChaos = () => {
    setActiveChaos(null);
    chaosTick.current = 0;
    // Restore all nodes to full health
    setNodes(prev => prev.map(n => ({ ...n, health: 1.0 })));
  };

  // ── Simulation tick (v1+v1.5+v2 engine) ────────────────────────────
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const activeChaosRef = useRef(activeChaos);
  activeChaosRef.current = activeChaos;

  const runSim = () => {
    if (simRunning) {
      if (simInterval.current) clearInterval(simInterval.current);
      simInterval.current = null;
      setSimRunning(false);
      return;
    }
    setSimRunning(true);
    simInterval.current = setInterval(() => {
      // Update connections (circuit breaker, throughput, pooling)
      setConnections(prevConns => prevConns.map(c => {
        let conn = { ...c };
        // #10 Circuit breaker cooldown
        if (conn.cbState === "open") {
          conn.cbCooldown = Math.max(0, conn.cbCooldown - 1);
          if (conn.cbCooldown <= 0) conn.cbState = "half-open";
        }
        // Reset throughput each tick (will be recalculated)
        conn.throughput = 0;
        conn.activeConnections = 0;
        return conn;
      }));

      setNodes(prev => {
        const conns = connectionsRef.current;

        // Apply chaos scenario if active
        let working = prev;
        const chaosId = activeChaosRef.current;
        if (chaosId) {
          const scenario = CHAOS_SCENARIOS.find(s => s.id === chaosId);
          if (scenario) {
            chaosTick.current++;
            working = scenario.apply(working, chaosTick.current);
          }
        }

        // First pass: compute backpressure signals (#5)
        const backpressure: Record<string, number> = {};
        working.forEach(n => {
          const maxQ = (n.config.maxRPS || n.config.maxConn || n.config.maxIOPS || 5000) * 2;
          backpressure[n.id] = Math.min(1, n.ingressQueue / Math.max(maxQ, 1));
        });

        // Edge throughput accumulator
        const edgeThroughput: Record<string, number> = {};

        return working.map(n => {
          const h = Math.max(n.health, 0.05);
          const maxRPS = n.config.maxRPS || n.config.maxConn || n.config.maxIOPS || 5000;
          const instances = n.config.instances || n.config.replicas || n.config.shards || 1;
          const effectiveCapacity = maxRPS * instances * h;

          // #11 Rate limiting (API gateway/server nodes)
          const rateLimit = n.config.rateLimit || Infinity;

          // Gather inbound RPS, respecting #13 partitions and #10 circuit breakers
          const inboundEdges = conns.filter(c => c.to === n.id && !c.partitioned && c.cbState !== "open");
          const inbound = inboundEdges.map(c => working.find(p => p.id === c.from)).filter(Boolean) as SysNode[];
          let totalInRPS = inbound.reduce((s, p) => s + p.metrics.rps, 0);

          // #5 Backpressure: if this node is overloaded, signal upstream to reduce
          const myPressure = backpressure[n.id] || 0;
          if (myPressure > 0.8) {
            totalInRPS *= Math.max(0.1, 1 - myPressure);
          }

          // #8 Connection pooling: cap by available connections on edges
          const poolCap = inboundEdges.reduce((s, c) => s + c.maxConnections, 0) || Infinity;
          totalInRPS = Math.min(totalInRPS, poolCap);

          let incoming = n.type === "client" ? (n.config.instances || 1000) : totalInRPS;

          // #4 Read/Write split
          const readRatio = (n.config.readRatio || 80) / 100;
          const reads = incoming * readRatio;
          const writes = incoming * (1 - readRatio);

          // Cache nodes: serve reads at hitRate, forward misses (#4)
          if (n.type === "cache") {
            const hitRate = (n.config.hitRate || 80) / 100;
            const served = reads * hitRate; // served from cache
            incoming = served + writes + reads * (1 - hitRate); // misses go through
          }

          // Queue nodes: writes are async (buffered), reads pass through
          if (n.type === "queue") {
            incoming = writes + reads * 0.1; // most reads skip queue
          }

          // #11 Rate limiting
          incoming = Math.min(incoming, rateLimit * instances);

          // Pipeline stages
          const newIngress = n.ingressQueue + incoming;
          const canProcess = Math.min(newIngress, effectiveCapacity);
          const leftInQueue = Math.max(0, newIngress - canProcess);
          const rps = canProcess;

          // Track edge throughput (#16)
          inboundEdges.forEach(c => {
            edgeThroughput[c.id] = (edgeThroughput[c.id] || 0) + rps / Math.max(inboundEdges.length, 1);
          });

          // Health-degraded metrics with jitter (#7)
          const load = rps / Math.max(effectiveCapacity, 1);
          const jitter = 1 + (Math.random() - 0.5) * 0.4;
          const baseLatency = 5 + load * 200;
          const latency = Math.max(1, (baseLatency / h) * jitter);
          const cpu = Math.min(99, load * 100 + Math.random() * 5);
          const errorRate = Math.min(1, (1 - h) * 0.5 + (load > 0.9 ? (load - 0.9) * 2 : 0));
          const saturation = Math.min(1, load);

          // #9 Retries: errors cause ~30% retry traffic (amplification)
          const retryAmplification = errorRate > 0.05 ? errorRate * 0.3 : 0;

          const history: MetricsHistory = {
            rps: pushHist(n.history.rps, Math.round(rps * (1 + retryAmplification))),
            p95Latency: pushHist(n.history.p95Latency, Math.round(latency * 1.3)),
            errorRate: pushHist(n.history.errorRate, Math.round(errorRate * 100)),
            queueDepth: pushHist(n.history.queueDepth, Math.round(leftInQueue)),
            saturation: pushHist(n.history.saturation, Math.round(saturation * 100)),
          };

          return {
            ...n,
            ingressQueue: leftInQueue,
            processing: canProcess,
            metrics: {
              rps: Math.max(0, Math.round(rps * (1 + retryAmplification))),
              latency: Math.round(latency),
              cpu: Math.round(cpu),
              errorRate: Math.round(errorRate * 100) / 100,
              queueDepth: Math.round(leftInQueue),
            },
            history,
          };
        });
      });

      // Update edge throughput + circuit breaker (#10, #16)
      setConnections(prevConns => prevConns.map(c => {
        let conn = { ...c };
        // #10 Circuit breaker: check if downstream node has high error rate
        // (We approximate by checking if throughput dropped)
        if (conn.cbState === "closed" && conn.cbFailCount > 5) {
          conn.cbState = "open";
          conn.cbCooldown = 30; // 3 seconds at 10 ticks/sec
          conn.cbFailCount = 0;
        }
        if (conn.cbState === "half-open") {
          conn.cbState = "closed"; // allow one request through
          conn.cbFailCount = 0;
        }
        return conn;
      }));

    }, 100);
  };

  useEffect(() => { return () => { if (simInterval.current) clearInterval(simInterval.current); }; }, []);

  // ── Helpers ───────────────────────────────────────────────────────
  const selectedNode = nodes.find(n => n.id === selected);
  const getComp = (type: string) => COMPONENTS.find(c => c.type === type);

  const getNodeCenter = (id: string): [number,number] => {
    const n = nodes.find(nd => nd.id === id);
    return n ? [n.x + 60, n.y + 30] : [0, 0];
  };

  const totalRPS = nodes.reduce((s, n) => n.type === "client" ? s + n.metrics.rps : s, 0);
  const avgLatency = nodes.length ? Math.round(nodes.reduce((s, n) => s + n.metrics.latency, 0) / nodes.length) : 0;
  const avgErrorRate = nodes.length ? Math.round(nodes.reduce((s, n) => s + n.metrics.errorRate, 0) / nodes.length * 100) : 0;
  const bottlenecks = nodes.filter(n => n.metrics.cpu > 80);
  const totalQueue = nodes.reduce((s, n) => s + n.metrics.queueDepth, 0);

  // #18 Cost estimation
  const totalCost = nodes.reduce((s, n) => {
    const base = getCost(n.type);
    const instances = n.config.instances || n.config.replicas || n.config.shards || 1;
    return s + base * instances;
  }, 0);

  // #17 Auto-diagnostics (computed every render when sim running)
  const diagnostics = simRunning ? runDiagnostics(nodes, connections) : [];

  const updateConfig = (key: string, val: number) => {
    if (!selected) return;
    setNodes(prev => prev.map(n => n.id === selected ? { ...n, config: { ...n.config, [key]: val } } : n));
  };

  // #13 Toggle partition on edge
  const togglePartition = (connId: string) => {
    setConnections(prev => prev.map(c =>
      c.id === connId ? { ...c, partitioned: !c.partitioned } : c
    ));
  };

  // #23 Export to SVG/PNG
  const exportDesign = () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "1200");
    svg.setAttribute("height", "800");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.innerHTML = `<rect width="1200" height="800" fill="#0f0f15"/>`;
    // Add connections
    connections.forEach(c => {
      const [x1, y1] = getNodeCenter(c.from);
      const [x2, y2] = getNodeCenter(c.to);
      const mx = (x1 + x2) / 2;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", c.partitioned ? "#ef4444" : "#7c5cfc");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-dasharray", c.partitioned ? "6,4" : "none");
      svg.appendChild(path);
    });
    // Add nodes
    nodes.forEach(n => {
      const comp = getComp(n.type);
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(n.x));
      rect.setAttribute("y", String(n.y));
      rect.setAttribute("width", "120");
      rect.setAttribute("height", "60");
      rect.setAttribute("rx", "12");
      rect.setAttribute("fill", "#1a1a2e");
      rect.setAttribute("stroke", comp?.color || "#666");
      rect.setAttribute("stroke-width", "2");
      g.appendChild(rect);
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(n.x + 60));
      text.setAttribute("y", String(n.y + 35));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "#fff");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-family", "Inter, sans-serif");
      text.textContent = n.label;
      g.appendChild(text);
      svg.appendChild(g);
    });
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "system-design.svg"; a.click();
    URL.revokeObjectURL(url);
  };

  const updateHealth = (val: number) => {
    if (!selected) return;
    setNodes(prev => prev.map(n => n.id === selected ? { ...n, health: val } : n));
  };

  // ── Sparkline SVG helper (#3) ─────────────────────────────────────
  const Sparkline = ({ data, color, w = 80, h = 20 }: { data: number[]; color: string; w?: number; h?: number }) => {
    if (data.length < 2) return null;
    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
    return (
      <svg width={w} height={h} style={{ display: "block" }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="sds-root">
      {/* Header */}
      <header className="sds-header">
        <Link to="/dashboard" className="sds-logo">
          <Zap size={18} />
          <span style={{ background: "linear-gradient(135deg, var(--yellow), var(--orange))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>EduAI</span>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400, marginLeft: 4 }}>/ System Design</span>
        </Link>
        <div className="sds-divider" />
        <button className="sds-icon-btn" onClick={() => setShowTemplates(true)} title="Load template">
          <FolderOpen size={15} />
        </button>
        <button className="sds-icon-btn" onClick={() => { setNodes([]); setConnections([]); setSelected(null); }} title="Clear canvas">
          <Trash2 size={15} />
        </button>
        <button className="sds-icon-btn" onClick={exportDesign} title="Export as SVG">
          <Download size={15} />
        </button>
        {simRunning && (
          <button className={`sds-icon-btn ${showDiagnostics ? 'active' : ''}`} onClick={() => setShowDiagnostics(p => !p)} title="Auto-Diagnostics">
            <Activity size={15} />
          </button>
        )}
        <button
          className={`sds-icon-btn ${aiTutorOpen ? 'active' : ''}`}
          onClick={() => setAiTutorOpen(p => !p)}
          title="AI Tutor"
          style={aiTutorOpen ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
        >
          <Sparkles size={15} />
        </button>
        <div className="sds-spacer" />

        {/* Chaos controls */}
        {simRunning && !activeChaos && (
          <button className="sds-sim-btn chaos" onClick={() => setShowChaos(true)}>
            <Flame size={13} /> Chaos Test
          </button>
        )}
        {simRunning && activeChaos && (
          <button className="sds-sim-btn stop" onClick={stopChaos} style={{ fontSize: 11 }}>
            <X size={13} /> Stop {CHAOS_SCENARIOS.find(s => s.id === activeChaos)?.icon} {CHAOS_SCENARIOS.find(s => s.id === activeChaos)?.name}
          </button>
        )}

        <button className={`sds-sim-btn ${simRunning ? "stop" : "run"}`} onClick={runSim}>
          {simRunning ? <><Square size={13} /> Stop</> : <><Play size={13} /> Simulate</>}
        </button>
      </header>

      {/* Body */}
      <div className="sds-body">
        {/* Toolbox (categorized) */}
        <div className="sds-toolbox">
          {CATEGORIES.map(cat => {
            const items = COMPONENTS.filter(c => c.cat === cat.id);
            if (!items.length) return null;
            return (
              <div className="sds-toolbox-section" key={cat.id}>
                <div className="sds-toolbox-title">{cat.icon} {cat.name}</div>
                <div className="sds-toolbox-grid">
                  {items.map(c => (
                    <div
                      key={c.type}
                      className="sds-toolbox-item"
                      draggable
                      onDragStart={e => { e.dataTransfer.setData("component-type", c.type); e.dataTransfer.effectAllowed = "copy"; }}
                      title={`$${c.cost}/mo per instance`}
                    >
                      <div className="sds-toolbox-icon" style={{ background: c.color + "20", color: c.color }}>{c.icon}</div>
                      <span className="sds-toolbox-label">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Canvas */}
        <div
          className={`sds-canvas-wrap tool-${activeTool}`}
          ref={canvasRef}
          onDragOver={e => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onClick={() => { if (activeTool === "select") { setSelected(null); setConnecting(null); } }}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          {/* ── Floating Canvas Toolbar ──────────────────────────── */}
          <div className="sds-canvas-toolbar">
            <button
              className={`sds-canvas-tool-btn ${activeTool === "select" ? "active" : ""}`}
              onClick={e => { e.stopPropagation(); setActiveTool("select"); }}
              title="Select Tool (V)"
            >
              <MousePointer2 size={16} />
              <span className="tool-key">V</span>
            </button>
            <button
              className={`sds-canvas-tool-btn ${activeTool === "hand" ? "active" : ""}`}
              onClick={e => { e.stopPropagation(); setActiveTool("hand"); }}
              title="Hand Tool — Pan (H)"
            >
              <Hand size={16} />
              <span className="tool-key">H</span>
            </button>
            <div className="sds-tb-sep" />
            <button
              className={`sds-canvas-tool-btn ${activeTool === "connect" ? "active" : ""}`}
              onClick={e => { e.stopPropagation(); setActiveTool("connect"); }}
              title="Connect Tool (C)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              <span className="tool-key">C</span>
            </button>
            <div className="sds-tb-sep" />
            <button
              className={`sds-canvas-tool-btn ${activeTool === "line" ? "active" : ""}`}
              onClick={e => { e.stopPropagation(); setActiveTool("line"); }}
              title="Line Tool (L)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="19" x2="19" y2="5" /></svg>
              <span className="tool-key">L</span>
            </button>
            <button
              className={`sds-canvas-tool-btn ${activeTool === "text" ? "active" : ""}`}
              onClick={e => { e.stopPropagation(); setActiveTool("text"); }}
              title="Text Tool (T)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9.5" y1="20" x2="14.5" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
              <span className="tool-key">T</span>
            </button>
          </div>

          {/* ── Zoom Controls ───────────────────────────────────── */}
          <div className="sds-zoom-controls">
            <button className="sds-zoom-btn" onClick={e => { e.stopPropagation(); setZoom(z => Math.max(0.1, z - 0.1)); }} title="Zoom Out">
              <Minus size={14} />
            </button>
            <span className="sds-zoom-label">{Math.round(zoom * 100)}%</span>
            <button className="sds-zoom-btn" onClick={e => { e.stopPropagation(); setZoom(z => Math.min(5, z + 0.1)); }} title="Zoom In">
              <Plus size={14} />
            </button>
            <button className="sds-zoom-btn" onClick={e => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset Zoom" style={{ fontSize: 10, fontWeight: 700 }}>
              1:1
            </button>
          </div>

          {/* ── Zoomable/Pannable Layer ─────────────────────────── */}
          <div
            className="sds-canvas-layer"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <div className="sds-grid" />

            {/* SVG layer: connections + canvas lines + drawing line */}
            <svg className="sds-connections" style={{ width: 10000, height: 10000, position: "absolute", top: -5000, left: -5000, pointerEvents: "none", zIndex: 2 }}>
              {/* Canvas lines */}
              {canvasLines.map(l => (
                <line
                  key={l.id}
                  x1={l.x1 + 5000} y1={l.y1 + 5000}
                  x2={l.x2 + 5000} y2={l.y2 + 5000}
                  className={`sds-canvas-line ${l.id === selected ? "selected" : ""}`}
                  style={{ pointerEvents: "stroke", cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); setSelected(l.id); }}
                />
              ))}
              {/* Drawing line preview */}
              {drawingLine && (
                <line
                  x1={drawingLine.x1 + 5000} y1={drawingLine.y1 + 5000}
                  x2={drawingLine.x2 + 5000} y2={drawingLine.y2 + 5000}
                  stroke="var(--accent)" strokeWidth="2" strokeDasharray="6,4" opacity="0.7"
                />
              )}
              {/* System connections */}
              {connections.map(c => {
                const [x1, y1] = getNodeCenter(c.from);
                const [x2, y2] = getNodeCenter(c.to);
                const mx = (x1 + x2) / 2;
                const isPartitioned = c.partitioned;
                const isCBOpen = c.cbState === "open";
                const strokeColor = isPartitioned ? "#ef4444" : isCBOpen ? "#f97316" : "var(--accent)";
                const dash = isPartitioned ? "8,4" : isCBOpen ? "4,4" : "none";
                return (
                  <g key={c.id}>
                    <path
                      d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                      fill="none" stroke="transparent" strokeWidth="14"
                      style={{ cursor: "pointer", pointerEvents: "stroke" }}
                      onClick={e => { e.stopPropagation(); togglePartition(c.id); }}
                    >
                      <title>{isPartitioned ? "🔌 Partitioned (click to reconnect)" : `Click to partition · ${c.cbState.toUpperCase()} · ${Math.round(c.throughput)} rps`}</title>
                    </path>
                    <path
                      className={`sds-connection ${simRunning && !isPartitioned ? "active" : ""}`}
                      d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                      style={{ stroke: strokeColor, strokeDasharray: dash }}
                    />
                    {simRunning && !isPartitioned && !isCBOpen && (
                      <circle r="3" className="sds-connection-flow active"
                        style={{ offsetPath: `path("M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}")` }}
                      />
                    )}
                    {(isPartitioned || isCBOpen) && (
                      <text x={(x1+x2)/2} y={(y1+y2)/2 - 8} textAnchor="middle"
                        fill={strokeColor} fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">
                        {isPartitioned ? "🔌 PARTITIONED" : "⚡ CB OPEN"}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Canvas text elements */}
            {canvasTexts.map(t => (
              <div
                key={t.id}
                className={`sds-canvas-text ${t.id === selected ? "selected" : ""}`}
                style={{ left: t.x, top: t.y }}
                onClick={e => { e.stopPropagation(); setSelected(t.id); }}
                onMouseDown={e => {
                  if (activeTool === "select" || activeTool === "hand") {
                    e.stopPropagation();
                    setSelected(t.id);
                    textDragRef.current = { id: t.id, ox: e.clientX / zoom - t.x, oy: e.clientY / zoom - t.y };
                  }
                }}
                onDoubleClick={e => {
                  e.stopPropagation();
                  setEditingText({ id: t.id, x: t.x, y: t.y, text: t.text });
                }}
              >
                {t.text}
              </div>
            ))}

            {/* Text editing input */}
            {editingText && (
              <input
                className="sds-canvas-text-input"
                style={{ left: editingText.x, top: editingText.y }}
                value={editingText.text}
                autoFocus
                placeholder="Type text..."
                onChange={e => setEditingText(prev => prev ? { ...prev, text: e.target.value } : null)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); commitText(); }
                  if (e.key === "Escape") setEditingText(null);
                }}
                onBlur={commitText}
                onClick={e => e.stopPropagation()}
              />
            )}

            {/* Nodes */}
            {nodes.map(n => {
              const comp = getComp(n.type);
              const isBottleneck = simRunning && n.metrics.cpu > 80;
              const isDegraded = n.health < 0.8;
              return (
                <div
                  key={n.id}
                  className={`sds-node ${n.id === selected ? "selected" : ""} ${isBottleneck ? "bottleneck" : ""}`}
                  style={{ left: n.x, top: n.y }}
                  onMouseDown={e => startDrag(n.id, e)}
                  onClick={e => { e.stopPropagation(); setSelected(n.id); }}
                >
                  <div className="sds-node-delete" onClick={e => { e.stopPropagation(); deleteNode(n.id); }}>
                    <X size={10} />
                  </div>
                  {/* Ports */}
                  <div className="sds-port in" onClick={e => { e.stopPropagation(); handlePortClick(n.id, false); }} />
                  <div className="sds-port out" onClick={e => { e.stopPropagation(); handlePortClick(n.id, true); }} />

                  {/* Health bar (#2) */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "12px 12px 0 0", overflow: "hidden", background: "var(--border)" }}>
                    <div style={{
                      width: `${n.health * 100}%`, height: "100%",
                      background: n.health > 0.7 ? "var(--green, #22c55e)" : n.health > 0.4 ? "var(--orange, #f97316)" : "var(--red, #ef4444)",
                      transition: "width 0.15s, background 0.15s",
                    }} />
                  </div>

                  <div className="sds-node-header">
                    <div className="sds-node-icon" style={{ background: (comp?.color || "#666") + "20", color: comp?.color }}>
                      {comp?.icon || "?"}
                    </div>
                    <div>
                      <div className="sds-node-name">
                        {n.label}
                        {isDegraded && <span style={{ color: "var(--orange)", marginLeft: 4, fontSize: 10 }}>⚠</span>}
                      </div>
                      <div className="sds-node-type">{comp?.label} · {Math.round(n.health * 100)}%</div>
                    </div>
                  </div>
                  {simRunning && (
                    <>
                      <div className="sds-node-stats">
                        <div className="sds-node-stat"><span className="val">{n.metrics.rps}</span> rps</div>
                        <div className="sds-node-stat"><span className="val">{n.metrics.latency}</span>ms</div>
                        <div className="sds-node-stat">
                          <span className={`val ${n.metrics.cpu > 80 ? "bad" : n.metrics.cpu > 50 ? "warn" : "good"}`}>
                            {n.metrics.cpu}%
                          </span> cpu
                        </div>
                        {n.metrics.errorRate > 0.05 && (
                          <div className="sds-node-stat"><span className="val bad">{Math.round(n.metrics.errorRate * 100)}%</span> err</div>
                        )}
                      </div>
                      {/* Inline sparkline (#3) */}
                      {n.history.rps.length > 3 && (
                        <div style={{ marginTop: 4, opacity: 0.7 }}>
                          <Sparkline data={n.history.rps} color={comp?.color || "#888"} w={100} h={16} />
                        </div>
                      )}
                      {/* Queue depth indicator (#1) */}
                      {n.metrics.queueDepth > 0 && (
                        <div style={{ fontSize: 9, color: "var(--orange)", marginTop: 2 }}>
                          📋 Queue: {n.metrics.queueDepth}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {nodes.length === 0 && canvasLines.length === 0 && canvasTexts.length === 0 && (
              <div className="sds-empty">
                <div className="sds-empty-icon">🏗️</div>
                <div className="sds-empty-text">
                  Drag components from the left panel<br />or load a template to get started
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties panel */}
        {selectedNode && (
          <div className="sds-props">
            <div className="sds-props-title">
              {getComp(selectedNode.type)?.icon} {selectedNode.label}
            </div>

            {/* Health slider (#2) */}
            <div className="sds-props-section">
              <div className="sds-props-label">Health</div>
              <div className="sds-props-row">
                <span className="sds-props-key" style={{
                  color: selectedNode.health > 0.7 ? "var(--green)" : selectedNode.health > 0.4 ? "var(--orange)" : "var(--red)",
                  fontWeight: 600,
                }}>{Math.round(selectedNode.health * 100)}%</span>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={selectedNode.health}
                  onChange={e => updateHealth(parseFloat(e.target.value))}
                  style={{ width: 100, accentColor: selectedNode.health > 0.7 ? "var(--green)" : selectedNode.health > 0.4 ? "var(--orange)" : "var(--red)" }}
                />
              </div>
            </div>

            <div className="sds-props-section">
              <div className="sds-props-label">Configuration</div>
              {Object.entries(selectedNode.config).map(([k, v]) => (
                <div className="sds-props-row" key={k}>
                  <span className="sds-props-key">{k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</span>
                  <input
                    className="sds-props-input"
                    type="number"
                    value={v}
                    onChange={e => updateConfig(k, parseInt(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>

            {/* Live Metrics + Sparklines (#3) */}
            {simRunning && (
              <div className="sds-props-section">
                <div className="sds-props-label">Live Metrics</div>
                <div className="sds-props-row">
                  <span className="sds-props-key">RPS</span>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{selectedNode.metrics.rps}</span>
                </div>
                <Sparkline data={selectedNode.history.rps} color="var(--accent)" w={220} h={24} />

                <div className="sds-props-row" style={{ marginTop: 8 }}>
                  <span className="sds-props-key">P95 Latency</span>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{selectedNode.history.p95Latency.slice(-1)[0] || 0}ms</span>
                </div>
                <Sparkline data={selectedNode.history.p95Latency} color="var(--orange, #f97316)" w={220} h={24} />

                <div className="sds-props-row" style={{ marginTop: 8 }}>
                  <span className="sds-props-key">Error Rate</span>
                  <span style={{ fontWeight: 600, color: selectedNode.metrics.errorRate > 0.1 ? "var(--red)" : "var(--green)" }}>
                    {Math.round(selectedNode.metrics.errorRate * 100)}%
                  </span>
                </div>
                <Sparkline data={selectedNode.history.errorRate} color="var(--red, #ef4444)" w={220} h={24} />

                <div className="sds-props-row" style={{ marginTop: 8 }}>
                  <span className="sds-props-key">Queue Depth</span>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{selectedNode.metrics.queueDepth}</span>
                </div>
                <Sparkline data={selectedNode.history.queueDepth} color="var(--blue, #3b82f6)" w={220} h={24} />

                <div className="sds-props-row" style={{ marginTop: 8 }}>
                  <span className="sds-props-key">Saturation</span>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{selectedNode.history.saturation.slice(-1)[0] || 0}%</span>
                </div>
                <Sparkline data={selectedNode.history.saturation} color="var(--purple, #8b5cf6)" w={220} h={24} />

                <div className="sds-props-row" style={{ marginTop: 8 }}>
                  <span className="sds-props-key">CPU</span>
                  <span style={{ fontWeight: 600, color: selectedNode.metrics.cpu > 80 ? "var(--red)" : selectedNode.metrics.cpu > 50 ? "var(--orange)" : "var(--green)" }}>
                    {selectedNode.metrics.cpu}%
                  </span>
                </div>

                {/* Pipeline stage indicators (#1) */}
                <div style={{ marginTop: 10, padding: "8px 0", borderTop: "1px solid var(--border)" }}>
                  <div className="sds-props-label">Pipeline</div>
                  <div className="sds-props-row"><span className="sds-props-key">Ingress Queue</span><span style={{ fontWeight: 600, color: "var(--text)" }}>{Math.round(selectedNode.ingressQueue)}</span></div>
                  <div className="sds-props-row"><span className="sds-props-key">Processing</span><span style={{ fontWeight: 600, color: "var(--text)" }}>{Math.round(selectedNode.processing)}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom metrics bar */}
      <div className="sds-metrics">
        <div className="sds-metric">Components: <span className="val">{nodes.length}</span></div>
        <div className="sds-metric">Connections: <span className="val">{connections.length}</span></div>
        {simRunning && (
          <>
            <div className="sds-metric">Total RPS: <span className={`val ${totalRPS > 10000 ? "good" : "warn"}`}>{totalRPS.toLocaleString()}</span></div>
            <div className="sds-metric">Avg Latency: <span className={`val ${avgLatency < 50 ? "good" : avgLatency < 150 ? "warn" : "bad"}`}>{avgLatency}ms</span></div>
            <div className="sds-metric">Errors: <span className={`val ${avgErrorRate > 5 ? "bad" : avgErrorRate > 1 ? "warn" : "good"}`}>{avgErrorRate}%</span></div>
            <div className="sds-metric">Queue: <span className={`val ${totalQueue > 1000 ? "bad" : totalQueue > 100 ? "warn" : "good"}`}>{totalQueue}</span></div>
            <div className="sds-metric">Bottlenecks: <span className={`val ${bottlenecks.length ? "bad" : "good"}`}>{bottlenecks.length}</span></div>
            {activeChaos && (
              <div className="sds-metric" style={{ color: "var(--orange)" }}>
                {CHAOS_SCENARIOS.find(s => s.id === activeChaos)?.icon} Chaos Active
              </div>
            )}
          </>
        )}
        {/* #18 Cost estimation — always visible */}
        <div className="sds-metric" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
          💰 <span className="val">${totalCost.toLocaleString()}</span>/mo
        </div>
        <div className="sds-spacer" />
        <span style={{ opacity: 0.5 }}>Click edges to partition • Drag to add • Simulate to test</span>
      </div>

      {/* #17 Diagnostics panel (floating) */}
      {showDiagnostics && diagnostics.length > 0 && (
        <div style={{
          position: "fixed", bottom: 48, right: 16, width: 340, maxHeight: 320,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
          padding: 14, overflowY: "auto", zIndex: 50,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={14} /> Auto-Diagnostics
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted)" }}>{diagnostics.length} hints</span>
          </div>
          {diagnostics.map((d, i) => (
            <div key={i} style={{
              padding: "6px 8px", borderRadius: 8, marginBottom: 4, fontSize: 11,
              background: d.severity === "error" ? "rgba(239,68,68,0.1)" : d.severity === "warn" ? "rgba(249,115,22,0.1)" : "rgba(34,197,94,0.1)",
              color: d.severity === "error" ? "var(--red, #ef4444)" : d.severity === "warn" ? "var(--orange, #f97316)" : "var(--green, #22c55e)",
              border: `1px solid ${d.severity === "error" ? "rgba(239,68,68,0.2)" : d.severity === "warn" ? "rgba(249,115,22,0.2)" : "rgba(34,197,94,0.2)"}`,
            }}>
              {d.message}
            </div>
          ))}
        </div>
      )}

      {/* Templates modal (educational) */}
      {showTemplates && (
        <div className="sds-templates-overlay" onClick={() => setShowTemplates(false)}>
          <div className="sds-templates-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: "80vh", overflow: "auto" }}>
            <div className="sds-templates-title">📐 System Design Templates</div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Pre-built architectures with learning objectives. Load one, run the simulation, and experiment!
            </p>
            {TEMPLATES.map(t => {
              const diffColor = t.difficulty === "Easy" ? "#22c55e" : t.difficulty === "Medium" ? "#f59e0b" : "#ef4444";
              return (
                <div key={t.id} className="sds-template-card" onClick={() => loadTemplate(t)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                    <div className="sds-template-icon" style={{ background: "var(--accent-soft)" }}>{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="sds-template-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {t.name}
                        <span style={{
                          fontSize: 9, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                          background: diffColor + "20", color: diffColor, textTransform: "uppercase",
                        }}>{t.difficulty}</span>
                      </div>
                      <div className="sds-template-desc">{t.desc}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--accent)", padding: "4px 8px", background: "var(--accent-soft)", borderRadius: 8, width: "100%", lineHeight: 1.5 }}>
                    💡 <strong>Learn:</strong> {t.learn}
                  </div>
                  {t.chaos && (
                    <div style={{ fontSize: 10, color: "var(--orange)", opacity: 0.8 }}>
                      🔥 Try chaos: {CHAOS_SCENARIOS.find(s => s.id === t.chaos)?.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chaos scenarios modal (#20) */}
      {showChaos && (
        <div className="sds-templates-overlay" onClick={() => setShowChaos(false)}>
          <div className="sds-templates-modal" onClick={e => e.stopPropagation()}>
            <div className="sds-templates-title">🔥 Chaos Scenarios</div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Inject real-world failure modes to stress-test your architecture
            </p>
            {CHAOS_SCENARIOS.map(s => (
              <div key={s.id} className="sds-template-card" onClick={() => applyChaos(s.id)}>
                <div className="sds-template-icon" style={{ background: "rgba(239,68,68,0.1)" }}>{s.icon}</div>
                <div>
                  <div className="sds-template-name">{s.name}</div>
                  <div className="sds-template-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Inline AI Tutor ──────────────────────────────────── */}
      {!aiTutorOpen && (
        <button
          className="iat-fab"
          onClick={() => setAiTutorOpen(true)}
          title="Open AI Tutor"
        >
          <Sparkles size={20} />
          <span className="iat-fab-label">✨ AI Tutor</span>
        </button>
      )}

      <InlineAITutor
        open={aiTutorOpen}
        onToggle={() => setAiTutorOpen(p => !p)}
        contextType="system_design"
        systemDesignState={{
          nodes: nodes.map(n => ({
            type: n.type,
            label: n.label,
            config: n.config,
            health: n.health,
            metrics: n.metrics,
          })),
          connections: connections.map(c => ({
            from: nodes.find(n => n.id === c.from)?.label || c.from,
            to: nodes.find(n => n.id === c.to)?.label || c.to,
            partitioned: c.partitioned,
            cbState: c.cbState,
          })),
          simRunning,
          activeChaos,
        }}
      />
    </div>
  );
};

export default SystemDesignSimulator;
