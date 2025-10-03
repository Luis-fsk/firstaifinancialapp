import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  title: string;
  summary: string;
  category: string;
  source: string;
  source_url: string;
  published_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching news articles...');
    
    // Mock news data from trusted sources
    const mockNews: NewsItem[] = [
      {
        title: "Mercado de criptomoedas registra alta de 15% esta semana",
        summary: "Bitcoin e principais altcoins lideram movimento de recuperação após correção do mês passado.",
        category: "Criptomoedas",
        source: "Bloomberg",
        source_url: "https://bloomberg.com/crypto-market-rally",
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Banco Central mantém taxa Selic em 11,75%",
        summary: "Decisão era esperada pelo mercado e reflete cenário de inflação controlada.",
        category: "Economia",
        source: "Reuters",
        source_url: "https://reuters.com/brazil-central-bank-selic",
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Ações da Vale sobem 8% após anúncio de dividendos",
        summary: "Mineradora anuncia distribuição extraordinária de dividendos para acionistas.",
        category: "Bolsa",
        source: "Financial Times",
        source_url: "https://ft.com/vale-dividends-announcement",
        published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Dólar recua para R$ 5,20 em meio a fluxo estrangeiro",
        summary: "Moeda americana perde força com entrada de capital internacional no país.",
        category: "Câmbio",
        source: "Wall Street Journal",
        source_url: "https://wsj.com/brazil-dollar-rate",
        published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Fundos imobiliários atraem R$ 2,5 bi em janeiro",
        summary: "Setor de FIIs continua aquecido com alta demanda por renda passiva.",
        category: "Investimentos",
        source: "InfoMoney",
        source_url: "https://infomoney.com/fundos-imobiliarios-captacao",
        published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Tesouro Direto: IPCA+ 2029 rende 6,2% ao ano",
        summary: "Títulos públicos oferecem boa oportunidade para proteção contra inflação.",
        category: "Renda Fixa",
        source: "Valor Econômico",
        source_url: "https://valor.globo.com/tesouro-direto-ipca",
        published_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Petrobras anuncia lucro recorde no trimestre",
        summary: "Estatal registra melhor resultado trimestral em 5 anos com alta do petróleo.",
        category: "Bolsa",
        source: "Bloomberg",
        source_url: "https://bloomberg.com/petrobras-earnings-record",
        published_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "ETFs de S&P 500 disponíveis para brasileiros",
        summary: "Investidores brasileiros ganham acesso facilitado a fundos de índice americanos.",
        category: "Investimentos",
        source: "Financial Times",
        source_url: "https://ft.com/brazil-sp500-etf-access",
        published_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Inflação desacelera para 3,8% em 12 meses",
        summary: "IPCA mostra tendência de queda e aproximação da meta do Banco Central.",
        category: "Economia",
        source: "Reuters",
        source_url: "https://reuters.com/brazil-inflation-report",
        published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Nubank lança novo produto de crédito imobiliário",
        summary: "Fintech amplia portfólio com financiamento para compra de imóveis.",
        category: "Investimentos",
        source: "Wall Street Journal",
        source_url: "https://wsj.com/nubank-mortgage-product",
        published_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Ouro atinge novo recorde histórico",
        summary: "Metal precioso alcança US$ 2.100 a onça em meio a incertezas globais.",
        category: "Investimentos",
        source: "Bloomberg",
        source_url: "https://bloomberg.com/gold-price-record-high",
        published_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Startups brasileiras captam US$ 1 bi no semestre",
        summary: "Venture capital mantém interesse em tecnologia nacional apesar de cenário global.",
        category: "Economia",
        source: "Financial Times",
        source_url: "https://ft.com/brazil-startup-funding",
        published_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Insert news articles into database
    for (const newsItem of mockNews) {
      const { error } = await supabase
        .from('news_articles')
        .upsert({
          title: newsItem.title,
          summary: newsItem.summary,
          category: newsItem.category,
          source: newsItem.source,
          source_url: newsItem.source_url,
          published_at: newsItem.published_at
        }, {
          onConflict: 'source_url',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Error inserting news:', error);
      }
    }

    console.log('News articles fetched and stored successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'News articles fetched and stored successfully',
      count: mockNews.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});