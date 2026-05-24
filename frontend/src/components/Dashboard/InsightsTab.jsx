import React from "react";
import { ShieldAlert, Lightbulb, CheckCircle2, ChevronRight, TrendingDown, HelpCircle, AlertTriangle, Sparkles, Activity } from "lucide-react";

export default function InsightsTab({ transactions, currency, aiAnalysis, isFetchingAi }) {
  if (isFetchingAi) {
    return (
      <div className="tab-pane animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="uploading-spin" style={{ width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}></div>
          <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Analyzing Financial Data...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', textAlign: 'center', marginTop: '4px' }}>Our AI is scanning your transactions to uncover deep spending insights. This usually takes a few seconds.</p>
        </div>
      </div>
    );
  }

  // Parse AI Analysis if it's a JSON string
  let aiData = null;
  let markdownFallback = null;

  if (aiAnalysis) {
    if (typeof aiAnalysis === "string") {
      try {
        let cleanStr = aiAnalysis.trim();
        if (cleanStr.startsWith("```json")) {
          cleanStr = cleanStr.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanStr.startsWith("```")) {
          cleanStr = cleanStr.replace(/^```/, "").replace(/```$/, "").trim();
        }
        aiData = JSON.parse(cleanStr);
      } catch (e) {
        // Not JSON, assume it's markdown or plain text
        markdownFallback = aiAnalysis;
      }
    } else if (typeof aiAnalysis === "object") {
      aiData = aiAnalysis;
    }
  }

  // Helper to render markdown if backend sends string
  const renderMarkdown = (markdownText) => {
    if (!markdownText) return null;
    const lines = markdownText.split("\n");
    return lines.map((line, index) => {
      if (line.startsWith("## ")) {
        return <h3 key={index} className="mt-4 mb-3">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- **")) {
        const parts = line.replace("- **", "").split("**");
        return (
          <div key={index} className="flex-row gap-2 mb-3" style={{ alignItems: "flex-start" }}>
            <div className="bullet-point" style={{ marginTop: "2px" }}>•</div>
            <p className="m-0" style={{ margin: 0 }}>
              <strong>{parts[0]}</strong>{parts.slice(1).join("**")}
            </p>
          </div>
        );
      }
      if (line.trim() === "") return null;
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  // If we have structured AI data from backend (even if headline is missing, let's check for any of the arrays)
  if (aiData && (aiData.headline || aiData.spending_alerts || aiData.recommendations)) {
    return (
      <div className="tab-pane animate-fade-in">
        {/* Top Summary Banner */}
        <div className="dashboard-card glassmorphism-card card mb-4 border-high">
          <div className="card-header border-bottom-dim pb-3">
            <div className="flex-row gap-2">
              <Sparkles className="text-accent" size={22} />
              <h3>AI Financial Health Assessment</h3>
            </div>
            <h4 className="mt-2 text-primary">{aiData.headline || "Financial Health Analysis"}</h4>
          </div>
          <div className="ai-analysis-content mt-3 p-2">
            <p className="text-body">{aiData.health_assessment || "See insights below."}</p>
          </div>
        </div>

        <div className="insights-view-layout">
          {/* Left Column: Alerts & Insights */}
          <div className="insights-column-left">
            <div className="dashboard-card glassmorphism-card card mb-4">
              <div className="card-header border-bottom-dim pb-3">
                <div className="flex-row gap-2">
                  <ShieldAlert className="text-orange" size={22} />
                  <h3>Spending Alerts & Insights</h3>
                </div>
              </div>
              
              <div className="anomalies-list mt-3">
                {/* Spending Alerts */}
                {aiData.spending_alerts && aiData.spending_alerts.map((alert, idx) => (
                  <div key={`alert-${idx}`} className={`anomaly-card-item border-${alert.severity.toLowerCase()}`}>
                    <div className="anomaly-header">
                      <div className="header-left">
                        <span className={`risk-badge risk-${alert.severity.toLowerCase()}`}>{alert.severity} Risk</span>
                        <span className="anomaly-type-title">{alert.title}</span>
                      </div>
                      <span className="category-tag text-xs">{alert.category}</span>
                    </div>
                    <div className="anomaly-analysis-box mt-3">
                      <div className="analysis-row">
                        <AlertTriangle size={14} className="text-muted" />
                        <p className="analysis-reason"><b>Details:</b> {alert.description}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Savings Insights */}
                {aiData.savings_insights && aiData.savings_insights.map((insight, idx) => (
                  <div key={`insight-${idx}`} className={`anomaly-card-item border-${insight.severity.toLowerCase()} mt-3`}>
                    <div className="anomaly-header">
                      <div className="header-left">
                        <Activity size={16} className={`text-${insight.severity === 'high' ? 'red' : 'yellow'}`} />
                        <span className="anomaly-type-title">{insight.title}</span>
                      </div>
                      <span className="category-tag text-xs">{insight.category}</span>
                    </div>
                    <div className="anomaly-analysis-box mt-2">
                      <p className="analysis-reason m-0 text-sm">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Recommendations & Actions */}
          <div className="insights-column-right">
            <div className="dashboard-card glassmorphism-card card">
              <div className="card-header border-bottom-dim pb-3">
                <div className="flex-row gap-2">
                  <Lightbulb className="text-yellow" size={22} />
                  <h3>AI Recommendations</h3>
                </div>
              </div>

              <div className="recommendations-list mt-3">
                {aiData.recommendations && aiData.recommendations.map((rec, index) => (
                  <div key={`rec-${index}`} className="recommendation-card-item">
                    <div className="rec-badge-row">
                      <span className="category-tag">{rec.category}</span>
                      {rec.estimated_monthly_savings_inr && (
                        <div className="saving-pot-pill">
                          <TrendingDown size={12} />
                          <span>Save {currency}{rec.estimated_monthly_savings_inr}</span>
                        </div>
                      )}
                    </div>
                    <h4 className="rec-title mt-2">
                      {rec.title} <span className="text-muted text-xs">({rec.priority} priority)</span>
                    </h4>
                    <p className="rec-desc mt-1">{rec.description}</p>
                  </div>
                ))}

                {aiData.action_items && aiData.action_items.length > 0 && (
                  <div className="recommendation-card-item mt-4 border-info">
                    <div className="rec-badge-row mb-2">
                      <span className="category-tag bg-info text-white">Action Plan</span>
                    </div>
                    <ul className="text-sm pl-4">
                      {aiData.action_items.map((item, idx) => (
                        <li key={idx} className="mb-2 text-body">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to Markdown or old layout if backend AI data isn't structured JSON yet
  return (
    <div className="tab-pane animate-fade-in">
      {(markdownFallback || aiAnalysis) && (
        <div className="dashboard-card glassmorphism-card card mb-4">
          <div className="card-header border-bottom-dim pb-3">
            <div className="flex-row gap-2">
              <Sparkles className="text-accent" size={22} />
              <h3>Raw AI Output (Debug)</h3>
            </div>
          </div>
          <div className="ai-analysis-content mt-3 p-2">
            {markdownFallback 
              ? renderMarkdown(markdownFallback) 
              : <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{JSON.stringify(aiAnalysis, null, 2)}</pre>}
          </div>
        </div>
      )}

      <div className="insights-view-layout">
        <div className="insights-column-left">
          <div className="dashboard-card glassmorphism-card card">
            <div className="card-header border-bottom-dim pb-3">
              <div className="flex-row gap-2">
                <ShieldAlert className="text-orange" size={22} />
                <h3>Waiting for AI Analysis</h3>
              </div>
              <p className="subtitle mt-1">Structured AI Data is not available or could not be parsed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

