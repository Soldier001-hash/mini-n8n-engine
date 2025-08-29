// CONTEÚDO FINAL E CORRETO PARA nodes/LogMessageNode.ts

import { INode, IInputData } from '../core/INode';

export class LogMessageNode implements INode {
    async execute(input: IInputData[], params: Record<string, any>): Promise<IInputData[]> {
        if (!params || !params.message) {
            console.warn("LogMessageNode: 'message' parameter not provided. Skipping log.");
            return input;
        }

        for (const item of input) {
            let formattedMessage = params.message.replace(/\{\{(.*?)\}\}/g, (_match, key) => {
                // A correção crucial está nesta linha
                const value = key.split('.').reduce((o: any, i: string) => (o ? o[i] : undefined), item);
                return value !== undefined ? value : `{{${key}}}`;
            });
            console.log(`LOG: ${formattedMessage}`);
        }
        
        return input;
    }
}