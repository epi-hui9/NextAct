/**
 * Automatic validation for generated Story/Legacy claims.
 *
 * There is no human review. Every factual sentence must have supporting source
 * ids. Two outcomes only:
 *   1. A sentence without evidence is removed.
 *   2. A gap that only the client can fill becomes one natural follow-up
 *      question.
 *
 * The client receives only the supported result plus, when appropriate, one
 * follow-up question. Internal statuses (verifier failure, low confidence) are
 * never surfaced.
 */

export interface CandidateStatement {
  text: string;
  sourceIds: string[];
}

export interface ValidationResult {
  supportedStatements: string[];
  removedStatements: string[];
  followUpQuestion: string | null;
}

export function validateArtifact(
  statements: CandidateStatement[],
  gap?: { followUpQuestion: string } | null,
): ValidationResult {
  const supportedStatements: string[] = [];
  const removedStatements: string[] = [];

  for (const s of statements) {
    if (s.sourceIds.length > 0 && s.text.trim() !== "") {
      supportedStatements.push(s.text.trim());
    } else {
      removedStatements.push(s.text.trim());
    }
  }

  // A follow-up is offered when essential information can only come from the
  // client (an explicit gap). Otherwise none.
  const followUpQuestion = gap?.followUpQuestion?.trim() || null;

  return { supportedStatements, removedStatements, followUpQuestion };
}
