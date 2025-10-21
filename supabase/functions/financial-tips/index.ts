import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const goalSchema = z.object({
  category: z.enum(['fixed', 'variable', 'investment']),
  progress: z.number().nonnegative().max(999999999.99),
  target: z.number().positive().max(999999999.99),
  isCompleted: z.boolean().optional()
});

const requestSchema = z.object({
  goals: z.array(goalSchema)
    .min(1, 'Dados financeiros são obrigatórios')
    .max(50, 'Muitos objetivos (máximo 50)')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user ID from JWT token
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

    // Check premium status using database function
    const { data: isPremium, error: premiumError } = await supabase
      .rpc('is_premium_user', { _user_id: user.id });

    if (premiumError || !isPremium) {
      return new Response(
        JSON.stringify({ error: 'Assinatura premium necessária para usar este recurso' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { goals } = requestSchema.parse(body);

    console.log('Generating financial tips for goals:', goals);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Preparar contexto financeiro
    const fixedGoal = goals.find((g: any) => g.category === 'fixed');
    const variableGoal = goals.find((g: any) => g.category === 'variable');
    const investmentGoal = goals.find((g: any) => g.category === 'investment');

    const fixedStatus = fixedGoal 
      ? `Gastos fixos: R$ ${fixedGoal.progress.toFixed(2)} de R$ ${fixedGoal.target.toFixed(2)} (meta: ${(fixedGoal.progress / fixedGoal.target * 100).toFixed(1)}%)`
      : 'Sem dados de gastos fixos';
    
    const variableStatus = variableGoal
      ? `Gastos variáveis: R$ ${variableGoal.progress.toFixed(2)} de R$ ${variableGoal.target.toFixed(2)} (meta: ${(variableGoal.progress / variableGoal.target * 100).toFixed(1)}%)`
      : 'Sem dados de gastos variáveis';
    
    const investmentStatus = investmentGoal
      ? `Investimentos: R$ ${investmentGoal.progress.toFixed(2)} de R$ ${investmentGoal.target.toFixed(2)} (meta: ${(investmentGoal.progress / investmentGoal.target * 100).toFixed(1)}%)`
      : 'Sem dados de investimentos';

    const totalSpent = (fixedGoal?.progress || 0) + (variableGoal?.progress || 0);
    const totalInvested = investmentGoal?.progress || 0;

    const aiPrompt = `Você é um consultor financeiro experiente. Analise a situação financeira abaixo e forneça 4-5 dicas personalizadas e práticas para melhorar a performance financeira do usuário.

Situação atual:
- ${fixedStatus}
- ${variableStatus}
- ${investmentStatus}
- Total gasto: R$ ${totalSpent.toFixed(2)}
- Total investido: R$ ${totalInvested.toFixed(2)}

Meta concluída em gastos fixos: ${fixedGoal?.isCompleted ? 'Sim' : 'Não'}
Meta concluída em gastos variáveis: ${variableGoal?.isCompleted ? 'Sim' : 'Não'}
Meta concluída em investimentos: ${investmentGoal?.isCompleted ? 'Sim' : 'Não'}

Forneça dicas específicas, práticas e acionáveis considerando:
1. Áreas onde o usuário está gastando acima do planejado
2. Oportunidades de economia
3. Sugestões de investimento baseadas no perfil atual
4. Estratégias para otimizar o orçamento

Responda APENAS com um array JSON de strings, cada uma contendo uma dica. Exemplo:
["Reduza gastos fixos renegociando contratos", "Aumente investimentos em 10%", "...]

Importante: Retorne APENAS o JSON, sem markdown ou explicações adicionais.`;

    console.log('Calling OpenAI API...');
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
            content: 'Você é um consultor financeiro experiente. Sempre responda em português brasileiro com dicas práticas e específicas. Retorne sempre um JSON válido sem markdown.' 
          },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      throw new Error(`OpenAI API request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received:', aiData);

    let tips: string[];
    const content = aiData.choices[0].message.content;
    
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      tips = JSON.parse(cleanContent);
      
      if (!Array.isArray(tips)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw content:', content);
      
      // Fallback: dicas padrão
      tips = [
        '💡 Revise seus gastos fixos mensalmente e busque renegociar contratos',
        '📊 Mantenha uma reserva de emergência de 6 meses de gastos',
        '📈 Diversifique seus investimentos entre renda fixa e variável',
        '💰 Invista pelo menos 10% da sua renda mensal'
      ];
    }

    console.log('Financial tips generated:', tips);

    return new Response(
      JSON.stringify({ tips }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in financial-tips function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        tips: [
          '💡 Revise seus gastos fixos mensalmente e busque renegociar contratos',
          '📊 Mantenha uma reserva de emergência de 6 meses de gastos',
          '📈 Diversifique seus investimentos entre renda fixa e variável',
          '💰 Invista pelo menos 10% da sua renda mensal'
        ]
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
