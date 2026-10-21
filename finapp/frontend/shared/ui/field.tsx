"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "false" | "true";
};

export function Field({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const control = isValidElement<FieldControlProps>(children)
    ? cloneElement(children as ReactElement<FieldControlProps>, {
        id: children.props.id || generatedId,
        "aria-invalid": error ? true : children.props["aria-invalid"],
        "aria-describedby": error
          ? [children.props["aria-describedby"], errorId].filter(Boolean).join(" ")
          : children.props["aria-describedby"],
      })
    : children;

  return <div className="grid gap-1.5 text-sm font-medium"><label htmlFor={isValidElement<FieldControlProps>(control) ? control.props.id : undefined}>{label}</label>{control}{error && <span id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</span>}</div>;
}
