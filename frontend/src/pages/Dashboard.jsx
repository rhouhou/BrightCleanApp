import React, { useState, useEffect, useMemo } from "react";
import { fetchItems } from "../utils/generalUtils";
import ItemsTable from "../components/ItemsTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs";
import  Pagination from "../components/Pagination";

import {
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_EXCHANGE_RATE = 90000;
const INITIAL_WEEK = new Date(2025, 0, 6);
const INITIAL_CASH = Math.round(379.33);

const Dashboard = () => {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading] = useState(true);
  const rowsPerPage = 10;
  const [weeklyPage, setWeeklyPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);


  // Fetch raw sales data
  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        const [ salesData, expensesData ] = await Promise.all([
          fetchItems("/api/sales"),
          fetchItems("/api/expenses"),
        ]);
        setSales(salesData);
        setExpenses(expensesData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  // Compute weekly summary
  const weeklySummary = useMemo(() => {
    if (!sales.length) return [];

    // sort sale dates
    const dates = sales
      .map((s) => new Date(s.dateOfPurchase))
      .sort((a, b) => a - b);
    const first = dates[0],
      last = dates[dates.length - 1];

    // get each Monday in range
    const weeks = eachWeekOfInterval(
      {
        start: startOfWeek(first, { weekStartsOn: 1 }),
        end: endOfWeek(last, { weekStartsOn: 1 }),
      },
      { weekStartsOn: 1 }
    );

    const unsorted  = weeks.map((wkStart) => {
      const wkEnd = endOfWeek(wkStart, { weekStartsOn: 1 });
      const bucket = sales.filter((s) => {
        const d = new Date(s.dateOfPurchase);
        return d >= wkStart && d <= wkEnd;
      });

      const totalSold = bucket.reduce(
        (sum, rec) => sum + (parseFloat(rec.quantity) || 0),
        0
      );
      const amountLL = bucket.reduce(
        (sum, rec) => sum + (parseFloat(rec.totalamount) || 0),
        0
      );
      // convert LBP → USD via exchangeRate field on each sale
      const amountUS = bucket.reduce((sum, rec) => {
        const ll   = parseFloat(rec.totalamount) || 0;
        const rate = rec.exchangeRate ? parseFloat(rec.exchangeRate) : DEFAULT_EXCHANGE_RATE;
        // avoid division by zero
        const us = rate > 0 ? ll / rate : 0;
        return sum + us;
      }, 0);
      // expenses in that week (USD)
      const expBucket = expenses.filter((e) => {
        const d = new Date(e.dateOfExpense);
        return d >= wkStart && d <= wkEnd;
      });
      const weekExpenses = expBucket.reduce(
        (sum, e) => sum + (parseFloat(e.paidInUSD) || 0),
        0
      );

      return {
        _wkStart: wkStart,
        weekStart: format(wkStart, "dd/MM/yyyy"),
        weekEnd: format(wkEnd, "dd/MM/yyyy"),
        totalSold,
        amountLL,
        amountUS,
        weekExpenses,
      };
    });
    unsorted.sort((a, b) => a._wkStart - b._wkStart);

    const withBalance = [];
    let prevBalance = 0;
    for (let i=0; i < unsorted.length; i++) {
      const w = unsorted[i];
      let cb =0;
      if (w._wkStart.getTime() === INITIAL_WEEK.getTime()) {
       cb = INITIAL_CASH;
     }else if (w._wkStart > INITIAL_WEEK) {
       // carry forward last week’s balance
       cb = prevBalance + w.amountUS - w.weekExpenses;
     }
      withBalance.push({ ...w, cashbalance: Math.round(cb) });
      prevBalance = cb;
    }
    return withBalance.map(({ _wkStart,...rest }) => rest).reverse();
  }, [sales, expenses]);

  // Compute monthly summary
  const monthlySummary = useMemo(() => {
    if (!sales.length) return [];

    const dates = sales
      .map((s) => new Date(s.dateOfPurchase))
      .sort((a, b) => a - b);
    const months = eachMonthOfInterval({
      start: dates[0],
      end: dates[dates.length - 1],
    });

    const unsorted = months.map((m) => {
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const bucket = sales.filter((s) => {
        const d = new Date(s.dateOfPurchase);
        return d >= mStart && d <= mEnd;
      }).reverse();

      const totalSold = bucket.reduce(
        (sum, rec) => sum + (parseFloat(rec.quantity) || 0),
        0
      );
      const amountLL = bucket.reduce(
        (sum, rec) => sum + (parseFloat(rec.totalamount) || 0),
        0
      );
      const amountUS = bucket.reduce((sum, rec) => {
        const ll   = parseFloat(rec.totalamount) || 0;
        const rate = rec.exchangeRate ? parseFloat(rec.exchangeRate) : DEFAULT_EXCHANGE_RATE;
        // avoid division by zero
        const us = rate > 0 ? ll / rate : 0;
        return sum + us;
      }, 0);

      return {
        _mStart: mStart,
        monthStart: format(mStart, "dd/MM/yyyy"),
        monthEnd: format(mEnd, "dd/MM/yyyy"),
        totalSold,
        amountLL: amountLL.toLocaleString(),
        amountUS: amountUS.toFixed(2),
      };
    });
    unsorted.sort((a, b) => b._mStart - a._mStart);
    return unsorted.map(({ _mStart, ...rest }) => rest);
  }, [sales]);

  //Weekly pagination
  const weeklyTotalPages = Math.ceil(weeklySummary.length / rowsPerPage);
  const weeklyPaginated = weeklySummary.slice(
    (weeklyPage - 1) * rowsPerPage,
    weeklyPage * rowsPerPage
  );
  //Monthly pagination
  const monthlyTotalPages = Math.ceil(monthlySummary.length / rowsPerPage);
  const monthlyPaginated = monthlySummary.slice(
    (monthlyPage - 1) * rowsPerPage,
    monthlyPage * rowsPerPage
  );

  if (loading) {
    return <div>Loading Dashboard…</div>;
  }

  // Column definitions for the two summaries
  const weeklyCols = [
    { header: "Week Start Date", accessor: "weekStart" },
    { header: "Week End Date", accessor: "weekEnd" },
    { header: "Units Sold", accessor: "totalSold" },
    { header: "Amount LL.", accessor: "amountLL" },
    { header: "Amount $", accessor: "amountUS" },
    { header: "Weekly Expenses $", accessor: "weekExpenses" },
    { header: "Current Cash Balance", accessor: "cashbalance" },
  ];

  const monthlyCols = [
    { header: "Month Start Date", accessor: "monthStart" },
    { header: "Month End Date", accessor: "monthEnd" },
    { header: "Units Sold", accessor: "totalSold" },
    { header: "Amount LL.", accessor: "amountLL" },
    { header: "Amount $", accessor: "amountUS" },
    { header: "Profit LL.", accessor: "profitLL" },
    { header: "Profit $", accessor: "profitUS" },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center">Dashboard</h1>

      {/* Tabs */}
      <Tabs defaultValue="weekly">
        <TabsList className="p-2 flex space-x-4">
          <TabsTrigger value="weekly" className="border rounded-lg p-2">Weekly Sales Summary</TabsTrigger>
          <TabsTrigger value="monthly" className="border rounded-lg p-2">Monthly Sales Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className={"p-2 space-y-6"}>
          {/* Chart */}
          <ResponsiveContainer width="70%" height={300} className="mx-auto">
             <ComposedChart data={weeklySummary} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} className="mt-4 bg-sky-100 rounded-lg p-4">
            <XAxis dataKey="weekStart" tick={{angle:-45, textAnchor: 'end', fontSize: 14}} tickMargin={14} height={60} interval={0}/>
            <YAxis  yAxisId="left" label={{ value: "Units Sold", angle: -90, position: "insideLeft" }}/>
             <YAxis yAxisId="right" orientation="right" label={{ value: "Amount $", angle: 90, position: "insideRight" }}/>
             <Tooltip
             formatter={(value, name) => name === "Units Sold" ? [value, name]
              : [value.toLocaleString(undefined, { minimumFractionDigits: 2 }), name]
            }/>
            <Legend verticalAlign="top" wrapperStyle={{ fontWeight: 'bold' }}/>
            <CartesianGrid strokeDasharray="3 3" />
            <Bar yAxisId="left" dataKey="totalSold" name="Units Sold" fill="#44B7C2"/>
            <Bar yAxisId="right" dataKey="amountUS" name="Amount $"fill="#ECAE52"/>
          </ComposedChart>
          </ResponsiveContainer>
          {/* Table (optional) */}  
          <ItemsTable
            columns={weeklyCols}
            items={weeklyPaginated}
            showActions={false}
          />
          <Pagination
            totalPages={weeklyTotalPages}
            currentPage={weeklyPage}
            onPageChange={(p) => setWeeklyPage(p)}
            />
        </TabsContent>

        <TabsContent value="monthly" className={"p-2 space-y-6"}>
          <ResponsiveContainer width="70%" height={300} className="mx-auto">
            <ComposedChart data={monthlySummary} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} className="mt-4 bg-sky-100 rounded-lg p-4">
              <XAxis dataKey="monthStart" tick={{angle:-45, textAnchor: 'end', fontSize: 14}} tickMargin={14} height={60} interval={0}/>
              <YAxis yAxisId="left" label={{ value: "Units Sold", angle: -90, position: "insideLeft" }}/>
              <YAxis yAxisId="right" orientation="right" label={{ value: "Amount $", angle: 90, position: "insideRight" }}/>
              <Tooltip
                formatter={(value, name) => name === "Units Sold" ? [value, name]
                  : [value.toLocaleString(undefined, { minimumFractionDigits: 2 }), name]
                }
              />
              <Legend verticalAlign="top" wrapperStyle={{ fontWeight: 'bold' }}/>
              <CartesianGrid strokeDasharray="3 3" />
              <Bar yAxisId="left" dataKey="totalSold" name="Units Sold" fill="#44B7C2"/>
              <Bar yAxisId="right" dataKey="amountUS" name="Amount $" fill="#ECAE52"/>
            </ComposedChart>
          </ResponsiveContainer>
          <ItemsTable
            columns={monthlyCols}
            items={monthlyPaginated}
            showActions={false}
          />
          <Pagination
            totalPages={monthlyTotalPages}
            currentPage={monthlyPage}
            onPageChange={(p) => setMonthlyPage(p)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
