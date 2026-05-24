import React, { useState, useEffect } from "react";
import "./App.css";

// CSS Imports
import "./css/auth.css";
import "./css/upload.css";
import "./css/dashboard.css";

// Utilities
import { autoCategorize } from "./utils/categorizer";
import { clearSession, getToken, apiUploadStatement, mapBackendStatement } from "./utils/api";

// Component Imports
import Login from "./components/Auth/Login";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Register from "./components/Auth/Register";
import Sidebar from "./components/Dashboard/Sidebar";
import Header from "./components/Dashboard/Header";
import OverviewTab from "./components/Dashboard/OverviewTab";
import TransactionsTab from "./components/Dashboard/TransactionsTab";
import AnalyticsTab from "./components/Dashboard/AnalyticsTab";
import InsightsTab from "./components/Dashboard/InsightsTab";
import FileUpload from "./components/Upload/FileUpload";
import ProcessingScreen from "./components/Upload/ProcessingScreen";

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login"); // 'login', 'register', 'forgot'

  // Application Layout States
  const [activeTab, setActiveTab] = useState("overview"); // overview, transactions, analytics, insights
  const [statement, setStatement] = useState(null); // holds { transactions, bankName, currency, isPdf, ... }
  const [customCategories, setCustomCategories] = useState({});
  
  // OCR Simulation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedFile, setSimulatedFile] = useState(null); // holds { name, type, parsedData }

  // Check login state on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("apex_user");
    const token = getToken();
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Auth Handlers — receive real user object from API
  const handleLogin = (apiUser) => {
    setUser(apiUser);
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = (apiUser) => {
    // After register, user still needs to login to get a token.
    // Redirect them to login with a success notice.
    setAuthView("login");
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setIsAuthenticated(false);
    setStatement(null);
    setAuthView("login");
    setActiveTab("overview");
  };

  // Real API upload handler — called by FileUpload when user uploads a file
  const handleRealUpload = async (file, currency) => {
    try {
      const apiResp = await apiUploadStatement(file);
      const mapped = mapBackendStatement(apiResp, file.name, currency);
      setStatement(mapped);
      setActiveTab("overview");
    } catch (err) {
      // FileUpload component will handle showing the error
      throw err;
    }
  };

  // Update inline transaction category
  const handleUpdateTransactionCategory = (txId, newCategory) => {
    setStatement(prev => {
      if (!prev) return null;
      const updated = prev.transactions.map(t => {
        if (t.id === txId) {
          return { ...t, category: newCategory };
        }
        return t;
      });
      return { ...prev, transactions: updated };
    });
  };

  // Add custom user-defined category & re-categorize matches
  const handleAddCustomCategory = (newCat) => {
    setCustomCategories(prev => {
      const updated = {
        ...prev,
        [newCat.name]: {
          label: newCat.name,
          color: newCat.color,
          bgColor: newCat.bgColor,
          keywords: newCat.keywords
        }
      };

      // Instantly run parser scan on current statement to update transactions fitting keywords
      if (statement) {
        setStatement(prevStatement => {
          const updatedTxs = prevStatement.transactions.map(t => {
            if (!t.category || t.category === "Miscellaneous / Others") {
              const text = t.narration.toLowerCase();
              const matchesKeyword = newCat.keywords.some(k => text.includes(k.toLowerCase()));
              if (matchesKeyword) {
                return { ...t, category: newCat.name };
              }
            }
            return t;
          });
          return { ...prevStatement, transactions: updatedTxs };
        });
      }

      return updated;
    });
  };

  const handleAnalyzeNew = () => {
    setStatement(null);
    setActiveTab("overview");
  };

  // Render Authentication Section
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        {authView === "login" && (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView("register")}
            onForgotPassword={() => setAuthView("forgot")}
          />
        )}
        {authView === "register" && (
          <Register
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setAuthView("login")}
          />
        )}
        {authView === "forgot" && (
          <ForgotPassword
            onBack={() => setAuthView("login")}
          />
        )}
      </div>
    );
  }

  // Render OCR Scanner Simulation Section
  if (isSimulating && simulatedFile) {
    return (
      <div className="auth-container">
        <ProcessingScreen
          fileName={simulatedFile.name}
          fileType={simulatedFile.type}
          onComplete={handleFinishSimulation}
        />
      </div>
    );
  }

  // Render File Upload Prompt Section
  if (!statement) {
    return (
      <div className="auth-container">
        <FileUpload
          onUploadComplete={(res) => setStatement(res)}
          onRealUpload={handleRealUpload}
        />
      </div>
    );
  }

  // Render main Dashboard Panel
  return (
    <div className="dashboard-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userEmail={user.email}
        userName={user.name}
      />

      <main className="main-workspace">
        <Header
          activeTab={activeTab}
          bankMetadata={{
            bankName: statement.bankName,
            accountNumber: statement.accountNumber,
            accountType: statement.accountType
          }}
          onAnalyzeNew={handleAnalyzeNew}
        />

        <div className="tab-content-area">
          {activeTab === "overview" && (
            <OverviewTab
              transactions={statement.transactions}
              currency={statement.currency}
              categories={customCategories}
            />
          )}

          {activeTab === "transactions" && (
            <TransactionsTab
              transactions={statement.transactions}
              currency={statement.currency}
              customCategories={customCategories}
              onAddCustomCategory={handleAddCustomCategory}
              onUpdateTransactionCategory={handleUpdateTransactionCategory}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsTab
              transactions={statement.transactions}
              currency={statement.currency}
              customCategories={customCategories}
            />
          )}

          {activeTab === "insights" && (
            <InsightsTab
              transactions={statement.transactions}
              currency={statement.currency}
            />
          )}
        </div>
      </main>
    </div>
  );
}
