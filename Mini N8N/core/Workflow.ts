// Path: /mini-n8n/core/Workflow.ts (VERSÃO CORRIGIDA)

import { INode, IInputData } from './INode';
import * as path from 'path';

// DEFININDO AS ESTRUTURAS PARA O TYPESCRIPT
interface INodeConfig {
    id: string;
    type: string;
    params?: Record<string, any>;
}

interface IConnection {
    from: string;
    to: string;
}

export class Workflow {
    private nodes: Map<string, INode> = new Map();
    private workflowDefinition: any;

    constructor(definitionPath: string) {
        this.workflowDefinition = require(path.resolve(definitionPath));
    }

    private getExecutionOrder(): string[] {
        const nodes: INodeConfig[] = this.workflowDefinition.nodes;
        const connections: IConnection[] = this.workflowDefinition.connections;
        
        const inDegree: Map<string, number> = new Map();
        const graph: Map<string, string[]> = new Map();

        for (const node of nodes) {
            inDegree.set(node.id, 0);
            graph.set(node.id, []);
        }

        for (const conn of connections) {
            graph.get(conn.from)!.push(conn.to);
            inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
        }

        const queue: string[] = [];
        for (const [nodeId, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(nodeId);
            }
        }
        
        const executionOrder: string[] = [];
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            executionOrder.push(nodeId);

            for (const neighborId of graph.get(nodeId)!) {
                inDegree.set(neighborId, inDegree.get(neighborId)! - 1);
                if (inDegree.get(neighborId) === 0) {
                    queue.push(neighborId);
                }
            }
        }

        if (executionOrder.length !== nodes.length) {
            throw new Error("Workflow has a cycle (loop) and cannot be executed.");
        }

        return executionOrder;
    }

    private async loadNode(nodeType: string): Promise<INode> {
        if (this.nodes.has(nodeType)) return this.nodes.get(nodeType)!;

        try {
            const nodeModule = await import(`../nodes/${nodeType}`);
            const nodeInstance: INode = new nodeModule[nodeType]();
            this.nodes.set(nodeType, nodeInstance);
            return nodeInstance;
        } catch (error) {
            throw new Error(`Node type "${nodeType}" not found or has an error.`);
        }
    }

    public async run(): Promise<void> {
        console.log('--- Workflow Starting ---');
        const executionOrder = this.getExecutionOrder();
        console.log('Execution Order:', executionOrder.join(' -> '));
        
        const executionResults: Record<string, IInputData[]> = {};
        
        for (const nodeId of executionOrder) {
            // CORREÇÃO AQUI: adicionamos o tipo INodeConfig para 'n'
            const nodeConfig = this.workflowDefinition.nodes.find((n: INodeConfig) => n.id === nodeId);
            
            console.log(`\n[Executing Node: ${nodeConfig.id} (${nodeConfig.type})]`);
            
            try {
                const node = await this.loadNode(nodeConfig.type);
                // CORREÇÃO AQUI: adicionamos o tipo IConnection para 'c'
                const connections = this.workflowDefinition.connections.filter((c: IConnection) => c.to === nodeId);
                let inputData: IInputData[] = [];
                
                if (connections.length > 0) {
                    for (const conn of connections) {
                        if (executionResults[conn.from]) {
                            inputData.push(...executionResults[conn.from]);
                        }
                    }
                } else {
                     inputData.push({});
                }
                
                const outputData = await node.execute(inputData, nodeConfig.params || {});
                executionResults[nodeConfig.id] = outputData;

                console.log(`Output of ${nodeConfig.id}:`, JSON.stringify(outputData, null, 2));

            } catch (error) {
                console.error(`\n!!! ERROR at node "${nodeConfig.id}" !!!`);
                console.error(error);
                console.log('--- Workflow Halted Due to Error ---');
                return;
            }
        }

        console.log('\n--- Workflow Finished ---');
    }
}