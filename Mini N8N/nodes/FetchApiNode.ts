// Path: /mini-n8n/nodes/FetchApiNode.ts
import { INode, IInputData } from '../core/INode';
import axios from 'axios';

export class FetchApiNode implements INode {
    async execute(input: IInputData[], params: Record<string, any>): Promise<IInputData[]> {
        if (!params || !params.url) {
            throw new Error("FetchApiNode Error: 'url' parameter is required.");
        }

        const url = params.url;
        console.log(`Fetching data from: ${url}`);
        
        try {
            const response = await axios.get(url);
            const combinedResults = input.map(item => ({
                ...item,
                api_result: response.data,
            }));
            return combinedResults;
        } catch (error: any) {
            throw new Error(`Failed to fetch from ${url}. Reason: ${error.message}`);
        }
    }
}