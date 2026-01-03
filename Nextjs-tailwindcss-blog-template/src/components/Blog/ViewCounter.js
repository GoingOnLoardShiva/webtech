"use client";
import React, { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'


const SUPABASE_URL = process.env.NEXTAUTH_URL;
const SUPABASE_ANON_KEY = process.env.NEXTAUTH_SECRET;

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  // Supabase not configured in this environment (likely local dev without env vars)
  // We'll avoid throwing and make functions no-ops so the app still works.
  console.warn('Supabase not configured: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing. ViewCounter will be disabled.');
}

const ViewCounter = ({ slug, noCount = false, showCount = true }) => {
  const [views, setViews] = useState(0);

  useEffect(() => {
    const incrementView = async () => {
      if (!supabase) return; // Supabase not configured
      try {
        let { error } = await supabase.rpc("increment", {
          slug_text: slug,
        });

        if (error) {
          console.error("Error incrementing view count inside try block:", error);
        }
      } catch (error) {
        console.error(
          "An error occurred while incrementing the view count:",
          error
        );
      }
    };

    if (!noCount) {
      incrementView();
    }
  }, [slug, noCount]);

  useEffect(() => {
    const getViews = async () => {
      if (!supabase) {
        setViews(0);
        return;
      }

      try {
        let { data, error } = await supabase.from("views").select("count").match({ slug: slug }).single();

        if (error) {
          console.error("Error incrementing view count inside try block:", error);
        }

        setViews(data ? data.count : 0);
      } catch (error) {
        console.error("An error occurred while incrementing the view count:", error);
      }
    };

    getViews();
  }, [slug]);

  if (showCount) {
    return <div>{views} views</div>;
  } else {
    return null;
  }
};

export default ViewCounter;
