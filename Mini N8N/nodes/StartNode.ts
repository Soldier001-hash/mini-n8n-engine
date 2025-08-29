import { INode, IInputData } from '../core/INode';

export class StartNode implements INode {
    async execute(input: IInputData[], params: Record<string, any>): Promise<IInputData[]> {
        console.log('StartNode is providing initial data.');
        // Retorna os parâmetros definidos no JSON do workflow
        return [params];
    }
}