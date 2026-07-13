"use client";

import { useCallback, useEffect, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (!SITE_KEY) return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-tl-recaptcha="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("reCAPTCHA failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.dataset.tlRecaptcha = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("reCAPTCHA failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function useRecaptcha(action: string) {
  const enabled = Boolean(SITE_KEY);
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadRecaptchaScript()
      .then(() => {
        window.grecaptcha?.ready(() => {
          if (!cancelled) setReady(true);
        });
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (!enabled || !SITE_KEY) return undefined;
    await loadRecaptchaScript();
    return new Promise((resolve) => {
      window.grecaptcha?.ready(() => {
        window.grecaptcha
          ?.execute(SITE_KEY, { action })
          .then(resolve)
          .catch(() => resolve(undefined));
      });
    });
  }, [action, enabled]);

  return { enabled, ready, getToken };
}

/** Invisible honeypot — leave empty. Bots often fill it. */
export function HoneypotField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
    >
      <label htmlFor="tl-company-url">Company website</label>
      <input
        id="tl-company-url"
        name="company_url"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
