/**
 * MCP LLM Interaction Tool
 * 
 * This tool provides functionality for interacting with language models
 * in the Metis application.
 */

const { McpServer } = require('@modelcontextprotocol/server');
const { OpenAI } = require('langchain/llms/openai');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { Anthropic } = require('langchain/llms/anthropic');
const { ChatAnthropic } = require('langchain/chat_models/anthropic');
const { PromptTemplate } = require('langchain/prompts');
const { StringOutputParser } = require('langchain/schema/output_parser');
const { RunnableSequence } = require('langchain/schema/runnable');

// LLM models
const models = {};

// Initialize the MCP server
const server = new McpServer({
  name: 'llm-interaction-tool',
  description: 'Tool for interacting with language models in the Metis application',
});

// Tool to initialize an LLM model
server.addTool({
  name: 'init_llm_model',
  description: 'Initialize an LLM model',
  inputSchema: {
    type: 'object',
    properties: {
      modelId: { type: 'string', description: 'Unique identifier for the model' },
      provider: { 
        type: 'string', 
        description: 'LLM provider (openai, anthropic)',
        enum: ['openai', 'anthropic']
      },
      modelName: { type: 'string', description: 'Name of the model to use' },
      apiKey: { type: 'string', description: 'API key for the provider' },
      temperature: { type: 'number', description: 'Temperature for generation', default: 0.7 },
      maxTokens: { type: 'number', description: 'Maximum tokens to generate', default: 1000 },
      isChatModel: { type: 'boolean', description: 'Whether this is a chat model', default: true },
    },
    required: ['modelId', 'provider', 'modelName', 'apiKey'],
  },
  handler: async (params) => {
    try {
      const { modelId, provider, modelName, apiKey, temperature, maxTokens, isChatModel } = params;
      
      // Create the model based on provider and type
      let model;
      
      if (provider === 'openai') {
        if (isChatModel) {
          model = new ChatOpenAI({
            modelName: modelName,
            openAIApiKey: apiKey,
            temperature: temperature || 0.7,
            maxTokens: maxTokens || 1000,
          });
        } else {
          model = new OpenAI({
            modelName: modelName,
            openAIApiKey: apiKey,
            temperature: temperature || 0.7,
            maxTokens: maxTokens || 1000,
          });
        }
      } else if (provider === 'anthropic') {
        if (isChatModel) {
          model = new ChatAnthropic({
            modelName: modelName,
            anthropicApiKey: apiKey,
            temperature: temperature || 0.7,
            maxTokens: maxTokens || 1000,
          });
        } else {
          model = new Anthropic({
            modelName: modelName,
            anthropicApiKey: apiKey,
            temperature: temperature || 0.7,
            maxTokens: maxTokens || 1000,
          });
        }
      } else {
        return { success: false, error: `Unsupported provider: ${provider}` };
      }
      
      // Store the model
      models[modelId] = {
        model,
        provider,
        modelName,
        isChatModel,
      };
      
      return { 
        success: true, 
        message: `Model '${modelId}' initialized successfully`,
        modelId,
        provider,
        modelName,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to generate text with an LLM
server.addTool({
  name: 'generate_text',
  description: 'Generate text with an LLM model',
  inputSchema: {
    type: 'object',
    properties: {
      modelId: { type: 'string', description: 'ID of the model to use' },
      prompt: { type: 'string', description: 'Prompt for text generation' },
      temperature: { type: 'number', description: 'Override temperature for this generation' },
      maxTokens: { type: 'number', description: 'Override maximum tokens for this generation' },
    },
    required: ['modelId', 'prompt'],
  },
  handler: async (params) => {
    try {
      const { modelId, prompt, temperature, maxTokens } = params;
      
      // Check if model exists
      if (!models[modelId]) {
        return { success: false, error: `Model '${modelId}' not found` };
      }
      
      const modelInfo = models[modelId];
      let result;
      
      // Generate text based on model type
      if (modelInfo.isChatModel) {
        // For chat models, we need to format the prompt as a message
        result = await modelInfo.model.invoke([
          { role: 'user', content: prompt }
        ]);
        result = result.content;
      } else {
        // For completion models, we can use the prompt directly
        result = await modelInfo.model.invoke(prompt);
      }
      
      return { 
        success: true, 
        text: result,
        modelId,
        provider: modelInfo.provider,
        modelName: modelInfo.modelName,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to use a prompt template
server.addTool({
  name: 'use_prompt_template',
  description: 'Use a prompt template with an LLM model',
  inputSchema: {
    type: 'object',
    properties: {
      modelId: { type: 'string', description: 'ID of the model to use' },
      template: { type: 'string', description: 'Prompt template with variables in {variable} format' },
      variables: { 
        type: 'object', 
        description: 'Variables to fill in the template',
        additionalProperties: true
      },
      temperature: { type: 'number', description: 'Override temperature for this generation' },
      maxTokens: { type: 'number', description: 'Override maximum tokens for this generation' },
    },
    required: ['modelId', 'template', 'variables'],
  },
  handler: async (params) => {
    try {
      const { modelId, template, variables, temperature, maxTokens } = params;
      
      // Check if model exists
      if (!models[modelId]) {
        return { success: false, error: `Model '${modelId}' not found` };
      }
      
      const modelInfo = models[modelId];
      
      // Create a prompt template
      const promptTemplate = PromptTemplate.fromTemplate(template);
      
      // Create a runnable sequence
      const chain = RunnableSequence.from([
        promptTemplate,
        modelInfo.model,
        new StringOutputParser(),
      ]);
      
      // Run the chain
      const result = await chain.invoke(variables);
      
      return { 
        success: true, 
        text: result,
        modelId,
        provider: modelInfo.provider,
        modelName: modelInfo.modelName,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to generate embeddings
server.addTool({
  name: 'generate_embeddings',
  description: 'Generate embeddings for text',
  inputSchema: {
    type: 'object',
    properties: {
      provider: { 
        type: 'string', 
        description: 'Embedding provider (openai, cohere)',
        enum: ['openai', 'cohere']
      },
      modelName: { type: 'string', description: 'Name of the embedding model to use' },
      apiKey: { type: 'string', description: 'API key for the provider' },
      texts: { 
        type: 'array', 
        description: 'Array of texts to embed', 
        items: { type: 'string' } 
      },
    },
    required: ['provider', 'modelName', 'apiKey', 'texts'],
  },
  handler: async (params) => {
    try {
      const { provider, modelName, apiKey, texts } = params;
      
      let embeddings;
      
      // Create the embeddings model based on provider
      if (provider === 'openai') {
        const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
        embeddings = new OpenAIEmbeddings({
          modelName: modelName,
          openAIApiKey: apiKey,
        });
      } else if (provider === 'cohere') {
        const { CohereEmbeddings } = require('langchain/embeddings/cohere');
        embeddings = new CohereEmbeddings({
          modelName: modelName,
          cohereApiKey: apiKey,
        });
      } else {
        return { success: false, error: `Unsupported provider: ${provider}` };
      }
      
      // Generate embeddings
      const embeddingVectors = await embeddings.embedDocuments(texts);
      
      return { 
        success: true, 
        embeddings: embeddingVectors,
        count: embeddingVectors.length,
        dimensions: embeddingVectors[0].length,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Start the server
server.start();

console.log('LLM Interaction MCP server started');
