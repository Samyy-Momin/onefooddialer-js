// pages/customer.js

import React, { useState } from "react";

export default function Customer() {
  const [plan, setPlan] = useState("");

  const getSuggestion = async () => {
    const res = await fetch("/api/gpt");
    const data = await res.json();
    setPlan(data.result);
  };

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">Welcome, Sabih</h1>
      <button
        onClick={getSuggestion}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Get AI Subscription Suggestion
      </button>
      {plan && <p className="mt-4 bg-gray-100 p-4">{plan}</p>}
    </main>
  );
}
