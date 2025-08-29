import { type User, type InsertUser, type Workflow, type InsertWorkflow, type Execution, type InsertExecution } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workflow methods
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getAllWorkflows(): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;
  
  // Execution methods
  getExecution(id: string): Promise<Execution | undefined>;
  getExecutionsByWorkflow(workflowId: string): Promise<Execution[]>;
  createExecution(execution: InsertExecution): Promise<Execution>;
  updateExecution(id: string, execution: Partial<Execution>): Promise<Execution | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workflows: Map<string, Workflow>;
  private executions: Map<string, Execution>;

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.executions = new Map();
    
    // Initialize with sample workflow
    this.initializeSampleWorkflow();
  }

  private initializeSampleWorkflow() {
    const sampleWorkflow: Workflow = {
      id: "sample-workflow-1",
      name: "My First Workflow",
      description: "A simple workflow demonstrating HTTP request and logging",
      nodes: [
        {
          id: "start-node",
          type: "StartNode",
          position: { x: 100, y: 120 },
          params: {}
        },
        {
          id: "fetch-node",
          type: "FetchApiNode",
          position: { x: 300, y: 170 },
          params: {
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/users",
            headers: {}
          }
        },
        {
          id: "log-node",
          type: "LogMessageNode",
          position: { x: 500, y: 220 },
          params: {
            message: "API Response received"
          }
        }
      ],
      connections: [
        { id: "conn-1", from: "start-node", to: "fetch-node" },
        { id: "conn-2", from: "fetch-node", to: "log-node" }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.workflows.set(sampleWorkflow.id, sampleWorkflow);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updateData: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const existing = this.workflows.get(id);
    if (!existing) return undefined;

    const updated: Workflow = {
      ...existing,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.workflows.set(id, updated);
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  async getExecution(id: string): Promise<Execution | undefined> {
    return this.executions.get(id);
  }

  async getExecutionsByWorkflow(workflowId: string): Promise<Execution[]> {
    return Array.from(this.executions.values()).filter(
      (execution) => execution.workflowId === workflowId
    );
  }

  async createExecution(insertExecution: InsertExecution): Promise<Execution> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const execution: Execution = {
      ...insertExecution,
      id,
      startedAt: now,
      logs: []
    };
    this.executions.set(id, execution);
    return execution;
  }

  async updateExecution(id: string, updateData: Partial<Execution>): Promise<Execution | undefined> {
    const existing = this.executions.get(id);
    if (!existing) return undefined;

    const updated: Execution = {
      ...existing,
      ...updateData
    };
    this.executions.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
