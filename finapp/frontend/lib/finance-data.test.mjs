import assert from "node:assert/strict";
import test from "node:test";
import { accountRecordKey, demoFinanceAccounts, getAccountOverview } from "./finance-data.ts";

test("todas contas consolida os saldos e os registros sem duplicar valores", () => {
  const overview = getAccountOverview(demoFinanceAccounts, null);
  assert.equal(overview.name, "todas contas");
  assert.equal(overview.totalBalance, 24380.55);
  assert.equal(overview.monthChange, 1240);
  assert.equal(overview.monthBillsTotal, 5820);
  assert.equal(overview.freeBalance, 18560.55);
  assert.equal(overview.pendingBills.length, 3);
  assert.equal(overview.upcomingBills.length, 4);
  assert.equal(overview.recentTransactions.length, 3);
});

test("selecionar um ID usa o nome e somente os dados daquela conta", () => {
  for (const account of demoFinanceAccounts) {
    const overview = getAccountOverview(demoFinanceAccounts, account.id);
    assert.equal(overview.name, account.name);
    assert.equal(overview.totalBalance, account.totalBalance);
    assert.equal(overview.monthChange, account.monthChange);
    assert.equal(overview.monthBillsTotal, account.monthBillsTotal);
    for (const field of ["pendingBills", "upcomingBills", "recentTransactions"]) {
      assert.equal(overview[field].length, account[field].length);
      assert.ok(overview[field].every((record) => record.accountId === account.id));
    }
  }
});

test("a lista suporta N contas, nomes iguais e soma monetária em centavos", () => {
  const accounts = [0.1, 0.2, 0.3].map((balance, index) => ({
    ...demoFinanceAccounts[0],
    id: `id-${index}`,
    name: "Mesmo nome",
    totalBalance: balance,
    monthBillsTotal: 0,
  }));
  assert.equal(getAccountOverview(accounts, null).totalBalance, 0.6);
  assert.equal(getAccountOverview(accounts, "id-1").totalBalance, 0.2);
  assert.equal(getAccountOverview(accounts, "id-1").name, "Mesmo nome");
});

test("lista vazia ou ID desconhecido não expõe dados de outras contas", () => {
  for (const overview of [
    getAccountOverview([], null),
    getAccountOverview(demoFinanceAccounts, "desconhecida"),
  ]) {
    assert.equal(overview.totalBalance, 0);
    assert.equal(overview.monthBillsTotal, 0);
    assert.equal(overview.freeBalance, 0);
    assert.deepEqual(overview.pendingBills, []);
    assert.deepEqual(overview.upcomingBills, []);
    assert.deepEqual(overview.recentTransactions, []);
  }
});

test("confirmações e chaves distinguem IDs repetidos em contas diferentes", () => {
  const first = accountRecordKey("conta-1", "b1");
  const second = accountRecordKey("conta-2", "b1");
  assert.notEqual(first, second);
  assert.equal(first, accountRecordKey("conta-1", "b1"));
  assert.notEqual(accountRecordKey("a:b", "c"), accountRecordKey("a", "b:c"));
});
