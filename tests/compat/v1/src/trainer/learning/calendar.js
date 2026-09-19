export function dayInZone(instant, timeZone) {
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid instant');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({type, value}) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDays(day, count) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match || !Number.isInteger(count)) throw new RangeError('Invalid calendar day');
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== day) throw new RangeError('Invalid calendar day');
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
