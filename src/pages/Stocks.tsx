import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, TrendingUp, Search, Loader2, LineChart, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StockAnalysis {
  company_name: string;
  current_price: number;
  performance_summary: string;
  chart_data: Array<{ date: string; price: number }>;
  chart_analysis: string;
  future_projection: string;
  recommendation: {
    action: 'investir' | 'evitar' | 'cautela';
    timeframe: 'curto' | 'médio' | 'longo';
    reasoning: string;
  };
}

const Stocks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stockSymbol, setStockSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);

  const analyzeStock = async () => {
    if (!stockSymbol.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o símbolo da ação",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-stock', {
        body: { symbol: stockSymbol.toUpperCase().trim() }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setAnalysis(data);
      toast({
        title: "Análise concluída",
        description: "Análise da ação gerada com sucesso",
      });
    } catch (error) {
      console.error('Error analyzing stock:', error);
      toast({
        title: "Erro",
        description: "Erro ao analisar ação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (action: string) => {
    switch (action) {
      case 'investir':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'evitar':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'cautela':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getRecommendationIcon = (action: string) => {
    switch (action) {
      case 'investir':
        return '✓';
      case 'evitar':
        return '✗';
      case 'cautela':
        return '⚠';
      default:
        return '•';
    }
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
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Análise de Ações</h1>
                <p className="text-sm text-muted-foreground">Análise inteligente com IA</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white mb-8 shadow-warm-lg">
          <div className="flex items-center gap-4 mb-4">
            <LineChart className="h-8 w-8" />
            <div>
              <h2 className="text-3xl font-bold">Análise de Ações com IA</h2>
              <p className="text-white/90 text-lg mt-2">
                Insira o símbolo da ação para obter análise completa, gráficos e recomendações
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buscar Ação</CardTitle>
            <CardDescription>
              Insira o símbolo da ação (ex: PETR4, VALE3, AAPL, TSLA)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Ex: PETR4"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && analyzeStock()}
                className="flex-1"
              />
              <Button 
                onClick={analyzeStock}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analisar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Company Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{analysis.company_name}</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {analysis.current_price.toFixed(2)}
                  </span>
                </CardTitle>
                <CardDescription>Visão Geral da Empresa</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{analysis.performance_summary}</p>
              </CardContent>
            </Card>

            {/* Price Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Gráfico de Performance</CardTitle>
                <CardDescription>Histórico de preços dos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={analysis.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Análise do Gráfico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {analysis.chart_analysis}
                </p>
              </CardContent>
            </Card>

            {/* Future Projection */}
            <Card>
              <CardHeader>
                <CardTitle>Projeções Futuras</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {analysis.future_projection}
                </p>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className={`border-2 ${getRecommendationColor(analysis.recommendation.action)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recomendação de Investimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">
                    {getRecommendationIcon(analysis.recommendation.action)}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold capitalize">
                      {analysis.recommendation.action === 'investir' ? 'Investir' : 
                       analysis.recommendation.action === 'evitar' ? 'Evitar' : 'Cautela'}
                    </p>
                    <p className="text-sm">
                      Prazo: <span className="font-semibold capitalize">{analysis.recommendation.timeframe}</span>
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="font-semibold mb-2">Por que este prazo?</p>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {analysis.recommendation.reasoning}
                  </p>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    ⚠️ Esta é apenas uma análise informativa gerada por IA. Não constitui aconselhamento financeiro. 
                    Consulte um profissional certificado antes de tomar decisões de investimento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Comece sua análise
              </h3>
              <p className="text-muted-foreground">
                Insira o símbolo de uma ação acima para obter análise completa com IA
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Stocks;