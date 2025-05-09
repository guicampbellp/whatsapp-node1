const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Rota para processar PDF
app.post('/processar-pdf', async (req, res) => {
  try {
    const { pdfPath } = req.body;
    
    if (!pdfPath) {
      return res.status(400).json({ error: 'Caminho do PDF não fornecido' });
    }

    const fullPath = path.join(__dirname, '..', pdfPath);
    
    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'Arquivo PDF não encontrado' });
    }

    exec(`node extrair.js "${fullPath}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error('Erro ao processar PDF:', stderr);
        return res.status(500).json({ error: 'Falha ao processar PDF' });
      }

      try {
        const mensagens = await fs.readJson(path.join(__dirname, 'mensagem.json'));
        res.json({ success: true, mensagens });
      } catch (readError) {
        res.status(500).json({ error: 'Erro ao ler mensagens geradas' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para enviar mensagens
app.post('/enviar-mensagens', async (req, res) => {
  try {
    const { pacientes, tipo_mensagem } = req.body;
    
    if (!pacientes || !Array.isArray(pacientes)) {
      return res.status(400).json({ error: 'Dados de pacientes inválidos' });
    }

    const mensagemPath = path.join(__dirname, 'mensagem_selecionados.json');
    await fs.writeJson(mensagemPath, pacientes);
    
    exec('node whatsapp.js mensagem_selecionados.json', (error, stdout, stderr) => {
      if (error) {
        console.error('Erro ao enviar mensagens:', stderr);
        return res.status(500).json({ error: 'Falha ao enviar mensagens' });
      }
      
      res.json({ 
        success: true,
        output: stdout,
        message: `${pacientes.length} mensagens processadas`,
        tipo: tipo_mensagem || 'confirmacao'
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));