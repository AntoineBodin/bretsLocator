export const normalize = (s = "") => {
  // coerce anything to a safe string to avoid "toLowerCase is not a function"
  const str = s == null ? "" : String(s);
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export function levenshteinLimit(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const dp = new Array(b.length + 1).fill(0).map((_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    let minRow = dp[0];
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
      if (dp[j] < minRow) minRow = dp[j];
    }
    if (minRow > max) return max + 1;
  }
  return dp[b.length];
}

export function fuzzyMatches(text, q) {
  if (!q) return true;
  const tn = normalize(text);
  const qn = normalize(q);
  if (tn.includes(qn)) return true;
  const max = Math.max(1, Math.ceil(qn.length * 0.3));
  const dist = levenshteinLimit(qn, tn, max);
  return dist <= max;
}