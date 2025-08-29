import React, { useState } from "react";
import { type WorkflowNode, type Workflow } from "@shared/schema";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

interface NodeConfigPanelProps {
  nodeId: string;
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: WorkflowNode) => void;
}

export function NodeConfigPanel({ nodeId, workflow, isOpen, onClose, onSave }: NodeConfigPanelProps) {
  const node = workflow.nodes.find(n => n.id === nodeId);
  const [params, setParams] = useState(node?.params || {});

  if (!node) {
    return null;
  }

  const handleSave = () => {
    const updatedNode = { ...node, params };
    onSave(updatedNode);
  };

  const handleParamChange = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const renderFetchApiNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="method" className="block text-sm font-medium mb-2">HTTP Method</Label>
        <Select
          value={params.method || "GET"}
          onValueChange={(value) => handleParamChange("method", value)}
        >
          <SelectTrigger data-testid="select-http-method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="url" className="block text-sm font-medium mb-2">URL</Label>
        <Input
          id="url"
          type="url"
          value={params.url || ""}
          onChange={(e) => handleParamChange("url", e.target.value)}
          placeholder="https://api.example.com/users"
          data-testid="input-url"
        />
      </div>

      <div>
        <Label htmlFor="headers" className="block text-sm font-medium mb-2">Headers (JSON)</Label>
        <Textarea
          id="headers"
          value={typeof params.headers === 'object' ? JSON.stringify(params.headers, null, 2) : params.headers || "{}"}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleParamChange("headers", parsed);
            } catch {
              handleParamChange("headers", e.target.value);
            }
          }}
          placeholder='{"Content-Type": "application/json"}'
          className="h-24 font-mono text-sm"
          data-testid="textarea-headers"
        />
      </div>

      {(params.method === "POST" || params.method === "PUT") && (
        <div>
          <Label htmlFor="body" className="block text-sm font-medium mb-2">Request Body (JSON)</Label>
          <Textarea
            id="body"
            value={typeof params.body === 'object' ? JSON.stringify(params.body, null, 2) : params.body || ""}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleParamChange("body", parsed);
              } catch {
                handleParamChange("body", e.target.value);
              }
            }}
            placeholder="JSON payload for POST/PUT requests"
            className="h-32 font-mono text-sm"
            data-testid="textarea-body"
          />
        </div>
      )}
    </div>
  );

  const renderLogMessageNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="message" className="block text-sm font-medium mb-2">Log Message</Label>
        <Input
          id="message"
          value={params.message || ""}
          onChange={(e) => handleParamChange("message", e.target.value)}
          placeholder="Enter log message"
          data-testid="input-message"
        />
      </div>
    </div>
  );

  const renderStartNodeConfig = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Start nodes don't require configuration. They automatically trigger when the workflow begins.
      </div>
    </div>
  );

  const renderIfNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="condition" className="block text-sm font-medium mb-2">Condition</Label>
        <Input
          id="condition"
          value={params.condition || ""}
          onChange={(e) => handleParamChange("condition", e.target.value)}
          placeholder="e.g., {{api_result.id}} === 1"
          data-testid="input-condition"
        />
        <div className="text-xs text-muted-foreground mt-1">
          Use {`{{variable}}`} syntax to reference data from previous nodes
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">Output Paths</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success rounded-full"></div>
          <span className="text-sm text-muted-foreground">True - when condition is met</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-destructive rounded-full"></div>
          <span className="text-sm text-muted-foreground">False - when condition is not met</span>
        </div>
      </div>
    </div>
  );

  const renderNodeConfig = () => {
    switch (node.type) {
      case "FetchApiNode":
        return renderFetchApiNodeConfig();
      case "LogMessageNode":
        return renderLogMessageNodeConfig();
      case "StartNode":
        return renderStartNodeConfig();
      case "IfNode":
        return renderIfNodeConfig();
      default:
        return (
          <div className="text-sm text-muted-foreground">
            No configuration available for this node type.
          </div>
        );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-96" data-testid="node-config-panel">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Configure {node.type}</span>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-config">
              <X className="w-4 h-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-2">Node ID</div>
            <div className="font-mono text-sm bg-muted p-2 rounded" data-testid="text-node-id">
              {node.id}
            </div>
          </div>

          {renderNodeConfig()}
        </div>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-config">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-config">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
