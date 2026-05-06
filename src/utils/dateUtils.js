export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function parseInputDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isSameDay(value, date = new Date()) {
  const parsed = parseInputDate(value);

  if (!parsed) {
    return false;
  }

  return parsed.toDateString() === date.toDateString();
}

export function startOfWeek(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfWeek(date = new Date()) {
  const copy = startOfWeek(date);
  copy.setDate(copy.getDate() + 6);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function isCurrentWeek(value) {
  const parsed = parseInputDate(value);

  if (!parsed) {
    return false;
  }

  const start = startOfWeek();
  const end = endOfWeek();
  return parsed >= start && parsed <= end;
}

export function isCurrentMonth(value) {
  const parsed = parseInputDate(value);
  const now = new Date();

  if (!parsed) {
    return false;
  }

  return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth();
}

export function filterByPeriod(items, period) {
  if (period === 'today') {
    return items.filter((item) => isSameDay(item.date));
  }

  if (period === 'week') {
    return items.filter((item) => isCurrentWeek(item.date));
  }

  if (period === 'month') {
    return items.filter((item) => isCurrentMonth(item.date));
  }

  return items;
}

export function groupByDay(items) {
  return items.reduce((groups, item) => {
    if (!groups[item.date]) {
      groups[item.date] = [];
    }

    groups[item.date].push(item);
    return groups;
  }, {});
}
