import { type Workflow, type WorkflowNode, type Connection, type Execution, type INodeData, type INodeParams } from "@shared/schema";
import { type IStorage } from "./storage";
import axios from "axios";

interface INode {
  execute(inputData: INodeData[], params: INodeParams): Promise<INodeData[]>;
}

class StartNode implements INode {
  async execute(inputData: INodeData[], params: INodeParams): Promise<INodeData[]> {
    return [{ startTime: new Date().toISOString(), ...params }];
  }
}

class FetchApiNode implements INode {
  async execute(inputData: INodeData[], params: INodeParams): Promise<INodeData[]> {
    const { method = "GET", url, headers = {}, body } = params;
    
    if (!url) {
      throw new Error("URL is required for HTTP request");
    }

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers,
        data: body,
        timeout: 30000
      });

      return [{
        statusCode: response.status,
        headers: response.headers,
        data: response.data,
        inputData: inputData[0] || {}
      }];
    } catch (error: any) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error("No response received from server");
      } else {
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }
}

class LogMessageNode implements INode {
  async execute(inputData: INodeData[], params: INodeParams): Promise<INodeData[]> {
    const { message = "Log output" } = params;
    const data = inputData[0] || {};
    
    return [{
      logMessage: message,
      loggedData: data,
      timestamp: new Date().toISOString()
    }];
  }
}

class IfNode implements INode {
  async execute(inputData: INodeData[], params: INodeParams): Promise<INodeData[]> {
    const { condition = "true" } = params;
    const data = inputData[0] || {};
    
    try {
      // Simple condition evaluation - replace {{variable}} patterns with actual values
      let evaluableCondition = condition.replace(/\{\{([^}]+)\}\}/g, (match: string, path: string) => {
        // Navigate nested object properties (e.g., "api_result.id")
        const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], data);
        return JSON.stringify(value);
      });

      // Evaluate the condition safely
      const result = eval(evaluableCondition);
      
      return [{
        conditionResult: Boolean(result),
        conditionExpression: condition,
        inputData: data,
        outputPath: result ? "true" : "false"
      }];
    } catch (error: any) {
      throw new Error(`Failed to evaluate condition "${condition}": ${error.message}`);
    }
  }
}

export class WorkflowEngine {
  private nodeRegistry: Map<string, () => INode> = new Map();
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.nodeRegistry.set("StartNode", () => new StartNode());
    this.nodeRegistry.set("FetchApiNode", () => new FetchApiNode());
    this.nodeRegistry.set("LogMessageNode", () => new LogMessageNode());
    this.nodeRegistry.set("IfNode", () => new IfNode());
  }

  /**
   * Get execution order using topological sort
   */
  private getExecutionOrder(nodes: WorkflowNode[], connections: Connection[]): string[] {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    // Initialize graph
    for (const node of nodes) {
      inDegree.set(node.id, 0);
      graph.set(node.id, []);
    }

    // Build graph and calculate in-degrees
    for (const conn of connections) {
      if (!graph.has(conn.from) || !graph.has(conn.to)) {
        throw new Error(`Invalid connection: ${conn.from} -> ${conn.to}`);
      }
      graph.get(conn.from)?.push(conn.to);
      inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
    }

    // Topological sort
    const queue: string[] = [];
    const executionOrder: string[] = [];

    // Find nodes with no incoming edges
    for (const [nodeId, degree] of Array.from(inDegree.entries())) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      executionOrder.push(nodeId);

      // Process neighbors
      for (const neighborId of graph.get(nodeId) || []) {
        inDegree.set(neighborId, inDegree.get(neighborId)! - 1);
        if (inDegree.get(neighborId) === 0) {
          queue.push(neighborId);
        }
      }
    }

    // Check for cycles
    if (executionOrder.length !== nodes.length) {
      throw new Error("Workflow contains a cycle and cannot be executed");
    }

    return executionOrder;
  }

  private async addLog(executionId: string, level: "info" | "error" | "warn", message: string, nodeId?: string) {
    const execution = await this.storage.getExecution(executionId);
    if (!execution) return;

    const newLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      nodeId
    };

    const updatedLogs = [...execution.logs, newLog];
    await this.storage.updateExecution(executionId, { logs: updatedLogs });

    console.log(`[${level.toUpperCase()}] ${nodeId ? `[${nodeId}] ` : ""}${message}`);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflow: Workflow, executionId: string): Promise<void> {
    try {
      await this.addLog(executionId, "info", "--- Workflow Starting ---");
      await this.addLog(executionId, "info", `Executing workflow: ${workflow.name}`);

      const executionOrder = this.getExecutionOrder(workflow.nodes, workflow.connections);
      await this.addLog(executionId, "info", `Execution order: ${executionOrder.join(" -> ")}`);

      const executionResults: Record<string, INodeData[]> = {};

      for (const nodeId of executionOrder) {
        // Update current node
        await this.storage.updateExecution(executionId, { 
          currentNodeId: nodeId 
        });

        const nodeConfig = workflow.nodes.find(n => n.id === nodeId);
        if (!nodeConfig) {
          throw new Error(`Node configuration not found for ${nodeId}`);
        }

        await this.addLog(executionId, "info", `Executing Node: ${nodeConfig.id} (${nodeConfig.type})`, nodeId);

        try {
          const nodeFactory = this.nodeRegistry.get(nodeConfig.type);
          if (!nodeFactory) {
            throw new Error(`Node type "${nodeConfig.type}" is not registered`);
          }

          const node = nodeFactory();

          // Get input data from connected nodes
          const inputConnections = workflow.connections.filter(c => c.to === nodeId);
          let inputData: INodeData[] = [];

          if (inputConnections.length > 0) {
            for (const conn of inputConnections) {
              if (executionResults[conn.from]) {
                inputData.push(...executionResults[conn.from]);
              }
            }
          } else {
            inputData.push({});
          }

          // Execute node
          const outputData = await node.execute(inputData, nodeConfig.params || {});
          executionResults[nodeConfig.id] = outputData;

          await this.addLog(
            executionId, 
            "info", 
            `Output: ${JSON.stringify(outputData, null, 2)}`, 
            nodeId
          );

        } catch (error: any) {
          await this.addLog(executionId, "error", `ERROR: ${error.message}`, nodeId);
          await this.storage.updateExecution(executionId, {
            status: "failed",
            completedAt: new Date().toISOString(),
            currentNodeId: undefined
          });
          return;
        }
      }

      // Success
      await this.addLog(executionId, "info", "--- Workflow Finished Successfully ---");
      await this.storage.updateExecution(executionId, {
        status: "completed",
        completedAt: new Date().toISOString(),
        currentNodeId: undefined,
        results: executionResults
      });

    } catch (error: any) {
      await this.addLog(executionId, "error", `Workflow execution failed: ${error.message}`);
      await this.storage.updateExecution(executionId, {
        status: "failed",
        completedAt: new Date().toISOString(),
        currentNodeId: undefined
      });
    }
  }
}
