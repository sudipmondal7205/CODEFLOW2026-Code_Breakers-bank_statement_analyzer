import React from "react";
import { Upload, HelpCircle, User, ArrowLeft, Landmark } from "lucide-react";

export default function Header({ activeTab, bankMetadata, onAnalyzeNew }) {
  const getTabTitle = () => {
    switch (activeTab) {
      case "overview": return "Financial Dashboard";
      case "transactions": return "Statement Ledger Explorer";
      case "analytics": return "Category Distribution & Analytics";
      case "insights": return "AI Audits & Recommendations";
      default: return "Dashboard";
    }
  };

  return (
    <header className="header-container glassmorphism">
      <div className="header-left">
        <h1>{getTabTitle()}</h1>
        {bankMetadata && (
          <div className="statement-metadata-badge">
            <Landmark size={14} className="metadata-icon" />
            <span>
              {bankMetadata.bankName} ({bankMetadata.accountType || "Savings"}) — Account: {bankMetadata.accountNumber || "N/A"}
            </span>
          </div>
        )}
      </div>

      <div className="header-right">
        <button className="btn btn-secondary btn-header-upload" onClick={onAnalyzeNew}>
          <Upload size={16} />
          <span>Upload Statement</span>
        </button>
      </div>
    </header>
  );
}
