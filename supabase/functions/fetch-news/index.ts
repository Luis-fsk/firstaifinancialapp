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
    
    // Mock news data for demonstration - in production you would fetch from real APIs
    const mockNews: NewsItem[] = [
      {
        title: "Mercado de criptomoedas registra alta de 15% esta semana",
        summary: "Bitcoin e principais altcoins lideram movimento de recuperação após correção do mês passado.",
        category: "Criptomoedas",
        source: "Yahoo Finance",
        source_url: "https://finance.yahoo.com/crypto",
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Banco Central mantém taxa Selic em 11,75%",
        summary: "Decisão era esperada pelo mercado e reflete cenário de inflação controlada.",
        category: "Economia",
        source: "Bloomberg",
        source_url: "https://bloomberg.com/news/brazil-economy",
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Ações da Vale sobem 8% após anúncio de dividendos",
        summary: "Mineradora anuncia distribuição extraordinária de dividendos para acionistas.",
        category: "Bolsa",
        source: "Investopedia",
        source_url: "https://investopedia.com/vale-dividends",
        published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Dólar recua para R$ 5,20 em meio a fluxo estrangeiro",
        summary: "Moeda americana perde força com entrada de capital internacional no país.",
        category: "Câmbio",
        source: "Yahoo Finance",
        source_url: "https://finance.yahoo.com/quote/USDBRL=X",
        published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Fundos imobiliários atraem R$ 2,5 bi em janeiro",
        summary: "Setor de FIIs continua aquecido com alta demanda por renda passiva.",
        category: "Investimentos",
        source: "Bloomberg",
        source_url: "https://bloomberg.com/news/reit-funds-brazil",
        published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Tesouro Direto: IPCA+ 2029 rende 6,2% ao ano",
        summary: "Títulos públicos oferecem boa oportunidade para proteção contra inflação.",
        category: "Renda Fixa",
        source: "Investopedia",
        source_url: "https://investopedia.com/brazil-treasury-bonds",
        published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
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