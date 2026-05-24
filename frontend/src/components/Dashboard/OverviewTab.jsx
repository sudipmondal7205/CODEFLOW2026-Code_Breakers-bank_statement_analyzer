import React, { useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Calendar, AlertCircle } from "lucide-react";

export default function OverviewTab({ transactions, currency, categories }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 1. Calculate Totals
  let totalIncome = 0;
  let totalExpense = 0;
  
  transactions.forEach(t => {
    totalIncome += t.credit;
    totalExpense += t.debit;
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;
  const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 100;

  // 2. Identify Highest Spending Category
  const categoryTotals = {};
  transactions.forEach(t => {
    if (t.debit > 0) {
      const cat = t.category || "Miscellaneous / Others";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.debit;
    }
  });

  let highestCategory = "N/A";
  let highestAmount = 0;
  Object.keys(categoryTotals).forEach(cat => {
    if (categoryTotals[cat] > highestAmount) {
      highestAmount = categoryTotals[cat];
      highestCategory = cat;
    }
  });

  // 3. Detect Recurring Payments (same narration appearing multiple times with similar debit amount)
  const narrationCounts = {};
  transactions.forEach(t => {
    if (t.debit > 0) {
      // Normalize narration slightly to match recurring patterns
      const norm = t.narration.replace(/[0-9*]/g, '').trim();
      if (!narrationCounts[norm]) {
        narrationCounts[norm] = { count: 0, total: 0, dates: [], amount: t.debit, origName: t.narration };
      }
      narrationCounts[norm].count += 1;
      narrationCounts[norm].total += t.debit;
      narrationCounts[norm].dates.push(t.date);
    }
  });

  const recurringPayments = [];
  Object.keys(narrationCounts).forEach(norm => {
    const item = narrationCounts[norm];
    // If it appears 2 or more times (typical in a single monthly statement of 15-30 days for subscriptions, or just flagged as recurring)
    if (item.count >= 2 || item.origName.toLowerCase().includes("rent") || item.origName.toLowerCase().includes("emi") || item.origName.toLowerCase().includes("netflix") || item.origName.toLowerCase().includes("spotify") || item.origName.toLowerCase().includes("youtube")) {
      recurringPayments.push({
        narration: item.origName,
        amount: (item.total / item.count).toFixed(2),
        frequency: "Monthly",
        occurrences: item.count
      });
    }
  });

  // Limit to top 4 recurring payments
  const displayedRecurring = recurringPayments.slice(0, 4);

  // 4. Custom SVG Chart Coordinate Builder
  // Group transactions chronologically to build a daily timeline
  const dailyValues = {};
  transactions.forEach(t => {
    if (!dailyValues[t.date]) {
      dailyValues[t.date] = { date: t.date, income: 0, expense: 0 };
    }
    dailyValues[t.date].income += t.credit;
    dailyValues[t.date].expense += t.debit;
  });

  const chartData = Object.keys(dailyValues)
    .sort((a, b) => new Date(a) - new Date(b))
    .map(date => dailyValues[date]);

  const maxVal = Math.max(
    ...chartData.map(d => Math.max(d.income, d.expense)),
    100 // fallback floor
  );

  // Generate path points for SVG
  const width = 600;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = chartData.map((d, i) => {
    const x = paddingLeft + (i / (chartData.length - 1 || 1)) * chartWidth;
    // Y points scaled
    const yIncome = height - paddingBottom - (d.income / maxVal) * chartHeight;
    const yExpense = height - paddingBottom - (d.expense / maxVal) * chartHeight;
    return { x, yIncome, yExpense, ...d };
  });

  // Build SVG path commands
  let incomeLinePath = "";
  let incomeAreaPath = "";
  let expenseLinePath = "";
  let expenseAreaPath = "";

  if (points.length > 0) {
    // Start lines
    incomeLinePath = `M ${points[0].x} ${points[0].yIncome}`;
    expenseLinePath = `M ${points[0].x} ${points[0].yExpense}`;

    points.forEach((p, i) => {
      if (i > 0) {
        incomeLinePath += ` L ${p.x} ${p.yIncome}`;
        expenseLinePath += ` L ${p.x} ${p.yExpense}`;
      }
    });

    // Close area paths
    incomeAreaPath = `${incomeLinePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    expenseAreaPath = `${expenseLinePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  // Format currency value helper
  const fmt = (val) => {
    const formatted = parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency}${formatted}`;
  };

  return (
    <div className="tab-pane animate-fade-in">
      {/* 4 KPI Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card glassmorphism-card">
          <div className="metric-header">
            <span className="metric-label">Total Income</span>
            <div className="icon-wrap bg-green">
              <TrendingUp size={18} className="text-green" />
            </div>
          </div>
          <div className="metric-value text-green">{fmt(totalIncome)}</div>
          <div className="metric-subtext">Statement Credit total</div>
        </div>

        <div className="metric-card glassmorphism-card">
          <div className="metric-header">
            <span className="metric-label">Total Expenses</span>
            <div className="icon-wrap bg-red">
              <TrendingDown size={18} className="text-red" />
            </div>
          </div>
          <div className="metric-value text-red">{fmt(totalExpense)}</div>
          <div className="metric-subtext">Statement Debit total</div>
        </div>

        <div className="metric-card glassmorphism-card">
          <div className="metric-header">
            <span className="metric-label">Net Balance</span>
            <div className="icon-wrap bg-indigo">
              <Wallet size={18} className="text-indigo" />
            </div>
          </div>
          <div className="metric-value">{fmt(netSavings)}</div>
          <div className="metric-subtext">Net savings this period</div>
        </div>

        <div className="metric-card glassmorphism-card">
          <div className="metric-header">
            <span className="metric-label">Savings Rate</span>
            <div className="savings-meter">
              <span className="savings-pct">{savingsRate}%</span>
            </div>
          </div>
          <div className="metric-value-row">
            <div className="progress-track-mini">
              <div 
                className="progress-fill-mini" 
                style={{ width: `${Math.max(0, Math.min(100, parseFloat(savingsRate)))}%`, backgroundColor: parseFloat(savingsRate) > 20 ? "#34d399" : "#fbbf24" }}
              ></div>
            </div>
          </div>
          <div className="metric-subtext">Ideal target rate: 20%+</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* SVG Sparkline Area Chart */}
        <div className="dashboard-card main-chart-card glassmorphism-card">
          <div className="card-header">
            <h3>Income vs Expense Progression</h3>
            <div className="chart-legend">
              <div className="legend-item"><span className="legend-dot bg-green"></span><span>Income</span></div>
              <div className="legend-item"><span className="legend-dot bg-red"></span><span>Expense</span></div>
            </div>
          </div>

          <div className="chart-wrapper-inner">
            {chartData.length > 0 ? (
              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="svg-chart">
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y Axis Guide Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = paddingTop + ratio * chartHeight;
                  const label = maxVal - ratio * maxVal;
                  return (
                    <g key={idx}>
                      <line 
                        x1={paddingLeft} 
                        y1={y} 
                        x2={width - paddingRight} 
                        y2={y} 
                        stroke="rgba(255, 255, 255, 0.05)" 
                        strokeDasharray="4" 
                      />
                      <text 
                        x={paddingLeft - 8} 
                        y={y + 4} 
                        fill="#64748b" 
                        fontSize="10" 
                        textAnchor="end"
                      >
                        {currency}{Math.round(label)}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Date labels */}
                {chartData.map((d, i) => {
                  if (i === 0 || i === chartData.length - 1 || (chartData.length > 4 && i === Math.floor(chartData.length / 2))) {
                    const x = paddingLeft + (i / (chartData.length - 1 || 1)) * chartWidth;
                    const dateObj = new Date(d.date);
                    const labelText = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    return (
                      <text
                        key={i}
                        x={x}
                        y={height - paddingBottom + 18}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {labelText}
                      </text>
                    );
                  }
                  return null;
                })}

                {/* Area Graphs */}
                <path d={incomeAreaPath} fill="url(#incomeGrad)" />
                <path d={expenseAreaPath} fill="url(#expenseGrad)" />

                {/* Line Graphs */}
                <path d={incomeLinePath} fill="none" stroke="#10b981" strokeWidth="2.5" />
                <path d={expenseLinePath} fill="none" stroke="#ef4444" strokeWidth="2.5" />

                {/* Hover Interactive Nodes */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    {/* Invisible hover trigger columns */}
                    <rect
                      x={p.x - 10}
                      y={paddingTop}
                      width="20"
                      height={chartHeight}
                      fill="transparent"
                      cursor="pointer"
                      onMouseEnter={() => setHoveredPoint({ idx, ...p })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    
                    {/* Active nodes indicator */}
                    {hoveredPoint?.idx === idx && (
                      <>
                        <line 
                          x1={p.x} 
                          y1={paddingTop} 
                          x2={p.x} 
                          y2={height - paddingBottom} 
                          stroke="rgba(255, 255, 255, 0.15)" 
                          strokeWidth="1"
                        />
                        <circle cx={p.x} cy={p.yIncome} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                        <circle cx={p.x} cy={p.yExpense} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                      </>
                    )}
                  </g>
                ))}
              </svg>
            ) : (
              <div className="empty-chart-fallback">No chart data coordinates found</div>
            )}

            {/* Custom Tooltip Block */}
            {hoveredPoint && (
              <div className="custom-chart-tooltip glassmorphism">
                <p className="tooltip-date">
                  {new Date(hoveredPoint.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <p className="tooltip-value text-green">Income: {fmt(hoveredPoint.income)}</p>
                <p className="tooltip-value text-red">Expenses: {fmt(hoveredPoint.expense)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info Section */}
        <div className="dashboard-card side-info-card glassmorphism-card">
          <div className="card-header">
            <h3>Key Spend Insights</h3>
          </div>
          
          <div className="overview-insights-details">
            <div className="insight-pill bg-red-dim border-red">
              <AlertCircle className="text-red flex-shrink" size={20} />
              <div className="insight-text">
                <span className="label">Highest Spending Category</span>
                <span className="value">{highestCategory} ({fmt(highestAmount)})</span>
              </div>
            </div>

            <div className="insight-pill bg-indigo-dim border-indigo mt-3">
              <Wallet className="text-indigo flex-shrink" size={20} />
              <div className="insight-text">
                <span className="label">Expense-to-Income Ratio</span>
                <span className="value">{expenseRatio}%</span>
              </div>
            </div>
          </div>

          <div className="card-header border-top mt-4">
            <h3>Recurring Direct Debits</h3>
          </div>

          <div className="recurring-payments-list">
            {displayedRecurring.length > 0 ? (
              displayedRecurring.map((bill, index) => (
                <div key={index} className="recurring-bill-item">
                  <div className="bill-icon">
                    <Calendar size={16} className="text-indigo" />
                  </div>
                  <div className="bill-name-wrap">
                    <span className="bill-name">{bill.narration.substring(0, 24)}...</span>
                    <span className="bill-freq">{bill.frequency} cycle</span>
                  </div>
                  <div className="bill-cost text-red">
                    -{currency}{parseFloat(bill.amount).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-bills-state">
                <Calendar size={24} />
                <span>No recurring bills detected in this statement window.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
