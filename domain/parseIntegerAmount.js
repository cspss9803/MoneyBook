export function parseIntegerAmount(rawValue, allowZeroOrNegative = false) {
    const parsed = Math.round(Number(rawValue));
    if (Number.isNaN(parsed)) {
        return allowZeroOrNegative ? 0 : 1;
    }
    if (allowZeroOrNegative) {
        return parsed;
    }
    return Math.max(1, Math.abs(parsed));
}