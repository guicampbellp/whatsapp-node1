const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Rota para processar arquivo (PDF ou Imagem)
app.post('/processar-arquivo', async (req, res) => {
  try {
    console.log('Recebida requisição para processar arquivo');
    const { fileUrl, fileType } = req.body;
    
    if (!fileUrl || !fileType) {
      console.log('Dados incompletos');
      return res.status(400).json({ error: 'URL ou tipo de arquivo não fornecidos' });
    }

    const tempDir = path.join(__dirname, 'temp');
    console.log(`Criando diretório temporário: ${tempDir}`);
    await fs.ensureDir(tempDir);
    
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}${fileType === 'pdf' ? '.pdf' : '.png'}`);
    console.log(`Arquivo temporário: ${tempFilePath}`);

    try {
      console.log(`Iniciando download do arquivo: ${fileUrl}`);
      const response = await axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log('Arquivo baixado com sucesso, iniciando processamento...');
      
      // Determina qual script executar baseado no tipo de arquivo
      const script = fileType === 'pdf' ? 'extrair.js' : 'extrair-img.js';
      exec(`node ${script} "${tempFilePath}"`, async (error, stdout, stderr) => {
        console.log('Processamento concluído, stdout:', stdout);
        console.log('stderr:', stderr);
        
        try {
          await fs.remove(tempFilePath);
          console.log('Arquivo temporário removido');
        } catch (cleanupError) {
          console.error('Erro ao limpar arquivo temporário:', cleanupError);
        }
        
        if (error) {
          console.error('Erro ao processar arquivo:', stderr);
          return res.status(500).json({ error: `Falha ao processar ${fileType}`, details: stderr });
        }

        try {
          const mensagemPath = path.join(__dirname, 'mensagem.json');
          console.log(`Tentando ler arquivo: ${mensagemPath}`);
          console.log('Conteúdo do diretório:', await fs.readdir(__dirname));
          
          const mensagens = await fs.readJson(mensagemPath);
          console.log(`Mensagens lidas: ${mensagens.length}`);
          res.json({ success: true, mensagens });
        } catch (readError) {
          console.error('Erro ao ler mensagens:', readError);
          res.status(500).json({ 
            error: 'Erro ao ler mensagens geradas',
            details: readError.message,
            directoryContent: await fs.readdir(__dirname).catch(e => e.message)
          });
        }
      });
    } catch (downloadError) {
      console.error('Erro ao baixar arquivo:', downloadError);
      return res.status(500).json({ 
        error: 'Falha ao baixar arquivo da URL fornecida',
        details: downloadError.message 
      });
    }
  } catch (err) {
    console.error('Erro geral:', err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));