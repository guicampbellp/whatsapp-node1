const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios'); // Adicione esta linha
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
console.log(`Diretório de trabalho atual: ${__dirname}`);
console.log(`Conteúdo do diretório:`, fs.readdirSync(__dirname));
console.log('Versão do Node:', process.version);
console.log('Plataforma:', process.platform);
// Rota para processar PDF
app.post('/processar-pdf', async (req, res) => {
  try {
    console.log('Recebida requisição para processar PDF');
    const { pdfUrl } = req.body;
    
    if (!pdfUrl) {
      console.log('URL do PDF não fornecida');
      return res.status(400).json({ error: 'URL do PDF não fornecida' });
    }

    const tempDir = path.join(__dirname, 'temp');
    console.log(`Criando diretório temporário: ${tempDir}`);
    await fs.ensureDir(tempDir);
    
    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    console.log(`Arquivo temporário: ${tempPdfPath}`);

    try {
      console.log(`Iniciando download do PDF: ${pdfUrl}`);
      const response = await axios({
        method: 'get',
        url: pdfUrl,
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(tempPdfPath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log('PDF baixado com sucesso, iniciando processamento...');
      exec(`node extrair.js "${tempPdfPath}"`, async (error, stdout, stderr) => {
        console.log('Processamento concluído, stdout:', stdout);
        console.log('stderr:', stderr);
        
        try {
          await fs.remove(tempPdfPath);
          console.log('Arquivo temporário removido');
        } catch (cleanupError) {
          console.error('Erro ao limpar arquivo temporário:', cleanupError);
        }
        
        if (error) {
          console.error('Erro ao processar PDF:', stderr);
          return res.status(500).json({ error: 'Falha ao processar PDF', details: stderr });
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
      console.error('Erro ao baixar PDF:', downloadError);
      return res.status(500).json({ 
        error: 'Falha ao baixar PDF da URL fornecida',
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

// Rota para enviar mensagens

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));