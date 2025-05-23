const fs = require("fs-extra");
const pdf = require("pdf-parse");
const path = require("path");

const pdfPath = process.argv[2];
const sessionId = process.argv[3]; // Recebe o sessionId como terceiro argumento

async function extrairConsultas() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const texto = data.text;

        // Salva texto para debug
        fs.writeFileSync('debug_pdf_text.txt', texto);
        
        const consultas = [];
        
        // Extrair informações da unidade e profissional
        const infoUnidade = texto.match(/USF\s+([^\n]+)/);
        const unidade = infoUnidade ? infoUnidade[0].trim() : 'Unidade não identificada';
        
        const infoProfissional = texto.match(/Profissional\s+([^\n]+)/);
        const profissional = infoProfissional ? infoProfissional[1].trim() : 'Profissional não identificado';
        
        // Padrão regex ajustado para o formato específico
        const padraoConsulta = /(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2})\s*([A-Z][A-Z\s]+?[A-Z])\s*(?:PUERICULTURA|CLINICA MEDICA|PEDIATRIA|PRE NATAL|PRE NATAL PRIMEIRA CONSULTA|CONSULTA ENFERMAGEM|CONSULTA).*?Telefones do paciente:\s*([^\n]+)/gs;
        
        let match;
        while ((match = padraoConsulta.exec(texto)) !== null) {
            const data = match[1];
            const hora = match[2];
            let nomeCompleto = match[3].trim().replace(/\s+/g, ' ');
            const telefones = match[4];
            
            // Processa o nome completo
            const partesNome = nomeCompleto.split(' ');
            let nomeFormatado = nomeCompleto;
            
            if (partesNome.length >= 2) {
                if (['de', 'da', 'dos', 'das'].includes(partesNome[1].toLowerCase())) {
                    nomeFormatado = partesNome.slice(0, 3).join(' ');
                } else {
                    nomeFormatado = partesNome.slice(0, 2).join(' ');
                }
            }
            
            // Extrai todos os números de telefone
            const tels = telefones.match(/\(\d+\)\s*\d+[\d\s-]*/g) || [];
            
            for (const tel of tels) {
                const telFormatado = tel.replace(/[^\d]/g, '');
                if (telFormatado.length >= 10) {
                    consultas.push({
                        telefone: telFormatado,
                        mensagem: `Mensagem Automática - Confirmação de Consulta\n\n` +
                                  `Olá, ${nomeFormatado}!\n\n` +
                                  `Este é um lembrete da sua consulta na ${unidade} com ${profissional}.\n\n` +
                                  `📅 Data: ${data}\n` +
                                  `⏰ Horário: ${hora}\n\n` +
                                  `Por favor, confirme sua presença respondendo com:\n` +
                                  `✅ 1 para Sim, estarei presente\n` +
                                  `❌ 2 para Não poderei comparecer\n\n` +
                                  `A sua confirmação é muito importante para melhor organização do atendimento.\n\n` +
                                  `Agradecemos sua atenção!`,
                        unidade: unidade,
                        profissional: profissional
                    });
                }
            }
        }

        const mensagemPath = path.join(__dirname, `mensagem_${sessionId}.json`);
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
            console.log("Nenhuma consulta encontrada - verifique debug_pdf_text.txt");
        }

    } catch (err) {
        console.error("Erro ao processar o PDF:", err);
    }
}

extrairConsultas();