import React, { useState } from "react";
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, PlusCircle, Check, Tag } from "lucide-react";
import { DEFAULT_CATEGORIES } from "../../utils/categorizer";

export default function TransactionsTab({ 
  transactions, 
  currency, 
  customCategories, 
  onAddCustomCategory, 
  onUpdateTransactionCategory 
}) {
  // Search & Filter States
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  
  // Custom Category Dialog State
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("hsla(260, 80%, 60%, 1)");
  const [newCatKeywords, setNewCatKeywords] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Combined List of Categories
  const categories = { ...DEFAULT_CATEGORIES, ...customCategories };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const filteredTransactions = transactions.filter((t) => {
    // 1. Text Search
    const text = t.narration.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase()) || 
                          t.date.includes(search) || 
                          (t.category && t.category.toLowerCase().includes(search.toLowerCase()));

    // 2. Type Filter (Debit/Credit)
    const matchesType = typeFilter === "all" || 
                        (typeFilter === "debits" && t.debit > 0) || 
                        (typeFilter === "credits" && t.credit > 0);

    // 3. Category Filter
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

    // 4. Amount Range Filter
    const val = t.debit > 0 ? t.debit : t.credit;
    const matchesMin = !minAmount || val >= parseFloat(minAmount);
    const matchesMax = !maxAmount || val <= parseFloat(maxAmount);

    return matchesSearch && matchesType && matchesCategory && matchesMin && matchesMax;
  });

  // Apply Sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // If sorting by amount
    if (sortField === "amount") {
      aVal = a.debit > 0 ? a.debit : a.credit;
      bVal = b.debit > 0 ? b.debit : b.credit;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Paginated Slices
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  // Handle Adding custom category
  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const keywordsArray = newCatKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    onAddCustomCategory({
      name: newCatName.trim(),
      color: newCatColor,
      bgColor: newCatColor.replace("1)", "0.15)"),
      keywords: keywordsArray
    });

    // Reset Form
    setNewCatName("");
    setNewCatKeywords("");
    setShowAddCat(false);
  };

  const presetColors = [
    "hsla(262, 80%, 60%, 1)", // Purple
    "hsla(322, 85%, 60%, 1)", // Pink
    "hsla(190, 90%, 50%, 1)", // Cyan
    "hsla(142, 70%, 45%, 1)", // Green
    "hsla(28, 90%, 55%, 1)",  // Orange
    "hsla(350, 80%, 60%, 1)", // Coral Red
    "hsla(217, 90%, 60%, 1)"  // Blue
  ];

  return (
    <div className="tab-pane animate-fade-in">
      <div className="transactions-filters-row glassmorphism-card card">
        <div className="filter-search-group">
          <div className="input-with-icon">
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search by description, date, category..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
        </div>

        <div className="filters-grid">
          <div className="form-group-filter">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Types</option>
              <option value="debits">Expenses (Debits)</option>
              <option value="credits">Income (Credits)</option>
            </select>
          </div>

          <div className="form-group-filter">
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Categories</option>
              {Object.keys(categories).map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
          </div>

          <div className="range-inputs">
            <input
              type="number"
              placeholder="Min Price"
              value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }}
              className="range-input"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max Price"
              value={maxAmount}
              onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }}
              className="range-input"
            />
          </div>
        </div>

        <button 
          onClick={() => setShowAddCat(!showAddCat)} 
          className="btn btn-secondary btn-custom-cat"
        >
          <PlusCircle size={16} />
          <span>New Category</span>
        </button>
      </div>

      {/* Add Custom Category Drawer */}
      {showAddCat && (
        <div className="custom-category-card glassmorphism-card card animate-fade-in mb-4">
          <h4>Configure Custom Category</h4>
          <form onSubmit={handleAddCategorySubmit} className="custom-category-form">
            <div className="form-grid-columns">
              <div className="form-group">
                <label>Category Label</label>
                <input
                  type="text"
                  placeholder="e.g. Health & Wellness"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Keywords (Comma separated matcher)</label>
                <input
                  type="text"
                  placeholder="e.g. gym, pharmacy, medical, doctor"
                  value={newCatKeywords}
                  onChange={(e) => setNewCatKeywords(e.target.value)}
                />
              </div>
            </div>

            <div className="color-palette-selector-wrap">
              <label>Select Category Color Theme</label>
              <div className="colors-grid">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-dot ${newCatColor === color ? "active-color" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCatColor(color)}
                  >
                    {newCatColor === color && <Check size={12} className="check-icon" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="buttons-row mt-3">
              <button type="submit" className="btn btn-primary">
                Add Custom Category
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddCat(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ledger Table */}
      <div className="ledger-card-wrapper glassmorphism-card card">
        <div className="table-responsive">
          <table className="ledger-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("date")} className="sortable-th">
                  Date <ArrowUpDown size={12} />
                </th>
                <th className="th-desc">Transaction Description / Narration</th>
                <th onClick={() => handleSort("category")} className="sortable-th text-center">
                  Category <ArrowUpDown size={12} />
                </th>
                <th onClick={() => handleSort("amount")} className="sortable-th text-right">
                  Amount <ArrowUpDown size={12} />
                </th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((t) => {
                  const isDebit = t.debit > 0;
                  const amtVal = isDebit ? t.debit : t.credit;
                  const catConfig = categories[t.category] || categories["Miscellaneous / Others"];

                  return (
                    <tr key={t.id} className="ledger-row">
                      <td className="td-date">{new Date(t.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</td>
                      <td className="td-narration" title={t.narration}>{t.narration}</td>
                      <td className="td-category text-center">
                        <div className="inline-category-picker">
                          <Tag size={12} style={{ color: catConfig.color }} />
                          <select
                            value={t.category || "Miscellaneous / Others"}
                            onChange={(e) => onUpdateTransactionCategory(t.id, e.target.value)}
                            style={{ 
                              color: catConfig.color, 
                              backgroundColor: catConfig.bgColor,
                              border: `1px solid ${catConfig.color}25`
                            }}
                            className="category-inline-select"
                          >
                            {Object.keys(categories).map((catName) => (
                              <option key={catName} value={catName}>
                                {catName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className={`td-amount text-right ${isDebit ? "text-red" : "text-green"}`}>
                        {isDebit ? "-" : "+"}{currency}{amtVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="td-balance text-right text-muted">
                        {t.balance && typeof t.balance === 'string' ? t.balance : `${currency}${t.balance ? t.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}`}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="empty-table-state">
                    No transactions match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination footer */}
        {totalPages > 1 && (
          <div className="table-pagination-footer">
            <span className="pagination-info">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedTransactions.length)} of {sortedTransactions.length} entries
            </span>
            <div className="pagination-controls">
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="btn btn-pagination"
              >
                <ChevronLeft size={16} />
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`btn btn-pagination ${currentPage === i + 1 ? "active-page" : ""}`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="btn btn-pagination"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
