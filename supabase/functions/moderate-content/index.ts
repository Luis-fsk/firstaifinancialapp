import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side content validation
const MAX_CONTENT_LENGTH = 5000;

function validateContent(content: string): { valid: boolean; reason?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, reason: 'Conteúdo vazio' };
  }
  
  if (content.length > MAX_CONTENT_LENGTH) {
    return { valid: false, reason: `Conteúdo muito longo (máximo ${MAX_CONTENT_LENGTH} caracteres)` };
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if user has moderator or admin role
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${authHeader}` } }
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        const { data: isModerator } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'moderator' });
        
        if (!isAdmin && !isModerator) {
          console.log('User is not admin/moderator - proceeding with AI moderation');
        } else {
          console.log('Admin/moderator bypassing content moderation');
        }
      }
    }

    const { content } = await req.json();
    
    console.log('Moderating content with length:', content?.length || 0);
    
    // Validate content first
    const contentValidation = validateContent(content);
    if (!contentValidation.valid) {
      return new Response(
        JSON.stringify({ 
          approved: false, 
          reason: contentValidation.reason 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          approved: true, 
          reason: 'Moderação temporariamente indisponível - conteúdo aprovado por padrão' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Use OpenAI Agent to analyze content
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `Você é um agente moderador de conteúdo especializado para "Growing S&K", um aplicativo de finanças e investimentos.

Sua função é analisar conteúdo e determinar se é adequado para publicação.

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

Sempre responda em português brasileiro usando a ferramenta moderate_content.` 
          },
          { role: 'user', content: `Analise este conteúdo:\n\n"${content}"` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'moderate_content',
              description: 'Retorna o resultado da moderação de conteúdo',
              parameters: {
                type: 'object',
                properties: {
                  approved: {
                    type: 'boolean',
                    description: 'Se o conteúdo foi aprovado ou não'
                  },
                  reason: {
                    type: 'string',
                    description: 'Breve explicação do motivo da aprovação ou rejeição'
                  }
                },
                required: ['approved', 'reason']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'moderate_content' } },
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
      console.error('AI API error:', aiResponse.status);
      return new Response(
        JSON.stringify({ 
          approved: true, 
          reason: 'Erro na moderação - conteúdo aprovado por padrão' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== 'moderate_content') {
      console.error('No tool call in AI response');
      return new Response(
        JSON.stringify({ 
          approved: true, 
          reason: 'Erro na moderação - conteúdo aprovado por padrão' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Content moderation result received from AI');

    // Parse the tool call arguments
    let moderationResult;
    try {
      moderationResult = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse tool call arguments:', parseError);
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
        reason: 'Erro no sistema de moderação - conteúdo aprovado por padrão'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
