export const DEFAULT_CATEGORIES = {
  Salary: { label: "Salary", color: "hsla(142, 70%, 45%, 1)", bgColor: "hsla(142, 70%, 45%, 0.15)" },
  Rent: { label: "Rent", color: "hsla(217, 90%, 60%, 1)", bgColor: "hsla(217, 90%, 60%, 0.15)" },
  Food: { label: "Food", color: "hsla(28, 90%, 55%, 1)", bgColor: "hsla(28, 90%, 55%, 0.15)" },
  Shopping: { label: "Shopping", color: "hsla(322, 85%, 60%, 1)", bgColor: "hsla(322, 85%, 60%, 0.15)" },
  Travel: { label: "Travel", color: "hsla(190, 90%, 50%, 1)", bgColor: "hsla(190, 90%, 50%, 0.15)" },
  Subscriptions: { label: "Subscriptions", color: "hsla(262, 80%, 60%, 1)", bgColor: "hsla(262, 80%, 60%, 0.15)" },
  "EMIs / Loan Payments": { label: "EMIs / Loan Payments", color: "hsla(0, 85%, 60%, 1)", bgColor: "hsla(0, 85%, 60%, 0.15)" },
  "UPI Transfers": { label: "UPI Transfers", color: "hsla(160, 80%, 40%, 1)", bgColor: "hsla(160, 80%, 40%, 0.15)" },
  "Miscellaneous / Others": { label: "Miscellaneous / Others", color: "hsla(215, 15%, 60%, 1)", bgColor: "hsla(215, 15%, 60%, 0.15)" }
};

export const autoCategorize = (narration = "", amount = 0, type = "debit", customCategories = {}) => {
  const text = narration.toLowerCase();
  
  // Combine default & custom categories
  const categories = { ...DEFAULT_CATEGORIES, ...customCategories };
  
  // 1. SALARY / INCOME (usually Credit, but check keywords)
  if (text.includes("salary") || text.includes("direct deposit") || text.includes("cms/salary") || text.includes("interest credit") || text.includes("payroll")) {
    return "Salary";
  }
  
  // 2. RENT
  if (text.includes("rent") || text.includes("landlord") || text.includes("properties") || text.includes("lease")) {
    return "Rent";
  }

  // 3. SUBSCRIPTIONS
  if (text.includes("netflix") || text.includes("spotify") || text.includes("youtube") || text.includes("premium") || 
      text.includes("adobe") || text.includes("comcast") || text.includes("icloud") || text.includes("apple services") || 
      text.includes("microsoft") || text.includes("aws") || text.includes("subscription")) {
    return "Subscriptions";
  }

  // 4. EMIs / LOANS
  if (text.includes("loan") || text.includes("emi") || text.includes("mortgage") || text.includes("finance") || text.includes("sip") || text.includes("mutual fund")) {
    return "EMIs / Loan Payments";
  }

  // 5. FOOD / DRINK
  if (text.includes("zomato") || text.includes("swiggy") || text.includes("starbucks") || text.includes("coffee") || 
      text.includes("restaurant") || text.includes("cafe") || text.includes("caffee") || text.includes("food") || 
      text.includes("dining") || text.includes("tea stall") || text.includes("bakery") || text.includes("uber eats")) {
    return "Food";
  }

  // 6. SHOPPING / GROCERY
  if (text.includes("amazon") || text.includes("wholefoods") || text.includes("safeway") || text.includes("target") || 
      text.includes("dmart") || text.includes("instamart") || text.includes("grocery") || text.includes("myntra") || 
      text.includes("clothing") || text.includes("best buy") || text.includes("jewellers") || text.includes("steam") || 
      text.includes("store") || text.includes("supermarket") || text.includes("games") || text.includes("crypto") || text.includes("wallmart")) {
    return "Shopping";
  }

  // 7. TRAVEL
  if (text.includes("uber") || text.includes("lyft") || text.includes("taxi") || text.includes("ola") || 
      text.includes("cabs") || text.includes("flight") || text.includes("irctc") || text.includes("train") || 
      text.includes("travel") || text.includes("booking") || text.includes("gas") || text.includes("fuel") || text.includes("shell")) {
    return "Travel";
  }

  // 8. UPI / ZELLE / PEER TRANSFERS (If not categorized by specific vendor above)
  if (text.includes("upi") || text.includes("gpay") || text.includes("zelle") || text.includes("transfer") || 
      text.includes("paytm") || text.includes("neft") || text.includes("rtgs") || text.includes("imps") || text.includes("cash withdrawal")) {
    return "UPI Transfers";
  }

  // Check custom categories keywords if any user-defined categories match
  for (const catName in customCategories) {
    const customCat = customCategories[catName];
    if (customCat.keywords) {
      for (const kw of customCat.keywords) {
        if (text.includes(kw.toLowerCase())) {
          return catName;
        }
      }
    }
  }

  // 9. DEFAULT MISC
  return "Miscellaneous / Others";
};
