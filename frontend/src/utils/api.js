// frontend/src/utils/api.js
// Central API utility — all backend calls go through here

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// ── Token helpers ──────────────────────────────────────────────
export const getToken = () => localStorage.getItem("apex_token");

export const saveSession = (token, user) => {
  localStorage.setItem("apex_token", token);
  localStorage.setItem("apex_user", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("apex_token");
  localStorage.removeItem("apex_user");
};

const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// ── Generic fetch wrapper ──────────────────────────────────────
const request = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.detail ||
      (Array.isArray(data?.detail)
        ? data.detail.map((e) => e.msg).join(", ")
        : "Something went wrong.");
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
};

// ── Auth API ───────────────────────────────────────────────────

/** Register a new user. Returns UserResponse. */
export const apiRegister = ({ firstName, lastName, email, password }) =>
  request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    }),
  });

/** Login. Returns { access_token, token_type, user }. */
export const apiLogin = ({ email, password }) =>
  request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

// ── Analytics API ──────────────────────────────────────────────

/** Get available analytics months */
export const apiGetAnalyticsMonths = () =>
  request("/analytics/months", {
    headers: authHeader(),
  });

/** Get analytics for a specific month */
export const apiGetMonthlyAnalytics = (month) =>
  request(`/analytics/monthly?month=${month}`, {
    headers: authHeader(),
  });

/** Get AI Analysis for a specific month */
export const apiGetAiAnalysis = (month, regenerate = false) =>
  request(`/analytics/monthly/ai-analysis?month=${month}&regenerate=${regenerate}`, {
    method: "POST",
    headers: authHeader(),
  });

/** Get all transactions */
export const apiGetTransactions = () =>
  request("/transactions/", {
    headers: authHeader(),
  });

// ── Statement API ──────────────────────────────────────────────

/**
 * Upload a bank statement file (PDF/CSV).
 * Returns FullAnalysisPayloadResponse from the backend.
 */
export const apiUploadStatement = (file) => {
  const form = new FormData();
  form.append("file", file);
  return request("/statements/upload", {
    method: "POST",
    headers: authHeader(),
    body: form,
  });
};

/**
 * Map the backend FullAnalysisPayloadResponse into the shape
 * the frontend dashboard components expect:
 *
 *  statement.transactions  → [{ id, date, narration, credit, debit, category }]
 *  statement.bankName      → string
 *  statement.currency      → "₹" or "$"
 *  statement.accountNumber → string
 *  statement.accountType   → string
 *  statement.aiAnalysis    → string
 *  statement.metrics       → raw summary object
 */
export const mapBackendStatement = (apiResp, filename, currency = "₹") => {
  const metrics = apiResp.metrics || {};

  // Build synthetic transactions from category_breakdown for dashboard charts.
  // Each category entry becomes one synthetic "transaction" so charts can render.
  const today = apiResp.upload_date ? new Date(apiResp.upload_date) : new Date();

  const transactions = (apiResp.category_breakdown || []).map((item, i) => {
    // Spread categories over the last 28 days for a realistic graph
    const fakeDate = new Date(today);
    fakeDate.setDate(today.getDate() - ((i * 3) % 28));

    return {
      id: `cat-${i}`,
      date: fakeDate.toISOString().split("T")[0],
      narration: item.category,
      debit: item.total_amount,
      credit: 0,
      category: item.category,
    };
  });

  // Add synthetic credit rows for total income so charts balance
  if (metrics.total_income > 0) {
    // Split income into two payloads (e.g. bi-weekly salary) for a nicer graph shape
    const halfIncome = metrics.total_income / 2;

    const d1 = new Date(today);
    d1.setDate(today.getDate() - 25);
    transactions.push({
      id: "income-1",
      date: d1.toISOString().split("T")[0],
      narration: "Salary & Income",
      debit: 0,
      credit: halfIncome,
      category: "Salary & Income",
    });

    const d2 = new Date(today);
    d2.setDate(today.getDate() - 10);
    transactions.push({
      id: "income-2",
      date: d2.toISOString().split("T")[0],
      narration: "Salary & Income",
      debit: 0,
      credit: halfIncome,
      category: "Salary & Income",
    });
  }

  return {
    // For chart & card components
    transactions,

    // Bank meta displayed in Header
    bankName: filename || apiResp.filename || "Uploaded Statement",
    currency,
    accountNumber: apiResp.statement_id
      ? `STMT-${apiResp.statement_id.slice(-6).toUpperCase()}`
      : "N/A",
    accountType: "Bank Statement",

    // Extra backend data available for InsightsTab / future use
    aiAnalysis: apiResp.ai_analysis || "",
    metrics,
    categoryBreakdown: apiResp.category_breakdown || [],
    anomalies: apiResp.anomalies || [],
    recurringPayments: apiResp.recurring_payments || [],

    // Raw backend response preserved
    _raw: apiResp,
  };
};
