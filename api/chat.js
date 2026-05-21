// api/chat.js — Vercel Serverless Function
// Esta função fica entre o frontend e o Groq, escondendo a chave de API.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-8b-8192";

const SYSTEM_PROMPT = `Você é o Assistente Virtual da AutoBot IA, um atendente simpático, 
objetivo e profissional. Responda sempre em português brasileiro de forma clara e concisa. 
Seja prestativo e tente resolver as dúvidas do usuário da melhor forma possível. 
Quando não souber algo específico da empresa, sugira que o usuário entre em contato com o suporte humano.`;

export default async function handler(req, res) {

    // ─── CORS ─────────────────────────────────────────────
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Responde requisição preflight do navegador
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Permite apenas POST
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método não permitido"
        });
    }

    const { messages } = req.body;

    // Validação
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
            error: "Campo 'messages' inválido ou ausente"
        });
    }

    try {

        // ─── Chamada para a API da Groq ───────────────────
        const groqRes = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",

                // A chave fica SOMENTE no backend
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

        // ─── Erro vindo da Groq ───────────────────────────
        if (!groqRes.ok) {

            const err = await groqRes.json().catch(() => ({}));

            return res.status(groqRes.status).json({
                error: err?.error?.message || "Erro na Groq API"
            });
        }

        // ─── Resposta da IA ───────────────────────────────
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