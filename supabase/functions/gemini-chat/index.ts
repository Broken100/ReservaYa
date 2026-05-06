import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  GoogleGenAI,
} from "https://esm.sh/@google/genai@1.29.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter: max 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  businessSlug?: string;
  mode?: "general" | "booking_assistant";
}

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `Eres el asistente virtual de ReservaYa, una plataforma ecuatoriana de reservas para negocios locales.
Ayudas a clientes a descubrir negocios, entender cómo funciona la plataforma, y resolver dudas.
Responde en español, de forma amable y concisa. Máximo 3-4 oraciones por respuesta.
Si no sabes algo, sugiere contactar al negocio directamente.`,

  booking_assistant: `Eres un asistente especializado en ayudar a clientes a hacer reservas en ReservaYa.
Tu trabajo es extraer la información necesaria para una reserva a partir del lenguaje natural del cliente:
- Tipo de servicio deseado
- Profesional preferido (si menciona)
- Fecha y hora preferidas
- Cualquier requisito especial

Responde en formato JSON con los siguientes campos:
{
  "intent": "book_service" | "ask_question" | "unknown",
  "service_type": string | null,
  "preferred_professional": string | null,
  "date_suggestion": string | null,
  "time_suggestion": string | null,
  "notes": string | null,
  "response_to_user": string
}

El campo "response_to_user" debe ser una respuesta amable en español confirmando lo que entendiste o pidiendo más detalles.`,
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages, mode = "general" } = (await req.json()) as ChatRequest;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general;

    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      ],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Gemini error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
