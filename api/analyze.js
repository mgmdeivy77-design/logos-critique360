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

  let bodyData = req.body;
  if (typeof bodyData === "string") {
    try {
      bodyData = JSON.parse(bodyData);
    } catch (_) {
      bodyData = {};
    }
  }

  const { argument, focus } = bodyData || {};
  if (!argument || typeof argument !== "string" || !argument.trim()) {
    return res.status(400).json({ error: "El campo 'argument' es obligatorio." });
  }

  const focusGuidance = {
    universal: "Mantén un equilibrio riguroso entre análisis lógico, supuestos implícitos, evidencia científica, reflexión teológica/filosófica y conclusión universal.",
    logic: "Profundiza especialmente en la validez formal e informal, estructura de premisas, falacias y sesgos cognitivos, sin descuidar el contraste empírico y teológico.",
    "science-theology": "Profundiza especialmente en la distinción metodológica entre ciencia empírica y teología/filosofía, evitando reduccionismos o falsos conflictos, con rigor lógico."
  };

  const selectedGuidance = focusGuidance[focus] || focusGuidance.universal;

  const systemInstruction = `Eres un analista lógico, epistemológico y crítico de alto rigor, objetivo y respetuoso.
Tu tarea es analizar, deconstruir y refutar de manera objetiva y fundamentada el planteamiento del usuario.

Reglas obligatorias de veracidad y rigor:
1. PROHIBIDO INVENTAR: Nunca inventes estudios científicos, porcentajes, citas textuales, autores, fechas, hechos históricos ni pasajes bíblicos. Si un dato o referencia no es seguro o no aplica, no lo fabriques; señala explícitamente qué es verificable, qué es debatible y qué es incierto.
2. OBJETIVIDAD Y RESPETO: Evalúa el argumento por su estructura y evidencia, nunca con ataques personales ni burlas. Trata tanto la ciencia empírica como la teología académica con seriedad y precisión conceptual, respetando los límites de cada disciplina.
3. FORMATO LEGIBLE EN ESPAÑOL: Usa **negritas** para conceptos clave, viñetas (- ) o listas numeradas (1. ) para enumeraciones, y párrafos claros y breves.
4. ÉNFASIS DEL ENFOQUE: ${selectedGuidance}
5. PUNTUACIONES (0-100): Calibra logicScore, biasRiskScore, scienceSupportScore y theologyCoherenceScore de forma realista y coherente con el texto analizado.`;

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
            text: `Enfoque: ${focus || "universal"}\nPlanteamiento a analizar:\n${argument.trim()}`
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
