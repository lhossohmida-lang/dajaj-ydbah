import { toNumber, roundNumber } from './calculations.js';

const customerNameFields = ['customerName', 'buyerName', 'clientName', 'customerFullName'];
const customerPhoneFields = ['phone', 'customerPhone', 'buyerPhone', 'clientPhone'];

function firstTextValue(record, fields) {
  const value = fields.map((field) => record[field]).find((fieldValue) => String(fieldValue || '').trim());

  return String(value || '').trim();
}

function buildCustomerKey(name, phone = '') {
  return `${String(name || '').trim()}__${String(phone || '').trim()}`;
}

function emptyCustomer(key, name, phone = '') {
  return {
    key,
    name,
    phone,
    transactions: [],
    transactionCount: 0,
    chickenCount: 0,
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    lastTransactionDate: '',
  };
}

function addCustomerTransaction(customersMap, transaction) {
  const name = String(transaction.customerName || '').trim();

  if (!name) {
    return;
  }

  const phone = String(transaction.phone || '').trim();
  const key = buildCustomerKey(name, phone);

  if (!customersMap.has(key)) {
    customersMap.set(key, emptyCustomer(key, name, phone));
  }

  const customer = customersMap.get(key);
  customer.transactions.push(transaction);
  customer.transactionCount += 1;
  customer.chickenCount += toNumber(transaction.chickenCount);
  customer.totalAmount += toNumber(transaction.totalAmount);
  customer.paidAmount += toNumber(transaction.paidAmount);
  customer.remainingAmount += toNumber(transaction.remainingAmount);

  const transactionDateTime = `${transaction.date || ''} ${transaction.time || ''}`.trim();
  if (transactionDateTime && transactionDateTime.localeCompare(customer.lastTransactionDate) > 0) {
    customer.lastTransactionDate = transactionDateTime;
  }
}

export function buildCustomerTransactions(services = [], slaughters = []) {
  const transactions = [];

  services.forEach((service) => {
    transactions.push({
      id: `service-${service.id}`,
      sourceId: service.id,
      type: 'خدمة ذبح',
      customerName: service.customerName,
      phone: service.phone || '',
      date: service.date,
      time: service.time || '',
      chickenCount: service.chickenCount,
      totalAmount: service.totalAmount,
      paidAmount: service.paidAmount,
      remainingAmount: service.remainingAmount,
      notes: service.notes,
    });
  });

  slaughters.forEach((record) => {
    const customerName = firstTextValue(record, customerNameFields);

    if (!customerName) {
      return;
    }

    transactions.push({
      id: `sale-${record.id}`,
      sourceId: record.id,
      type: 'شراء سابق',
      customerName,
      phone: firstTextValue(record, customerPhoneFields),
      date: record.date,
      time: record.time || '',
      chickenCount: record.chickenCount,
      totalAmount: record.revenue,
      paidAmount: record.paidAmount ?? record.revenue,
      remainingAmount: record.remainingAmount ?? 0,
      notes: record.notes,
    });
  });

  return transactions.sort((firstTransaction, secondTransaction) => {
    const firstDateTime = `${firstTransaction.date || ''} ${firstTransaction.time || ''}`;
    const secondDateTime = `${secondTransaction.date || ''} ${secondTransaction.time || ''}`;

    return secondDateTime.localeCompare(firstDateTime);
  });
}

export function buildCustomers(services = [], slaughters = []) {
  const customersMap = new Map();

  buildCustomerTransactions(services, slaughters).forEach((transaction) => {
    addCustomerTransaction(customersMap, transaction);
  });

  return Array.from(customersMap.values())
    .map((customer) => ({
      ...customer,
      chickenCount: roundNumber(customer.chickenCount),
      totalAmount: roundNumber(customer.totalAmount),
      paidAmount: roundNumber(customer.paidAmount),
      remainingAmount: roundNumber(customer.remainingAmount),
    }))
    .sort((firstCustomer, secondCustomer) => {
      const byDate = secondCustomer.lastTransactionDate.localeCompare(firstCustomer.lastTransactionDate);
      return byDate || firstCustomer.name.localeCompare(secondCustomer.name, 'ar');
    });
}
