import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Workflow } from "@shared/schema";
import { WorkflowCanvas } from "@/components/workflow-canvas";
import { NodePalette } from "@/components/node-palette";
import { ExecutionModal } from "@/components/execution-modal";
import { NodeConfigPanel } from "@/components/node-config-panel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Save, Settings } from "lucide-react";

export default function WorkflowBuilder() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  // Load first workflow by default
  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflowId) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [workflows, selectedWorkflowId]);

  // Fetch selected workflow
  const { data: currentWorkflow, isLoading: workflowLoading } = useQuery<Workflow>({
    queryKey: ["/api/workflows", selectedWorkflowId],
    enabled: !!selectedWorkflowId,
  });

  // Update workflow mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async (workflow: Partial<Workflow>) => {
      if (!selectedWorkflowId) throw new Error("No workflow selected");
      return apiRequest("PUT", `/api/workflows/${selectedWorkflowId}`, workflow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Success", description: "Workflow saved successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to save workflow",
        variant: "destructive" 
      });
    },
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkflowId) throw new Error("No workflow selected");
      const response = await apiRequest("POST", `/api/workflows/${selectedWorkflowId}/execute`);
      return response.json();
    },
    onSuccess: (execution) => {
      setCurrentExecutionId(execution.id);
      setIsExecutionModalOpen(true);
      toast({ title: "Success", description: "Workflow execution started" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to start workflow execution",
        variant: "destructive" 
      });
    },
  });

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsConfigPanelOpen(true);
  };

  const handleSaveWorkflow = () => {
    if (currentWorkflow) {
      // Log to console as requested
      console.log("Current Workflow JSON:", JSON.stringify(currentWorkflow, null, 2));
      updateWorkflowMutation.mutate(currentWorkflow);
    }
  };

  const handleExecuteWorkflow = () => {
    executeWorkflowMutation.mutate();
  };

  const handleNodeAdd = (nodeType: string, position: { x: number; y: number }) => {
    if (!currentWorkflow) return;
    
    const newNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType as any,
      position,
      params: {},
      status: "idle" as const
    };

    const updatedWorkflow = {
      ...currentWorkflow,
      nodes: [...currentWorkflow.nodes, newNode]
    };
    
    updateWorkflowMutation.mutate(updatedWorkflow);
  };

  const handleNodeDelete = (nodeId: string) => {
    if (!currentWorkflow) return;
    
    const updatedWorkflow = {
      ...currentWorkflow,
      nodes: currentWorkflow.nodes.filter(node => node.id !== nodeId),
      connections: currentWorkflow.connections.filter(
        conn => conn.from !== nodeId && conn.to !== nodeId
      )
    };
    
    updateWorkflowMutation.mutate(updatedWorkflow);
  };

  const handleConnectionAdd = (from: string, to: string) => {
    if (!currentWorkflow) return;
    
    const newConnection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from,
      to
    };

    const updatedWorkflow = {
      ...currentWorkflow,
      connections: [...currentWorkflow.connections, newConnection]
    };
    
    updateWorkflowMutation.mutate(updatedWorkflow);
  };

  const handleConnectionDelete = (connectionId: string) => {
    if (!currentWorkflow) return;
    
    const updatedWorkflow = {
      ...currentWorkflow,
      connections: currentWorkflow.connections.filter(conn => conn.id !== connectionId)
    };
    
    updateWorkflowMutation.mutate(updatedWorkflow);
  };

  if (workflowsLoading || workflowLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col" data-testid="sidebar">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold">Mini N8N</h1>
              <p className="text-sm text-muted-foreground">Workflow Engine</p>
            </div>
          </div>
        </div>

        {/* Node Palette */}
        <NodePalette />

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button 
            className="w-full" 
            onClick={handleSaveWorkflow}
            disabled={updateWorkflowMutation.isPending}
            data-testid="button-save"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateWorkflowMutation.isPending ? "Saving..." : "Save Workflow"}
          </Button>
          <Button 
            className="w-full" 
            onClick={handleExecuteWorkflow}
            disabled={executeWorkflowMutation.isPending || !currentWorkflow}
            data-testid="button-execute"
          >
            <Play className="w-4 h-4 mr-2" />
            {executeWorkflowMutation.isPending ? "Starting..." : "Execute Workflow"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold" data-testid="text-workflow-name">
                {currentWorkflow?.name || "No Workflow Selected"}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span data-testid="text-status">Ready</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" title="Settings" data-testid="button-settings">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Workflow Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {currentWorkflow ? (
            <WorkflowCanvas 
              workflow={currentWorkflow} 
              onNodeClick={handleNodeClick}
              onNodeAdd={handleNodeAdd}
              onNodeDelete={handleNodeDelete}
              onConnectionAdd={handleConnectionAdd}
              onConnectionDelete={handleConnectionDelete}
              data-testid="workflow-canvas"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="max-w-md">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No Workflow Selected</h3>
                <p className="text-muted-foreground">Select a workflow to start building your automation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execution Modal */}
      {isExecutionModalOpen && currentExecutionId && (
        <ExecutionModal
          executionId={currentExecutionId}
          isOpen={isExecutionModalOpen}
          onClose={() => {
            setIsExecutionModalOpen(false);
            setCurrentExecutionId(null);
          }}
        />
      )}

      {/* Node Configuration Panel */}
      {isConfigPanelOpen && selectedNodeId && currentWorkflow && (
        <NodeConfigPanel
          nodeId={selectedNodeId}
          workflow={currentWorkflow}
          isOpen={isConfigPanelOpen}
          onClose={() => {
            setIsConfigPanelOpen(false);
            setSelectedNodeId(null);
          }}
          onSave={(updatedNode) => {
            const updatedWorkflow = {
              ...currentWorkflow,
              nodes: currentWorkflow.nodes.map(node => 
                node.id === updatedNode.id ? updatedNode : node
              )
            };
            updateWorkflowMutation.mutate(updatedWorkflow);
            setIsConfigPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}
