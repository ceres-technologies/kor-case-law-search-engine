export const config = {
  editor: {
    maxCompletionTokens: 50,
    retrieveRelevantChunkThreshold: 0,
    focusingChunkPromptLength: 1024,
    focusingChunkEmbeddingLength: 256,
    directRelevantChunksOffsetMargin: 128,
    directRelevantChunksEmbeddingLength: 128,
    directRelevantChunksOverlapLength: 64,
    directRelevantChunksTopk: 6,
    indirectRelevantChunksOffsetMargin: 128,
    indirectRelevantChunksEmbeddingLength: 128,
    indirectRelevantChunksOverlapLength: 64,
    indirectRelevantChunksTopk: 6,
  },
};
