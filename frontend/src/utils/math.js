/**
 * Safe arithmetic evaluator — only allows digits, basic operators, parens, dot, power.
 * Returns the numeric result or null if the expression is not valid arithmetic.
 */
function safeMathEval(expr) {
  const cleaned = expr.replace(/\s/g, '').replace(/\^/g, '**');
  if (!/^[\d+\-*/.()** ]+$/.test(cleaned.replace(/\*\*/g, ''))) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + cleaned + ')')();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * Detects whether the input is a simple arithmetic equation that can be
 * verified with an irrefutable proof (e.g. "2 + 2 = 4", "3 ^ 2 = 9").
 *
 * Returns { isMath: true, isTrue: bool } or { isMath: false }.
 */
export function evaluateMath(text) {
  const trimmed = text.trim();

  // Must contain exactly one `=` sign
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1 || trimmed.indexOf('=', eqIndex + 1) !== -1) {
    return { isMath: false };
  }

  const lhs = trimmed.slice(0, eqIndex).trim();
  const rhs = trimmed.slice(eqIndex + 1).trim();

  if (!lhs || !rhs) return { isMath: false };

  const left = safeMathEval(lhs);
  const right = safeMathEval(rhs);

  if (left === null || right === null) return { isMath: false };

  // Use a tiny epsilon for floating-point comparisons
  const isTrue = Math.abs(left - right) < 1e-10;
  return { isMath: true, isTrue, left, right };
}
