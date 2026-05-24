import React from "react";
import {
  LayoutDashboard, ReceiptText, PieChart, Lightbulb,
  LogOut, Sparkles, UserCheck
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, onLogout, userEmail, userName }) {

  const navItems = [
    { id: "overview",      label: "Overview",       icon: LayoutDashboard },
    { id: "transactions",  label: "Transactions",   icon: ReceiptText },
    { id: "analytics",     label: "Analytics",      icon: PieChart },
    { id: "insights",      label: "AI Insights",    icon: Lightbulb },
  ];

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sidebar-container glassmorphism">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Sparkles size={22} className="accent-color" />
          </div>
          <span className="brand-name">APEXBANK</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`nav-item-btn ${activeTab === id ? "active" : ""}`}
            >
              <Icon size={20} className="nav-icon" />
              <span>{label}</span>
              {activeTab === id && <div className="active-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="avatar"><UserCheck size={18} /></div>
            <div className="user-details">
              <span className="user-name">{userName || "Demo User"}</span>
              <span className="user-email">{userEmail || "demo@apex.com"}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ── */}
      <header className="mobile-topbar glassmorphism">
      </header>
    </>
  );
}