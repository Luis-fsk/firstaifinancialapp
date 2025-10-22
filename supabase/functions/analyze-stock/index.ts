import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  symbol: z.string()
    .trim()
    .min(1, 'Símbolo da ação é obrigatório')
    .max(20, 'Símbolo muito longo')
    .regex(/^[A-Z0-9.]+$/i, 'Símbolo inválido (use apenas letras, números e ponto)')
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
    const { symbol } = requestSchema.parse(body);

    console.log('Analyzing stock:', symbol);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço temporariamente indisponível' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
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
    
    // Use OpenAI Agent to analyze stock
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
            content: `Você é um agente analista financeiro especializado.

Sua função é analisar ações e fornecer insights detalhados sobre:
1. Identificação da empresa
2. Performance e atuação no mercado
3. Análise técnica do gráfico de preços
4. Projeções futuras
5. Recomendações de investimento

Sempre forneça análises profissionais, bem fundamentadas e em português brasileiro.
Use a ferramenta analyze_stock para retornar seus resultados.` 
          },
          { 
            role: 'user', 
            content: `Analise a ação "${symbol}":
            
Dados atuais:
- Preço: ${currency} ${currentPrice.toFixed(2)}
- Variação: ${priceChange}%
- Preço anterior: ${currency} ${previousClose.toFixed(2)}
- Tendência dos últimos 30 dias disponível

Forneça uma análise completa com recomendação de investimento.` 
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_stock',
              description: 'Retorna análise completa de uma ação',
              parameters: {
                type: 'object',
                properties: {
                  company_name: {
                    type: 'string',
                    description: 'Nome completo da empresa'
                  },
                  performance_summary: {
                    type: 'string',
                    description: 'Resumo detalhado da atuação e performance (2-3 parágrafos)'
                  },
                  chart_analysis: {
                    type: 'string',
                    description: 'Análise técnica do gráfico considerando preço atual, variação e tendência'
                  },
                  future_projection: {
                    type: 'string',
                    description: 'Projeções para curto, médio e longo prazo'
                  },
                  recommendation: {
                    type: 'object',
                    properties: {
                      action: {
                        type: 'string',
                        enum: ['investir', 'evitar', 'cautela'],
                        description: 'Recomendação de ação'
                      },
                      timeframe: {
                        type: 'string',
                        enum: ['curto', 'médio', 'longo'],
                        description: 'Prazo recomendado: curto (até 6 meses), médio (6-18 meses), longo (mais de 18 meses)'
                      },
                      reasoning: {
                        type: 'string',
                        description: 'Justificativa detalhada do prazo recomendado'
                      }
                    },
                    required: ['action', 'timeframe', 'reasoning']
                  }
                },
                required: ['company_name', 'performance_summary', 'chart_analysis', 'future_projection', 'recommendation']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_stock' } },
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

    if (!toolCall || toolCall.function.name !== 'analyze_stock') {
      console.error('No tool call in AI response');
      return new Response(
        JSON.stringify({ error: 'Erro ao processar análise. Tente novamente.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('AI Tool Call received');

    // Parse the tool call arguments
    let analysisData;
    try {
      analysisData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse tool call arguments:', parseError);
      analysisData = {
        company_name: symbol,
        performance_summary: 'Erro ao processar análise detalhada.',
        chart_analysis: 'Análise técnica indisponível.',
        future_projection: 'Projeções indisponíveis.',
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
      JSON.stringify({ error: 'Erro ao analisar ação. Tente novamente.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
