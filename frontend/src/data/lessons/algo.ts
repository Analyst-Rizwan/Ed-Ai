import type { Lesson } from "@/data/learnData";

export const ALGO_LESSONS: Lesson[] = [
  {
    id: 201, subject: "algo", title: "Sorting Algorithms", duration: "18 min", done: false,
    desc: "Bubble, Selection, Merge, Quick, Heap sort — complexity comparison",
    vizType: "algo",
    vizConfig: { module: "sort" },
    content: {
      intro: "Sorting is the most studied problem in CS. Each algorithm makes different trade-offs between time, space, and stability.",
      sections: [
        { type: "text", heading: "Complexity Summary", body: "<table><tr><td>Bubble</td><td>O(n²)</td><td>stable</td></tr><tr><td>Merge</td><td>O(n log n)</td><td>stable</td></tr><tr><td>Quick</td><td>O(n log n) avg</td><td>unstable</td></tr><tr><td>Heap</td><td>O(n log n)</td><td>unstable</td></tr></table>" },
        { type: "callout", style: "tip", heading: "In Practice", body: "TimSort (Python, Java) hybrid of merge + insertion. Fastest on real-world data. O(n log n) worst, O(n) best." },
        { type: "quiz", heading: "Quick Check", q: "Which sort is stable AND O(n log n)?", opts: ["Quick Sort","Heap Sort","Merge Sort","Selection Sort"], ans: 2 },
      ]
    }
  },
  {
    id: 202, subject: "algo", title: "Binary Search", duration: "12 min", done: false,
    desc: "Divide and conquer on sorted arrays, O(log n), search space patterns",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `def binary_search(arr, target):\n    lo, hi = 0, len(arr)-1\n    while lo <= hi:\n        mid = (lo+hi) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n\narr = [2,5,8,12,16,23,38,45]\nbinary_search(arr, 23)  # → 5`,
      steps: [
        { line: 1, vars: { lo:0, hi:7 }, output: "", note: "lo=0 (left), hi=7 (right). Target=23." },
        { line: 3, vars: { lo:0, hi:7, mid:3 }, output: "", note: "mid=(0+7)//2=3. arr[3]=12 < 23 → go right." },
        { line: 6, vars: { lo:4, hi:7, mid:5 }, output: "", note: "lo=4. mid=5. arr[5]=23 == target → return 5." },
        { line: 4, vars: {}, output: "5\n", note: "Found at index 5 in 2 steps. Would take 8 steps linearly." },
      ]
    },
    content: {
      intro: "Binary search eliminates half the search space each step — O(log n) is 20 steps for 1 million elements vs 1 million steps for linear search.",
      sections: [
        { type: "text", heading: "Generalised Pattern", body: "Binary search works on any monotone predicate: 'find the first index where condition is True'. Used for: finding lower/upper bound, rotated sorted array, minimum in mountain array." },
        { type: "quiz", heading: "Quick Check", q: "Binary search on 1M elements takes at most:", opts: ["1000 steps","20 steps","500 steps","100 steps"], ans: 1 },
      ]
    }
  },
  {
    id: 203, subject: "algo", title: "Recursion & Backtracking", duration: "15 min", done: false,
    desc: "Base case, recursive call, call stack, backtracking with pruning",
    vizType: "algo",
    vizConfig: { module: "nqueens" },
    content: {
      intro: "Recursion solves problems by breaking them into smaller identical subproblems. Backtracking adds constraint pruning to skip dead ends.",
      sections: [
        { type: "text", heading: "Fibonacci Breakdown", body: "fib(4) → fib(3)+fib(2) → (fib(2)+fib(1))+(fib(1)+fib(0)). Without memoisation: exponential. With: O(n)." },
        { type: "callout", style: "tip", heading: "Backtracking Template", body: "1. Choose a path. 2. Explore recursively. 3. If dead end: undo (backtrack). Used for: N-Queens, Sudoku, permutations, subsets." },
        { type: "quiz", heading: "Quick Check", q: "Backtracking improves brute force by:", opts: ["Using more memory","Pruning invalid paths early","Using iteration instead","Memoising results"], ans: 1 },
      ]
    }
  },
  {
    id: 204, subject: "algo", title: "Dynamic Programming", duration: "20 min", done: false,
    desc: "Optimal substructure, overlapping subproblems, memoisation vs tabulation",
    vizType: "algo",
    vizConfig: { module: "dp" },
    content: {
      intro: "DP turns exponential problems into polynomial by storing and reusing solutions to overlapping subproblems.",
      sections: [
        { type: "code", heading: "Fibonacci with Memoisation", body: `from functools import lru_cache\n@lru_cache(maxsize=None)\ndef fib(n):\n    if n<=1: return n\n    return fib(n-1) + fib(n-2)\n# O(n) time, O(n) space` },
        { type: "callout", style: "tip", heading: "DP Framework", body: "1. Define state: what changes between subproblems? 2. Base case. 3. Transition: how to build bigger from smaller? 4. Answer: which state gives the final answer?" },
        { type: "quiz", heading: "Quick Check", q: "DP works when a problem has:", opts: ["Greedy choice property","Optimal substructure + overlapping subproblems","No base case","Linear structure only"], ans: 1 },
      ]
    }
  },
  {
    id: 205, subject: "algo", title: "Greedy Algorithms", duration: "14 min", done: false,
    desc: "Greedy choice property, activity selection, Huffman coding",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `# Activity selection: max non-overlapping intervals\n# Sort by end time (greedy choice)\nactivities = [(1,3),(2,5),(3,9),(6,8)]\nactivities.sort(key=lambda x: x[1])\n\nselected = []\nlast_end = 0\nfor start, end in activities:\n    if start >= last_end:\n        selected.append((start,end))\n        last_end = end\n# [(1,3),(3,9)] or [(1,3),(6,8)]`,
      steps: [
        { line: 2, vars: { activities: "[(1,3),(2,5),(3,9),(6,8)]" }, output: "", note: "Unsorted activities. Each is (start, end)." },
        { line: 3, vars: { activities: "[(1,3),(2,5),(6,8),(3,9)]" }, output: "", note: "Sort by end time — greedy: always pick the earliest-finishing compatible activity." },
        { line: 8, vars: { "last_end": 3, selected: "[(1,3)]" }, output: "", note: "Activity (1,3): start=1 >= last_end=0. Select it. last_end=3." },
        { line: 8, vars: { "last_end": 3, selected: "[(1,3)]" }, output: "", note: "Activity (2,5): start=2 < last_end=3. Skip." },
        { line: 8, vars: { "last_end": 8, selected: "[(1,3),(6,8)]" }, output: "", note: "Activity (6,8): start=6 >= 3. Select. Final: 2 activities." },
      ]
    },
    content: {
      intro: "Greedy algorithms make the locally optimal choice at each step. Faster than DP when the greedy choice property holds.",
      sections: [
        { type: "text", heading: "When Greedy Works", body: "Greedy works when: (1) Greedy choice property: local optimal → global optimal. (2) Optimal substructure. Activity selection, Huffman coding, Dijkstra's, Kruskal's all use greedy." },
        { type: "quiz", heading: "Quick Check", q: "In activity selection, the greedy choice is:", opts: ["Pick longest activity","Pick activity with earliest start","Pick activity with earliest end","Pick activity with most overlap"], ans: 2 },
      ]
    }
  },
  {
    id: 206, subject: "algo", title: "Graph Algorithms — BFS & DFS", duration: "16 min", done: false,
    desc: "Breadth-first and depth-first traversal, applications, complexity",
    vizType: "algo",
    vizConfig: { module: "graph" },
    content: {
      intro: "BFS and DFS are the two fundamental graph traversal algorithms. Every other graph algorithm builds on them.",
      sections: [
        { type: "text", heading: "BFS vs DFS", body: "<strong>BFS</strong>: uses a queue, explores level by level. Finds shortest path (unweighted). <strong>DFS</strong>: uses a stack/recursion, explores depth first. Detects cycles, finds topological order." },
        { type: "code", heading: "BFS Template", body: `from collections import deque\ndef bfs(graph, start):\n    visited, queue = {start}, deque([start])\n    while queue:\n        node = queue.popleft()\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)` },
        { type: "quiz", heading: "Quick Check", q: "BFS finds shortest path because:", opts: ["It uses recursion","It explores nodes level by level","It uses a stack","It backtracks"], ans: 1 },
      ]
    }
  },
  {
    id: 207, subject: "algo", title: "Dijkstra's Algorithm", duration: "18 min", done: false,
    desc: "Shortest path in weighted graphs, priority queue, greedy approach",
    vizType: "algo",
    vizConfig: { module: "graph" },
    content: {
      intro: "Dijkstra's finds the shortest path in a weighted graph (non-negative weights). It's the foundation of GPS routing and network routing protocols.",
      sections: [
        { type: "code", heading: "Dijkstra with heapq", body: `import heapq\ndef dijkstra(graph, src):\n    dist = {v: float('inf') for v in graph}\n    dist[src] = 0\n    pq = [(0, src)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist[u]: continue\n        for v, w in graph[u]:\n            if dist[u]+w < dist[v]:\n                dist[v] = dist[u]+w\n                heapq.heappush(pq,(dist[v],v))\n    return dist` },
        { type: "callout", style: "warn", heading: "Negative Weights", body: "Dijkstra fails with negative weights. Use Bellman-Ford (O(VE)) for negative weights, or Floyd-Warshall (O(V³)) for all-pairs." },
        { type: "quiz", heading: "Quick Check", q: "Dijkstra's time complexity with binary heap:", opts: ["O(V+E)","O(E log V)","O(V²)","O(V log E)"], ans: 1 },
      ]
    }
  },
  {
    id: 208, subject: "algo", title: "KMP String Matching", duration: "16 min", done: false,
    desc: "Failure function, linear-time pattern matching, avoid redundant comparisons",
    vizType: "algo",
    vizConfig: { module: "kmp" },
    content: {
      intro: "Naïve string matching is O(n×m). KMP achieves O(n+m) by precomputing a failure function that skips redundant comparisons.",
      sections: [
        { type: "code", heading: "KMP Algorithm", body: `def kmp_search(text, pattern):\n    lps = build_lps(pattern)  # O(m)\n    i = j = 0\n    while i < len(text):\n        if text[i] == pattern[j]:\n            i += 1; j += 1\n        if j == len(pattern):\n            return i - j  # found\n        elif i < len(text) and text[i] != pattern[j]:\n            j = lps[j-1] if j else i.__add__(1) or 0` },
        { type: "text", heading: "LPS Array", body: "Longest Proper Prefix which is also Suffix. For 'AABAA': [0,1,0,1,2]. When mismatch, jump j back to lps[j-1] instead of resetting — reuse already-matched prefix." },
        { type: "quiz", heading: "Quick Check", q: "KMP's advantage over naïve search:", opts: ["Uses less memory","O(n+m) vs O(n×m)","Works on binary only","Uses regex"], ans: 1 },
      ]
    }
  },
  {
    id: 209, subject: "algo", title: "Two Pointers & Sliding Window", duration: "15 min", done: false,
    desc: "O(n) solutions for subarray problems with two-pointer technique",
    vizType: "algo",
    vizConfig: { module: "twoptr" },
    content: {
      intro: "Two pointers and sliding window convert O(n²) brute force into O(n) by maintaining a window that expands and contracts.",
      sections: [
        { type: "code", heading: "Sliding Window Maximum", body: `# Longest substring with at most k distinct chars\ndef longest_k_distinct(s, k):\n    counts = {}\n    left = result = 0\n    for right, c in enumerate(s):\n        counts[c] = counts.get(c, 0) + 1\n        while len(counts) > k:\n            counts[s[left]] -= 1\n            if counts[s[left]] == 0: del counts[s[left]]\n            left += 1\n        result = max(result, right - left + 1)\n    return result` },
        { type: "quiz", heading: "Quick Check", q: "Sliding window is useful for:", opts: ["Sorted array problems","Subarray/substring problems","Graph traversal","Matrix problems"], ans: 1 },
      ]
    }
  },
  {
    id: 210, subject: "algo", title: "Bit Manipulation", duration: "13 min", done: false,
    desc: "Bitwise tricks: power of 2, single number, bit count, subsets",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `n = 12  # 0b1100\n\n# Check if power of 2\nis_pow2 = n and (n & (n-1)) == 0  # False for 12\n\n# Count set bits (Brian Kernighan)\ncount = 0\nwhile n:\n    n &= (n-1)  # removes lowest set bit\n    count += 1\n# count = 2 (bits 2,3)`,
      steps: [
        { line: 0, vars: { n: "12=0b1100" }, output: "", note: "12 in binary: 1100. Two bits set (at positions 2 and 3)." },
        { line: 3, vars: { is_pow2: "False" }, output: "", note: "n & (n-1) clears lowest set bit. If n is power-of-2, result=0. 12=1100, 11=1011, 1100&1011=1000≠0." },
        { line: 7, vars: { n: "0b1000", count: 1 }, output: "", note: "n &= (n-1): 1100 & 1011 = 1000. Removed lowest set bit." },
        { line: 7, vars: { n: "0b0000", count: 2 }, output: "", note: "1000 & 0111 = 0. Loop ends. count=2." },
      ]
    },
    content: {
      intro: "Bit manipulation gives O(1) or O(number of bits) solutions to problems that would otherwise require O(n) loops.",
      sections: [
        { type: "text", heading: "Essential Tricks", body: "<code>x & 1</code>: odd check. <code>x >> 1</code>: divide by 2. <code>x << 1</code>: multiply by 2. <code>x ^ x = 0</code>: XOR with self. <code>x ^ 0 = x</code>: XOR with 0. Used for: find single non-duplicate number, toggle bits, generate all subsets." },
        { type: "quiz", heading: "Quick Check", q: "n & (n-1) == 0 tests if n is:", opts: ["Odd","Even","Power of 2","Prime"], ans: 2 },
      ]
    }
  },
  {
    id: 211, subject: "algo", title: "Minimum Spanning Tree", duration: "16 min", done: false,
    desc: "Prim's and Kruskal's algorithms, greedy MST, Union-Find",
    vizType: "algo",
    vizConfig: { module: "graph" },
    content: {
      intro: "A Minimum Spanning Tree connects all vertices with minimum total edge weight. Kruskal's uses Union-Find; Prim's uses a priority queue.",
      sections: [
        { type: "text", heading: "Kruskal's vs Prim's", body: "<strong>Kruskal's</strong>: sort edges by weight, add edge if it doesn't form cycle (Union-Find). O(E log E). Better for sparse graphs. <strong>Prim's</strong>: grow MST from a source, always pick min-weight crossing edge. O(E log V) with heap. Better for dense graphs." },
        { type: "code", heading: "Kruskal's Implementation", body: `def kruskal(n, edges):\n    edges.sort(key=lambda e: e[2])  # sort by weight\n    uf = UF(n)\n    mst_cost = 0\n    for u, v, w in edges:\n        if uf.find(u) != uf.find(v):\n            uf.union(u, v)\n            mst_cost += w\n    return mst_cost` },
        { type: "quiz", heading: "Quick Check", q: "Kruskal's algorithm uses which data structure?", opts: ["Heap","Queue","Union-Find","Stack"], ans: 2 },
      ]
    }
  },
  {
    id: 212, subject: "algo", title: "Topological Sort & SCC", duration: "16 min", done: false,
    desc: "DAG topological ordering with Kahn's algorithm, Kosaraju's SCC",
    vizType: "algo",
    vizConfig: { module: "graph" },
    content: {
      intro: "Topological sort linearly orders nodes in a DAG (Directed Acyclic Graph). Used for build systems, course prerequisites, task scheduling.",
      sections: [
        { type: "code", heading: "Kahn's Algorithm (BFS-based)", body: `def toposort(graph, in_degree):\n    queue = deque([n for n in graph if in_degree[n]==0])\n    order = []\n    while queue:\n        node = queue.popleft()\n        order.append(node)\n        for neighbor in graph[node]:\n            in_degree[neighbor] -= 1\n            if in_degree[neighbor] == 0:\n                queue.append(neighbor)\n    return order if len(order)==len(graph) else []  # empty = cycle` },
        { type: "text", heading: "SCC (Strongly Connected Components)", body: "Kosaraju's algorithm finds SCCs in two DFS passes: (1) DFS on original, push to stack by finish time. (2) DFS on transpose graph in stack order. Each DFS tree in step 2 is an SCC." },
        { type: "quiz", heading: "Quick Check", q: "Topological sort is only valid on:", opts: ["Any graph","Undirected graphs","DAGs (no cycles)","Trees"], ans: 2 },
      ]
    }
  },
];
