import React from "react";

const nodeTypes = [
  {
    category: "Triggers",
    nodes: [
      {
        type: "StartNode",
        name: "Start",
        description: "Workflow trigger",
        icon: (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        ),
        color: "success"
      }
    ]
  },
  {
    category: "Actions",
    nodes: [
      {
        type: "FetchApiNode",
        name: "HTTP Request",
        description: "Fetch API data",
        icon: (
          <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        ),
        color: "primary"
      },
      {
        type: "LogMessageNode",
        name: "Log Message",
        description: "Output data",
        icon: (
          <svg className="w-4 h-4 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        ),
        color: "secondary"
      },
      {
        type: "IfNode",
        name: "IF Condition",
        description: "Conditional logic",
        icon: (
          <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        ),
        color: "primary"
      }
    ]
  }
];

const getColorClasses = (color: string) => {
  switch (color) {
    case "success":
      return {
        bg: "bg-success/10",
        border: "border-success/20",
        hoverBorder: "hover:border-success/40",
        iconBg: "bg-success"
      };
    case "primary":
      return {
        bg: "bg-primary/10",
        border: "border-primary/20",
        hoverBorder: "hover:border-primary/40",
        iconBg: "bg-primary"
      };
    case "secondary":
      return {
        bg: "bg-secondary/10",
        border: "border-secondary/20",
        hoverBorder: "hover:border-secondary/40",
        iconBg: "bg-secondary"
      };
    default:
      return {
        bg: "bg-muted/10",
        border: "border-border",
        hoverBorder: "hover:border-border",
        iconBg: "bg-muted"
      };
  }
};

export function NodePalette() {
  const handleNodeDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ nodeType }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4" data-testid="node-palette">
      <div className="space-y-6">
        {nodeTypes.map((category) => (
          <div key={category.category}>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.nodes.map((node) => {
                const colorClasses = getColorClasses(node.color);
                return (
                  <div
                    key={node.type}
                    className={`
                      node p-3 border-2 rounded-lg cursor-pointer transition-all duration-200
                      ${colorClasses.bg} ${colorClasses.border} ${colorClasses.hoverBorder}
                      hover:transform hover:-translate-y-1 hover:shadow-lg
                    `}
                    draggable
                    onDragStart={(e) => handleNodeDragStart(e, node.type)}
                    data-node-type={node.type}
                    data-testid={`node-${node.type.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${colorClasses.iconBg} rounded-md flex items-center justify-center`}>
                        {node.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{node.name}</p>
                        <p className="text-xs text-muted-foreground">{node.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
