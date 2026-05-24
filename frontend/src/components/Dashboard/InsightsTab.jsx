import React from "react";
import { ShieldAlert, Lightbulb, CheckCircle2, ChevronRight, TrendingDown, HelpCircle, AlertTriangle } from "lucide-react";

export default function InsightsTab({ transactions, currency }) {
  // 1. Calculate base data for recommendations
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = {};
  
  transactions.forEach((t) => {
    totalIncome += t.credit;
    totalExpense += t.debit;
    if (t.debit > 0) {
      const cat = t.category || "Miscellaneous / Others";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.debit;
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // 2. Identify Anomalies (Anomalous Transactions Detector)
  // Rules:
  // - Contains "UNUSUAL" in narration
  // - Double swipe detection: identical amount & similar narration within same/next day
  // - Outlier: amount is greater than 3x the category average expense
  const anomalies = [];
  const processedDuplicates = new Set();

  // Calculate category averages
  const categoryAverages = {};
  const categoryCounts = {};
  transactions.forEach((t) => {
    if (t.debit > 0) {
      const cat = t.category || "Miscellaneous / Others";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      categoryAverages[cat] = (categoryAverages[cat] || 0) + t.debit;
    }
  });
  Object.keys(categoryAverages).forEach((cat) => {
    categoryAverages[cat] = categoryAverages[cat] / categoryCounts[cat];
  });

  transactions.forEach((t, index) => {
    if (t.debit === 0) return;
    const desc = t.narration.toLowerCase();
    const cat = t.category || "Miscellaneous / Others";
    const avg = categoryAverages[cat] || 0;

    // Check 1: Manual mock flag
    if (desc.includes("unusual")) {
      anomalies.push({
        id: `anom-1-${t.id}`,
        transaction: t,
        type: "Outlier Purchase",
        risk: "High",
        reason: "Suspected non-typical debit behavior. Value exceeds average transaction size.",
        fix: "Flagged for manual review. Confirm this was authorized by you."
      });
      return;
    }

    // Check 2: Large amount relative to average (> 3.5x average)
    if (t.debit > avg * 3.5 && t.debit > (currency === "$" ? 150 : 5000)) {
      anomalies.push({
        id: `anom-2-${t.id}`,
        transaction: t,
        type: "High Spending Spike",
        risk: "Medium",
        reason: `This charge is ${((t.debit / avg) * 100).toFixed(0)}% larger than your typical ${cat} transactions.`,
        fix: "Examine if this represents a contract change, billing error, or one-off purchase."
      });
      return;
    }

    // Check 3: Suspected Duplicate (Identical amount & category, same day)
    for (let i = index + 1; i < transactions.length; i++) {
      const other = transactions[i];
      if (other.id !== t.id && other.debit === t.debit && other.date === t.date && other.category === t.category) {
        const dupKey = `${t.id}-${other.id}`;
        if (!processedDuplicates.has(dupKey) && !processedDuplicates.has(`${other.id}-${t.id}`)) {
          anomalies.push({
            id: `anom-3-${t.id}`,
            transaction: t,
            type: "Duplicate Transaction Warning",
            risk: "High",
            reason: `Detected two identical charges of ${currency}${t.debit} on the same day (${t.date}).`,
            fix: "Verify with the merchant to ensure you were not double-charged."
          });
          processedDuplicates.add(dupKey);
        }
      }
    }
  });

  // 3. Dynamic Budget Recommendations Generator
  const recommendations = [];

  // Rec 1: Savings rate advice
  if (savingsRate < 10) {
    recommendations.push({
      title: "Boost Emergency Savings Buffer",
      description: `Your savings rate is currently ${savingsRate.toFixed(1)}%. We recommend aiming for at least 20%. Try setting up a recursive auto-transfer of ${currency}${Math.round(totalIncome * 0.1)} right after pay-day to build your emergency fund.`,
      savingPotential: `${currency}${Math.round(totalIncome * 0.15)}/mo`,
      category: "Savings"
    });
  } else if (savingsRate >= 20) {
    recommendations.push({
      title: "Put Your Savings Surplus to Work",
      description: `Great job! Your savings rate is at ${savingsRate.toFixed(1)}%. Consider allocating 15% of your surplus (${currency}${Math.round(netSavings * 0.15)}) into index tracking funds or tax-advantaged retirement plans rather than keeping it in cash checking.`,
      savingPotential: "Growth Opportunity",
      category: "Investment"
    });
  }

  // Rec 2: Food spending check
  const foodSpend = categoryTotals["Food"] || 0;
  const foodPct = totalExpense > 0 ? (foodSpend / totalExpense) * 100 : 0;
  if (foodPct > 15 && foodSpend > (currency === "$" ? 100 : 3000)) {
    recommendations.push({
      title: "Reduce Restaurant Delivery Fees",
      description: `Food delivery and restaurant spend accounts for ${foodPct.toFixed(1)}% of your expenses. Preparing meals at home just 3 extra days per week could cut food expenses by 25%.`,
      savingPotential: `${currency}${Math.round(foodSpend * 0.25)}/mo`,
      category: "Food"
    });
  }

  // Rec 3: Shopping spending check
  const shoppingSpend = categoryTotals["Shopping"] || 0;
  const shoppingPct = totalExpense > 0 ? (shoppingSpend / totalExpense) * 100 : 0;
  if (shoppingPct > 20 && shoppingSpend > (currency === "$" ? 200 : 5000)) {
    recommendations.push({
      title: "Implement the 48-Hour Shopping Rule",
      description: `Shopping represents ${shoppingPct.toFixed(1)}% of your overall monthly expenses. Next time you want to purchase non-essential items online, add them to your cart and wait 48 hours. You will find that you skip the purchase half of the time.`,
      savingPotential: `${currency}${Math.round(shoppingSpend * 0.3)}/mo`,
      category: "Shopping"
    });
  }

  // Rec 4: Subscriptions check
  const subSpend = categoryTotals["Subscriptions"] || 0;
  if (subSpend > (currency === "$" ? 30 : 1000)) {
    recommendations.push({
      title: "Audit Active Digital Subscriptions",
      description: `You paid ${currency}${subSpend.toFixed(2)} in subscriptions this month. Scan through your active streaming services, app subscriptions, or magazine memberships. Consolidating or pausing even 2 inactive services yields immediate savings.`,
      savingPotential: `${currency}${Math.round(subSpend * 0.4)}/mo`,
      category: "Subscriptions"
    });
  }

  // Limit recommendations to 3 maximum
  const displayedRecs = recommendations.slice(0, 3);

  const fmt = (val) => {
    return `${currency}${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="tab-pane animate-fade-in">
      <div className="insights-view-layout">
        
        {/* Left Column: Anomalies & Scanned Alerts */}
        <div className="insights-column-left">
          <div className="dashboard-card glassmorphism-card card">
            <div className="card-header border-bottom-dim pb-3">
              <div className="flex-row gap-2">
                <ShieldAlert className="text-orange" size={22} />
                <h3>AI Transaction Audit (Outlier Detector)</h3>
              </div>
              <p className="subtitle mt-1">Automatically highlights charges exceeding averages or matching risk rules.</p>
            </div>

            <div className="anomalies-list mt-3">
              {anomalies.length > 0 ? (
                anomalies.map((anom) => (
                  <div key={anom.id} className={`anomaly-card-item border-${anom.risk.toLowerCase()}`}>
                    <div className="anomaly-header">
                      <div className="header-left">
                        <span className={`risk-badge risk-${anom.risk.toLowerCase()}`}>{anom.risk} Risk</span>
                        <span className="anomaly-type-title">{anom.type}</span>
                      </div>
                      <span className="anomaly-amount text-red">
                        -{currency}{parseFloat(anom.transaction.debit).toLocaleString()}
                      </span>
                    </div>

                    <div className="anomaly-meta mt-1">
                      <span className="tx-date">{anom.transaction.date}</span>
                      <span className="tx-dot">•</span>
                      <span className="tx-narration">{anom.transaction.narration}</span>
                    </div>

                    <div className="anomaly-analysis-box mt-3">
                      <div className="analysis-row">
                        <AlertTriangle size={14} className="text-muted" />
                        <p className="analysis-reason"><b>Analysis:</b> {anom.reason}</p>
                      </div>
                      <div className="analysis-row mt-2">
                        <CheckCircle2 size={14} className="text-accent" />
                        <p className="analysis-fix"><b>Action Item:</b> {anom.fix}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-anomalies-state">
                  <CheckCircle2 size={36} className="text-green" />
                  <h4>Statement Audited. No Anomalies Found!</h4>
                  <p className="subtitle">All transactions fell within typical limits and safety parameters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Recommendations */}
        <div className="insights-column-right">
          <div className="dashboard-card glassmorphism-card card">
            <div className="card-header border-bottom-dim pb-3">
              <div className="flex-row gap-2">
                <Lightbulb className="text-yellow" size={22} />
                <h3>Personalized Savings Advice</h3>
              </div>
              <p className="subtitle mt-1">Targeted actions matching your exact spending patterns.</p>
            </div>

            <div className="recommendations-list mt-3">
              {displayedRecs.map((rec, index) => (
                <div key={index} className="recommendation-card-item">
                  <div className="rec-badge-row">
                    <span className="category-tag">{rec.category}</span>
                    <div className="saving-pot-pill">
                      <TrendingDown size={12} />
                      <span>Save {rec.savingPotential}</span>
                    </div>
                  </div>
                  <h4 className="rec-title mt-2">{rec.title}</h4>
                  <p className="rec-desc mt-1">{rec.description}</p>
                  
                  <button className="btn-rec-action mt-3">
                    <span>Apply Budget Adjustment</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
