type SessionStatus = "RECORDING" | "REVIEW" | "APPROVED" | "COMPLETED" | "FAILED";

const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
  RECORDING: ["REVIEW", "FAILED"],
  REVIEW: ["APPROVED", "FAILED", "COMPLETED"],
  APPROVED: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: [],
};

export function canTransitionSessionStatus(current: SessionStatus, next: SessionStatus) {
  return allowedTransitions[current].includes(next);
}

export function assertSessionTransition(current: SessionStatus, next: SessionStatus) {
  if (!canTransitionSessionStatus(current, next)) {
    throw new Error(`Invalid session transition: ${current} -> ${next}`);
  }
}
