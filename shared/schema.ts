import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Workflow Node Schema
export const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["StartNode", "FetchApiNode", "LogMessageNode", "IfNode"]),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  params: z.record(z.any()).optional(),
  status: z.enum(["idle", "running", "success", "error"]).optional()
});

// Connection Schema
export const connectionSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string()
});

// Workflow Schema
export const workflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(workflowNodeSchema),
  connections: z.array(connectionSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Execution Schema
export const executionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.enum(["running", "completed", "failed", "stopped"]),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  currentNodeId: z.string().optional(),
  logs: z.array(z.object({
    timestamp: z.string(),
    level: z.enum(["info", "error", "warn"]),
    message: z.string(),
    nodeId: z.string().optional()
  })),
  results: z.record(z.any()).optional()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWorkflowSchema = workflowSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertExecutionSchema = executionSchema.omit({
  id: true,
  startedAt: true,
  completedAt: true,
  logs: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Workflow = z.infer<typeof workflowSchema>;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type Connection = z.infer<typeof connectionSchema>;
export type Execution = z.infer<typeof executionSchema>;
export type InsertExecution = z.infer<typeof insertExecutionSchema>;

// Node execution data interface
export interface INodeData {
  [key: string]: any;
}

export interface INodeParams {
  [key: string]: any;
}
