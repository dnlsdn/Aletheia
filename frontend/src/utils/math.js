/**
 * Converts a math expression string into a JS-evaluable string,
 * supporting: +, -, *, /, ^, log_n(), log(), log2(), log10(),
 * sqrt(), sin(), cos(), tan(), abs(), floor(), ceil(), round(),
 * constants pi/π/e.
 *
 * Returns a numeric result or null if invalid / non-math.
 */
function advancedMathEval(expr) {
  if (!expr || !expr.trim()) return null;

  let s = expr
    .trim()
    .replace(/\s/g, '')
    .toLowerCase()
    .replace(/π/g, 'Math.PI')
    .replace(/\bpi\b/g, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/\^/g, '**');

  // log_N(x) → use change-of-base: (Math.log(x)/Math.log(N))
  // Must be done before generic log() replacement
  s = s.replace(/log_(\d+)\(/g, 'LOG_BASE_$1_(');
  // Now expand LOG_BASE_N_(x) — we need to handle nested parens carefully
  // Simple approach: replace the token, then post-process
  s = s.replace(/log_2\(/g, 'Math.log2(');
  s = s.replace(/log_10\(/g, 'Math.log10(');
  s = s.replace(/log2\(/g, 'Math.log2(');
  s = s.replace(/log10\(/g, 'Math.log10(');
  // Generic log_N base — replace LOG_BASE_N_ markers
  s = s.replace(/log_base_(\d+)_\(/g, (_, base) => `(1/Math.log(${base}))*Math.log(`);

  // Remaining log( → natural log
  s = s.replace(/\blog\(/g, 'Math.log(');

  // Other functions
  s = s.replace(/\bsqrt\(/g, 'Math.sqrt(');
  s = s.replace(/\bsin\(/g, 'Math.sin(');
  s = s.replace(/\bcos\(/g, 'Math.cos(');
  s = s.replace(/\btan\(/g, 'Math.tan(');
  s = s.replace(/\babs\(/g, 'Math.abs(');
  s = s.replace(/\bfloor\(/g, 'Math.floor(');
  s = s.replace(/\bceil\(/g, 'Math.ceil(');
  s = s.replace(/\bround\(/g, 'Math.round(');

  // After transformations, reject if anything other than known-safe tokens remains
  // Allowed: digits, ., +, -, *, /, (, ), Math.*, _
  const safe = s.replace(/Math\.(PI|E|log2?|log10|sqrt|sin|cos|tan|abs|floor|ceil|round)\b/g, '');
  if (/[a-zA-Z_]/.test(safe)) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function('Math', '"use strict"; return (' + s + ')')(Math);
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * Extracts the longest valid math prefix from a string,
 * stopping at the first non-math character (e.g. Italian text like "è giusto?").
 * Math chars: digits, letters (function names), operators, parens, dot, underscore.
 */
function extractMathPrefix(str) {
  const match = str.trim().match(/^[0-9a-zA-Z+\-*/^()._πΣ∞\s]+/);
  return match ? match[0].trim() : null;
}

// Natural language "equals" keywords (Italian + English)
const EQ_KEYWORDS = [
  'è uguale a',
  'è uguale ad',
  'fa',
  'equals',
  'equal to',
  'is equal to',
  'makes',
  'risulta',
  'risulta essere',
];

/**
 * Tries to extract an arithmetic claim from natural language.
 * e.g. "2 + 2 è uguale a 5 giusto?" → lhs="2 + 2", rhs="5"
 */
function extractNaturalMath(text) {
  const lower = text.toLowerCase();
  for (const kw of EQ_KEYWORDS) {
    const idx = lower.indexOf(kw);
    if (idx === -1) continue;
    const lhsRaw = extractMathPrefix(text.slice(0, idx));
    const rhsRaw = extractMathPrefix(text.slice(idx + kw.length));
    if (!lhsRaw || !rhsRaw) continue;
    const left = advancedMathEval(lhsRaw);
    const right = advancedMathEval(rhsRaw);
    if (left !== null && right !== null) {
      return { left, right, lhs: lhsRaw, rhs: rhsRaw };
    }
  }
  return null;
}

/**
 * Detects whether the input contains an arithmetic claim that can be
 * verified with an irrefutable proof.
 *
 * Handles:
 *   - Symbolic:   "2+2=4", "log_2(8)=3", "sqrt(16)=4"
 *   - Natural IT: "log_2(8) = 3 è giusto?", "2 + 2 è uguale a 5"
 *   - Natural EN: "sqrt(9) equals 3, right?"
 *
 * Returns { isMath: true, isTrue: bool, statement: string } or { isMath: false }.
 */
export function evaluateMath(text) {
  const trimmed = text.trim();

  // --- 1. Symbolic: look for exactly one `=` ---
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex !== -1 && trimmed.indexOf('=', eqIndex + 1) === -1) {
    const lhsRaw = extractMathPrefix(trimmed.slice(0, eqIndex));
    const rhsRaw = extractMathPrefix(trimmed.slice(eqIndex + 1));
    if (lhsRaw && rhsRaw) {
      const left = advancedMathEval(lhsRaw);
      const right = advancedMathEval(rhsRaw);
      if (left !== null && right !== null) {
        const isTrue = Math.abs(left - right) < 1e-9;
        return { isMath: true, isTrue, statement: `${lhsRaw} = ${rhsRaw}` };
      }
    }
  }

  // --- 2. Natural language ---
  const natural = extractNaturalMath(trimmed);
  if (natural) {
    const isTrue = Math.abs(natural.left - natural.right) < 1e-9;
    return { isMath: true, isTrue, statement: `${natural.lhs} = ${natural.rhs}` };
  }

  return { isMath: false };
}
