"use client";

import { useState } from "react";
import { firebaseAuth } from "@/lib/firebase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function CallApiButton() {
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setError("");
    setResult("");
    setPending(true);

    try {
      const idToken = await firebaseAuth().currentUser?.getIdToken();
      if (!idToken) {
        setError("No active Firebase session in this browser. Sign in again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/hello`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) {
        setError(`Request failed with status ${response.status}.`);
        return;
      }

      setResult(JSON.stringify(await response.json(), null, 2));
    } catch {
      setError("Could not reach the API.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="h-11 rounded-full bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        Call /hello API
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {result && (
        <pre className="w-full overflow-x-auto rounded-lg bg-zinc-100 p-4 font-mono text-sm dark:bg-zinc-900">
          {result}
        </pre>
      )}
    </div>
  );
}
