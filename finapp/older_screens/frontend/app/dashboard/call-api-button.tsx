"use client";

import { useState } from "react";
import { firebaseAuth } from "@/infrastructure/firebase/client";
import { buttonClass } from "@/shared/ui/styles";

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
        className={buttonClass}
      >
        Call /hello API
      </button>

      {error && (
        <p role="alert" className="rounded-xl bg-expense-container p-3 text-sm text-expense">
          {error}
        </p>
      )}

      {result && (
        <pre className="w-full overflow-x-auto rounded-xl bg-surface-subtle p-4 font-mono text-sm text-foreground">
          {result}
        </pre>
      )}
    </div>
  );
}
