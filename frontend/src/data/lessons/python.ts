import type { Lesson } from "@/data/learnData";

export const PYTHON_LESSONS: Lesson[] = [
  {
    id: 401, subject: "python", title: "List Comprehensions", duration: "9 min", done: false,
    desc: "Concise list creation with conditions and expressions",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `numbers = [1, 2, 3, 4, 5, 6, 7, 8]\n\n# Traditional loop\nsquares = []\nfor n in numbers:\n    if n % 2 == 0:\n        squares.append(n**2)\n\n# Comprehension (equivalent)\nsquares = [n**2 for n in numbers if n % 2 == 0]\n# [4, 16, 36, 64]`,
      steps: [
        { line: 0, vars: { numbers: "[1..8]" }, output: "", note: "Input list of 8 integers." },
        { line: 3, vars: { squares: "[]" }, output: "", note: "Traditional approach: empty list, then loop." },
        { line: 4, vars: { n: 2, squares: "[4]" }, output: "", note: "n=2 is even — append 2²=4." },
        { line: 9, vars: { squares: "[4,16,36,64]" }, output: "", note: "Comprehension: [n**2 for n in numbers if n%2==0]. One line, same result." },
      ]
    },
    content: {
      intro: "List comprehensions are one of Python's most beloved features — readable, concise, and faster than equivalent for-loops.",
      sections: [
        { type: "text", heading: "Syntax", body: "<code>[expression for item in iterable if condition]</code>. All three parts: expression, iteration, and optional filter." },
        { type: "code", heading: "Nested Comprehension", body: `matrix = [[i*j for j in range(1,4)] for i in range(1,4)]\n# [[1,2,3],[2,4,6],[3,6,9]]` },
        { type: "quiz", heading: "Quick Check", q: "[x**2 for x in range(5) if x>2] produces:", opts: ["[0,1,4,9,16]","[9,16]","[4,9,16]","[9,16,25]"], ans: 1 },
      ]
    }
  },
  {
    id: 402, subject: "python", title: "Decorators", duration: "14 min", done: false,
    desc: "Function wrappers, @syntax, preserving metadata with functools.wraps",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `def timer(func):\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        print(f"{time.time()-start:.3f}s")\n        return result\n    return wrapper\n\n@timer\ndef slow_add(a, b):\n    time.sleep(0.1)\n    return a + b\n\nslow_add(2, 3)  # prints "0.100s", returns 5`,
      steps: [
        { line: 0, vars: {}, output: "", note: "timer is a higher-order function that takes a function as argument." },
        { line: 1, vars: {}, output: "", note: "wrapper is a closure — it captures 'func' from the outer scope." },
        { line: 8, vars: {}, output: "", note: "@timer is sugar for: slow_add = timer(slow_add)." },
        { line: 13, vars: {}, output: "0.100s\n", note: "Calling slow_add actually calls wrapper, which calls the original func." },
      ]
    },
    content: {
      intro: "Decorators modify functions without changing their source code. They're used for logging, caching, authentication, and timing.",
      sections: [
        { type: "callout", style: "tip", heading: "Use functools.wraps", body: "<code>@functools.wraps(func)</code> on your wrapper preserves the original function's __name__ and __doc__. Always add this." },
        { type: "quiz", heading: "Quick Check", q: "@decorator syntax is equivalent to:", opts: ["decorator.apply(func)","func = decorator(func)","func.decorate()","decorator + func"], ans: 1 },
      ]
    }
  },
  {
    id: 403, subject: "python", title: "Generators", duration: "12 min", done: false,
    desc: "yield, lazy evaluation, generator expressions, send()",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `def fibonacci():\n    a, b = 0, 1\n    while True:\n        yield a       # pause here, return a\n        a, b = b, a+b # resume from here\n\ngen = fibonacci()\nprint(next(gen))  # 0\nprint(next(gen))  # 1\nprint(next(gen))  # 1`,
      steps: [
        { line: 0, vars: {}, output: "", note: "Calling fibonacci() returns a generator object. No code executes yet." },
        { line: 7, vars: { gen: "generator" }, output: "", note: "gen = fibonacci(). Still no computation." },
        { line: 3, vars: { a: 0, b: 1 }, output: "0\n", note: "next(gen): runs until yield a. Yields 0, then PAUSES. State preserved." },
        { line: 3, vars: { a: 1, b: 1 }, output: "0\n1\n", note: "next(gen): resumes from after yield. a,b=1,1. Yields 1." },
        { line: 3, vars: { a: 1, b: 2 }, output: "0\n1\n1\n", note: "next(gen): a,b=1,2. Yields 1." },
      ]
    },
    content: {
      intro: "Generators produce values lazily — one at a time, on demand. They're memory-efficient for large datasets and infinite sequences.",
      sections: [
        { type: "text", heading: "Memory Efficiency", body: "A list of 1M numbers uses ~8MB. A generator for the same range uses ~200 bytes — it only stores the current state, not all values." },
        { type: "quiz", heading: "Quick Check", q: "A generator function is identified by:", opts: ["return keyword","yield keyword","async keyword","gen() call"], ans: 1 },
      ]
    }
  },
  {
    id: 404, subject: "python", title: "OOP in Python", duration: "14 min", done: false,
    desc: "__init__, __str__, inheritance, super(), @classmethod, @staticmethod",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return f"{self.name} speaks"\n\nclass Dog(Animal):\n    def speak(self):\n        return f"{self.name} says Woof!"\n\nd = Dog("Rex")\nprint(d.speak())  # Rex says Woof!`,
      steps: [
        { line: 1, vars: {}, output: "", note: "__init__ is the constructor. self refers to the instance." },
        { line: 6, vars: {}, output: "", note: "Dog(Animal) inherits from Animal. Gets all its methods." },
        { line: 7, vars: {}, output: "", note: "speak() overrides Animal.speak(). Method resolution order finds Dog.speak() first." },
        { line: 10, vars: { d: "Dog(Rex)" }, output: "", note: "Dog('Rex') calls Animal.__init__ first (via inheritance)." },
        { line: 11, vars: {}, output: "Rex says Woof!\n", note: "d.speak() calls Dog.speak() — polymorphism at work." },
      ]
    },
    content: {
      intro: "Python's OOP is dynamic and flexible. Everything is an object, including classes and functions.",
      sections: [
        { type: "text", heading: "@classmethod vs @staticmethod", body: "<code>@classmethod</code>: receives cls as first arg — used for alternative constructors. <code>@staticmethod</code>: no implicit arg — utility functions related to the class." },
        { type: "quiz", heading: "Quick Check", q: "super() in Python is used to:", opts: ["Create a new class","Call parent class methods","List subclasses","Check inheritance"], ans: 1 },
      ]
    }
  },
  {
    id: 405, subject: "python", title: "File I/O & Context Managers", duration: "10 min", done: false,
    desc: "with statement, open(), read/write modes, pathlib",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `from pathlib import Path\n\npath = Path("data.txt")\n\n# Write\npath.write_text("Hello Python\\n")\n\n# Read\nwith open(path, 'r') as f:\n    for line in f:\n        print(line.strip())`,
      steps: [
        { line: 2, vars: { path: "data.txt" }, output: "", note: "Path is cross-platform. path / 'subdir' / 'file.txt' works on all OS." },
        { line: 5, vars: {}, output: "", note: "write_text() opens, writes, and closes atomically. Simple one-liner." },
        { line: 7, vars: { f: "file" }, output: "", note: "with open() — context manager calls f.close() automatically on exit." },
        { line: 8, vars: { line: "Hello Python" }, output: "Hello Python\n", note: "Iterating over file reads line by line — memory efficient for huge files." },
      ]
    },
    content: {
      intro: "Python's with statement guarantees resource cleanup. pathlib makes file paths expressive and cross-platform.",
      sections: [
        { type: "quiz", heading: "Quick Check", q: "The 'with' statement ensures:", opts: ["Faster I/O","File is closed even if exception occurs","File is read-only","Automatic encoding detection"], ans: 1 },
      ]
    }
  },
  {
    id: 406, subject: "python", title: "Error Handling", duration: "10 min", done: false,
    desc: "try/except/else/finally, raising exceptions, custom exception classes",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `try:\n    result = 10 / 0\nexcept ZeroDivisionError as e:\n    print(f"Error: {e}")\nexcept (TypeError, ValueError) as e:\n    print(f"Type error: {e}")\nelse:\n    print("Success:", result)\nfinally:\n    print("Always runs")`,
      steps: [
        { line: 1, vars: {}, output: "", note: "10/0 raises ZeroDivisionError." },
        { line: 2, vars: { e: "ZeroDivisionError" }, output: "Error: division by zero\n", note: "except ZeroDivisionError catches it. Code in try after exception skipped." },
        { line: 6, vars: {}, output: "Error: division by zero\n", note: "else block skipped — only runs if NO exception occurred." },
        { line: 8, vars: {}, output: "Error: division by zero\nAlways runs\n", note: "finally always executes — good for cleanup: closing files, DB connections." },
      ]
    },
    content: {
      intro: "Python exception handling is expressive. else (no exception) and finally (always runs) complete the full try block.",
      sections: [
        { type: "code", heading: "Custom Exception", body: `class InsufficientFunds(Exception):\n    def __init__(self, balance, amount):\n        super().__init__(f"Need {amount}, have {balance}")\n\nraise InsufficientFunds(50, 100)` },
        { type: "quiz", heading: "Quick Check", q: "The else clause in try/except runs when:", opts: ["An exception occurs","No exception occurs","finally completes","catch block runs"], ans: 1 },
      ]
    }
  },
  {
    id: 407, subject: "python", title: "Lambda & Functional Tools", duration: "11 min", done: false,
    desc: "lambda, map, filter, functools.reduce, partial",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `nums = [1, 2, 3, 4, 5]\n\n# map: apply function to each element\nsquared = list(map(lambda x: x**2, nums))\n# [1, 4, 9, 16, 25]\n\n# filter: keep elements where function returns True\nevens = list(filter(lambda x: x%2==0, nums))\n# [2, 4]\n\nfrom functools import reduce\ntotal = reduce(lambda acc, x: acc+x, nums, 0) # 15`,
      steps: [
        { line: 3, vars: { squared: "[1,4,9,16,25]" }, output: "", note: "map() applies lambda to each element lazily. list() forces evaluation." },
        { line: 7, vars: { evens: "[2,4]" }, output: "", note: "filter() keeps elements where lambda returns True." },
        { line: 10, vars: { total: 15 }, output: "", note: "reduce() folds: acc=0+1=1, 1+2=3, 3+3=6, 6+4=10, 10+5=15." },
      ]
    },
    content: {
      intro: "Python supports functional programming through first-class functions, lambda, and functools.",
      sections: [
        { type: "callout", style: "tip", heading: "Prefer Comprehensions", body: "For simple cases, list comprehensions are more Pythonic than map/filter: <code>[x**2 for x in nums]</code> vs <code>list(map(lambda x: x**2, nums))</code>." },
        { type: "quiz", heading: "Quick Check", q: "reduce() with initial value 0 and [1,2,3] returns:", opts: ["3","[1,2,3]","6","0"], ans: 2 },
      ]
    }
  },
  {
    id: 408, subject: "python", title: "Async/Await", duration: "15 min", done: false,
    desc: "asyncio, coroutines, gather, event loop, I/O concurrency",
    vizType: "diagram",
    vizConfig: {
      nodes: [
        { id:"loop",  label:"Event Loop",      sublabel:"manages coroutines",   x:50, y:10, color:"var(--accent)" },
        { id:"c1",    label:"coroutine: fetch(url1)", sublabel:"awaiting I/O", x:20, y:60, color:"var(--green)" },
        { id:"c2",    label:"coroutine: fetch(url2)", sublabel:"awaiting I/O", x:50, y:60, color:"var(--yellow)" },
        { id:"c3",    label:"coroutine: fetch(url3)", sublabel:"awaiting I/O", x:80, y:60, color:"var(--orange)" },
        { id:"result",label:"Results gathered",        sublabel:"all complete",  x:50, y:90, color:"var(--purple)", highlight:true },
      ],
      edges: [
        { from:"loop", to:"c1", label:"run" },
        { from:"loop", to:"c2", label:"run" },
        { from:"loop", to:"c3", label:"run" },
        { from:"c1", to:"result", animated:true },
        { from:"c2", to:"result", animated:true },
        { from:"c3", to:"result", animated:true },
      ],
      steps: [
        { title:"Sequential (slow)", note:"Without async: fetch(url1) blocks 200ms, then fetch(url2), then url3. Total: 600ms.", highlightNodes:["c1"] },
        { title:"Concurrent with asyncio", note:"asyncio.gather(fetch(url1), fetch(url2), fetch(url3)) — all start together. While url1 awaits I/O, event loop runs url2.", highlightNodes:["c1","c2","c3"] },
        { title:"All results gathered", note:"Total time ≈ slowest request (200ms), not sum (600ms). 3× speedup with zero threads.", highlightNodes:["result"] },
      ]
    },
    content: {
      intro: "asyncio enables I/O concurrency with a single thread. Perfect for web scraping, API calls, and network servers.",
      sections: [
        { type: "code", heading: "async/await Pattern", body: `import asyncio, aiohttp\n\nasync def fetch(url):\n    async with aiohttp.ClientSession() as s:\n        async with s.get(url) as r:\n            return await r.text()\n\nasync def main():\n    results = await asyncio.gather(\n        fetch("https://api1.com"),\n        fetch("https://api2.com"),\n    )\n\nasyncio.run(main())` },
        { type: "quiz", heading: "Quick Check", q: "asyncio.gather() runs coroutines:", opts: ["Sequentially","Concurrently (not in parallel)","In separate threads","In separate processes"], ans: 1 },
      ]
    }
  },
  {
    id: 409, subject: "python", title: "Unit Testing with pytest", duration: "12 min", done: false,
    desc: "pytest basics, fixtures, parametrize, monkeypatching",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `import pytest\n\ndef add(a, b): return a + b\n\n@pytest.mark.parametrize("a,b,exp", [\n    (1, 2, 3),\n    (0, 0, 0),\n    (-1, 1, 0),\n])\ndef test_add(a, b, exp):\n    assert add(a, b) == exp`,
      steps: [
        { line: 4, vars: {}, output: "", note: "@parametrize generates 3 separate test cases from the table — DRY testing." },
        { line: 9, vars: { a: 1, b: 2, exp: 3 }, output: "✅ PASS (1+2==3)\n", note: "First run: a=1, b=2, exp=3. assert 3==3 passes." },
        { line: 9, vars: { a: 0, b: 0, exp: 0 }, output: "✅ PASS (0+0==0)\n", note: "Second run: a=0, b=0. Passes." },
        { line: 9, vars: { a: -1, b: 1, exp: 0 }, output: "✅ PASS (-1+1==0)\n", note: "Third run: a=-1, b=1. Passes. All 3 cases covered." },
      ]
    },
    content: {
      intro: "pytest is Python's best-in-class test framework. Fixtures, parametrize, and rich failure messages make it far superior to unittest.",
      sections: [
        { type: "code", heading: "Fixture Example", body: `@pytest.fixture\ndef db_conn():\n    conn = create_test_db()\n    yield conn\n    conn.close()  # cleanup\n\ndef test_query(db_conn):\n    result = db_conn.execute("SELECT 1")\n    assert result == 1` },
        { type: "quiz", heading: "Quick Check", q: "@pytest.fixture with yield:", opts: ["Runs only setup","Runs setup + cleanup","Skips tests","Runs in parallel"], ans: 1 },
      ]
    }
  },
  {
    id: 410, subject: "python", title: "Regular Expressions", duration: "12 min", done: false,
    desc: "re module, match vs search vs findall, groups, compile",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `import re\n\ntext = "Emails: alice@test.com and bob@work.org"\n\npattern = r'[\\w.+-]+@[\\w-]+\\.[a-z]{2,4}'\nemails = re.findall(pattern, text)\n# ['alice@test.com', 'bob@work.org']\n\n# Named group\nm = re.search(r'(?P<user>\\w+)@(?P<domain>[\\w.]+)', text)\nprint(m.group('user'))   # alice`,
      steps: [
        { line: 4, vars: { pattern: "email regex" }, output: "", note: "Raw string r'' avoids double-escaping. \\w matches word chars, + means one or more." },
        { line: 5, vars: { emails: "['alice@test.com','bob@work.org']" }, output: "", note: "findall() returns all non-overlapping matches as a list." },
        { line: 9, vars: { m: "Match object" }, output: "", note: "(?P<name>...) creates a named capturing group." },
        { line: 10, vars: {}, output: "alice\n", note: "m.group('user') retrieves the named capture group." },
      ]
    },
    content: {
      intro: "Regular expressions are a mini-language for pattern matching in strings. Essential for parsing, validation, and text processing.",
      sections: [
        { type: "text", heading: "match vs search vs findall", body: "<code>match()</code>: only at string start. <code>search()</code>: anywhere in string, returns first match. <code>findall()</code>: all matches as list. <code>finditer()</code>: all matches as iterator." },
        { type: "quiz", heading: "Quick Check", q: "re.findall() returns:", opts: ["First match only","All matches as a list","A match object","True/False"], ans: 1 },
      ]
    }
  },
  {
    id: 411, subject: "python", title: "Type Hints & Mypy", duration: "12 min", done: false,
    desc: "PEP 484 type hints, Optional, Union, TypeVar, runtime type checking",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `from typing import Optional, Union\n\ndef greet(name: str, age: Optional[int] = None) -> str:\n    if age:\n        return f"Hello {name}, age {age}"\n    return f"Hello {name}"\n\n# Union type\ndef parse(val: Union[int, str]) -> str:\n    return str(val)\n\nresult: str = greet("Alice", 25)`,
      steps: [
        { line: 2, vars: {}, output: "", note: "str, Optional[int]—type hints. Optional[int] = int | None. Python ignores at runtime." },
        { line: 3, vars: {}, output: "", note: "-> str declares return type. Mypy checks these statically." },
        { line: 8, vars: {}, output: "", note: "Union[int, str] — either type accepted. Python 3.10+: int | str." },
        { line: 11, vars: { result: "Hello Alice, age 25" }, output: "", note: "greet returns str. result: str annotation and Mypy confirm type safety." },
      ]
    },
    content: {
      intro: "Type hints make Python code self-documenting and enable static analysis with mypy — catching bugs before runtime.",
      sections: [
        { type: "callout", style: "tip", heading: "Run Mypy", body: "<code>pip install mypy && mypy myfile.py</code>. Catches type errors like passing an int where a string is expected, before running." },
        { type: "quiz", heading: "Quick Check", q: "Type hints in Python are enforced at:", opts: ["Runtime by default","Compile time","By mypy (statically)","Never"], ans: 2 },
      ]
    }
  },
  {
    id: 412, subject: "python", title: "Packaging & Virtual Environments", duration: "11 min", done: false,
    desc: "venv, pip, pyproject.toml, __init__.py, publishing to PyPI",
    vizType: "codeStep",
    vizConfig: {
      language: "python",
      code: `# Create and activate virtual environment\n# python -m venv .venv\n# .venv/Scripts/activate  (Windows)\n# source .venv/bin/activate  (Linux/Mac)\n\n# Install dependencies\n# pip install requests\n\n# Freeze requirements\n# pip freeze > requirements.txt\n\n# Install from requirements\n# pip install -r requirements.txt`,
      steps: [
        { line: 1, vars: {}, output: "", note: "python -m venv .venv creates an isolated environment with its own Python and pip." },
        { line: 2, vars: {}, output: "", note: "Activate: now pip install only installs into this environment. Doesn't affect system Python." },
        { line: 6, vars: {}, output: "", note: "pip install requests downloads from PyPI into the active venv." },
        { line: 9, vars: {}, output: "", note: "pip freeze captures all installed packages + exact versions. Reproducible environments." },
        { line: 12, vars: {}, output: "", note: "Another developer runs pip install -r requirements.txt to get identical dependencies." },
      ]
    },
    content: {
      intro: "Virtual environments isolate project dependencies. Every Python project should use one.",
      sections: [
        { type: "text", heading: "Modern: pyproject.toml", body: "Replace requirements.txt with <code>pyproject.toml</code> (PEP 517/518). Tools like Poetry and Hatch manage venvs, dependencies, and publishing in one command." },
        { type: "quiz", heading: "Quick Check", q: "Virtual environments are used to:", opts: ["Speed up Python","Isolate project dependencies","Run multiple Python versions simultaneously","Compile Python to machine code"], ans: 1 },
      ]
    }
  },
];
