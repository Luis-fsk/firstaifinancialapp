import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Símbolo da ação é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Analyzing stock:', symbol);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    if (!FINNHUB_API_KEY) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    console.log('Fetching stock data from Finnhub...');
    
    // Get current quote
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    
    if (!quoteResponse.ok) {
      throw new Error(`Finnhub API error: ${quoteResponse.status}`);
    }
    
    const quoteData = await quoteResponse.json();
    console.log('Finnhub Quote:', JSON.stringify(quoteData));
    
    if (!quoteData.c || quoteData.c === 0) {
      console.error('Invalid stock symbol or no data:', symbol);
      return new Response(
        JSON.stringify({ error: 'Símbolo de ação inválido ou não encontrado. Use símbolos US como AAPL, TSLA, NVDA, etc.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const currentPrice = quoteData.c;
    
    // Get historical candles (last 30 days)
    const to = Math.floor(Date.now() / 1000);
    const from = to - (30 * 24 * 60 * 60); // 30 days ago
    
    const candlesUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
    const candlesResponse = await fetch(candlesUrl);
    
    if (!candlesResponse.ok) {
      throw new Error(`Finnhub candles API error: ${candlesResponse.status}`);
    }
    
    const candlesData = await candlesResponse.json();
    console.log('Finnhub Candles status:', candlesData.s);
    
    if (candlesData.s !== 'ok') {
      console.error('No candles data available');
      return new Response(
        JSON.stringify({ error: 'Dados históricos não disponíveis para este símbolo.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Format chart data
    const chartData = candlesData.t.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      price: parseFloat(candlesData.c[index].toFixed(2))
    }));

    // Call Lovable AI for analysis
    const aiPrompt = `Você é um analista financeiro experiente. Analise a ação "${symbol}" e forneça:

1. Nome completo da empresa
2. Um resumo da atuação e performance da empresa (2-3 parágrafos)
3. Análise do gráfico de preços considerando os dados: preço atual R$ ${currentPrice.toFixed(2)}
4. Projeções para o futuro (curto, médio e longo prazo)
5. Recomendação de investimento:
   - Ação: investir, evitar ou cautela
   - Prazo recomendado: curto (até 6 meses), médio (6-18 meses) ou longo (mais de 18 meses)
   - Justificativa detalhada do prazo

Formato de resposta (JSON):
{
  "company_name": "Nome da Empresa",
  "performance_summary": "Resumo detalhado...",
  "chart_analysis": "Análise técnica do gráfico...",
  "future_projection": "Projeções futuras...",
  "recommendation": {
    "action": "investir|evitar|cautela",
    "timeframe": "curto|médio|longo",
    "reasoning": "Justificativa detalhada do prazo..."
  }
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
            content: 'Você é um analista financeiro especializado. Sempre responda em português brasileiro com análises profissionais e bem fundamentadas. Retorne sempre um JSON válido.' 
          },
          { role: 'user', content: aiPrompt }
        ],
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
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos à sua conta Lovable.' }),
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

    // Try to parse JSON from the response
    let analysisData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, aiContent];
      const jsonString = jsonMatch[1] || aiContent;
      analysisData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: create structured response from text
      analysisData = {
        company_name: symbol,
        performance_summary: aiContent.substring(0, 500),
        chart_analysis: 'Análise técnica não disponível no formato esperado.',
        future_projection: 'Projeções não disponíveis no formato esperado.',
        recommendation: {
          action: 'cautela',
          timeframe: 'médio',
          reasoning: 'Recomendação gerada com cautela devido a formato de resposta inesperado.'
        }
      };
    }

    const response = {
      company_name: analysisData.company_name || symbol,
      current_price: currentPrice,
      performance_summary: analysisData.performance_summary || '',
      chart_data: chartData,
      chart_analysis: analysisData.chart_analysis || '',
      future_projection: analysisData.future_projection || '',
      recommendation: {
        action: analysisData.recommendation?.action || 'cautela',
        timeframe: analysisData.recommendation?.timeframe || 'médio',
        reasoning: analysisData.recommendation?.reasoning || ''
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-stock function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao analisar ação' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});