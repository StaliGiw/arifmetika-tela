const test = require('node:test');
const assert = require('node:assert/strict');
const { monthStats } = require('../calculations.js');

test('считает только приёмы выбранного месяца и фактически полученные деньги', () => {
  const patients = [{ firstName: 'Тест', visits: [
    { date: '2026-09-01', type: 'Первичный', price: 2000, paidAmount: 2000 },
    { date: '2026-09-30', type: 'Повторный', price: 2500, paidAmount: 1000 },
    { date: '2026-10-01', type: 'Повторный', price: 3000, paidAmount: 3000 }
  ] }];
  assert.deepEqual(monthStats(patients, '2026-09'), { visits: [
    { date: '2026-09-01', type: 'Первичный', price: 2000, paidAmount: 2000, patientName: 'Тест' },
    { date: '2026-09-30', type: 'Повторный', price: 2500, paidAmount: 1000, patientName: 'Тест' }
  ], income: 3000, unpaid: 1500, average: 1500, primary: 1, unpaidCount: 1 });
});

test('пустой месяц возвращает нулевые показатели', () => {
  const result = monthStats([], '2026-09');
  assert.equal(result.income, 0); assert.equal(result.average, 0); assert.equal(result.visits.length, 0);
});
