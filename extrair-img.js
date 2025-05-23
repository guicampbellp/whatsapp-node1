const fs = require("fs-extra");
const path = require("path");
const Tesseract = require("tesseract.js");

const imagePath = process.argv[2];

async function extrairConsultasDaImagem() {
    try {
        // Processa a imagem com OCR
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'por',
            { logger: m => console.log(m) }
        );

        // Salva texto para debug
        fs.writeFileSync('debug_image_text.txt', text);
        
        const consultas = [];
        
        // Extrair informações da unidade e profissional
        const infoUnidade = text.match(/USF\s+([^\n]+)/);
        const unidade = infoUnidade ? infoUnidade[0].trim() : 'Unidade não identificada';
        
        const infoProfissional = text.match(/Profissional\s+([^\n]+)/);
        const profissional = infoProfissional ? infoProfissional[1].trim() : 'Profissional não identificado';
        
        // Padrão regex ajustado para o formato específico da imagem
        const padraoConsulta = /Data Consulta:\s*(\d{2}\/\d{2}\/\d{4}).*?Hora:\s*(\d{2}:\d{2}).*?Tipo Atendimento:\s*([^\n]+).*?Paciente:\s*([^\n]+)\s*Nascimento:\s*(\d{2}\/\d{2}\/\d{4}).*?Telefones do paciente:\s*([^\n]+)/gs;
        
        let match;
        while ((match = padraoConsulta.exec(text)) !== null) {
            const data = match[1];
            const hora = match[2];
            const tipoAtendimento = match[3].trim();
            const nomePaciente = match[4].trim();
            const dataNascimento = match[5];
            const telefones = match[6];
            
            // Extrai todos os números de telefone
            const tels = telefones.match(/\(\d+\)\s*\d+[\d\s-]*/g) || [];
            
            for (const tel of tels) {
                const telFormatado = tel.replace(/[^\d]/g, '');
                if (telFormatado.length >= 10) {
                    // Formata o nome para a mensagem (pega as primeiras partes do nome)
                    let nomeFormatado = nomePaciente;
                    const partesNome = nomePaciente.split(' ');
                    if (partesNome.length >= 2) {
                        if (['de', 'da', 'dos', 'das'].includes(partesNome[1].toLowerCase())) {
                            nomeFormatado = partesNome.slice(0, 3).join(' ');
                        } else {
                            nomeFormatado = partesNome.slice(0, 2).join(' ');
                        }
                    }
                    
                    consultas.push({
                        telefone: telFormatado,
                        mensagem: `Mensagem Automática - Confirmação de Consulta\n\n` +
                                  `Olá, ${nomeFormatado || 'paciente'}!\n\n` +
                                  `Este é um lembrete da sua consulta na ${unidade} com ${profissional}.\n\n` +
                                  `📅 Data: ${data}\n` +
                                  `⏰ Horário: ${hora}\n` +
                                  `📋 Tipo: ${tipoAtendimento}\n\n` +
                                  `Por favor, confirme sua presença respondendo com:\n` +
                                  `✅ 1 para Sim, estarei presente\n` +
                                  `❌ 2 para Não poderei comparecer\n\n` +
                                  `A sua confirmação é muito importante para melhor organização do atendimento.\n\n` +
                                  `Agradecemos sua atenção!`,
                        unidade: unidade,
                        profissional: profissional,
                        dataNascimento: dataNascimento
                    });
                }
            }
        }

        const mensagemPath = path.join(__dirname, 'mensagem.json');
        fs.writeFileSync(mensagemPath, JSON.stringify(consultas, null, 4));
        console.log(`Arquivo criado em: ${mensagemPath}`);
        
        if (consultas.length > 0) {
            console.log("\nInformações extraídas:");
            console.log(`Unidade: ${unidade}`);
            console.log(`Profissional: ${profissional}`);
            console.log("\nExemplo de mensagem gerada:");
            console.log(consultas[0].mensagem);
            console.log("\nPrimeiras 3 consultas extraídas:");
            consultas.slice(0, 3).forEach((consulta, index) => {
                console.log(`${index + 1}. Telefone: ${consulta.telefone}`);
            });
        } else {
            console.log("Nenhuma consulta encontrada - verifique debug_image_text.txt");
        }

    } catch (err) {
        console.error("Erro ao processar a imagem:", err);
    }
}

extrairConsultasDaImagem();