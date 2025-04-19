# Metis MCP Tools

This repository contains a collection of Model Context Protocol (MCP) tools designed to enhance the Metis RAG application. These tools provide functionality for database management, vector store operations, document processing, and LLM interactions.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for language models to interact with external tools and resources. It allows models to access data, perform actions, and utilize specialized capabilities beyond their training data.

## Tools Overview

This repository includes the following MCP tools:

### 1. Database Management Tool

The Database Management Tool provides functionality for interacting with PostgreSQL databases in the Metis application.

**Features:**
- Initialize database connections
- Execute SQL queries
- Get table schemas
- List database tables

**Usage Example:**
```javascript
// Initialize a database connection
const dbResult = await useMcpTool({
  serverName: 'database-tool',
  toolName: 'init_database_connection',
  arguments: {
    host: 'localhost',
    port: 5432,
    database: 'metis_db',
    user: 'metis_user',
    password: 'password123'
  }
});

// Execute a query
const queryResult = await useMcpTool({
  serverName: 'database-tool',
  toolName: 'execute_query',
  arguments: {
    query: 'SELECT * FROM documents LIMIT 10'
  }
});
```

### 2. Vector Store Tool

The Vector Store Tool provides functionality for interacting with vector databases like Chroma in the Metis application.

**Features:**
- Initialize vector store connections
- Create and manage collections
- Add documents to collections
- Query collections for similar documents
- Delete documents from collections

**Usage Example:**
```javascript
// Initialize a vector store connection
const vsResult = await useMcpTool({
  serverName: 'vector-store-tool',
  toolName: 'init_vector_store',
  arguments: {
    host: 'localhost',
    port: 8000
  }
});

// Create a collection
const collectionResult = await useMcpTool({
  serverName: 'vector-store-tool',
  toolName: 'get_or_create_collection',
  arguments: {
    name: 'metis_documents'
  }
});

// Query the collection
const queryResult = await useMcpTool({
  serverName: 'vector-store-tool',
  toolName: 'query_collection',
  arguments: {
    queryTexts: ['How does quantum computing work?'],
    nResults: 5
  }
});
```

### 3. Document Processing Tool

The Document Processing Tool provides functionality for loading, processing, and chunking documents in the Metis application.

**Features:**
- Load documents from various file formats (PDF, DOCX, TXT, MD)
- Split documents into chunks for processing
- Extract code blocks from documents
- Analyze document structure

**Usage Example:**
```javascript
// Load a document
const docResult = await useMcpTool({
  serverName: 'document-processing-tool',
  toolName: 'load_document',
  arguments: {
    filePath: '/path/to/document.pdf'
  }
});

// Chunk the document
const chunkResult = await useMcpTool({
  serverName: 'document-processing-tool',
  toolName: 'chunk_document',
  arguments: {
    text: docResult.document.pageContent,
    chunkSize: 1000,
    chunkOverlap: 200,
    metadata: docResult.document.metadata
  }
});
```

### 4. LLM Interaction Tool

The LLM Interaction Tool provides functionality for interacting with language models in the Metis application.

**Features:**
- Initialize LLM models from various providers (OpenAI, Anthropic)
- Generate text with LLMs
- Use prompt templates for structured generation
- Generate embeddings for text

**Usage Example:**
```javascript
// Initialize an LLM model
const llmResult = await useMcpTool({
  serverName: 'llm-interaction-tool',
  toolName: 'init_llm_model',
  arguments: {
    modelId: 'gpt4',
    provider: 'openai',
    modelName: 'gpt-4',
    apiKey: 'your-api-key',
    temperature: 0.7
  }
});

// Generate text with a prompt template
const genResult = await useMcpTool({
  serverName: 'llm-interaction-tool',
  toolName: 'use_prompt_template',
  arguments: {
    modelId: 'gpt4',
    template: 'Summarize the following text: {text}',
    variables: {
      text: 'Long document content here...'
    }
  }
});
```

## Installation and Setup

To use these MCP tools in your Metis application:

1. Clone this repository:
   ```
   git clone https://github.com/dagron78/metis-mcp-demo.git
   ```

2. Install dependencies:
   ```
   cd metis-mcp-demo
   npm install
   ```

3. Start the desired MCP server:
   ```
   node tools/database-tool.js
   node tools/vector-store-tool.js
   node tools/document-processing-tool.js
   node tools/llm-interaction-tool.js
   ```

4. Connect to the MCP server from your application using an MCP client.

## Contributing

Contributions are welcome! Feel free to submit pull requests or open issues to improve these tools or add new ones.

## License

MIT
