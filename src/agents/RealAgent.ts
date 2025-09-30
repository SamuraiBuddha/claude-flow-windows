import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface RealAgentConfig {
  id?: string;
  name: string;
  type: 'coder' | 'researcher' | 'reviewer' | 'tester' | 'architect' | 'worker';
  apiKey?: string;
  model?: string;
  mcpServers?: string[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'task' | 'response' | 'query' | 'broadcast';
  content: any;
  timestamp: Date;
}

export class RealAgent extends EventEmitter {
  public readonly id: string;
  private config: RealAgentConfig;
  private process?: ChildProcess;
  private mcpClients: Map<string, Client> = new Map();
  private messageQueue: AgentMessage[] = [];
  private status: 'idle' | 'busy' | 'error' | 'terminated' = 'idle';
  
  constructor(config: RealAgentConfig) {
    super();
    this.id = config.id || uuidv4();
    this.config = config;
  }

  /**
   * Start the agent process and connect to MCP servers
   */
  async start(): Promise<void> {
    // Create agent worker script
    const workerScript = this.createWorkerScript();
    const workerPath = path.join(process.cwd(), `.agent-${this.id}.js`);
    
    fs.writeFileSync(workerPath, workerScript);
    
    // Spawn Node.js process for the agent
    this.process = spawn('node', [workerPath], {
      env: {
        ...process.env,
        AGENT_ID: this.id,
        AGENT_NAME: this.config.name,
        AGENT_TYPE: this.config.type,
        CLAUDE_API_KEY: this.config.apiKey || process.env.CLAUDE_API_KEY,
        MCP_SERVERS: JSON.stringify(this.config.mcpServers || [])
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    // Handle IPC messages from agent
    this.process.on('message', (msg: any) => {
      this.handleAgentMessage(msg);
    });

    this.process.stdout?.on('data', (data) => {
      console.log(`[${this.config.name}]: ${data.toString()}`);
    });

    this.process.stderr?.on('data', (data) => {
      console.error(`[${this.config.name}] Error: ${data.toString()}`);
    });

    this.process.on('exit', (code) => {
      console.log(`Agent ${this.config.name} exited with code ${code}`);
      this.status = 'terminated';
      this.cleanup();
    });

    // Connect to MCP servers if specified
    if (this.config.mcpServers) {
      await this.connectToMCPServers();
    }

    this.status = 'idle';
    this.emit('ready', this.id);
  }

  /**
   * Connect to specified MCP servers
   */
  private async connectToMCPServers(): Promise<void> {
    for (const serverName of this.config.mcpServers || []) {
      try {
        const transport = new StdioClientTransport({
          command: 'npx',
          args: [serverName, 'serve']
        });
        
        const client = new Client({
          name: `${this.config.name}-client`,
          version: '1.0.0'
        }, {
          capabilities: {}
        });

        await client.connect(transport);
        this.mcpClients.set(serverName, client);
        
        console.log(`Agent ${this.config.name} connected to MCP server: ${serverName}`);
      } catch (error) {
        console.error(`Failed to connect to MCP server ${serverName}:`, error);
      }
    }
  }

  /**
   * Create the worker script that runs in the agent process
   */
  private createWorkerScript(): string {
    return `
const { parentPort } = require('worker_threads');
const Anthropic = require('@anthropic-ai/sdk');

// Agent configuration
const agentId = process.env.AGENT_ID;
const agentName = process.env.AGENT_NAME;
const agentType = process.env.AGENT_TYPE;
const apiKey = process.env.CLAUDE_API_KEY;
const mcpServers = JSON.parse(process.env.MCP_SERVERS || '[]');

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: apiKey
});

// System prompts for different agent types
const systemPrompts = {
  coder: 'You are a coding agent focused on implementation and development.',
  researcher: 'You are a research agent focused on finding information and solutions.',
  reviewer: 'You are a code review agent focused on quality and best practices.',
  tester: 'You are a testing agent focused on finding bugs and edge cases.',
  architect: 'You are an architecture agent focused on design and structure.'
};

// Message handling
process.on('message', async (msg) => {
  console.log(\`[\${agentName}] Received message:\`, msg.type);
  
  try {
    if (msg.type === 'task') {
      // Process task with Claude
      const response = await processTask(msg.content);
      
      // Send response back
      process.send({
        type: 'response',
        from: agentId,
        to: msg.from,
        content: response,
        timestamp: new Date()
      });
    } else if (msg.type === 'query') {
      // Handle query from another agent
      const response = await handleQuery(msg.content);
      
      process.send({
        type: 'response',
        from: agentId,
        to: msg.from,
        content: response,
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error(\`[\${agentName}] Error processing message:\`, error);
    process.send({
      type: 'error',
      from: agentId,
      error: error.message,
      timestamp: new Date()
    });
  }
});

async function processTask(task) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: systemPrompts[agentType],
      messages: [{
        role: 'user',
        content: task
      }]
    });
    
    return message.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    return 'Error processing task: ' + error.message;
  }
}

async function handleQuery(query) {
  // Handle queries from other agents
  return processTask(query);
}

// Keep process alive
setInterval(() => {
  process.send({
    type: 'heartbeat',
    from: agentId,
    timestamp: new Date()
  });
}, 30000);

console.log(\`[\${agentName}] Agent worker started\`);
`;
  }

  /**
   * Send a task to the agent
   */
  async sendTask(task: string, from?: string): Promise<void> {
    if (!this.process) {
      throw new Error('Agent process not started');
    }

    this.status = 'busy';
    
    const message: AgentMessage = {
      from: from || 'orchestrator',
      to: this.id,
      type: 'task',
      content: task,
      timestamp: new Date()
    };

    this.process.send(message);
    this.messageQueue.push(message);
  }

  /**
   * Send a message to another agent
   */
  async sendToAgent(targetAgentId: string, content: any): Promise<void> {
    this.emit('agent-message', {
      from: this.id,
      to: targetAgentId,
      type: 'query',
      content,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast a message to all agents in the swarm
   */
  async broadcast(content: any): Promise<void> {
    this.emit('broadcast', {
      from: this.id,
      type: 'broadcast',
      content,
      timestamp: new Date()
    });
  }

  /**
   * Handle messages from the agent process
   */
  private handleAgentMessage(msg: any): void {
    if (msg.type === 'response') {
      this.status = 'idle';
      this.emit('task-complete', msg);
    } else if (msg.type === 'error') {
      this.status = 'error';
      this.emit('error', msg);
    } else if (msg.type === 'heartbeat') {
      // Keep-alive signal
    }
    
    // Store in message history
    this.messageQueue.push(msg);
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  /**
   * Execute an MCP tool
   */
  async executeMCPTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = this.mcpClients.get(serverName);
    if (!client) {
      throw new Error(`MCP server ${serverName} not connected`);
    }

    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args
      });
      return result;
    } catch (error) {
      console.error(`Error executing MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Get agent status
   */
  getStatus(): string {
    return this.status;
  }

  /**
   * Get message history
   */
  getMessageHistory(): AgentMessage[] {
    return this.messageQueue;
  }

  /**
   * Terminate the agent
   */
  async terminate(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
    
    // Disconnect from MCP servers
    for (const [name, client] of this.mcpClients) {
      await client.close();
    }
    this.mcpClients.clear();
    
    this.status = 'terminated';
    this.cleanup();
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Remove worker script
    const workerPath = path.join(process.cwd(), `.agent-${this.id}.js`);
    if (fs.existsSync(workerPath)) {
      fs.unlinkSync(workerPath);
    }
  }
}