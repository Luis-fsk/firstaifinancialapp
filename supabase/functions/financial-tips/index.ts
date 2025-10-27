import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Check rate limit (3 requests per minute for financial tips)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseAdmin
      .rpc('check_rate_limit', { 
        _user_id: user.id, 
        _endpoint: 'financial-tips',
        _max_requests: 3,
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

    // Check premium status and trial
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

    if (!isPremium && !isTrialExpired) {
      // Still in trial, allow access
    } else if (!isPremium) {
      return new Response(
        JSON.stringify({ error: 'Assinatura premium necessária para usar este recurso' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar metas financeiras do usuário
    const { data: userGoals, error: goalsError } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar metas financeiras' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userGoals || userGoals.length === 0) {
      return new Response(
        JSON.stringify({ 
          tips: [
            '💡 Crie suas primeiras metas financeiras para receber dicas personalizadas',
            '📊 Defina objetivos claros de economia e investimento',
            '💰 Comece acompanhando seus gastos mensais',
            '📈 Estabeleça um plano de reserva de emergência'
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating financial tips - goals count:', userGoals?.length || 0);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Preparar contexto detalhado das metas
    const goalsContext = userGoals.map(goal => {
      const progress = parseFloat(goal.current_amount.toString());
      const target = parseFloat(goal.target_amount.toString());
      const percentage = ((progress / target) * 100).toFixed(1);
      const remaining = target - progress;
      
      return `
Meta: ${goal.title}
Categoria: ${goal.category}
Descrição: ${goal.description || 'Sem descrição'}
Progresso: R$ ${progress.toFixed(2)} de R$ ${target.toFixed(2)} (${percentage}%)
Faltam: R$ ${remaining.toFixed(2)}
Prazo: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : 'Sem prazo definido'}
Status: ${progress >= target ? 'Concluída ✓' : 'Em andamento'}`;
    }).join('\n\n---\n');

    const totalTarget = userGoals.reduce((sum, g) => sum + parseFloat(g.target_amount.toString()), 0);
    const totalProgress = userGoals.reduce((sum, g) => sum + parseFloat(g.current_amount.toString()), 0);
    const overallPercentage = ((totalProgress / totalTarget) * 100).toFixed(1);

    const aiPrompt = `Analise as metas financeiras do usuário abaixo e forneça 4-5 dicas personalizadas e práticas.

METAS FINANCEIRAS DO USUÁRIO:
${goalsContext}

RESUMO GERAL:
- Total de metas: ${userGoals.length}
- Progresso geral: R$ ${totalProgress.toFixed(2)} de R$ ${totalTarget.toFixed(2)} (${overallPercentage}%)
- Faltam: R$ ${(totalTarget - totalProgress).toFixed(2)}

Forneça dicas ESPECÍFICAS e ACIONÁVEIS considerando:
1. O progresso atual de cada meta
2. Estratégias para acelerar o alcance das metas
3. Como priorizar entre as diferentes metas
4. Sugestões de economia ou investimento para atingir os objetivos
5. Ajustes recomendados nos prazos ou valores

Responda em formato JSON com a seguinte estrutura:
{
  "tips": ["dica 1", "dica 2", "dica 3", "dica 4", "dica 5"]
}

Exemplo de dicas:
- "Para sua meta de ${userGoals[0]?.title}: aumente aportes em 15%"
- "Priorize a meta X que está mais próxima de ser concluída"

Importante: Retorne APENAS JSON válido, sem markdown.`;

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
        response_format: { type: 'json_object' },
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
    console.log('AI response received successfully');

    let tips: string[];
    const content = aiData.choices[0].message.content;
    
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanContent);
      
      // Check if response has tips property
      if (parsed.tips && Array.isArray(parsed.tips)) {
        tips = parsed.tips;
      } else if (Array.isArray(parsed)) {
        tips = parsed;
      } else {
        throw new Error('Response format invalid');
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
