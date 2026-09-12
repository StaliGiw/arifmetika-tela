(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AppCalculations = api;
})(typeof self !== 'undefined' ? self : this, function () {
  function monthKey(dateValue) { return String(dateValue || '').slice(0, 7); }
  function currency(value) { return new Intl.NumberFormat('ru-RU').format(Number(value) || 0) + ' ₽'; }
  function monthStats(patients, selectedMonth) {
    const visits = (patients || []).flatMap(p => (p.visits || []).map(v => ({ ...v, patientName: [p.lastName, p.firstName].filter(Boolean).join(' ') })) ).filter(v => monthKey(v.date) === selectedMonth);
    const income = visits.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);
    const unpaid = visits.reduce((sum, v) => sum + Math.max(0, (Number(v.price) || 0) - (Number(v.paidAmount) || 0)), 0);
    const paidVisits = visits.filter(v => Number(v.paidAmount) > 0);
    return { visits, income, unpaid, average: paidVisits.length ? income / paidVisits.length : 0, primary: visits.filter(v => v.type === 'Первичный').length, unpaidCount: visits.filter(v => Number(v.paidAmount) < Number(v.price)).length };
  }
  return { monthKey, currency, monthStats };
});
