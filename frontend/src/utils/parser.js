// Client-side Bank Statement CSV Parser

export const parseCSVStatement = (fileContent) => {
  try {
    // Split by newlines, filtering out empty lines
    const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) {
      return { success: false, error: "File seems to be empty or contains insufficient data." };
    }

    // A helper to parse CSV line while respecting double-quoted values (which may contain commas)
    const parseCSVLine = (line) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    // Find the header line. Sometimes bank statements contain metadata rows at the top (e.g. account info)
    let headerIndex = -1;
    let headers = [];
    
    // We scan the first 10 rows to look for something that contains common bank headers
    const headerKeywords = ["date", "narration", "description", "particulars", "debit", "credit", "amount", "balance"];
    
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const fields = parseCSVLine(lines[i]).map(f => f.toLowerCase());
      const matchCount = fields.filter(f => headerKeywords.some(keyword => f.includes(keyword))).length;
      if (matchCount >= 2) { // Found header row
        headerIndex = i;
        headers = parseCSVLine(lines[i]).map(f => f.toLowerCase().trim());
        break;
      }
    }

    // Default to index 0 if not found
    if (headerIndex === -1) {
      headerIndex = 0;
      headers = parseCSVLine(lines[0]).map(f => f.toLowerCase().trim());
    }

    // Column Index Mapping
    let dateIdx = -1;
    let descIdx = -1;
    let debitIdx = -1;
    let creditIdx = -1;
    let amountIdx = -1;
    let balanceIdx = -1;

    headers.forEach((h, idx) => {
      // Date mapping
      if (h.includes("date") && !h.includes("value date") && !h.includes("post date")) {
        dateIdx = idx;
      } else if (dateIdx === -1 && h.includes("date")) {
        dateIdx = idx;
      }
      
      // Description mapping
      if (h.includes("narration") || h.includes("description") || h.includes("particulars") || h.includes("remarks") || h.includes("memo")) {
        descIdx = idx;
      }
      
      // Debit mapping
      if (h.includes("debit") || h.includes("withdrawal") || h.includes("dr") || h.includes("payment")) {
        debitIdx = idx;
      }
      
      // Credit mapping
      if (h.includes("credit") || h.includes("deposit") || h.includes("cr") || h.includes("receipt")) {
        creditIdx = idx;
      }

      // Unified Amount mapping (e.g. if single amount column exists)
      if (h === "amount" || h.includes("transaction amount") || h.includes("amount (rs)") || h.includes("amount ($)")) {
        amountIdx = idx;
      }

      // Balance mapping
      if (h.includes("balance") || h.includes("bal")) {
        balanceIdx = idx;
      }
    });

    // Fallbacks if mapping is not perfect
    if (dateIdx === -1) dateIdx = headers.findIndex(h => h.includes("date")) !== -1 ? headers.findIndex(h => h.includes("date")) : 0;
    if (descIdx === -1) descIdx = headers.findIndex(h => h.includes("desc") || h.includes("narr") || h.includes("part")) !== -1 ? headers.findIndex(h => h.includes("desc") || h.includes("narr") || h.includes("part")) : 1;
    
    if (debitIdx === -1 && creditIdx === -1 && amountIdx === -1) {
      // Look for any numeric headers
      amountIdx = headers.findIndex(h => h.includes("amount") || h.includes("value") || h.includes("sum"));
      if (amountIdx === -1) {
        // Fallback to columns 2 and 3 for debits/credits
        debitIdx = 2;
        creditIdx = 3;
      }
    }

    const transactions = [];
    let currentBalance = 0;

    // Parse data lines
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = parseCSVLine(line);
      
      // Skip incomplete lines
      if (fields.length <= Math.max(dateIdx, descIdx)) continue;

      const rawDate = fields[dateIdx] || "";
      const narration = fields[descIdx] || "Unlabeled Transaction";
      if (!rawDate && narration === "Unlabeled Transaction") continue;

      // Extract numbers
      let debit = 0;
      let credit = 0;
      let balance = null;

      const cleanNum = (str) => {
        if (!str) return 0;
        // Remove currency symbols, spaces, commas
        const val = parseFloat(str.replace(/[^0-9.-]/g, ''));
        return isNaN(val) ? 0 : val;
      };

      if (debitIdx !== -1 || creditIdx !== -1) {
        debit = debitIdx !== -1 ? cleanNum(fields[debitIdx]) : 0;
        credit = creditIdx !== -1 ? cleanNum(fields[creditIdx]) : 0;
      } else if (amountIdx !== -1) {
        const amt = cleanNum(fields[amountIdx]);
        if (amt < 0) {
          debit = Math.abs(amt);
          credit = 0;
        } else {
          credit = amt;
          debit = 0;
        }
      }

      if (balanceIdx !== -1 && fields[balanceIdx]) {
        balance = cleanNum(fields[balanceIdx]);
        currentBalance = balance;
      }

      // Basic Date Normalizer (tries to output YYYY-MM-DD)
      let formattedDate = rawDate;
      const dateParts = rawDate.split(/[-/.]/);
      if (dateParts.length === 3) {
        let day = dateParts[0];
        let month = dateParts[1];
        let year = dateParts[2];
        
        // Check if year is 4 digits or 2 digits
        if (year.length === 2) year = "20" + year;

        // Tries to see if DD/MM/YYYY or MM/DD/YYYY based on numbers
        if (parseInt(month) > 12) {
          // It's likely DD/MM/YYYY and month was day
          const temp = day;
          day = month;
          month = temp;
        }
        
        // Pad month and day
        if (month.length === 1) month = "0" + month;
        if (day.length === 1) day = "0" + day;

        // If year is first (e.g. YYYY-MM-DD)
        if (dateParts[0].length === 4) {
          formattedDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
        } else {
          // Assume standard DD-MM-YYYY or MM-DD-YYYY
          // Let's format as YYYY-MM-DD
          formattedDate = `${year}-${month}-${day}`;
        }
      }

      // Check if this is a valid transaction row (at least has a date and some amount)
      if (rawDate && (debit > 0 || credit > 0)) {
        transactions.push({
          id: `csv-${i}`,
          date: formattedDate,
          narration: narration.toUpperCase(),
          debit: debit,
          credit: credit,
          balance: balance
        });
      }
    }

    // Sort transactions chronologically
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance if not provided
    if (transactions.length > 0 && transactions[0].balance === null) {
      let runBal = 5000.00; // start with a seed if none
      transactions.forEach(t => {
        if (t.credit > 0) runBal += t.credit;
        if (t.debit > 0) runBal -= t.debit;
        t.balance = parseFloat(runBal.toFixed(2));
      });
    }

    // Determine currency. If there is a currency symbol in the file content, extract it
    let currency = "$";
    if (fileContent.includes("₹") || fileContent.includes("INR") || fileContent.includes("Rs.")) {
      currency = "₹";
    } else if (fileContent.includes("£") || fileContent.includes("GBP")) {
      currency = "£";
    } else if (fileContent.includes("€") || fileContent.includes("EUR")) {
      currency = "€";
    }

    return {
      success: true,
      transactions: transactions,
      bankName: "Uploaded Statement (CSV)",
      currency: currency
    };

  } catch (err) {
    console.error("CSV Parser Error:", err);
    return { success: false, error: "Failed to parse CSV file: " + err.message };
  }
};
