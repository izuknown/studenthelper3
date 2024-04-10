import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmeddings(embeddings: number[], fileKey: string) {
    const pineconeClient = new Pinecone({apiKey: process.env.PINECONE_API_KEY!})
    
    const index = await pineconeClient.index('studenthelper3')

    try {
        const namespace = convertToAscii(fileKey)
        const queryResult = await index.query ({
            queryRequest: {
                topK: 5,
                vector: embeddings,
                includeMetadata: true,
                namespace
            }
        })
        return queryResult.matches || []
    } catch (error) {
        console.log("Error querying embeddings from Pinecone. See src/lib/context.ts line 11", error)  
        throw error      
    }


} 

export async function getContext( query: string, fileKey: string) {
    const queryEmeddings = await getEmbeddings(query)
    const matches = await getMatchesFromEmeddings(queryEmeddings, fileKey);

    const qualifyingdocs = matches.filter(match => match.score && match.score >0.7);

    type Metadata = { text:string, pageNumber: number}

    let docs = qualifyingdocs.map(match => (match.metadata as Metadata).text)
    return docs.join ("\n").substring(0, 3000)
}