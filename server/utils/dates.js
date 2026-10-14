// All booking dates are calendar days in 'YYYY-MM-DD' form (no time zones involved).
const DAY_MS = 86400000;

const toDay = (value) => {
  const d = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  return d.toISOString().slice(0, 10);
};

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (day, n) => toDay(new Date(new Date(`${day}T00:00:00Z`).getTime() + n * DAY_MS));

const diffDays = (from, to) =>
  Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / DAY_MS);

// Days from `from` (inclusive) to `to` (exclusive).
const range = (from, to) => {
  const days = [];
  for (let d = from; d < to; d = addDays(d, 1)) days.push(d);
  return days;
};

const weekday = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();

const isValidDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && toDay(value) === value;

module.exports = { toDay, today, addDays, diffDays, range, weekday, isValidDay, DAY_MS };
