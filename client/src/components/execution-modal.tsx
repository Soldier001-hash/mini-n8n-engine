import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Execution } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Square } from "lucide-react";

interface ExecutionModalProps {
  executionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutionModal({ executionId, isOpen, onClose }: ExecutionModalProps) {
  // Fetch execution data with polling
  const { data: execution, refetch } = useQuery<Execution>({
    queryKey: ["/api/executions", executionId],
    enabled: isOpen,
  });

  // Set up polling for running executions
  const pollingInterval = execution?.status === "running" ? 1000 : false;

  // Stop execution mutation
  const stopExecutionMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/executions/${executionId}/stop`),
    onSuccess: () => {
      refetch();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-success";
      case "running":
        return "text-primary";
      case "failed":
        return "text-destructive";
      case "stopped":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✓";
      case "running":
        return "⏳";
      case "failed":
        return "✗";
      case "stopped":
        return "⏸";
      default:
        return "⏸";
    }
  };

  if (!execution) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="execution-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Workflow Execution</span>
            <div className={`text-sm ${getStatusColor(execution.status)}`}>
              {getStatusIcon(execution.status)} {execution.status.toUpperCase()}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Execution Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Started:</span>
              <span className="ml-2" data-testid="text-started-time">
                {new Date(execution.startedAt).toLocaleString()}
              </span>
            </div>
            {execution.completedAt && (
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <span className="ml-2" data-testid="text-completed-time">
                  {new Date(execution.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Current Node */}
          {execution.currentNodeId && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="font-medium">Currently executing: {execution.currentNodeId}</span>
              </div>
            </div>
          )}

          {/* Execution Log */}
          <div>
            <h4 className="font-medium mb-3">Execution Log</h4>
            <div className="bg-muted/30 rounded-lg p-4">
              <ScrollArea className="h-64">
                <div className="font-mono text-sm space-y-1">
                  {execution.logs.length === 0 ? (
                    <div className="text-muted-foreground">No logs yet...</div>
                  ) : (
                    execution.logs.map((log, index) => (
                      <div key={index} className={`
                        ${log.level === 'error' ? 'text-destructive' : 
                          log.level === 'warn' ? 'text-warning' : 'text-muted-foreground'}
                      `}>
                        <span className="text-xs opacity-75">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        {log.nodeId && <span className="text-xs opacity-75"> [{log.nodeId}]</span>}
                        <span className="ml-2">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Results */}
          {execution.results && Object.keys(execution.results).length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Results</h4>
              <div className="bg-muted/30 rounded-lg p-4">
                <ScrollArea className="h-32">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(execution.results, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {execution.status === "running" && (
              <Button
                variant="outline"
                onClick={() => stopExecutionMutation.mutate()}
                disabled={stopExecutionMutation.isPending}
                data-testid="button-stop-execution"
              >
                <Square className="w-4 h-4 mr-2" />
                {stopExecutionMutation.isPending ? "Stopping..." : "Stop Execution"}
              </Button>
            )}
          </div>
          <Button onClick={onClose} data-testid="button-close-modal">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
