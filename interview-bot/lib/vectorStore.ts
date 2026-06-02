import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

interface DocChunk {
  pageContent: string;
  metadata: Record<string, string>;
  embedding: number[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export class SimpleVectorStore {
  private chunks: DocChunk[] = [];
  private embeddings: OpenAIEmbeddings;

  constructor(embeddings: OpenAIEmbeddings) {
    this.embeddings = embeddings;
  }

  async addDocuments(docs: { pageContent: string; metadata: Record<string, string> }[]) {
    const texts = docs.map((d) => d.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    for (let i = 0; i < docs.length; i++) {
      this.chunks.push({ ...docs[i], embedding: vectors[i] });
    }
  }

  async similaritySearch(query: string, k = 4) {
    const queryVec = await this.embeddings.embedQuery(query);
    return this.chunks
      .map((chunk) => ({ chunk, score: cosineSimilarity(queryVec, chunk.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((r) => r.chunk);
  }
}

export async function createVectorStore(resumeText: string, jdText: string) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const resumeChunks = await splitter.createDocuments(
    [resumeText], [{ source: "resume" }]
  );
  const jdChunks = await splitter.createDocuments(
    [jdText], [{ source: "job_description" }]
  );

  const store = new SimpleVectorStore(embeddings);
  await store.addDocuments([...resumeChunks, ...jdChunks]);
  return store;
}

export async function retrieveContext(
  vectorStore: SimpleVectorStore,
  query: string,
  k = 4
): Promise<string> {
  const results = await vectorStore.similaritySearch(query, k);
  return results.map((doc) => doc.pageContent).join("\n\n");
}