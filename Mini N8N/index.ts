// Caminho: /mini-n8n/index.ts (VERSÃO SERVIDOR API)

import { Workflow } from './core/Workflow';
import express from 'express';
import path from 'path';

// Inicializa o servidor web
const app = express();
const port = 3000;

// ----- LIGAÇÃO BACKEND-FRONTEND -----
// Esta linha diz ao nosso servidor para servir os ficheiros estáticos (HTML, CSS, JS) 
// que estarão na pasta "public"
app.use(express.static(path.join(__dirname, '../public')));

// ----- A NOSSA API -----
// Criamos uma "rota" ou "endpoint" no URL /api/workflow
// Quando o frontend chamar este URL, o código abaixo será executado.
app.get('/api/workflow', (req, res) => {
    try {
        // Em vez de executar o workflow, apenas lemos o ficheiro JSON
        // e o enviamos como resposta para o frontend.
        const workflowDefinition = require('./workflows/meuPrimeiroWorkflow.json');
        res.json(workflowDefinition); // Envia o JSON como resposta
    } catch (error) {
        res.status(500).json({ error: 'Falha ao ler o ficheiro do workflow.' });
    }
});

// ----- INICIA O SERVIDOR -----
// O servidor começa a "escutar" por pedidos na porta 3000
app.listen(port, () => {
    console.log(`🚀 Servidor "Mini-n8n" a correr!`);
    console.log(`Aceda à interface em http://localhost:${port}`);
});
