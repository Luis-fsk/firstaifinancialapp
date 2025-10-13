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

interface AlphaVantageNewsItem {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  source: string;
  category_within_source: string;
  topics: Array<{
    topic: string;
    relevance_score: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching real news articles from Alpha Vantage...');
    
    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!alphaVantageKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }

    // Tópicos relevantes para notícias financeiras
    const topics = [
      'financial_markets',
      'economy_monetary',
      'technology',
      'finance',
      'blockchain'
    ];

    // Buscar notícias da Alpha Vantage
    const newsResponse = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${topics.join(',')}&limit=50&apikey=${alphaVantageKey}`
    );

    if (!newsResponse.ok) {
      throw new Error('Failed to fetch news from Alpha Vantage');
    }

    const newsData = await newsResponse.json();
    
    if (!newsData.feed || !Array.isArray(newsData.feed)) {
      console.error('Invalid response from Alpha Vantage:', newsData);
      throw new Error('Invalid news data received');
    }

    // Fontes confiáveis
    const trustedSources = [
      'Bloomberg',
      'Reuters',
      'Financial Times',
      'Wall Street Journal',
      'CNBC',
      'MarketWatch',
      'The Economist',
      'Forbes',
      'Business Insider',
      'Yahoo Finance'
    ];

    // Categorizar e filtrar notícias
    const categorizeNews = (item: AlphaVantageNewsItem): string => {
      const topics = item.topics?.map(t => t.topic.toLowerCase()) || [];
      
      if (topics.includes('blockchain') || topics.includes('cryptocurrency')) {
        return 'Criptomoedas';
      }
      if (topics.includes('economy_monetary') || topics.includes('economy_macro')) {
        return 'Economia';
      }
      if (topics.includes('financial_markets') || topics.includes('earnings')) {
        return 'Bolsa';
      }
      if (topics.includes('real_estate')) {
        return 'Investimentos';
      }
      if (topics.includes('finance')) {
        return 'Renda Fixa';
      }
      
      return 'Economia';
    };

    const processedNews: NewsItem[] = newsData.feed
      .filter((item: AlphaVantageNewsItem) => {
        // Filtrar apenas fontes confiáveis
        return trustedSources.some(source => 
          item.source.toLowerCase().includes(source.toLowerCase())
        );
      })
      .map((item: AlphaVantageNewsItem) => ({
        title: item.title,
        summary: item.summary.length > 300 ? item.summary.substring(0, 300) + '...' : item.summary,
        category: categorizeNews(item),
        source: item.source,
        source_url: item.url,
        published_at: new Date(item.time_published).toISOString()
      }))
      .slice(0, 12);

    // Insert news articles into database
    for (const newsItem of processedNews) {
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
      count: processedNews.length 
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