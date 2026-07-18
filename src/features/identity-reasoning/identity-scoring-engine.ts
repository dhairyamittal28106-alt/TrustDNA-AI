/** Scores only the quality and repetition of supplied evidence; it never scores a person. */
export class IdentityScoringEngine {
  score(confidences: number[]): number {
    if (!confidences.length) return 0;
    const average = confidences.reduce((total, value) => total + value, 0) / confidences.length;
    const repetitionBonus = Math.min(confidences.length - 1, 3) * .01;
    return Math.min(.99, Number((average + repetitionBonus).toFixed(3)));
  }
}
