// Spreadsheet-compatible export: one CSV per dataset (opens in Excel / Google Sheets).
const esc = (v) => {
    const s = v == null ? '' : String(v);
    // Neutralise spreadsheet formula injection, then quote if needed
    const safe = /^[=+\-@]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export function toCsv(rows) {
    if (!rows.length)
        return '';
    const cols = Object.keys(rows[0]);
    return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}
export function downloadCsv(name, rows) {
    const blob = new Blob(['\ufeff' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
}
