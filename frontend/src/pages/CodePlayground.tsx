import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Play, Zap, ChevronDown, ChevronRight, Clock, Cpu, RotateCcw,
  Terminal, Settings2, Copy, Check, Keyboard,
} from "lucide-react";
import { codeApi, ExecuteResponse } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import "./CodePlayground.css";

// ─── Language definitions ──────────────────────────────────────────────────
interface Language {
  id: number;
  name: string;
  monacoLang: string;
  boilerplate: string;
}

const LANGUAGES: Language[] = [
  {
    id: 71, name: "Python 3", monacoLang: "python",
    boilerplate: `# Python 3
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: 54, name: "C++ (GCC 9.2)", monacoLang: "cpp",
    boilerplate: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
  },
  {
    id: 62, name: "Java (OpenJDK 13)", monacoLang: "java",
    boilerplate: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  },
  {
    id: 63, name: "JavaScript (Node.js 12)", monacoLang: "javascript",
    boilerplate: `// JavaScript (Node.js)
console.log("Hello, World!");
`,
  },
  {
    id: 74, name: "TypeScript (3.7.4)", monacoLang: "typescript",
    boilerplate: `// TypeScript
const greet = (name: string): string => \`Hello, \${name}!\`;
console.log(greet("World"));
`,
  },
  {
    id: 50, name: "C (GCC 9.2)", monacoLang: "c",
    boilerplate: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
  },
  {
    id: 60, name: "Go (1.13.5)", monacoLang: "go",
    boilerplate: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`,
  },
  {
    id: 73, name: "Rust (1.40.0)", monacoLang: "rust",
    boilerplate: `fn main() {
    println!("Hello, World!");
}
`,
  },
  {
    id: 51, name: "C# (Mono 6.6)", monacoLang: "csharp",
    boilerplate: `using System;

class Program {
    static void Main(string[] args) {
        Console.WriteLine("Hello, World!");
    }
}
`,
  },
  {
    id: 78, name: "Kotlin (1.3.70)", monacoLang: "kotlin",
    boilerplate: `fun main() {
    println("Hello, World!")
}
`,
  },
  {
    id: 72, name: "Ruby (2.7.0)", monacoLang: "ruby",
    boilerplate: `puts "Hello, World!"
`,
  },
  {
    id: 83, name: "Swift (5.2.3)", monacoLang: "swift",
    boilerplate: `import Foundation
print("Hello, World!")
`,
  },
  {
    id: 68, name: "PHP (7.4.1)", monacoLang: "php",
    boilerplate: `<?php
echo "Hello, World!\\n";
?>
`,
  },
  {
    id: 90, name: "Dart (2.19.2)", monacoLang: "dart",
    boilerplate: `void main() {
  print('Hello, World!');
}
`,
  },
  {
    id: 81, name: "Scala (2.13.2)", monacoLang: "scala",
    boilerplate: `@main def hello(): Unit =
  println("Hello, World!")
`,
  },
  {
    id: 80, name: "R (4.0.0)", monacoLang: "r",
    boilerplate: `cat("Hello, World!\\n")
`,
  },
  {
    id: 46, name: "Bash", monacoLang: "shell",
    boilerplate: `#!/bin/bash
echo "Hello, World!"
`,
  },
];

// ─── Status badge helpers ──────────────────────────────────────────────────
type RunStatus = "idle" | "running" | "accepted" | "error" | "tle" | "mle";

function getStatusInfo(statusId: number): { label: string; kind: RunStatus } {
  if (statusId === 3) return { label: "Accepted", kind: "accepted" };
  if (statusId === 4) return { label: "Wrong Answer", kind: "error" };
  if (statusId === 5) return { label: "Time Limit Exceeded", kind: "tle" };
  if (statusId === 6) return { label: "Memory Limit Exceeded", kind: "mle" };
  if (statusId === 11) return { label: "Runtime Error", kind: "error" };
  if (statusId >= 7 && statusId <= 12) return { label: "Error", kind: "error" };
  if (statusId === 13) return { label: "Internal Error", kind: "error" };
  return { label: "Done", kind: "accepted" };
}

// ─── Component ────────────────────────────────────────────────────────────
const CodePlayground = () => {
  const { theme } = useTheme();
  const monacoTheme = theme === "light" ? "vs-light" : "vs-dark";

  const [selectedLang, setSelectedLang] = useState<Language>(LANGUAGES[0]);
  const [code, setCode] = useState<string>(LANGUAGES[0].boilerplate);
  const [stdin, setStdin] = useState("");
  const [stdinOpen, setStdinOpen] = useState(false);
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [activeOutputTab, setActiveOutputTab] = useState<"output" | "stdin">("output");
  const [copied, setCopied] = useState(false);
  const [showShortcut, setShowShortcut] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const isRunning = runStatus === "running";

  // ─── Language change ─────────────────────────────────────────────────
  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGES.find((l) => l.id === parseInt(e.target.value));
    if (lang) {
      setSelectedLang(lang);
      setCode(lang.boilerplate);
      setResult(null);
      setRunStatus("idle");
    }
  };

  // ─── Run code ────────────────────────────────────────────────────────
  const runCode = useCallback(async () => {
    if (isRunning || !code.trim()) return;
    setRunStatus("running");
    setResult(null);
    setActiveOutputTab("output");
    try {
      const res = await codeApi.execute({
        source_code: code,
        language_id: selectedLang.id,
        stdin: stdin || "",
      });
      setResult(res);
      const statusId = res.status?.id ?? 0;
      setRunStatus(getStatusInfo(statusId).kind);
    } catch (err: any) {
      setResult({
        stdout: null,
        stderr: err?.message || "Execution failed",
        compile_output: null,
        status: { id: 0, description: "Error" },
        time: null,
        memory: null,
        token: null,
      });
      setRunStatus("error");
    }
  }, [isRunning, code, selectedLang.id, stdin]);

  // ─── Ctrl+Enter hotkey ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [runCode]);

  // ─── Scroll terminal to bottom ───────────────────────────────────────
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [result]);

  // ─── Copy code ───────────────────────────────────────────────────────
  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ─── Reset ───────────────────────────────────────────────────────────
  const resetCode = () => {
    setCode(selectedLang.boilerplate);
    setResult(null);
    setRunStatus("idle");
  };

  // ─── Status badge ────────────────────────────────────────────────────
  const statusInfo = result
    ? getStatusInfo(result.status?.id ?? 0)
    : { label: isRunning ? "Running…" : "Ready", kind: isRunning ? "running" : "idle" as RunStatus };

  return (
    <div className="pg-root">
      {/* ── Loading bar ─────────────────────────────────────────────── */}
      {isRunning && <div className="pg-loading-bar" style={{ width: "100%" }} />}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="pg-header">
        <Link to="/dashboard" className="pg-logo">
          <Zap size={18} />
          <span style={{
            background: "linear-gradient(135deg, var(--yellow), var(--orange))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>EduAI</span>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400, marginLeft: 4 }}>/ Playground</span>
        </Link>

        <div className="pg-divider" />

        {/* Language selector */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <select
            id="language-select"
            className="pg-lang-select"
            value={selectedLang.id}
            onChange={handleLangChange}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{
            position: "absolute", right: 10, pointerEvents: "none",
            color: "var(--muted)",
          }} />
        </div>

        <div className="pg-spacer" />

        {/* Status badge */}
        <div className={`pg-status-badge ${statusInfo.kind}`}>
          <div className="pg-status-dot" />
          {statusInfo.label}
        </div>

        {/* Icon actions */}
        <button
          className="pg-icon-btn"
          onClick={() => setShowShortcut((p) => !p)}
          title="Keyboard shortcuts"
          id="shortcuts-btn"
        >
          <Keyboard size={15} />
        </button>

        <button
          className="pg-icon-btn"
          onClick={copyCode}
          title="Copy code"
          id="copy-code-btn"
        >
          {copied ? <Check size={15} style={{ color: "var(--green)" }} /> : <Copy size={15} />}
        </button>

        <button
          className="pg-icon-btn"
          onClick={resetCode}
          title="Reset to boilerplate"
          id="reset-code-btn"
        >
          <RotateCcw size={15} />
        </button>

        {/* Run button */}
        <button
          id="run-code-btn"
          className="pg-run-btn"
          onClick={runCode}
          disabled={isRunning}
        >
          <Play size={14} fill="currentColor" />
          <span>{isRunning ? "Running…" : "Run Code"}</span>
        </button>
      </header>

      {/* ── Shortcut tooltip ────────────────────────────────────────── */}
      {showShortcut && (
        <div className="pg-shortcut-tooltip" onClick={() => setShowShortcut(false)}>
          <div className="pg-shortcut-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 600, marginBottom: 10, color: "var(--text)" }}>⌨️ Keyboard Shortcuts</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Ctrl + Enter", "Run code"],
                  ["Ctrl + Z", "Undo"],
                  ["Ctrl + Shift + Z", "Redo"],
                  ["Ctrl + /", "Toggle comment"],
                  ["Ctrl + F", "Find in editor"],
                ].map(([key, desc]) => (
                  <tr key={key} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 12px 6px 0", whiteSpace: "nowrap" }}>
                      <kbd className="pg-kbd">{key}</kbd>
                    </td>
                    <td style={{ padding: "6px 0", color: "var(--muted)", fontSize: 12 }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Body (editor + output) ───────────────────────────────────── */}
      <div className="pg-body">
        <PanelGroup direction="vertical">

          {/* ── Monaco Editor Panel ──────────────────────────────────── */}
          <Panel defaultSize={62} minSize={25} id="editor-panel">
            <div className="pg-editor-panel" style={{ height: "100%" }}>
              {/* Editor tab bar */}
              <div className="pg-editor-tabs">
                <div className="pg-editor-tab active">
                  <Settings2 size={12} />
                  {selectedLang.name}
                </div>
                <div className="pg-spacer" />
                <div style={{ fontSize: 11, color: "var(--muted)", paddingRight: 4 }}>
                  Ctrl+Enter to run
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="pg-editor-wrap">
                <Editor
                  height="100%"
                  language={selectedLang.monacoLang}
                  value={code}
                  onChange={(val) => setCode(val ?? "")}
                  theme={monacoTheme === "vs-dark" ? "vs-dark" : "light"}
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Space Mono', monospace",
                    fontLigatures: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 14, bottom: 14 },
                    lineHeight: 1.7,
                    renderWhitespace: "selection",
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    bracketPairColorization: { enabled: true },
                    scrollbar: {
                      verticalScrollbarSize: 6,
                      horizontalScrollbarSize: 6,
                    },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    renderLineHighlight: "gutter",
                    roundedSelection: true,
                    glyphMargin: false,
                  }}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle id="main-resize-handle" />

          {/* ── Output Panel ─────────────────────────────────────────── */}
          <Panel defaultSize={38} minSize={15} id="output-panel">
            <div className="pg-output-panel" style={{ height: "100%" }}>
              {/* Output tab bar */}
              <div className="pg-output-header">
                <button
                  id="output-tab-btn"
                  className={`pg-output-tab ${activeOutputTab === "output" ? "active" : ""}`}
                  onClick={() => setActiveOutputTab("output")}
                >
                  <Terminal size={12} />
                  Output
                </button>
                <button
                  id="stdin-tab-btn"
                  className={`pg-output-tab ${activeOutputTab === "stdin" ? "active" : ""}`}
                  onClick={() => setActiveOutputTab("stdin")}
                >
                  <ChevronRight size={12} />
                  Stdin
                </button>
                <div className="pg-spacer" />

                {/* Execution metadata */}
                {result && result.time && (
                  <div className="pg-meta-row">
                    <div className="pg-meta-chip">
                      <Clock size={10} />
                      {result.time}s
                    </div>
                    {result.memory && (
                      <div className="pg-meta-chip">
                        <Cpu size={10} />
                        {(result.memory / 1024).toFixed(1)} MB
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Output tab content ──────────────────── */}
              {activeOutputTab === "output" && (
                <div className="pg-terminal" ref={terminalRef}>
                  {!result && !isRunning && (
                    <div className="pg-terminal-idle">
                      <span className="pg-cursor" />
                      Press <strong style={{ color: "var(--accent)", margin: "0 4px" }}>Run Code</strong>
                      or hit <strong style={{ color: "var(--accent)", margin: "0 4px" }}>Ctrl+Enter</strong>
                      to execute your program
                    </div>
                  )}

                  {isRunning && (
                    <div className="pg-terminal-idle">
                      <span className="pg-cursor" />
                      <span>Executing {selectedLang.name} program…</span>
                    </div>
                  )}

                  {result && !isRunning && (
                    <>
                      <div className="pg-terminal-prompt">
                        $ {selectedLang.name} · {result.status?.description}
                      </div>

                      {/* Compile output (errors before runtime) */}
                      {result.compile_output && (
                        <div className="pg-terminal-compile">
                          {result.compile_output}
                        </div>
                      )}

                      {/* Standard Output */}
                      {result.stdout && (
                        <div className="pg-terminal-stdout">
                          {result.stdout}
                        </div>
                      )}

                      {/* Standard Error */}
                      {result.stderr && (
                        <div className="pg-terminal-stderr">
                          {result.stderr}
                        </div>
                      )}

                      {/* No output case */}
                      {!result.stdout && !result.stderr && !result.compile_output && (
                        <div className="pg-terminal-info">
                          (program produced no output)
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Stdin tab content ───────────────────── */}
              {activeOutputTab === "stdin" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div className="pg-stdin-header" style={{ cursor: "default" }}>
                    <ChevronRight size={13} style={{ color: "var(--accent)" }} />
                    <span>Provide standard input (stdin) for your program</span>
                  </div>
                  <textarea
                    id="stdin-textarea"
                    className="pg-stdin-textarea"
                    style={{ flex: 1, height: "100%" }}
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder={"Enter stdin here…\nEach line is a separate input.\nExample: 5\\n3 1 4 1 5"}
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* ── Inline styles for extras ─────────────────────────────────── */}
      <style>{`
        .pg-shortcut-tooltip {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(2px);
        }
        .pg-shortcut-card {
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: 14px;
          padding: 20px 24px;
          min-width: 320px;
          box-shadow: var(--shadow-md), 0 0 40px rgba(124,92,252,0.1);
          font-size: 13px;
        }
        .pg-kbd {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 5px;
          background: var(--surface2);
          border: 1px solid var(--border2);
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text);
        }
        /* Monaco editor container */
        .monaco-editor .margin { background: transparent !important; }
        .monaco-editor-background { background: var(--bg) !important; }
      `}</style>
    </div>
  );
};

export default CodePlayground;
