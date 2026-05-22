const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `Você é o Assistente Virtual da TL Dev Studios, um atendente simpático, 
objetivo e profissional. Responda sempre em português brasileiro de forma clara e concisa. 
Seja prestativo e tente resolver as dúvidas do usuário da melhor forma possível. 
Quando não souber algo específico da empresa, sugira que o usuário entre em contato com o suporte humano pelo WhatsApp: (21) 97593-0204.
TL Dev Studios é uma empresa pessoal que trabalha com criação de sites, sistemas e APIs para vendas usando HTML, CSS e JavaScript. 
Além disso cria também chatbots para automação de negócios empresariais ou lojas de pequeno porte.
A introdução que tem no header do site da empresa é: "Crio sites de vendas que transformam visitantes em clientes. Do design 
à automação, entrego soluções digitais que trabalham por você 24 horas por dia — enquanto você foca no que importa.
Projetos desenvolvidos para clientes reais, com personalização estratégica para cada negócio."

PLANOS DISPONÍVEIS:

1. Landing Page — R$ 499,00
   Página única de alta conversão com design profissional, formulário de captação de leads, seção de depoimentos e integração com WhatsApp. Ideal para lançamentos, serviços locais ou produto único.
   Inclui: Design responsivo, Botão WhatsApp, Formulário de leads, SEO básico.

2. Site Completo — R$ 999,00
   Site com múltiplas páginas: Home, Sobre, Serviços, Portfólio e Contato. Animações suaves, identidade visual forte, blog integrado e painel de edição simples para atualizar conteúdo sem precisar de programador.
   Inclui: Multi-páginas, Blog/Notícias, Painel de edição, Google Analytics, Animações premium.

3. E-commerce — R$ 1.999,00
   Loja online com catálogo de produtos, carrinho de compras, checkout integrado (Pix, cartão, boleto), painel de controle para gerenciar pedidos e estoque. Automatize suas vendas sem depender de marketplace.
   Inclui: Catálogo de produtos, Pix/Cartão/Boleto, Gestão de estoque, Cupons de desconto, App mobile.

4. IA + Automação — A partir de R$ 999,00
   Site completo com chatbot de IA personalizado para atender clientes, tirar dúvidas, capturar leads e fechar vendas automaticamente — 24h por dia, 7 dias por semana, sem precisar de atendente.
   Inclui: Chatbot com IA, Atendimento 24/7, Captura automática de leads, Integração CRM, Automação WhatsApp.

5. Sistema Web + Gestão — R$ 1.499,00
   Sistema completo para gerenciamento de ordens de serviço, clientes, status de atendimento e controle operacional. Ideal para oficinas, assistência técnica e prestadores de serviço.
   Inclui: Cadastro de Clientes, Controle de OS, Status de Atendimento, Gestão Operacional, Sistema Responsivo.

Regras:
    - Responda SEMPRE em português do Brasil
    - Seja curto e direto (máximo 3 frases por resposta)
    - Use emojis com moderação
    - Quando o cliente demonstrar interesse real em um plano, peça os dados de contato gentilmente e informe o WhatsApp: (21) 97593-0204
    - Nunca mencione que é uma IA a menos que diretamente perguntado
    - Quando o usuário pedir para ver os planos, responda apenas com: SHOW_PLANS (somente isso, sem mais nada)`;

export default async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método não permitido"
        });
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
            error: "Campo 'messages' inválido ou ausente"
        });
    }

    try {

        const groqRes = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",

                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },

            body: JSON.stringify({
                model: GROQ_MODEL,

                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT
                    },

                    ...messages,
                ],

                max_tokens: 1024,
                temperature: 0.7,
            }),
        });

        if (!groqRes.ok) {

            const err = await groqRes.json().catch(() => ({}));

            return res.status(groqRes.status).json({
                error: err?.error?.message || "Erro na Groq API"
            });
        }

        const data = await groqRes.json();

        const reply =
            data?.choices?.[0]?.message?.content?.trim() ||
            "Sem resposta da IA.";

        return res.status(200).json({
            reply
        });

    } catch (err) {

        console.error("Erro interno:", err);

        return res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
}