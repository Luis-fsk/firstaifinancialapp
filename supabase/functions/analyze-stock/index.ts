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
    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }

    // Fetch real stock data from Alpha Vantage
    console.log('Fetching stock data from Alpha Vantage...');
    
    // Get daily time series data
    const alphaVantageUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const stockResponse = await fetch(alphaVantageUrl);
    
    if (!stockResponse.ok) {
      throw new Error(`Alpha Vantage API error: ${stockResponse.status}`);
    }
    
    const stockData = await stockResponse.json();
    
    console.log('Alpha Vantage Response:', JSON.stringify(stockData).substring(0, 500));
    
    // Check for API errors
    if (stockData['Error Message']) {
      console.error('Invalid stock symbol:', symbol);
      return new Response(
        JSON.stringify({ error: 'Símbolo de ação inválido ou não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (stockData['Note']) {
      console.error('Rate limit hit:', stockData['Note']);
      return new Response(
        JSON.stringify({ error: 'Limite de requisições da API excedido. Tente novamente em 1 minuto.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }
    
    if (stockData['Information']) {
      console.error('API Information message:', stockData['Information']);
      return new Response(
        JSON.stringify({ error: 'Limite de requisições da API excedido. A API gratuita permite apenas 25 requisições por dia.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }
    
    const timeSeries = stockData['Time Series (Daily)'];
    if (!timeSeries) {
      console.error('No time series data available. Full response:', JSON.stringify(stockData));
      return new Response(
        JSON.stringify({ error: 'Dados de ação não disponíveis. Verifique se o símbolo está correto ou tente novamente mais tarde.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get the last 30 days of data
    const dates = Object.keys(timeSeries).sort().reverse().slice(0, 30).reverse();
    const chartData = dates.map(date => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      price: parseFloat(parseFloat(timeSeries[date]['4. close']).toFixed(2))
    }));
    
    const currentPrice = chartData[chartData.length - 1].price;

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