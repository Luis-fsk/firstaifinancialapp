import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  category: z.enum(['CDB', 'Renda Fixa', 'Crypto', 'Fundos', 'Outros']),
  amount: z.number().positive('Valor deve ser positivo').max(1000000000, 'Valor muito alto'),
  name: z.string().max(200, 'Nome muito longo').optional(),
  details: z.string().min(10, 'Forneça mais informações para análise').max(2000, 'Informações muito longas')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${authHeader}` } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (5 requests per minute for investment analysis)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseAdmin
      .rpc('check_rate_limit', { 
        _user_id: user.id, 
        _endpoint: 'analyze-investment',
        _max_requests: 5,
        _window_minutes: 1
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar limite de requisições' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rateLimitCheck.allowed) {
      const resetAt = new Date(rateLimitCheck.reset_at);
      return new Response(
        JSON.stringify({ 
          error: 'Limite de requisições excedido. Tente novamente em alguns instantes.',
          rate_limit: {
            remaining: 0,
            reset_at: resetAt.toISOString()
          }
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt.toISOString()
          } 
        }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan_type, trial_start')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isPremium = profile.plan_type === 'premium';
    const trialStart = profile.trial_start ? new Date(profile.trial_start) : new Date();
    const now = new Date();
    const daysElapsed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
    const isTrialExpired = daysElapsed >= 30;

    if (!isPremium && isTrialExpired) {
      return new Response(
        JSON.stringify({ 
          error: 'Seu período de teste gratuito expirou. Assine o plano Premium para continuar usando este recurso.',
          trial_expired: true
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { category, amount, name, details } = requestSchema.parse(body);

    console.log('Analyzing investment:', category);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço temporariamente indisponível' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    const investmentName = name ? `"${name}"` : 'o investimento mencionado';

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
            content: `Você é um agente analista financeiro especializado em análise de investimentos.

Sua função é avaliar oportunidades de investimento considerando:
1. Qualidade do investimento
2. Volatilidade esperada
3. Nível de risco
4. Oportunidade de retorno
5. Previsões de desempenho

Sempre forneça análises profissionais, equilibradas e em português brasileiro.
Use a ferramenta analyze_investment para retornar seus resultados.` 
          },
          { 
            role: 'user', 
            content: `Analise esta oportunidade de investimento:

Categoria: ${category}
Valor a investir: R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
${name ? `Nome: ${name}` : ''}

Detalhes fornecidos pelo investidor:
${details}

Forneça uma análise completa e profissional sobre este investimento.` 
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_investment',
              description: 'Retorna análise completa de uma oportunidade de investimento',
              parameters: {
                type: 'object',
                properties: {
                  investment_title: {
                    type: 'string',
                    description: 'Título descritivo para o investimento'
                  },
                  quality_analysis: {
                    type: 'string',
                    description: 'Análise detalhada da qualidade do investimento (2-3 parágrafos)'
                  },
                  quality_score: {
                    type: 'number',
                    description: 'Nota de qualidade de 0 a 10'
                  },
                  volatility_analysis: {
                    type: 'string',
                    description: 'Análise da volatilidade esperada'
                  },
                  volatility_level: {
                    type: 'string',
                    enum: ['baixa', 'média', 'alta'],
                    description: 'Nível de volatilidade'
                  },
                  risk_analysis: {
                    type: 'string',
                    description: 'Análise detalhada dos riscos envolvidos'
                  },
                  risk_level: {
                    type: 'string',
                    enum: ['baixo', 'médio', 'alto'],
                    description: 'Nível de risco'
                  },
                  opportunity_analysis: {
                    type: 'string',
                    description: 'Análise das oportunidades de retorno'
                  },
                  opportunity_score: {
                    type: 'number',
                    description: 'Nota de oportunidade de 0 a 10'
                  },
                  future_prediction: {
                    type: 'string',
                    description: 'Previsões para curto, médio e longo prazo'
                  },
                  recommendation: {
                    type: 'object',
                    properties: {
                      action: {
                        type: 'string',
                        enum: ['investir', 'evitar', 'cautela'],
                        description: 'Recomendação de ação'
                      },
                      reasoning: {
                        type: 'string',
                        description: 'Justificativa detalhada da recomendação'
                      }
                    },
                    required: ['action', 'reasoning']
                  }
                },
                required: ['investment_title', 'quality_analysis', 'quality_score', 'volatility_analysis', 'volatility_level', 'risk_analysis', 'risk_level', 'opportunity_analysis', 'opportunity_score', 'future_prediction', 'recommendation']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_investment' } },
        temperature: 0.7,
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
          JSON.stringify({ error: 'Créditos insuficientes da API OpenAI.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      console.error('AI API error:', aiResponse.status);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar análise. Tente novamente.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== 'analyze_investment') {
      console.error('No tool call in AI response');
      return new Response(
        JSON.stringify({ error: 'Erro ao processar análise. Tente novamente.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('AI Tool Call received');

    let analysisData;
    try {
      analysisData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse tool call arguments:', parseError);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar análise. Tente novamente.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const response = {
      category,
      amount,
      name: name || null,
      ...analysisData
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-investment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao analisar investimento. Tente novamente.';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
