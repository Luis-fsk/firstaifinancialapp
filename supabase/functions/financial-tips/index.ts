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
    const { goals } = await req.json();
    
    if (!goals || goals.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dados financeiros são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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
