from app.artifact.contracts import ArtifactProcessor
from app.artifact.models import Artifact


class ArtifactPipeline:
    def __init__(self, processors: list[ArtifactProcessor]) -> None:
        self._processors = processors

    async def run(self, artifact: Artifact) -> Artifact:
        current = artifact
        for processor in self._processors:
            current = await processor.process(current)
        return current
