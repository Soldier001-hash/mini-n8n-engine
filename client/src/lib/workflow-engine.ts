import { type Workflow, type WorkflowNode, type Connection, type INodeData, type INodeParams } from "@shared/schema";
import axios from "axios";

interface INode {
  execute(inputData: INodeData[], params: INodeParams): Promise<INodeData[]>;
}

class StartNode implements INode {
  async execute(inputData: INodeData[], params: INodeParams): Promise<INodeData[]> {
    console.log("🚀 Starting workflow execution");
    return [{ startTime: new Date().toISOString(), ...params }];
  }
}

class FetchApiNode implements INode {
  async execute(inputData: INodeData[], params: INodeParams): Promise<INodeData[]> {
    const { method = "GET", url, headers = {}, body } = params;
    
    if (!url) {
      throw new Error("URL is required for HTTP request");
    }

    console.log(`📡 Making ${method} request to ${url}`);

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers,
        data: body
      });

      return [{
        statusCode: response.status,
        headers: response.headers,
        data: response.data,
        inputData: inputData[0] || {}
      }];
    } catch (error: any) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }
}

class LogMessageNode implements INode {
  async execute(inputData: INodeData[], params: INodeParams): Promise<INodeData[]> {
    const { message = "Log output" } = params;
    const data = inputData[0] || {};
    
    console.log(`📝 ${message}:`, JSON.stringify(data, null, 2));
    
    return [{
      logMessage: message,
      loggedData: data,
      timestamp: new Date().toISOString()
    }];
  }
}

export class WorkflowEngine {
  private nodeRegistry: Map<string, () => INode> = new Map();

  constructor() {
    this.nodeRegistry.set("StartNode", () => new StartNode());
    this.nodeRegistry.set("FetchApiNode", () => new FetchApiNode());
    this.nodeRegistry.set("LogMessageNode", () => new LogMessageNode());
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

  /**
   * Execute workflow
   */
  async executeWorkflow(workflow: Workflow, onProgress?: (nodeId: string, status: string, data?: any) => void): Promise<void> {
    console.log("--- Workflow Starting ---");
    console.log(`Executing workflow: ${workflow.name}`);

    const executionOrder = this.getExecutionOrder(workflow.nodes, workflow.connections);
    console.log("Execution order:", executionOrder.join(" -> "));

    const executionResults: Record<string, INodeData[]> = {};

    for (const nodeId of executionOrder) {
      const nodeConfig = workflow.nodes.find(n => n.id === nodeId);
      if (!nodeConfig) {
        throw new Error(`Node configuration not found for ${nodeId}`);
      }

      console.log(`\n[Executing Node: ${nodeConfig.id} (${nodeConfig.type})]`);
      onProgress?.(nodeId, "executing");

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

        console.log(`✓ Output of ${nodeConfig.id}:`, JSON.stringify(outputData, null, 2));
        onProgress?.(nodeId, "completed", outputData);

      } catch (error: any) {
        console.error(`\n!!! ERROR at node "${nodeConfig.id}" !!!`);
        console.error(error);
        onProgress?.(nodeId, "failed", { error: error.message });
        throw new Error(`Execution failed at node ${nodeId}: ${error.message}`);
      }
    }

    console.log("\n--- Workflow Finished Successfully ---");
  }
}
