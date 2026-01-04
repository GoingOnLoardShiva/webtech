"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // success | error

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setStatus(null);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-12 text-base xs:text-lg sm:text-xl font-medium leading-relaxed font-in"
    >
      Hello! My name is{" "}
      <input
        type="text"
        placeholder="your name"
        {...register("name", { required: true, maxLength: 80 })}
        className="outline-none border-0 mx-2 border-b bg-transparent"
      />
      and I want to discuss a potential project. You can email me at
      <input
        type="email"
        placeholder="your@email"
        {...register("email", { required: true })}
        className="outline-none border-0 mx-2 border-b bg-transparent"
      />
      or reach out to me on
      <input
        type="tel"
        placeholder="your phone"
        {...register("phone")}
        className="outline-none border-0 mx-2 border-b bg-transparent"
      />
      Here are some details about my project:
      <textarea
        {...register("message", { required: true })}
        placeholder="My project is about..."
        rows={3}
        className="w-full mt-2 outline-none border-0 border-b bg-transparent"
      />

      <button
        type="submit"
        disabled={loading}
        className="mt-8 font-medium inline-block capitalize text-lg py-2 px-8 border-2 rounded"
      >
        {loading ? "Sending..." : "Send Request"}
      </button>

      {/* Status Messages */}
      {status === "success" && (
        <p className="mt-4 text-green-600">
          ✅ Your message has been sent successfully!
        </p>
      )}
      {status === "error" && (
        <p className="mt-4 text-red-600">
          ❌ Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
