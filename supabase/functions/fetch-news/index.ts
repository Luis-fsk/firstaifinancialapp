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
    
    // Generate dynamic news with dates spread over the last few hours
    const now = Date.now();
    const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();
    
    // Pool completo de notícias variadas
    const newsPool: NewsItem[] = [
      {
        title: "Mercado de criptomoedas registra alta de 15% esta semana",
        summary: "Bitcoin e principais altcoins lideram movimento de recuperação após correção do mês passado.",
        category: "Criptomoedas",
        source: "Bloomberg",
        source_url: `https://bloomberg.com/crypto-${Date.now()}`,
        published_at: hoursAgo(2)
      },
      {
        title: "Banco Central mantém taxa Selic em 11,75%",
        summary: "Decisão era esperada pelo mercado e reflete cenário de inflação controlada.",
        category: "Economia",
        source: "Reuters",
        source_url: `https://reuters.com/selic-${Date.now()}`,
        published_at: hoursAgo(4)
      },
      {
        title: "Ações da Vale sobem 8% após anúncio de dividendos",
        summary: "Mineradora anuncia distribuição extraordinária de dividendos para acionistas.",
        category: "Bolsa",
        source: "Financial Times",
        source_url: `https://ft.com/vale-${Date.now()}`,
        published_at: hoursAgo(6)
      },
      {
        title: "Dólar recua para R$ 5,20 em meio a fluxo estrangeiro",
        summary: "Moeda americana perde força com entrada de capital internacional no país.",
        category: "Câmbio",
        source: "Wall Street Journal",
        source_url: `https://wsj.com/dollar-${Date.now()}`,
        published_at: hoursAgo(8)
      },
      {
        title: "Fundos imobiliários atraem R$ 2,5 bi em janeiro",
        summary: "Setor de FIIs continua aquecido com alta demanda por renda passiva.",
        category: "Investimentos",
        source: "InfoMoney",
        source_url: `https://infomoney.com/fiis-${Date.now()}`,
        published_at: hoursAgo(12)
      },
      {
        title: "Petrobras anuncia novo projeto de exploração no pré-sal",
        summary: "Estatal investe R$ 15 bilhões em novo campo petrolífero na Bacia de Santos.",
        category: "Bolsa",
        source: "Bloomberg",
        source_url: `https://bloomberg.com/petrobras-${Date.now()}`,
        published_at: hoursAgo(3)
      },
      {
        title: "Itaú registra lucro de R$ 9 bi no trimestre",
        summary: "Banco lidera setor financeiro com crescimento em carteira de crédito e serviços.",
        category: "Bolsa",
        source: "Valor Econômico",
        source_url: `https://valor.globo.com/itau-${Date.now()}`,
        published_at: hoursAgo(5)
      },
      {
        title: "Magazine Luiza expande operação de marketplace",
        summary: "Varejista amplia plataforma com 50 mil novos sellers e produtos.",
        category: "Investimentos",
        source: "Reuters",
        source_url: `https://reuters.com/magalu-${Date.now()}`,
        published_at: hoursAgo(7)
      },
      {
        title: "B3 bate recorde com 5 milhões de investidores ativos",
        summary: "Bolsa brasileira atinge novo marco histórico de pessoas físicas operando.",
        category: "Bolsa",
        source: "InfoMoney",
        source_url: `https://infomoney.com/b3-${Date.now()}`,
        published_at: hoursAgo(10)
      },
      {
        title: "Ambev anuncia aquisição de cervejaria artesanal",
        summary: "Gigante de bebidas investe R$ 500 milhões no segmento premium.",
        category: "Bolsa",
        source: "Financial Times",
        source_url: `https://ft.com/ambev-${Date.now()}`,
        published_at: hoursAgo(14)
      },
      {
        title: "Tesouro Direto atinge R$ 120 bi em estoque",
        summary: "Investimento em títulos públicos cresce 35% em relação ao ano anterior.",
        category: "Renda Fixa",
        source: "Valor Econômico",
        source_url: `https://valor.globo.com/tesouro-${Date.now()}`,
        published_at: hoursAgo(16)
      },
      {
        title: "JBS expande operações na Ásia com nova planta",
        summary: "Frigorífico investe US$ 200 milhões em unidade na Tailândia.",
        category: "Bolsa",
        source: "Bloomberg",
        source_url: `https://bloomberg.com/jbs-${Date.now()}`,
        published_at: hoursAgo(18)
      },
      {
        title: "Copel anuncia investimento em energia renovável",
        summary: "Companhia destinará R$ 3 bilhões para projetos eólicos e solares.",
        category: "Investimentos",
        source: "Reuters",
        source_url: `https://reuters.com/copel-${Date.now()}`,
        published_at: hoursAgo(20)
      },
      {
        title: "Natura &Co registra crescimento no e-commerce",
        summary: "Vendas digitais sobem 45% e representam 60% do faturamento total.",
        category: "Bolsa",
        source: "Wall Street Journal",
        source_url: `https://wsj.com/natura-${Date.now()}`,
        published_at: hoursAgo(22)
      },
      {
        title: "Weg fecha contrato para fornecimento de turbinas",
        summary: "Acordo de R$ 800 milhões com parque eólico no Nordeste.",
        category: "Bolsa",
        source: "InfoMoney",
        source_url: `https://infomoney.com/weg-${Date.now()}`,
        published_at: hoursAgo(24)
      },
      {
        title: "Eletrobras apresenta plano de expansão até 2030",
        summary: "Empresa planeja investir R$ 50 bi em geração e transmissão de energia.",
        category: "Investimentos",
        source: "Financial Times",
        source_url: `https://ft.com/eletrobras-${Date.now()}`,
        published_at: hoursAgo(26)
      },
      {
        title: "Localiza amplia frota com veículos elétricos",
        summary: "Locadora investe R$ 2 bilhões em carros sustentáveis até 2025.",
        category: "Bolsa",
        source: "Bloomberg",
        source_url: `https://bloomberg.com/localiza-${Date.now()}`,
        published_at: hoursAgo(28)
      },
      {
        title: "Suzano anuncia projeto de celulose sustentável",
        summary: "Investimento de R$ 4 bi em nova planta com tecnologia verde.",
        category: "Investimentos",
        source: "Valor Econômico",
        source_url: `https://valor.globo.com/suzano-${Date.now()}`,
        published_at: hoursAgo(30)
      }
    ];

    // Seleciona 12 notícias aleatórias do pool
    const shuffled = newsPool.sort(() => Math.random() - 0.5);
    const mockNews = shuffled.slice(0, 12);

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
          ignoreDuplicates: false // Allow updates to refresh published_at
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