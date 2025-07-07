// pages/admin.js

import React from "react";

const customers = [
  { name: "Sabih", plan: "Monthly", status: "Active" },
  { name: "Irfan", plan: "Weekly", status: "Paused" },
];

export default function Admin() {
  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-4">All Customers:</p>
      <ul className="mt-2 list-disc pl-5">
        {customers.map((c, i) => (
          <li key={i}>
            {c.name} - {c.plan} Plan - {c.status}
          </li>
        ))}
      </ul>
    </main>
  );
}
