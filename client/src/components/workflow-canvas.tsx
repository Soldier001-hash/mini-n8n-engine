import React from "react";
import { type Workflow } from "@shared/schema";
import { WorkflowNode } from "./workflow-node";

interface WorkflowCanvasProps {
  workflow: Workflow;
  onNodeClick: (nodeId: string) => void;
  onNodeAdd?: (nodeType: string, position: { x: number; y: number }) => void;
  onNodeDelete?: (nodeId: string) => void;
  onConnectionAdd?: (from: string, to: string) => void;
  onConnectionDelete?: (connectionId: string) => void;
}

export function WorkflowCanvas({ 
  workflow, 
  onNodeClick, 
  onNodeAdd, 
  onNodeDelete, 
  onConnectionAdd, 
  onConnectionDelete 
}: WorkflowCanvasProps) {
  const generateConnectionPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const fromX = from.x + 192; // Node width (48 * 4 = 192px)
    const fromY = from.y + 60;  // Half node height
    const toX = to.x;
    const toY = to.y + 60;
    
    const controlPoint1X = fromX + (toX - fromX) / 2;
    const controlPoint2X = fromX + (toX - fromX) / 2;
    
    return `M ${fromX} ${fromY} C ${controlPoint1X} ${fromY} ${controlPoint2X} ${toY} ${toX} ${toY}`;
  };

  const getConnectionPaths = () => {
    return workflow.connections.map(connection => {
      const fromNode = workflow.nodes.find(n => n.id === connection.from);
      const toNode = workflow.nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return null;
      
      return {
        id: connection.id,
        path: generateConnectionPath(fromNode.position, toNode.position)
      };
    }).filter(Boolean);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.nodeType && onNodeAdd) {
        const rect = e.currentTarget.getBoundingClientRect();
        const position = {
          x: e.clientX - rect.left - 96, // Center the node (half width)
          y: e.clientY - rect.top - 60   // Center the node (half height)
        };
        onNodeAdd(data.nodeType, position);
      }
    } catch (error) {
      console.error("Failed to parse drag data:", error);
    }
  };

  const handleConnectionClick = (connectionId: string) => {
    if (onConnectionDelete) {
      onConnectionDelete(connectionId);
    }
  };

  return (
    <div 
      className="workflow-canvas w-full h-full relative bg-background"
      style={{
        backgroundImage: 'radial-gradient(circle, hsl(240 6% 90%) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
      data-testid="canvas"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="hsl(210 79% 46%)" />
          </marker>
        </defs>
        
        {/* Connection lines */}
        {getConnectionPaths().map(connection => (
          connection && (
            <path
              key={connection.id}
              className="stroke-primary stroke-2 fill-none cursor-pointer hover:stroke-destructive transition-colors"
              style={{ markerEnd: 'url(#arrowhead)', pointerEvents: 'all' }}
              d={connection.path}
              data-connection-id={connection.id}
              onClick={() => handleConnectionClick(connection.id)}
            />
          )
        ))}
      </svg>
      
      {/* Workflow Nodes */}
      {workflow.nodes.map((node) => (
        <WorkflowNode
          key={node.id}
          node={node}
          onClick={() => onNodeClick(node.id)}
          onDelete={onNodeDelete ? () => onNodeDelete(node.id) : undefined}
          style={{
            position: 'absolute',
            top: node.position.y,
            left: node.position.x,
            zIndex: 2
          }}
        />
      ))}
      
      {/* Empty state message */}
      {workflow.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div className="max-w-md">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Build Your Workflow</h3>
            <p className="text-muted-foreground mb-4">Drag nodes from the sidebar to create your automation workflow</p>
            <p className="text-sm text-muted-foreground">Start with a trigger node, then add actions to process your data</p>
          </div>
        </div>
      )}
    </div>
  );
}
