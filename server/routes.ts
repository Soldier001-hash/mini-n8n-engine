import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkflowSchema, insertExecutionSchema, type Workflow, type Execution } from "@shared/schema";
import { WorkflowEngine } from "./workflow-engine";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all workflows
  app.get("/api/workflows", async (_req, res) => {
    try {
      const workflows = await storage.getAllWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  // Get specific workflow
  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  // Create workflow
  app.post("/api/workflows", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ error: "Invalid workflow data", details: error });
    }
  });

  // Update workflow
  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.updateWorkflow(req.params.id, validatedData);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(400).json({ error: "Invalid workflow data", details: error });
    }
  });

  // Delete workflow
  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkflow(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  // Execute workflow
  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const execution = await storage.createExecution({
        workflowId: workflow.id,
        status: "running"
      });

      // Start workflow execution in background
      const engine = new WorkflowEngine(storage);
      engine.executeWorkflow(workflow, execution.id).catch(console.error);

      res.status(201).json(execution);
    } catch (error) {
      res.status(500).json({ error: "Failed to start workflow execution" });
    }
  });

  // Get execution status
  app.get("/api/executions/:id", async (req, res) => {
    try {
      const execution = await storage.getExecution(req.params.id);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch execution" });
    }
  });

  // Get executions for a workflow
  app.get("/api/workflows/:id/executions", async (req, res) => {
    try {
      const executions = await storage.getExecutionsByWorkflow(req.params.id);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch executions" });
    }
  });

  // Stop execution
  app.post("/api/executions/:id/stop", async (req, res) => {
    try {
      const execution = await storage.updateExecution(req.params.id, {
        status: "stopped",
        completedAt: new Date().toISOString()
      });
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop execution" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
