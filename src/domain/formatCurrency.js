export function formatCurrency(amount) {
    const intVal = Math.round(Number(amount) || 0);
    const absFormatted = Math.abs(intVal).toLocaleString('en-US');
    return intVal < 0 ? `-$${absFormatted}` : `$${absFormatted}`;
}
