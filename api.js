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
// Rota para processar PDF
app.post('/processar-pdf', async (req, res) => {
  try {
    const { pdfUrl } = req.body;
    
    if (!pdfUrl) {
      return res.status(400).json({ error: 'URL do PDF não fornecida' });
    }

    // Cria uma pasta temporária se não existir
    const tempDir = path.join(__dirname, 'temp');
    await fs.ensureDir(tempDir);
    
    // Define o caminho para o arquivo temporário
    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    
    try {
      // Faz o download do PDF
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
      
      // Processa o PDF
      // No endpoint /processar-pdf
exec(`node extrair.js "${tempPdfPath}"`, async (error, stdout, stderr) => {
  try {
      await fs.remove(tempPdfPath);
  } catch (cleanupError) {
      console.error('Erro ao limpar arquivo temporário:', cleanupError);
  }
  
  if (error) {
      console.error('Erro ao processar PDF:', stderr);
      return res.status(500).json({ error: 'Falha ao processar PDF' });
  }

  console.log('Saída do extrair.js:', stdout);
  
  try {
      const mensagemPath = path.join(__dirname, 'mensagem.json');
      console.log('Tentando ler:', mensagemPath);
      console.log('Conteúdo do diretório:', fs.readdirSync(__dirname));
      
      const mensagens = await fs.readJson(mensagemPath);
      console.log('Mensagens lidas com sucesso:', mensagens.length);
      
      res.json({ success: true, mensagens });
  } catch (readError) {
      console.error('Erro ao ler mensagem.json:', readError);
      res.status(500).json({ error: 'Erro ao ler mensagens geradas' });
  }
});
    } catch (downloadError) {
      console.error('Erro ao baixar PDF:', downloadError);
      return res.status(500).json({ error: 'Falha ao baixar PDF da URL fornecida' });
    }
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