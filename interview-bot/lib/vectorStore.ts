import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

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

  return await MemoryVectorStore.fromDocuments(
    [...resumeChunks, ...jdChunks],
    embeddings
  );
}

export async function retrieveContext(
  vectorStore: MemoryVectorStore,
  query: string,
  k = 4
): Promise<string> {
  const results = await vectorStore.similaritySearch(query, k);
  return results.map((doc) => doc.pageContent).join("\n\n");
}