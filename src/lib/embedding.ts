import { google } from "@ai-sdk/google";
import { embedMany } from "ai";
const embeddingModel = google.textEmbeddingModel("text-embedding-004");

const generateChunks = async (text: string) => {
  return text
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean);
};

export async function generateEmbeddings(
  value: string
): Promise<Array<{ content: string; embedding: number[] }>> {
  const chunks = await generateChunks(value);

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  return embeddings.map((embedding, index) => ({
    content: chunks[index],
    embedding,
  }));
}
