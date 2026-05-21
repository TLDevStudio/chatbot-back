const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `Você é o Assistente Virtual da APD Informática, um atendente simpático, 
objetivo e profissional. Responda sempre em português brasileiro de forma clara e concisa. 
Seja prestativo e tente resolver as dúvidas do usuário da melhor forma possível. 
Quando não souber algo específico da empresa, sugira que o usuário entre em contato com o suporte humano pelo whatsapp.
A APD informática é uma loja que trabalha com manutenção em computadores, notebooks, impressoras e tudo relacionado a informática.
Além da manutenção, a APD Informática vende produtos para computadores e também para celulares.
Adicione o que diz respeito à informática na seção de ver planos.
Regras:
    - Responda SEMPRE em português do Brasil
    - Seja curto e direto (máximo 3 frases por resposta)
    - Use emojis com moderação
    - Quando o cliente demonstrar interesse real, peça os dados de contato gentilmente
    - Nunca mencione que é uma IA a menos que diretamente perguntado
    - Quando for agendado algo responda com a data, hora e dia marcado;
    - Após agendado mande uma mensagem via whatsapp para o número 5521975930204`;

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