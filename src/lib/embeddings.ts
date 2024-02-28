import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

function chunkText(text: string, maxChunkSize: number): string[]{
  const chunks = [];
  let currentIndex = 0;
  while (currentIndex < text.length) {
    const chunkLimit = Math.min(text.length, currentIndex + maxChunkSize);
    let endIndex = chunkLimit;
    if (endIndex < text.length) {
      const lastSpaceIndex = text.lastIndexOf(' ', endIndex);
      endIndex = lastSpaceIndex > currentIndex ? lastSpaceIndex : chunkLimit;
    }
    chunks.push(text.substring(currentIndex, endIndex));
    currentIndex = endIndex;
  }
  return chunks;
}

export async function getEmbeddings(text: string) {
  const MAX_CHUNK_SIZE = 5000; // Adjust based on API limits and testing
  const chunks = chunkText(text.replace(/\n/g, " "), MAX_CHUNK_SIZE);
  const embeddings = [];

  for (const chunk of chunks) {
    try {
      const response = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: chunk,
      });
      const result = await response.json();
      embeddings.push(...result.data[0].embedding);
    } catch (error) {
      console.log("error calling openai embeddings api", error);
      throw error;
    }
  }}