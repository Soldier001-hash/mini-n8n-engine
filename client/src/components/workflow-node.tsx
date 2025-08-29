import React from "react";
import { type WorkflowNode as WorkflowNodeType } from "@shared/schema";

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  onClick: () => void;
  onDelete?: () => void;
  style?: React.CSSProperties;
}

const nodeConfigs = {
  StartNode: {
    name: "Start",
    description: "Workflow execution begins here",
    icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
    ),
    borderColor: "border-success",
    iconBg: "bg-success",
    statusColor: "bg-success"
  },
  FetchApiNode: {
    name: "HTTP Request",
    description: (params: any) => params?.url ? `${params.method || 'GET'} ${params.url}` : "Configure HTTP request",
    icon: (
      <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
    ),
    borderColor: "border-primary",
    iconBg: "bg-primary",
    statusColor: "bg-primary"
  },
  LogMessageNode: {
    name: "Log Message",
    description: (params: any) => params?.message || "Output execution data",
    icon: (
      <svg className="w-4 h-4 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    ),
    borderColor: "border-secondary",
    iconBg: "bg-secondary",
    statusColor: "bg-secondary"
  },
  IfNode: {
    name: "IF Condition",
    description: (params: any) => params?.condition || "Configure conditional logic",
    icon: (
      <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    ),
    borderColor: "border-primary",
    iconBg: "bg-primary",
    statusColor: "bg-primary"
  }
};

export function WorkflowNode({ node, onClick, onDelete, style }: WorkflowNodeProps) {
  const config = nodeConfigs[node.type as keyof typeof nodeConfigs];
  
  if (!config) {
    return (
      <div
        className="node absolute bg-card border-2 border-destructive rounded-lg shadow-lg p-4 w-48 cursor-pointer"
        style={style}
        onClick={onClick}
        data-testid={`node-${node.id}`}
      >
        <div className="text-sm text-destructive">Unknown node type: {node.type}</div>
      </div>
    );
  }

  const description = typeof config.description === 'function' 
    ? config.description(node.params) 
    : config.description;

  const getStatusBorderClass = () => {
    switch (node.status) {
      case "running":
        return "border-warning animate-pulse";
      case "success":
        return "border-success";
      case "error":
        return "border-destructive";
      default:
        return config.borderColor;
    }
  };

  return (
    <div
      className={`
        node absolute bg-card border-2 rounded-lg shadow-lg p-4 w-48 cursor-pointer
        transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-primary/60
        ${getStatusBorderClass()}
      `}
      style={style}
      onClick={onClick}
      data-node-id={node.id}
      data-testid={`node-${node.id}`}
      title="Click to configure this node"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 ${config.iconBg} rounded-md flex items-center justify-center`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm" data-testid={`text-node-name-${node.id}`}>
            {config.name}
          </h4>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors rounded flex items-center justify-center"
            title="Delete node"
            data-testid={`button-delete-${node.id}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2" data-testid={`text-node-description-${node.id}`}>
        {description}
      </p>
      <div className="flex justify-between items-center">
        {/* Connection points */}
        <div className="flex gap-1">
          {node.type !== 'StartNode' && (
            <div 
              className="w-3 h-3 bg-border rounded-full cursor-pointer hover:bg-secondary transition-colors" 
              title="Input connection"
              data-testid={`connection-input-${node.id}`}
            />
          )}
        </div>
        <div className="flex gap-1">
          {node.type === 'IfNode' ? (
            <>
              <div 
                className="w-3 h-3 bg-success rounded-full cursor-pointer hover:bg-success/80 transition-colors" 
                title="True output"
                data-testid={`connection-output-true-${node.id}`}
              />
              <div 
                className="w-3 h-3 bg-destructive rounded-full cursor-pointer hover:bg-destructive/80 transition-colors" 
                title="False output"
                data-testid={`connection-output-false-${node.id}`}
              />
            </>
          ) : node.type !== 'LogMessageNode' && (
            <div 
              className="w-3 h-3 bg-border rounded-full cursor-pointer hover:bg-primary transition-colors" 
              title="Output connection"
              data-testid={`connection-output-${node.id}`}
            />
          )}
        </div>
        
        {/* Status indicator */}
        <div className={`w-2 h-2 ${config.statusColor} rounded-full`} title="Ready" />
      </div>
    </div>
  );
}
