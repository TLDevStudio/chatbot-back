// api/chat.js — Vercel Serverless Function
// Esta função fica entre o frontend e o Groq, escondendo a chave de API.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-8b-8192";

const SYSTEM_PROMPT = `Você é o Assistente Virtual da AutoBot IA, um atendente simpático, 
objetivo e profissional. Responda sempre em português brasileiro de forma clara e concisa. 
Seja prestativo e tente resolver as dúvidas do usuário da melhor forma possível. 
Quando não souber algo específico da empresa, sugira que o usuário entre em contato com o suporte humano.`;

export default async function handler(req, res) {
    // Permite apenas POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    // CORS — permite qualquer origem (ajuste para o seu domínio em produção)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Campo 'messages' inválido ou ausente" });
    }

    try {
        const groqRes = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // A chave fica aqui no servidor — nunca vai pro navegador do usuário
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...messages,
                ],
                max_tokens: 1024,
                temperature: 0.7,
            }),
        });

        if (!groqRes.ok) {
            const err = await groqRes.json().catch(() => ({}));
            return res.status(groqRes.status).json({ error: err?.error?.message || "Erro na Groq API" });
        }

        const data = await groqRes.json();
        const reply = data.choices[0].message.content.trim();

        return res.status(200).json({ reply });

    } catch (err) {
        console.error("Erro interno:", err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}