export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { cur.push(field); field = ""; }
      else if (c === '\n' || c === '\r') {
        if (field !== "" || cur.length) { cur.push(field); rows.push(cur); cur = []; field = ""; }
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else field += c;
    }
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).filter(r => r.some(v => v.trim() !== "")).map(r => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => obj[h] = (r[i] ?? "").trim());
    return obj;
  });
}

export const SAMPLE_CSV = `Name,Age,Gender,Department,MonthlyIncome,JobRole,YearsAtCompany,WorkLifeBalance,JobSatisfaction,OverTime
Alice Johnson,29,Female,Sales,5400,Sales Executive,2,2,2,Yes
Brian Lee,34,Male,Information Technology,9200,Senior Engineer,6,3,4,No
Cynthia Patel,41,Female,Human Resources,7800,HR Manager,9,4,4,No
David Chen,26,Male,Information Technology,4200,Software Engineer,1,2,1,Yes
Elena Rossi,38,Female,Finance,8800,Finance Manager,7,3,3,No
Felix Brown,45,Male,Operations,11000,Operations Manager,12,4,4,No
Grace Kim,31,Female,Marketing,6200,Marketing Manager,4,2,2,Yes
Henry Davis,28,Male,Sales,3800,Sales Executive,2,1,2,Yes
Ivy Wong,36,Female,Customer Service,5200,Support Manager,5,3,3,No
Jack Müller,52,Male,Legal,12500,Legal Advisor,15,4,4,No
`;
