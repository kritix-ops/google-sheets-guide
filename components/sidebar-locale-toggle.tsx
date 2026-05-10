"use client";

import { useEffect } from "react";

import type { Locale } from "@/lib/i18n/routing";

const STORAGE_KEY = "sheets-guide-sidebar-locale";

// Reads the saved sidebar locale from localStorage. If it differs from the
// current path locale, navigates to the saved locale's sidebar URL.
//
// This is how the in-sheet sidebar honors the user's last locale choice
// even though the iframe URL was hardcoded into the Apps Script project at
// provisioning time. The Apps Script HTML is on googleusercontent.com and
// can't read localhost's localStorage; this client effect runs in the
// localhost iframe itself, where it can.
export function SidebarLocaleSync({
  pathLocale,
}: {
  pathLocale: Locale;
}) {
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable — bail
      return;
    }
    if (saved && saved !== pathLocale && (saved === "en" || saved === "he")) {
      const url = new URL(window.location.href);
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments[0] === pathLocale) segments[0] = saved;
      url.pathname = "/" + segments.join("/");
      window.location.replace(url.toString());
    }
  }, [pathLocale]);
  return null;
}

export function SidebarLocaleToggle({
  pathLocale,
}: {
  pathLocale: Locale;
}) {
  function switchTo(target: Locale) {
    try {
      localStorage.setItem(STORAGE_KEY, target);
    } catch {
      // ignore
    }
    if (target === pathLocale) return;
    const url = new URL(window.location.href);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] === pathLocale) segments[0] = target;
    url.pathname = "/" + segments.join("/");
    window.location.assign(url.toString());
  }

  return (
    <div className="sc-locale-toggle" role="group" aria-label="Locale">
      <button
        type="button"
        lang="en"
        className={pathLocale === "en" ? "is-active" : ""}
        onClick={() => switchTo("en")}
        aria-pressed={pathLocale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        lang="he"
        className={pathLocale === "he" ? "is-active" : ""}
        onClick={() => switchTo("he")}
        aria-pressed={pathLocale === "he"}
      >
        עב
      </button>
    </div>
  );
}
