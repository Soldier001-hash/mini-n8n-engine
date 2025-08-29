// Path: /mini-n8n/core/INode.ts
// Define a estrutura para os dados de entrada de um nó
export interface IInputData {
    [key: string]: any;
}

// A interface que todos os nós devem implementar
export interface INode {
    // O método execute processa os dados de entrada e retorna um resultado
    execute(input: IInputData[], params: Record<string, any>): Promise<IInputData[]>;
}