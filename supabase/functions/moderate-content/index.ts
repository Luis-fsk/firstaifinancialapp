import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Moderating content...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Lovable AI to analyze content
    const aiPrompt = `Você é um moderador de conteúdo para um aplicativo de finanças e investimentos chamado "Growing S&K". 

Analise o seguinte conteúdo e determine se ele é adequado para publicação:

"${content}"

CRITÉRIOS DE APROVAÇÃO:
- Conteúdo relacionado a finanças, investimentos, economia, mercado financeiro, educação financeira
- Discussões sobre ações, FIIs, renda fixa, criptomoedas, planejamento financeiro
- Perguntas e dúvidas sobre investimentos
- Experiências pessoais com investimentos (dentro dos limites éticos)
- Notícias e análises do mercado financeiro

CRITÉRIOS DE REJEIÇÃO:
- Spam ou propaganda não relacionada a finanças
- Conteúdo ofensivo, discriminatório ou de ódio
- Golpes, esquemas de pirâmide ou promessas irreais
- Conteúdo sexual ou violento
- Informações falsas maliciosas sobre mercado
- Conteúdo completamente fora do tema de finanças

Responda APENAS com um JSON válido no seguinte formato:
{
  "approved": true ou false,
  "reason": "breve explicação do motivo da aprovação ou rejeição"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um moderador de conteúdo especializado em finanças. Sempre responda em português brasileiro com um JSON válido.' 
          },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Entre em contato com o suporte.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response:', aiContent);

    // Parse the AI response
    let moderationResult;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, aiContent];
      const jsonString = jsonMatch[1] || aiContent;
      moderationResult = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Default to approval in case of parsing error to avoid blocking legitimate content
      moderationResult = {
        approved: true,
        reason: 'Análise automática indisponível - conteúdo aprovado por padrão'
      };
    }

    return new Response(
      JSON.stringify(moderationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in moderate-content function:', error);
    return new Response(
      JSON.stringify({ 
        approved: true, 
        reason: 'Erro no sistema de moderação - conteúdo aprovado por padrão',
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
