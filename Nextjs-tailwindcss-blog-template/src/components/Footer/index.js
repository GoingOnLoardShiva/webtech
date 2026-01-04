"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { DribbbleIcon, GithubIcon, LinkedinIcon, TwitterIcon } from "../Icons";
import Link from "next/link";
import siteMetadata from "@/src/utils/siteMetaData";

const Footer = () => {
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

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="mt-16 rounded-2xl bg-dark dark:bg-accentDark/90 m-2 sm:m-10 flex flex-col items-center text-light dark:text-dark">
      <h3 className="mt-16 font-medium text-center text-2xl sm:text-3xl lg:text-4xl px-4">
        Interesting Stories | Updates | Guides
      </h3>

      <p className="mt-5 px-4 text-center w-full sm:w-3/5 text-sm sm:text-base">
        Subscribe to learn about new technology and updates.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 w-fit sm:min-w-[384px] flex items-stretch bg-light dark:bg-dark p-2 rounded"
      >
        <input
          type="email"
          placeholder="Enter your email"
          {...register("email", { required: true })}
          className="w-full bg-transparent pl-2 text-dark border-0 border-b mr-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-dark text-light dark:text-dark dark:bg-light font-medium rounded px-5"
        >
          {loading ? "Sending..." : "Subscribe"}
        </button>
      </form>

      {/* Status messages */}
      {status === "success" && (
        <p className="mt-3 text-green-400 text-sm">
          ✅ Subscribed successfully!
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-red-400 text-sm">
          ❌ Failed to subscribe. Try again.
        </p>
      )}

      {/* Social icons */}
      <div className="flex items-center mt-8">
        <a href={siteMetadata.linkedin} target="_blank" rel="noreferrer">
          <LinkedinIcon />
        </a>
        <a href={siteMetadata.twitter} target="_blank" rel="noreferrer">
          <TwitterIcon />
        </a>
        <a href={siteMetadata.github} target="_blank" rel="noreferrer">
          <GithubIcon />
        </a>
        <a href={siteMetadata.dribbble} target="_blank" rel="noreferrer">
          <DribbbleIcon />
        </a>
      </div>

      <div className="w-full mt-16 border-t py-6 px-8 flex flex-col md:flex-row items-center justify-between">
        <span>&copy;2023 CodeBucks. All rights reserved.</span>
        <Link href="/sitemap.xml" className="underline">
          sitemap.xml
        </Link>
        <span>
          Made with &hearts; by{" "}
          <a href="https://devdreaming.com" className="underline" target="_blank">
            CodeBucks
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
