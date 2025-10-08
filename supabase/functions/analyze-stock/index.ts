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
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Símbolo da ação é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Analyzing stock:', symbol);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Buscar dados da ação usando Yahoo Finance API (gratuita)
    // Para ações brasileiras: PETR4.SA, VALE3.SA, etc.
    // Para ações americanas: AAPL, TSLA, etc.
    console.log('Fetching stock data from Yahoo Finance...');
    
    const yahooApiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
    
    const stockResponse = await fetch(yahooApiUrl);
    
    if (!stockResponse.ok) {
      console.error('Yahoo Finance API error:', stockResponse.status);
      return new Response(
        JSON.stringify({ 
          error: 'Ação não encontrada. Para ações brasileiras use .SA (ex: PETR4.SA). Para americanas use o símbolo direto (ex: AAPL).' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const stockData = await stockResponse.json();
    console.log('Yahoo Finance response status:', stockData.chart?.result?.[0] ? 'OK' : 'No data');
    
    if (!stockData.chart?.result?.[0]) {
      return new Response(
        JSON.stringify({ error: 'Dados da ação não disponíveis. Verifique o símbolo.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const result = stockData.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    if (!timestamps || timestamps.length === 0 || !quotes.close) {
      return new Response(
        JSON.stringify({ error: 'Dados insuficientes para análise.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const currency = meta.currency === 'BRL' ? 'R$' : '$';
    
    // Criar dados do gráfico dos últimos 30 dias
    const validDataPoints = timestamps.map((timestamp: number, index: number) => ({
      timestamp,
      price: quotes.close[index]
    })).filter((point: any) => point.price != null);

    const chartData = validDataPoints.slice(-30).map((point: any) => ({
      date: new Date(point.timestamp * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      price: parseFloat(point.price.toFixed(2))
    }));

    // Calcular variação
    const priceChange = ((currentPrice - previousClose) / previousClose * 100).toFixed(2);
    
    // Preparar contexto para a IA
    const aiPrompt = `Você é um analista financeiro experiente. Analise a ação "${symbol}" e forneça:

1. Nome completo da empresa
2. Um resumo da atuação e performance da empresa (2-3 parágrafos)
3. Análise do gráfico de preços considerando:
   - Preço atual: ${currency} ${currentPrice.toFixed(2)}
   - Variação: ${priceChange}%
   - Tendência dos últimos 30 dias
4. Projeções para o futuro (curto, médio e longo prazo)
5. Recomendação de investimento:
   - Ação: investir, evitar ou cautela
   - Prazo recomendado: curto (até 6 meses), médio (6-18 meses) ou longo (mais de 18 meses)
   - Justificativa detalhada do prazo

IMPORTANTE: Retorne APENAS um JSON válido no formato:
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
            content: 'Você é um analista financeiro especializado. Sempre responda em português brasileiro com análises profissionais e bem fundamentadas. Retorne sempre um JSON válido sem markdown.' 
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

    console.log('AI Response received');

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
        chart_analysis: 'Análise técnica disponível acima.',
        future_projection: 'Consulte a análise completa acima.',
        recommendation: {
          action: 'cautela',
          timeframe: 'médio',
          reasoning: 'Recomendação gerada com cautela. Consulte um profissional.'
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
