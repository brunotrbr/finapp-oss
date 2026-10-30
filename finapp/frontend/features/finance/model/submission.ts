export type PendingSubmission = { fingerprint: string; key: string };

export function submissionFor(
  current: PendingSubmission | null,
  payload: unknown,
  createKey: () => string = () => crypto.randomUUID(),
): PendingSubmission {
  const fingerprint = JSON.stringify(payload);
  return current?.fingerprint === fingerprint ? current : { fingerprint, key: createKey() };
}
