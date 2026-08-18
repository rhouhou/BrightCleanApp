import React, { useEffect, useState } from "react";
import { fetchItems } from "../utils/generalUtils";
import ItemsTable from "../components/ItemsTable";

const DEFAULT_EXCHANGE_RATE = 90000;

const Accounting = () => {
  const [accountingData, setAccountingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountingData = async () => {
      setLoading(true);

      try {
        const [expenses, sales] = await Promise.all([
          fetchItems("/api/expenses"),
          fetchItems("/api/sales"),
        ]);

        const aggregatedData = aggregateAccountingData(
          expenses,
          sales
        );

        setAccountingData(aggregatedData);
      } catch (error) {
        console.error(
          "Error fetching accounting data:",
          error
        );
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
    },
    {
      header: "Year",
      accessor: "year",
      isEditable: false,
    },
    {
      header: "Total Goods",
      accessor: "totalGoods",
      isEditable: false,
    },
    {
      header: "Regular Expenses",
      accessor: "regularExpenses",
      isEditable: false,
    },
    {
      header: "Irregular Expenses",
      accessor: "irregularExpenses",
      isEditable: false,
    },
    {
      header: "Utilities",
      accessor: "utilities",
      isEditable: false,
    },
    {
      header: "Revenues",
      accessor: "revenues",
      isEditable: false,
    },
    {
      header: "Gross Profit",
      accessor: "grossProfit",
      isEditable: false,
      getCellClassName: (value) =>
        value < 0
          ? "text-red-500 bg-red-100"
          : "text-green-500 bg-green-100",
    },
    {
      header: "Cost of Goods Sold",
      accessor: "costOfGoodsSold",
      isEditable: false,
    },
    {
      header: "Net Profit",
      accessor: "netProfit",
      isEditable: false,
      getCellClassName: (value) =>
        value < 0
          ? "text-red-500 bg-red-100"
          : "text-green-500 bg-green-100",
    },
  ];

  return (
    <>
      <div>
        <h1 className="page-title">
          Accounting Overview
        </h1>
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

const aggregateAccountingData = (
  expenses,
  sales
) => {
  const data = {};

  const createMonth = (month, year) => ({
    month,
    year,
    totalGoods: 0,
    regularExpenses: 0,
    irregularExpenses: 0,
    utilities: 0,
    revenues: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    netProfit: 0,
  });

  // -----------------------------
  // EXPENSES
  // -----------------------------
  expenses.forEach((expense) => {
    const date = new Date(expense.dateOfExpense);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const key = `${year}-${month}`;

    if (!data[key]) {
      data[key] = createMonth(month, year);
    }

    const amount =
      parseFloat(expense.paidInUSD) || 0;

    switch (expense.category) {
      case "Regular Facility Expenses":
        data[key].regularExpenses += amount;
        break;

      case "Irregular Facility Expenses":
        data[key].irregularExpenses += amount;
        break;

      case "Utilities":
        data[key].utilities += amount;
        break;

      default:
        // Raw materials, bottles, labels,
        // production supplies, etc.
        data[key].totalGoods += amount;
        break;
    }
  });

  // -----------------------------
  // SALES
  // -----------------------------
  sales.forEach((sale) => {
    const date = new Date(sale.dateOfPurchase);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const key = `${year}-${month}`;

    if (!data[key]) {
      data[key] = createMonth(month, year);
    }

    // Revenue
    const totalAmountLL =
      parseFloat(sale.totalamount) || 0;

    const exchangeRate =
      parseFloat(sale.exchangeRate) ||
      DEFAULT_EXCHANGE_RATE;

    const revenueUSD =
      exchangeRate > 0
        ? totalAmountLL / exchangeRate
        : 0;

    data[key].revenues += revenueUSD;

    // COGS
    if (
      sale.totalCostAtSaleUSD === undefined ||
      sale.totalCostAtSaleUSD === null
    ) {
      console.warn(
        `Old sale ${sale.transactions} has no saved historical cost.`
      );
    } else {
      data[key].costOfGoodsSold +=
        parseFloat(sale.totalCostAtSaleUSD) || 0;
    }
  });

  const round2 = (number) =>
    Math.round((number + Number.EPSILON) * 100) /
    100;

  // -----------------------------
  // FINAL ACCOUNTING
  // -----------------------------
  return Object.values(data)
    .map((entry) => {
      const grossProfit =
        entry.revenues -
        entry.costOfGoodsSold;

      const netProfit =
        grossProfit -
        entry.regularExpenses -
        entry.irregularExpenses -
        entry.utilities;

      return {
        month: entry.month,
        year: entry.year,

        totalGoods: round2(
          entry.totalGoods
        ),

        regularExpenses: round2(
          entry.regularExpenses
        ),

        irregularExpenses: round2(
          entry.irregularExpenses
        ),

        utilities: round2(
          entry.utilities
        ),

        revenues: round2(
          entry.revenues
        ),

        grossProfit: round2(
          grossProfit
        ),

        costOfGoodsSold: round2(
          entry.costOfGoodsSold
        ),

        netProfit: round2(
          netProfit
        ),
      };
    })
    .sort(
      (a, b) =>
        a.year - b.year ||
        a.month - b.month
    );
};