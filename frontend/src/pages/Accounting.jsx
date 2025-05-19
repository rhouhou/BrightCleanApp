import React, { useEffect, useState } from "react";
import { fetchItems } from "../utils/generalUtils";
import ItemsTable from "../components/ItemsTable";

const Accounting = () => {
  const [accountingData, setAccountingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountingData = async () => {
      setLoading(true);
      try {
        const [expenses, sales, products] = await Promise.all([
          fetchItems("/api/expenses"),
          fetchItems("/api/sales"),
          fetchItems("/api/products"),
        ]);

        const aggregatedData = aggregateAccountingData(
          expenses,
          sales,
          products
        );
        setAccountingData(aggregatedData);
      } catch (error) {
        console.error("Error fetching accounting data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountingData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const accountingColumns = [
    {
      header: "Month",
      accessor: "month",
      isEditable: false,
      type: "number",
    },
    {
      header: "Year",
      accessor: "year",
      isEditable: false,
      type: "number",
    },
    {
      header: "Total Purchases & Supplies",
      accessor: "totalPurchasesAndSupplies",
      isEditable: false,
      type: "number",
    },
    {
      header: "Regular Facility Expenses",
      accessor: "regularFacilityExpenses",
      isEditable: false,
      type: "number",
    },
    {
      header: "Irregular Facility Expenses",
      accessor: "irregularFacilityExpenses",
      isEditable: false,
      type: "number",
    },
    {
      header: "Utilities",
      accessor: "utilities",
      isEditable: false,
      type: "number",
    },
    {
      header: "Revenues",
      accessor: "revenues",
      isEditable: false,
      type: "number",
    },
    {
      header: "Cost of Goods Sold",
      accessor: "costOfGoodsSold",
      isEditable: false,
      type: "number",
    },
    {
      header: "General Profit Index",
      accessor: "generalProfitIndex",
      getCellClassName: (value) =>
        value < 0 ? "text-red-500 bg-red-100" : "text-green-500 bg-green-100",
    },
    {
      header: "Profit & Loss",
      accessor: "profitAndLoss",
      getCellClassName: (value) =>
        value < 0 ? "text-red-500 bg-red-100" : "text-green-500 bg-green-100",
    },
  ];

  return (
    <>
      <div>
        <h1 className="page-title">Accounting Overview</h1>
      </div>
      <div className="table-panel">
        <ItemsTable
          columns={accountingColumns}
          items={accountingData}
          showActions={false}
        />
      </div>
    </>
  );
};

export default Accounting;

const aggregateAccountingData = (expenses, sales, products) => {
  const productCostMap = products.reduce((map, p) => {
    map[p.productname] = parseFloat(p.totalcost || 0);
    return map;
  }, {});

  const data = {};
  const rateStats = {};

  expenses.forEach((expense) => {
    const date = new Date(expense.dateOfExpense);
    const month = date.getMonth() + 1; // Get month (0-indexed, so +1)
    const year = date.getFullYear();
    const key = `${year}-${month}`;
    const rate = parseFloat(expense.exchangeRate) || 0;

    rateStats[key] = rateStats[key]
      ? {
          sum: rateStats[key].sum + rate,
          count: rateStats[key].count + (rate > 0 ? 1 : 0),
        }
      : { sum: rate, count: rate > 0 ? 1 : 0 };

    if (!data[key]) {
      data[key] = {
        month,
        year,
        totalPurchasesAndSupplies: 0,
        regularFacilityExpenses: 0,
        irregularFacilityExpenses: 0,
        utilities: 0,
        costOfGoodsSold: 0,
        revenues: 0,
        generalProfitIndex: 0,
        profitAndLoss: 0,
      };
    }

    const amount = parseFloat(expense.paidInUSD || 0);

    // Categorize expenses
    switch (expense.category) {
      case "Regular Facility Expenses":
        data[key].regularFacilityExpenses += amount;
        break;
      case "Irregular Facility Expenses":
        data[key].irregularFacilityExpenses += amount;
        break;
      case "Utilities":
        data[key].utilities += amount;
        break;
      default:
        data[key].totalPurchasesAndSupplies += amount;
    }
  });
  // Compute average exchange rate map
  const exchangeRateMap = Object.fromEntries(
    Object.entries(rateStats).map(([k, { sum, count }]) => [
      k,
      count ? sum / count : 1,
    ])
  );

  // Process sales data
  sales.forEach((sale) => {
    const date = new Date(sale.dateOfPurchase);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const key = `${year}-${month}`;

    if (!data[key]) {
      data[key] = {
        month,
        year,
        totalPurchasesAndSupplies: 0,
        regularFacilityExpenses: 0,
        irregularFacilityExpenses: 0,
        utilities: 0,
        costOfGoodsSold: 0,
        revenues: 0,
        generalProfitIndex: 0,
        profitAndLoss: 0,
      };
    }
    const productKey = sale.productname;
    const rate = exchangeRateMap[key] || 1;
    const qty = parseFloat(sale.quantity) || 0;
    const priceLBP = parseFloat(sale.totalamount) || 0;
    const costPerUnitLBP = productCostMap[productKey] || 0;
    data[key].revenues += priceLBP / rate;
    if (!costPerUnitLBP) {
      console.warn(
        `No cost found for "${productKey}" in productCostMap`,
        productCostMap
      );
    }
    if (!qty) {
      console.warn(`Sale has zero quantity or wrong field:`, sale);
    }
    data[key].costOfGoodsSold += costPerUnitLBP * qty;
  });

  // Rounds a number to 2 decimals
  const round2 = (num) => Math.round(num * 100) / 100;

  // Final calculations per entry
  return Object.values(data).map((e) => {
    const GP =
      -e.totalPurchasesAndSupplies -
      e.regularFacilityExpenses -
      e.irregularFacilityExpenses -
      e.utilities +
      e.revenues;
    const PNL =
      -e.regularFacilityExpenses -
      e.irregularFacilityExpenses -
      e.utilities -
      e.costOfGoodsSold +
      e.revenues;
    return {
      month: e.month,
      year: e.year,
      totalPurchasesAndSupplies: round2(e.totalPurchasesAndSupplies),
      regularFacilityExpenses: round2(e.regularFacilityExpenses),
      irregularFacilityExpenses: round2(e.irregularFacilityExpenses),
      utilities: round2(e.utilities),
      revenues: round2(e.revenues),
      costOfGoodsSold: round2(e.costOfGoodsSold),
      generalProfitIndex: round2(GP),
      profitAndLoss: round2(PNL),
    };
  });
};
