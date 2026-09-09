import type { TutorProviderId, TutorRequest } from "../../shared/types";

export interface TutorResult {
  reply: string;
  done: boolean;
}

/**
 * A constrained, single-purpose tutor. No autonomous loops: one user message
 * in, one tutor response out. Providers must be Socratic — they teach, they
 * don't hand over solutions.
 */
export interface TutorProvider {
  readonly id: TutorProviderId;
  readonly label: string;
  /** Is this provider usable right now (CLI installed + authenticated, or built-in)? */
  checkAvailable(): Promise<{ available: boolean; detail: string }>;
  chat(req: TutorRequest): Promise<TutorResult>;
  cancel(): void;
}
