import React, { useState } from "react";
import { DEFAULT_CATEGORIES } from "../../utils/categorizer";
import { Plus, Target, Check, AlertTriangle } from "lucide-react";

export default function AnalyticsTab({ transactions, currency, customCategories }) {
  const categories = { ...DEFAULT_CATEGORIES, ...customCategories };
  
  // 1. Set/Load category budget limits (stored in local component state for demo)
  const [budgets, setBudgets] = useState({
    Food: 12000,
    Shopping: 20000,
    Rent: 30000,
    Travel: 8000,
    Subscriptions: 1500,
    "EMIs / Loan Payments": 45000,
    "Miscellaneous / Others": 10000
  });

  const [editingCategory, setEditingCategory] = useState(null);
  const [tempBudgetValue, setTempBudgetValue] = useState("");
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Calculate total expense & category expenses
  let totalExpense = 0;
  const categoryExpenses = {};
  
  transactions.forEach((t) => {
    if (t.debit > 0) {
      totalExpense += t.debit;
      const cat = t.category || "Miscellaneous / Others";
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + t.debit;
    }
  });

  // Calculate percentages and prepare chart data segments
  const chartData = Object.keys(categoryExpenses).map((catName) => {
    const expense = categoryExpenses[catName];
    const pct = totalExpense > 0 ? (expense / totalExpense) * 100 : 0;
    const catConfig = categories[catName] || categories["Miscellaneous / Others"];
    return {
      name: catName,
      value: expense,
      percentage: pct,
      color: catConfig.color,
      bgColor: catConfig.bgColor
    };
  }).sort((a, b) => b.value - a.value);

  // Donut Circle Math
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  let accumulatedPercent = 0;

  const donutSegments = chartData.map((d) => {
    const strokeDashArray = `${(d.percentage / 100) * circumference} ${circumference}`;
    const strokeDashOffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += d.percentage;
    return { ...d, strokeDashArray, strokeDashOffset };
  });

  const handleEditBudget = (catName) => {
    setEditingCategory(catName);
    setTempBudgetValue(budgets[catName] || 5000);
  };

  const handleSaveBudget = (catName) => {
    setBudgets((prev) => ({
      ...prev,
      [catName]: parseFloat(tempBudgetValue) || 0
    }));
    setEditingCategory(null);
  };

  const fmt = (val) => {
    return `${currency}${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="tab-pane animate-fade-in">
      <div className="dashboard-grid">
        
        {/* Custom SVG Donut Chart Widget */}
        <div className="dashboard-card glassmorphism-card card flex-column align-center">
          <div className="card-header text-left width-full">
            <h3>Expense Breakdown</h3>
            <p className="subtitle">Proportional category distribution of overall debits.</p>
          </div>

          <div className="donut-chart-container mt-4">
            {totalExpense > 0 ? (
              <div className="donut-chart-visual-wrapper">
                <svg width="220" height="220" viewBox="0 0 120 120" className="donut-svg">
                  {/* Background base circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="11"
                  />

                  {/* SVG segments */}
                  {donutSegments.map((seg, idx) => (
                    <circle
                      key={idx}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={hoveredSegment?.name === seg.name ? "14" : "11"}
                      strokeDasharray={seg.strokeDashArray}
                      strokeDashoffset={seg.strokeDashOffset}
                      transform="rotate(-90 60 60)"
                      className="donut-segment"
                      style={{ cursor: "pointer", transition: "stroke-width 0.2s ease" }}
                      onMouseEnter={() => setHoveredSegment(seg)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  ))}
                </svg>

                {/* Text centered inside the donut hole */}
                <div className="donut-center-label">
                  <span className="donut-total-val">{fmt(totalExpense)}</span>
                  <span className="donut-total-title">Total Debits</span>
                </div>
              </div>
            ) : (
              <div className="empty-chart-fallback">No expenses found for chart creation</div>
            )}
          </div>

          {/* Interactive Legend List */}
          <div className="donut-legend-grid mt-4 width-full">
            {chartData.map((d, index) => (
              <div 
                key={index} 
                className={`legend-badge-item ${hoveredSegment?.name === d.name ? "legend-hovered" : ""}`}
                style={{ borderLeft: `4px solid ${d.color}` }}
              >
                <div className="legend-label-col">
                  <span className="name">{d.name}</span>
                  <span className="pct">{d.percentage.toFixed(1)}%</span>
                </div>
                <div className="legend-amount-col">
                  <span>{fmt(d.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Limit Tracker Widget */}
        <div className="dashboard-card glassmorphism-card card">
          <div className="card-header">
            <h3>Monthly Category Budgets</h3>
            <p className="subtitle">Edit allocation limits to check overspend ratios.</p>
          </div>

          <div className="budgets-tracker-list mt-3">
            {Object.keys(budgets).map((catName) => {
              const spent = categoryExpenses[catName] || 0;
              const limit = budgets[catName] || 0;
              const pctSpent = limit > 0 ? (spent / limit) * 100 : 0;
              const isOverspent = spent > limit;
              const catColor = categories[catName]?.color || "#cbd5e1";

              return (
                <div key={catName} className="budget-bar-item">
                  <div className="budget-bar-headers">
                    <span className="cat-name">{catName}</span>
                    <div className="values-row">
                      <span className="spent-txt">{fmt(spent)} spent</span>
                      <span className="divider">/</span>
                      
                      {editingCategory === catName ? (
                        <div className="inline-budget-edit">
                          <input
                            type="number"
                            value={tempBudgetValue}
                            onChange={(e) => setTempBudgetValue(e.target.value)}
                            className="budget-input"
                          />
                          <button onClick={() => handleSaveBudget(catName)} className="btn-icon-check">
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span onClick={() => handleEditBudget(catName)} className="limit-txt editable-limit" title="Click to edit">
                          {limit > 0 ? fmt(limit) : "Set Limit"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="progress-track-budget">
                    <div
                      className={`progress-fill-budget ${isOverspent ? "bg-overspent" : ""}`}
                      style={{ 
                        width: `${Math.min(100, pctSpent)}%`,
                        backgroundColor: isOverspent ? "#ef4444" : catColor
                      }}
                    ></div>
                  </div>

                  {isOverspent && (
                    <div className="overspend-warning animate-fade-in">
                      <AlertTriangle size={12} className="warning-icon" />
                      <span>Exceeded limit by {fmt(spent - limit)}!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
