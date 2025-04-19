/**
 * MCP Vector Store Tool
 * 
 * This tool provides functionality for interacting with vector databases
 * like Chroma in the Metis application.
 */

const { McpServer } = require('@modelcontextprotocol/server');
const { ChromaClient } = require('chromadb');

// Vector store client
let client;
let collection;

// Initialize the MCP server
const server = new McpServer({
  name: 'vector-store-tool',
  description: 'Tool for interacting with vector databases in the Metis application',
});

// Tool to initialize vector store connection
server.addTool({
  name: 'init_vector_store',
  description: 'Initialize the vector store connection',
  inputSchema: {
    type: 'object',
    properties: {
      host: { type: 'string', description: 'Vector store host' },
      port: { type: 'number', description: 'Vector store port' },
    },
    required: ['host'],
  },
  handler: async (params) => {
    try {
      // Create a new client with the provided configuration
      client = new ChromaClient({
        path: `http://${params.host}:${params.port || 8000}`,
      });
      
      // Test the connection
      await client.heartbeat();
      
      return { success: true, message: 'Vector store connection initialized successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to get or create a collection
server.addTool({
  name: 'get_or_create_collection',
  description: 'Get or create a collection in the vector store',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Collection name' },
      metadata: { 
        type: 'object', 
        description: 'Collection metadata',
        additionalProperties: true
      },
      embeddingFunction: { 
        type: 'object', 
        description: 'Embedding function configuration',
        properties: {
          type: { type: 'string', description: 'Type of embedding function' },
          apiKey: { type: 'string', description: 'API key for the embedding function' },
          modelName: { type: 'string', description: 'Model name for the embedding function' },
        },
        required: ['type'],
      },
    },
    required: ['name'],
  },
  handler: async (params) => {
    try {
      if (!client) {
        return { success: false, error: 'Vector store connection not initialized' };
      }
      
      // Get or create the collection
      collection = await client.getOrCreateCollection({
        name: params.name,
        metadata: params.metadata || {},
        // In a real implementation, you would create an embedding function based on the params
      });
      
      return { 
        success: true, 
        message: `Collection '${params.name}' retrieved or created successfully`,
        collectionName: params.name
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to add documents to the collection
server.addTool({
  name: 'add_documents',
  description: 'Add documents to the vector store collection',
  inputSchema: {
    type: 'object',
    properties: {
      documents: { 
        type: 'array', 
        description: 'Array of document texts', 
        items: { type: 'string' } 
      },
      metadatas: { 
        type: 'array', 
        description: 'Array of document metadata', 
        items: { 
          type: 'object',
          additionalProperties: true
        } 
      },
      ids: { 
        type: 'array', 
        description: 'Array of document IDs', 
        items: { type: 'string' } 
      },
    },
    required: ['documents', 'ids'],
  },
  handler: async (params) => {
    try {
      if (!collection) {
        return { success: false, error: 'Collection not initialized' };
      }
      
      // Add documents to the collection
      await collection.add({
        documents: params.documents,
        metadatas: params.metadatas || Array(params.documents.length).fill({}),
        ids: params.ids,
      });
      
      return { 
        success: true, 
        message: `${params.documents.length} documents added to the collection`,
        count: params.documents.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to query the collection
server.addTool({
  name: 'query_collection',
  description: 'Query the vector store collection',
  inputSchema: {
    type: 'object',
    properties: {
      queryTexts: { 
        type: 'array', 
        description: 'Array of query texts', 
        items: { type: 'string' } 
      },
      nResults: { 
        type: 'number', 
        description: 'Number of results to return per query',
        default: 10
      },
      filter: { 
        type: 'object', 
        description: 'Filter to apply to the query',
        additionalProperties: true
      },
    },
    required: ['queryTexts'],
  },
  handler: async (params) => {
    try {
      if (!collection) {
        return { success: false, error: 'Collection not initialized' };
      }
      
      // Query the collection
      const results = await collection.query({
        queryTexts: params.queryTexts,
        nResults: params.nResults || 10,
        filter: params.filter,
      });
      
      return { 
        success: true, 
        results: results
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to delete documents from the collection
server.addTool({
  name: 'delete_documents',
  description: 'Delete documents from the vector store collection',
  inputSchema: {
    type: 'object',
    properties: {
      ids: { 
        type: 'array', 
        description: 'Array of document IDs to delete', 
        items: { type: 'string' } 
      },
    },
    required: ['ids'],
  },
  handler: async (params) => {
    try {
      if (!collection) {
        return { success: false, error: 'Collection not initialized' };
      }
      
      // Delete documents from the collection
      await collection.delete({
        ids: params.ids,
      });
      
      return { 
        success: true, 
        message: `${params.ids.length} documents deleted from the collection`,
        count: params.ids.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Start the server
server.start();

console.log('Vector Store MCP server started');
