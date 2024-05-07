import { Pinecone, QueryOptions } from "@pinecone-database/pinecone"; // Import Pinecone library for interacting with Pinecone database
import { convertToAscii } from "./utils"; // Import utility function for converting string to ASCII
import { getEmbeddings } from "./embeddings"; // Import function to get embeddings for a given text



// Function to retrieve matches from embeddings
export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
    // Initialize Pinecone client with API key
    const pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

    // Get or create an index in the Pinecone database
    const index = await pineconeClient.index('studenthelper3');
    
    try {

        // Create or access a namespace within the index based on the ASCII representation of the fileKey
        console.log('access a namespace within the index base on the ASCII representation fo the fileKey context.ts')
        const namespace = index.namespace(convertToAscii(fileKey));
        
        // Query the index for matches based on the provided embeddings
        console.log('Querying the index for matches based on provided embeddings, context.ts')
        const queryResult = await namespace.query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true, // Assign the namespace to the namespace property
        });     

        console.log('returning matches found the query');
        return queryResult.matches || []; // Return the matches found in the query result

    } catch (error) {
        // Handle errors that occur during the query process
        console.log("Error querying embeddings from Pinecone. See src/lib/context.ts line 11", error);
        throw error; // Throw the error to be caught and handled by the caller
    }
}

// Function to get context based on a query string and fileKey
export async function getContext(query: string, fileKey: string) {
    
    // Get embeddings for the query text
    console.log('Get embeddings for the query text context.ts')
    const queryEmbeddings = await getEmbeddings(query);
    
    // Retrieve matches from embeddings for the provided query and fileKey
    console.log('Retrieving matches from embeddings for the provided query and file key context.ts')
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

    // Filter matches based on a score threshold
    console.log('Filtering matches based on threshold context.ts')
    const qualifyingDocs = matches.filter((match) => match.score && match.score > 0.7);

    // Define the type of metadata associated with the matches
    type Metadata = {
        text: string;
        pageNumber: number;
    };

    // Extract the text from the qualifying matches and concatenate them
    console.log('Extracting text from qualify matches and concatenating them context.ts')
    let docs = qualifyingDocs.map(match => (match.metadata as Metadata)?.text);
    console.log('Returning concatenated text context.ts')
    return docs.join("\n").substring(0, 3000); // Return the concatenated text with a maximum length of 3000 characters
}
