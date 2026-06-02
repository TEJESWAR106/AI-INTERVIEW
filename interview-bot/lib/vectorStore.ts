import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

interface VectorEntry {
  text: string;
  vector: number[];
}

export type SimpleVectorStore = VectorEntry[];

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function createVectorStore(
  resumeText: string,
  jdText: string
): Promise<SimpleVectorStore> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const resumeChunks = await splitter.splitText(resumeText);
  const jdChunks = await splitter.splitText(jdText);
  const allChunks = [...resumeChunks, ...jdChunks];

  const vectors = await embeddings.embedDocuments(allChunks);

  return allChunks.map((text, i) => ({ text, vector: vectors[i] }));
}

export async function retrieveContext(
  store: SimpleVectorStore,
  query: string,
  k: number = 4
): Promise<string> {
  const queryVector = await embeddings.embedQuery(query);

  const scored = store.map((entry) => ({
    text: entry.text,
    score: cosineSimilarity(queryVector, entry.vector),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, k)
    .map((e) => e.text)
    .join("\n\n");
}