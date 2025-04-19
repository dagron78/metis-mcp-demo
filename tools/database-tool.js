/**
 * MCP Database Management Tool
 * 
 * This tool provides functionality for managing and accessing databases
 * in the Metis application.
 */

const { McpServer } = require('@modelcontextprotocol/server');
const { Pool } = require('pg'); // PostgreSQL client

// Database connection configuration
let pool;

// Initialize the MCP server
const server = new McpServer({
  name: 'database-tool',
  description: 'Tool for managing and accessing databases in the Metis application',
});

// Tool to initialize database connection
server.addTool({
  name: 'init_database_connection',
  description: 'Initialize the database connection with the provided configuration',
  inputSchema: {
    type: 'object',
    properties: {
      host: { type: 'string', description: 'Database host' },
      port: { type: 'number', description: 'Database port' },
      database: { type: 'string', description: 'Database name' },
      user: { type: 'string', description: 'Database user' },
      password: { type: 'string', description: 'Database password' },
    },
    required: ['host', 'database', 'user', 'password'],
  },
  handler: async (params) => {
    try {
      // Create a new pool with the provided configuration
      pool = new Pool({
        host: params.host,
        port: params.port || 5432,
        database: params.database,
        user: params.user,
        password: params.password,
      });
      
      // Test the connection
      const client = await pool.connect();
      client.release();
      
      return { success: true, message: 'Database connection initialized successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to execute a query
server.addTool({
  name: 'execute_query',
  description: 'Execute a SQL query on the database',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'SQL query to execute' },
      params: { 
        type: 'array', 
        description: 'Query parameters', 
        items: { type: 'string' } 
      },
    },
    required: ['query'],
  },
  handler: async (params) => {
    try {
      if (!pool) {
        return { success: false, error: 'Database connection not initialized' };
      }
      
      const result = await pool.query(params.query, params.params || []);
      return { success: true, data: result.rows, rowCount: result.rowCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to get table schema
server.addTool({
  name: 'get_table_schema',
  description: 'Get the schema of a database table',
  inputSchema: {
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name' },
      schema: { type: 'string', description: 'Schema name (default: public)' },
    },
    required: ['table'],
  },
  handler: async (params) => {
    try {
      if (!pool) {
        return { success: false, error: 'Database connection not initialized' };
      }
      
      const schema = params.schema || 'public';
      const query = `
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_schema = $1 AND table_name = $2
        ORDER BY 
          ordinal_position;
      `;
      
      const result = await pool.query(query, [schema, params.table]);
      return { success: true, schema: result.rows };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Tool to list tables
server.addTool({
  name: 'list_tables',
  description: 'List all tables in the database',
  inputSchema: {
    type: 'object',
    properties: {
      schema: { type: 'string', description: 'Schema name (default: public)' },
    },
  },
  handler: async (params) => {
    try {
      if (!pool) {
        return { success: false, error: 'Database connection not initialized' };
      }
      
      const schema = params.schema || 'public';
      const query = `
        SELECT 
          table_name
        FROM 
          information_schema.tables
        WHERE 
          table_schema = $1
        ORDER BY 
          table_name;
      `;
      
      const result = await pool.query(query, [schema]);
      return { success: true, tables: result.rows.map(row => row.table_name) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Start the server
server.start();

console.log('Database MCP server started');
