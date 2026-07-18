import { QuestionClassifier } from "@/features/identity-twin/question-classifier";
import type { TwinIntent } from "@/features/identity-twin/types";

export class IntentDetector {
  private readonly classifier = new QuestionClassifier();

  detect(question: string): TwinIntent {
    return this.classifier.classify(question);
  }
}
