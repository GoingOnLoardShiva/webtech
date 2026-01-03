"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);

    const res = await fetch("/api/admin-login", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.message);
      return;
    }

    window.location.href = "/admin/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-950 border border-slate-800 p-8 rounded-xl shadow-2xl"
      >
        <h1 className="text-2xl font-bold text-center text-white">
          Admin Login
        </h1>
        <p className="text-center text-sm text-slate-400 mt-1">
          Authorized access only
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-2 rounded mt-4 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6">
          <label className="text-sm text-slate-400">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-slate-400">Password</label>
          <input
            type="password"
            name="password"
            required
            className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 transition rounded py-2 font-semibold text-white"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
