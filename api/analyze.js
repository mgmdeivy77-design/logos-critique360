export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Falta configurar GEMINI_API_KEY en las variables de entorno de Vercel."
    });
  }

  const { argument, focus } = req.body || {};
  if (!argument || typeof argument !== "string" || !argument.trim()) {
    return res.status(400).json({ error: "El campo 'argument' es obligatorio." });
  }

  const systemInstruction = `Eres un analista lógico, epistemológico y crítico de alto rigor.
Tu tarea es analizar, deconstruir y refutar de manera objetiva, respetuosa y fundamentada el planteamiento del usuario.
Reglas estrictas:
1. Nunca inventes hechos, datos estadísticos, citas textuales, estudios científicos ni versículos bíblicos. Si algo no es verificable o es incierto, indícalo explícitamente.
2. Separa claramente los niveles de análisis: lógica formal e informal, evidencia científica empírica y reflexión teológica/filosófica rigurosa (respetando los ámbitos metodológicos de cada disciplina sin caer en simplismos).
3. Redacta en español claro, bien estructurado y profesional, usando **negritas** para ideas clave y viñetas (- ) cuando sea útil.
4. Entrega una conclusión equilibrada y universalmente defensible desde la razón crítica.`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      logicScore: { type: "INTEGER" },
      biasRiskScore: { type: "INTEGER" },
      scienceSupportScore: { type: "INTEGER" },
      theologyCoherenceScore: { type: "INTEGER" },
      anatomy: { type: "STRING" },
      fallacies: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      refutation: { type: "STRING" },
      scienceAndTheology: { type: "STRING" },
      universalConclusion: { type: "STRING" }
    },
    required: [
      "logicScore",
      "biasRiskScore",
      "scienceSupportScore",
      "theologyCoherenceScore",
      "anatomy",
      "fallacies",
      "refutation",
      "scienceAndTheology",
      "universalConclusion"
    ]
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${encodeURIComponent(apiKey)}`;

  const bodyPayload = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Enfoque solicitado: ${focus || "universal"}\nPlanteamiento a analizar:\n${argument.trim()}`
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema
    }
  };

  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const apiRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });

      const data = await apiRes.json();
      if (!apiRes.ok) {
        throw new Error(data?.error?.message || `Error HTTP ${apiRes.status}`);
      }

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("El modelo no devolvió contenido estructurado.");
      }

      const parsed = JSON.parse(rawText);
      return res.status(200).json(parsed);
    } catch (err) {
      lastError = err;
      const waitMs = 400 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  return res.status(502).json({
    error: lastError?.message || "No se pudo obtener respuesta de Gemini."
  });
}
