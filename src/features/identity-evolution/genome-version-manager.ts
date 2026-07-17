import type { GenomeSnapshot, IdentityGenomeVersionResponse, SourceRecord } from "@/features/identity-intelligence/types";

export class GenomeVersionManager {
  ordered(snapshot: GenomeSnapshot): IdentityGenomeVersionResponse[] {
    return [...snapshot.versions].sort((left, right) => this.versionNumber(right.version) - this.versionNumber(left.version));
  }

  previous(snapshot: GenomeSnapshot, version: IdentityGenomeVersionResponse): IdentityGenomeVersionResponse | undefined {
    const orderedAscending = [...snapshot.versions].sort((left, right) => this.versionNumber(left.version) - this.versionNumber(right.version));
    const index = orderedAscending.findIndex((entry) => entry.id === version.id);
    return index > 0 ? orderedAscending[index - 1] : undefined;
  }

  sourceForVersion(snapshot: GenomeSnapshot, version: IdentityGenomeVersionResponse): SourceRecord | undefined {
    return snapshot.sources.find((source) => source.genomeVersion === version.version);
  }

  sourceLabelForVersion(snapshot: GenomeSnapshot, version: IdentityGenomeVersionResponse): string {
    return this.sourceForVersion(snapshot, version)?.label ?? version.source_label;
  }

  private versionNumber(version: string): number {
    const parsed = Number.parseInt(version.replace(/^v/i, ""), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
