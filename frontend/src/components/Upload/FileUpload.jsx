import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, FileText, ChevronDown, CheckCircle, AlertCircle, Sparkles, Loader } from "lucide-react";
import { parseCSVStatement } from "../../utils/parser";
import { MOCK_STATEMENTS } from "../../utils/mockData";
import { mapBackendStatement } from "../../utils/api";

export default function FileUpload({ onUploadComplete, onRealUpload }) {
  const [bank, setBank] = useState("hdfc");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const bankOptions = [
    { value: "chase", label: "Chase Bank (USD)", template: "Freedom Checking", currency: "$" },
    { value: "wellsfargo", label: "Wells Fargo (USD)", template: "Preferred Checking", currency: "$" },
    { value: "hdfc", label: "HDFC Bank (INR)", template: "Savings Account", currency: "₹" },
    { value: "icici", label: "ICICI Bank (INR)", template: "Savings Account", currency: "₹" },
    { value: "sbi", label: "State Bank of India (INR)", template: "Savings Account", currency: "₹" },
    { value: "generic", label: "Generic / Auto-Detect (CSV Only)", template: "Standard Table", currency: "₹" },
  ];

  const getCurrency = () => {
    const opt = bankOptions.find((b) => b.value === bank);
    return opt ? opt.currency : "₹";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError("");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    setError("");
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    const fileName = file.name.toLowerCase();
    const ext = fileName.substring(fileName.lastIndexOf("."));

    if (ext !== ".csv" && ext !== ".pdf") {
      setError("Unsupported file format. Please upload a valid CSV or PDF bank statement.");
      return;
    }

    if (!onRealUpload) {
      setError("Statement upload requires a logged-in session.");
      return;
    }
    setIsUploading(true);
    setError("");
    try {
      await onRealUpload(file, getCurrency());
    } catch (err) {
      setError(err.message || "Failed to process statement. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (!isUploading) fileInputRef.current.click();
  };

  const loadDemoData = (bankKey) => {
    const selectedBank = bankOptions.find((b) => b.value === bankKey);
    const mockResult = {
      success: true,
      transactions: MOCK_STATEMENTS[bankKey].transactions,
      bankName: selectedBank.label,
      currency: selectedBank.currency,
      isDemo: true,
      accountNumber: MOCK_STATEMENTS[bankKey].accountNumber,
      accountType: MOCK_STATEMENTS[bankKey].accountType,
    };
    onUploadComplete(mockResult);
  };

  return (
    <div className="upload-container card glassmorphism animate-fade-in">
      <div className="upload-header">
        <div className="header-badge">
          <Sparkles size={16} className="text-accent" />
          <span>AI-Powered Analysis</span>
        </div>
        <h2>Upload Bank Statement</h2>
        <p className="subtitle">
          Upload a <strong>PDF</strong> for full AI analysis via the backend, or a{" "}
          <strong>CSV</strong> for instant local processing.
        </p>
      </div>

      <div className="bank-selector-group">
        <label htmlFor="bankSelect">Select Statement Issuer Bank</label>
        <div className="custom-select-wrapper">
          <select
            id="bankSelect"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            disabled={isUploading}
          >
            {bankOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="select-arrow" />
        </div>
        <p className="select-tip">
          Selecting the correct bank ensures accurate OCR extraction parameters.
        </p>
      </div>

      <div
        className={`drag-drop-zone ${isDragging ? "dragging" : ""} ${error ? "has-error" : ""} ${isUploading ? "uploading" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.pdf"
          style={{ display: "none" }}
          disabled={isUploading}
        />

        <div className="upload-visual">
          {isUploading ? (
            <Loader size={48} className="upload-icon uploading-spin" />
          ) : (
            <UploadCloud size={48} className="upload-icon" />
          )}
          <div className="file-badges">
            <span className="badge badge-csv">
              <FileSpreadsheet size={12} /> CSV
            </span>
            <span className="badge badge-pdf">
              <FileText size={12} /> PDF
            </span>
          </div>
        </div>

        <div className="upload-text">
          {isUploading ? (
            <>
              <p className="primary-text">Analyzing your statement...</p>
              <p className="secondary-text">Running AI pipeline on the backend. Please wait.</p>
            </>
          ) : (
            <>
              <p className="primary-text">
                <span>Click to browse</span> or drag and drop statement
              </p>
              <p className="secondary-text">Supported formats: PDF, CSV (Max 15MB)</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="upload-error">
          <AlertCircle size={18} className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      <div className="demo-section">
        <div className="divider">
          <span>OR LOAD PRE-LOADED DEMO STATEMENT</span>
        </div>
        <div className="demo-buttons-grid">
          <button
            type="button"
            onClick={() => loadDemoData("chase")}
            className="btn btn-demo"
            title="Load Chase Bank Statement (USD)"
            disabled={isUploading}
          >
            🇺🇸 Chase (USD)
          </button>
          <button
            type="button"
            onClick={() => loadDemoData("hdfc")}
            className="btn btn-demo"
            title="Load HDFC Bank Statement (INR)"
            disabled={isUploading}
          >
            🇮🇳 HDFC (INR)
          </button>
          <button
            type="button"
            onClick={() => loadDemoData("icici")}
            className="btn btn-demo"
            title="Load ICICI Bank Statement (INR)"
            disabled={isUploading}
          >
            🇮🇳 ICICI (INR)
          </button>
          <button
            type="button"
            onClick={() => loadDemoData("sbi")}
            className="btn btn-demo"
            title="Load SBI Bank Statement (INR)"
            disabled={isUploading}
          >
            🇮🇳 SBI (INR)
          </button>
        </div>
      </div>
    </div>
  );
}
