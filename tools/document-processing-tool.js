/**
 * MCP Document Processing Tool
 * 
 * This tool provides functionality for loading, processing, and chunking documents
 * in the Metis application.
 */

const { McpServer } = require('@modelcontextprotocol/server');
const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { DocxLoader } = require('langchain/document_loaders/fs/docx');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

// Initialize the MCP server
const server = new McpServer({
  name: 'document-processing-tool',
  description: 'Tool for loading, processing, and chunking documents in the Metis application',
});

// Tool to load a document
server.addTool({
  name: 'load_document',
  description: 'Load a document from a file path',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'Path to the document file' },
    },
    required: ['filePath'],
  },
  handler: async (params) => {
    try {
      const filePath = params.filePath;
      const fileExtension = path.extname(filePath).toLowerCase();
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, error: `File not found: ${filePath}` };
      }
      
      let loader;
      let docs = [];
      
      // Select the appropriate loader based on file extension
      switch (fileExtension) {
        case '.pdf':
          loader = new PDFLoader(filePath);
          docs = await loader.load();
          break;
        case '.docx':
          loader = new DocxLoader(filePath);
          docs = await loader.load();
          break;
        case '.txt':
        case '.md':
          loader = new TextLoader(filePath);
          docs = await loader.load();
          break;
        default:
          return { success: false, error: `Unsupported file type: ${fileExtension}` };
      }
      
      return { 
        success: true, 
        document: {
          pageContent: docs.map(doc => doc.pageContent).join('\n\n'),
          metadata: docs.length > 0 ? docs[0].metadata : {},
          fileName: path.basename(filePath),
          fileType: fileExtension.substring(1),
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to chunk a document
server.addTool({
  name: 'chunk_document',
  description: 'Split a document into chunks',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Document text to chunk' },
      chunkSize: { type: 'number', description: 'Size of each chunk', default: 1000 },
      chunkOverlap: { type: 'number', description: 'Overlap between chunks', default: 200 },
      metadata: { 
        type: 'object', 
        description: 'Metadata to attach to each chunk',
        additionalProperties: true
      },
    },
    required: ['text'],
  },
  handler: async (params) => {
    try {
      const text = params.text;
      const chunkSize = params.chunkSize || 1000;
      const chunkOverlap = params.chunkOverlap || 200;
      const metadata = params.metadata || {};
      
      // Create a text splitter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
      });
      
      // Split the text into chunks
      const chunks = await splitter.createDocuments(
        [text],
        [metadata]
      );
      
      return { 
        success: true, 
        chunks: chunks.map(chunk => ({
          text: chunk.pageContent,
          metadata: chunk.metadata,
        })),
        count: chunks.length,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to extract code from a document
server.addTool({
  name: 'extract_code',
  description: 'Extract code blocks from a document',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Document text to extract code from' },
      language: { type: 'string', description: 'Programming language to extract (optional)' },
    },
    required: ['text'],
  },
  handler: async (params) => {
    try {
      const text = params.text;
      const language = params.language ? params.language.toLowerCase() : null;
      
      // Regular expression to match code blocks
      // This matches both markdown-style code blocks and indented code blocks
      const codeBlockRegex = /```(?:([a-zA-Z0-9]+)\n)?([\s\S]*?)```|(?:^[ \t]*\n)?(?:(?:[ \t]+[^\n]*\n)+)/gm;
      
      const codeBlocks = [];
      let match;
      
      while ((match = codeBlockRegex.exec(text)) !== null) {
        const blockLanguage = match[1] ? match[1].toLowerCase() : 'unknown';
        const code = match[2] ? match[2].trim() : match[0].trim();
        
        // If a specific language is requested, filter for it
        if (!language || blockLanguage === language) {
          codeBlocks.push({
            language: blockLanguage,
            code: code,
          });
        }
      }
      
      return { 
        success: true, 
        codeBlocks: codeBlocks,
        count: codeBlocks.length,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to analyze document structure
server.addTool({
  name: 'analyze_document_structure',
  description: 'Analyze the structure of a document',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Document text to analyze' },
    },
    required: ['text'],
  },
  handler: async (params) => {
    try {
      const text = params.text;
      
      // Extract headings
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      const headings = [];
      let headingMatch;
      
      while ((headingMatch = headingRegex.exec(text)) !== null) {
        headings.push({
          level: headingMatch[1].length,
          text: headingMatch[2].trim(),
          position: headingMatch.index,
        });
      }
      
      // Count paragraphs (text blocks separated by blank lines)
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      // Detect lists
      const bulletListRegex = /^\s*[-*+]\s+.+/gm;
      const bulletListItems = text.match(bulletListRegex) || [];
      
      const numberedListRegex = /^\s*\d+\.\s+.+/gm;
      const numberedListItems = text.match(numberedListRegex) || [];
      
      // Detect tables (markdown tables)
      const tableRegex = /^\|(.+)\|\s*$/gm;
      const tableRows = text.match(tableRegex) || [];
      
      return { 
        success: true, 
        structure: {
          headings: headings,
          paragraphCount: paragraphs.length,
          bulletListItemCount: bulletListItems.length,
          numberedListItemCount: numberedListItems.length,
          tableRowCount: tableRows.length,
          totalLength: text.length,
          wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Start the server
server.start();

console.log('Document Processing MCP server started');
