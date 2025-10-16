import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ArrowLeft, Clock, TrendingUp, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cache, CACHE_TTL } from "@/lib/cache";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  source_url: string;
  published_at: string;
  ai_analysis?: string;
}

const formatMessage = (text: string): string => {
  // Replace bold text (**text**)
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace headings (### text for h3, ## text for h2)
  formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-2 mb-1">$1</h3>');
  formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-3 mb-2">$1</h2>');
  
  // Replace tables (lines with |)
  formatted = formatted.replace(/(\|[^\n]+\|\n?)+/g, (match) => {
    const rows = match.trim().split('\n').filter(row => row.trim() && row.includes('|'));
    if (rows.length === 0) return match;
    
    let html = '<div class="overflow-x-auto my-2"><table class="border-collapse w-full min-w-full"><tbody>';
    
    rows.forEach((row, index) => {
      if (row.match(/^\|[\s:-]+\|$/)) return;
      
      const cells = row.split('|').filter(cell => cell.trim());
      html += '<tr>';
      cells.forEach(cell => {
        const trimmedCell = cell.trim();
        if (index === 0) {
          html += `<th class="border border-border px-2 py-1 font-semibold bg-muted/50">${trimmedCell}</th>`;
        } else {
          html += `<td class="border border-border px-2 py-1">${trimmedCell}</td>`;
        }
      });
      html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    return html;
  });
  
  // Preserve line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
};

const News = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [analyzingArticle, setAnalyzingArticle] = useState<string | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const clickTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    fetchNews();
    // Auto-fetch news every hour
    const interval = setInterval(fetchNews, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async (showToast = false, forceRefresh = false) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedNews = cache.get<NewsArticle[]>('news_articles');
        if (cachedNews && cachedNews.length > 0) {
          setNewsArticles(cachedNews);
          setLoading(false);
          setIsUsingCache(true);
          if (showToast) {
            toast({
              title: "Cache carregado",
              description: "Notícias carregadas do cache local",
            });
          }
          return;
        }
      }

      setIsUsingCache(false);
      setLoading(true);
      
      // Fetch news from last 7 days only
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: existingNews, error: fetchError } = await supabase
        .from('news_articles')
        .select('*')
        .gte('published_at', sevenDaysAgo.toISOString())
        .order('published_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching news:', fetchError);
        toast({
          title: "Erro",
          description: "Erro ao carregar notícias",
          variant: "destructive",
        });
        return;
      }

      const articles = existingNews || [];
      setNewsArticles(articles);
      
      // Cache the results
      if (articles.length > 0) {
        cache.set('news_articles', articles, CACHE_TTL.NEWS);
      }
      
      if (showToast) {
        toast({
          title: "Notícias atualizadas",
          description: `${articles.length} notícias carregadas com sucesso`,
        });
      }
    } catch (error) {
      console.error('Error in fetchNews:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar notícias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    try {
      setLoading(true);
      
      // Call the edge function to fetch fresh news
      const { error } = await supabase.functions.invoke('fetch-news');
      
      if (error) {
        throw error;
      }
      
      // Reload the news from database with force refresh
      await fetchNews(true, true);
    } catch (error) {
      console.error('Error refreshing news:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar notícias",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const analyzeArticle = async (article: NewsArticle) => {
    if (article.ai_analysis) {
      setExpandedArticle(expandedArticle === article.id ? null : article.id);
      return;
    }

    try {
      setAnalyzingArticle(article.id);
      console.log('Starting analysis for article:', article.id, article.title);
      
      const { data, error } = await supabase.functions.invoke('analyze-news', {
        body: {
          newsId: article.id,
          title: article.title,
          summary: article.summary,
          category: article.category
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      // Handle different response formats
      let analysisText = '';
      if (data?.analysis) {
        analysisText = data.analysis;
      } else if (data?.reply) {
        analysisText = data.reply;
      } else if (data?.resposta) {
        analysisText = data.resposta;
      } else if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      } else {
        console.error('Unexpected response format:', data);
        toast({
          title: "Erro",
          description: "Formato de resposta inesperado",
          variant: "destructive",
        });
        return;
      }

      console.log('Analysis extracted:', analysisText);

      // Update local state with analysis
      setNewsArticles(prev => prev.map(a => 
        a.id === article.id 
          ? { ...a, ai_analysis: analysisText }
          : a
      ));
      
      setExpandedArticle(article.id);
      
      toast({
        title: "Análise gerada",
        description: "Análise por IA foi gerada com sucesso",
      });
    } catch (error) {
      console.error('Error analyzing article:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar análise",
        variant: "destructive",
      });
    } finally {
      setAnalyzingArticle(null);
    }
  };

  const handleArticleClick = (article: NewsArticle) => {
    const articleId = article.id;
    
    // Clear existing timeout for this article
    if (clickTimeouts.current[articleId]) {
      clearTimeout(clickTimeouts.current[articleId]);
      delete clickTimeouts.current[articleId];
      
      // This is a double click - redirect to source
      window.open(article.source_url, '_blank');
      return;
    }

    // Set timeout for single click
    clickTimeouts.current[articleId] = setTimeout(() => {
      delete clickTimeouts.current[articleId];
      analyzeArticle(article);
    }, 300);
  };

  const getTimeAgo = (publishedAt: string) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffInHours = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Menos de 1 hora atrás";
    if (diffInHours < 24) return `${diffInHours} horas atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dias atrás`;
  };

  const filteredArticles = selectedCategory === "Todas" 
    ? newsArticles 
    : newsArticles.filter(article => article.category === selectedCategory);

  const featuredArticles = filteredArticles.slice(0, 2);

  const categories = ["Todas", "Economia", "Bolsa", "Criptomoedas", "Câmbio", "Investimentos", "Renda Fixa"];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Criptomoedas": "bg-primary text-primary-foreground",
      "Economia": "bg-secondary text-secondary-foreground",
      "Bolsa": "bg-warm text-warm-foreground",
      "Câmbio": "bg-accent text-accent-foreground",
      "Investimentos": "bg-muted text-muted-foreground",
      "Renda Fixa": "bg-primary/20 text-primary",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-warm rounded-lg">
                <Newspaper className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Notícias Financeiras</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Últimas do mercado financeiro</p>
                  {isUsingCache && (
                    <Badge variant="outline" className="text-xs">
                      Cache
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshNews}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white mb-8 shadow-warm-lg">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="h-8 w-8" />
            <div>
              <h2 className="text-3xl font-bold">Mercado em Tempo Real</h2>
              <p className="text-white/90 text-lg mt-2">
                Acompanhe as principais notícias e tendências do mercado financeiro
              </p>
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {!loading && featuredArticles.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Destaques</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <Card 
                  key={article.id} 
                  className="group cursor-pointer hover:shadow-warm transition-all duration-300"
                  onClick={() => handleArticleClick(article)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getCategoryColor(article.category)}>
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(article.published_at)}
                        </div>
                        {analyzingArticle === article.id && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {article.summary}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Fonte: {article.source}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        1 clique: análise IA • 2 cliques: fonte original
                      </div>
                    </div>
                    {expandedArticle === article.id && article.ai_analysis && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2 text-foreground">Análise de Impacto:</h4>
                        <div 
                          className="text-sm prose prose-sm max-w-none dark:prose-invert overflow-x-auto [&_table]:text-xs [&_table]:my-2 [&_td]:px-2 [&_td]:py-1 [&_td]:border [&_td]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:border [&_th]:border-border [&_strong]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1"
                          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                          dangerouslySetInnerHTML={{ 
                            __html: formatMessage(article.ai_analysis)
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        {!loading && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              Todas as Notícias {selectedCategory !== "Todas" && `- ${selectedCategory}`}
            </h3>
            <div className="space-y-4">
              {filteredArticles.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma notícia encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      Não há notícias disponíveis no momento. Tente atualizar ou selecionar outra categoria.
                    </p>
                    <Button onClick={() => fetchNews(true, true)} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar Notícias
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredArticles.map((article) => (
                <Card 
                  key={article.id} 
                  className="group cursor-pointer hover:shadow-sm transition-all duration-300"
                  onClick={() => handleArticleClick(article)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className={getCategoryColor(article.category)}>
                            {article.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(article.published_at)}
                          </div>
                          {analyzingArticle === article.id && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </div>
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                          {article.title}
                        </h4>
                        <p className="text-muted-foreground text-sm mb-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Fonte: {article.source}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            1 clique: análise IA • 2 cliques: fonte original
                          </div>
                        </div>
                        {expandedArticle === article.id && article.ai_analysis && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold mb-2 text-foreground">Análise de Impacto:</h4>
                            <div 
                              className="text-sm prose prose-sm max-w-none dark:prose-invert overflow-x-auto [&_table]:text-xs [&_table]:my-2 [&_td]:px-2 [&_td]:py-1 [&_td]:border [&_td]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:border [&_th]:border-border [&_strong]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1"
                              style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                              dangerouslySetInnerHTML={{ 
                                __html: formatMessage(article.ai_analysis)
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
              )}
            </div>
          </div>
        )}

        {/* Load More */}
        {!loading && filteredArticles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma notícia encontrada para esta categoria.</p>
          </div>
        )}
        
        {!loading && filteredArticles.length > 10 && (
          <div className="text-center mt-8">
            <Button variant="outline" className="px-8" onClick={() => fetchNews()}>
              Buscar mais notícias
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default News;