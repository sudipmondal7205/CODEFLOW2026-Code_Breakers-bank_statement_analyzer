import React, { useState, useEffect } from "react";
import { Cpu, Terminal, CheckCircle2 } from "lucide-react";

export default function ProcessingScreen({ fileName, fileType, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);

  const ocrLogs = [
    { time: 200, text: `Initializing statement file buffer for ${fileName}...` },
    { time: 500, text: `Scanning document layout. Format identified: ${fileType.toUpperCase()}` },
    { time: 900, text: `Loading OCR engine blocks (tesseract.js-wasm-local)...` },
    { time: 1300, text: "Extracting raw document text rows and bounding boxes..." },
    { time: 1700, text: "Applying layout heuristics: locating grid tables..." },
    { time: 2100, text: "Mapping column templates (Date, Particulars/Narration, Withdrawals, Deposits)..." },
    { time: 2500, text: "Compiling raw transaction vectors: 100% extracted." },
    { time: 2800, text: "Running AI rules engine: automatically labeling category clusters..." },
    { time: 3100, text: "Checking database integrity: compiling balance history..." },
    { time: 3400, text: "Running anomaly spending checks: highlighting outliers..." },
    { time: 3700, text: "Done! Constructing analytics dashboard..." }
  ];

  useEffect(() => {
    // Progress increment
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 38);

    // Logs builder
    const logTimers = ocrLogs.map((log) => {
      return setTimeout(() => {
        setLogs((prev) => [...prev, `[system@local-analyzer]: ${log.text}`]);
      }, log.time);
    });

    // Final redirection callback
    const finalTimer = setTimeout(() => {
      onComplete();
    }, 4100);

    return () => {
      clearInterval(interval);
      logTimers.forEach((t) => clearTimeout(t));
      clearTimeout(finalTimer);
    };
  }, []);

  return (
    <div className="processing-container card glassmorphism animate-fade-in">
      <div className="processing-visual-area">
        {/* Scanner Simulation Graphics */}
        <div className="scanner-frame">
          <div className="scanner-laser"></div>
          <div className="document-silhouette">
            <div className="doc-line doc-title"></div>
            <div className="doc-line doc-header"></div>
            <div className="doc-grid">
              <div className="grid-cell highlight-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell highlight-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell highlight-cell"></div>
            </div>
            <div className="doc-line doc-footer"></div>
          </div>
          <div className="glow-badge">
            <Cpu size={20} className="spin-slow" />
            <span>AI OCR ACTIVE</span>
          </div>
        </div>

        <div className="status-label-group">
          <h3>Analyzing Statement</h3>
          <p className="subtitle">Running local extraction on {fileName}</p>
        </div>

        <div className="progress-bar-wrapper">
          <div className="progress-header">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="terminal-logs-wrapper">
        <div className="terminal-header">
          <Terminal size={14} className="terminal-icon" />
          <span>Extraction Terminal Logs</span>
        </div>
        <div className="terminal-output">
          {logs.map((log, index) => (
            <div key={index} className="log-line animate-log">
              {log}
            </div>
          ))}
          {progress === 100 && (
            <div className="log-success-line">
              <CheckCircle2 size={12} />
              <span>Statement analyzer ready. Rendering dashboard...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
