import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, TrendingUp, Search, Loader2, LineChart, AlertCircle, PieChart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallDialog } from "@/components/PaywallDialog";

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

interface InvestmentAnalysis {
  category: string;
  amount: number;
  name: string | null;
  investment_title: string;
  quality_analysis: string;
  quality_score: number;
  volatility_analysis: string;
  volatility_level: 'baixa' | 'média' | 'alta';
  risk_analysis: string;
  risk_level: 'baixo' | 'médio' | 'alto';
  opportunity_analysis: string;
  opportunity_score: number;
  future_prediction: string;
  recommendation: {
    action: 'investir' | 'evitar' | 'cautela';
    reasoning: string;
  };
}

const Stocks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stockSymbol, setStockSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const { isPremium, isTrialExpired } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  // Investment form state
  const [investmentCategory, setInvestmentCategory] = useState<string>("");
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [investmentName, setInvestmentName] = useState<string>("");
  const [investmentDetails, setInvestmentDetails] = useState<string>("");
  const [investmentLoading, setInvestmentLoading] = useState(false);
  const [investmentAnalysis, setInvestmentAnalysis] = useState<InvestmentAnalysis | null>(null);

  useEffect(() => {
    if (isTrialExpired && !isPremium) {
      setShowPaywall(true);
    }
  }, [isTrialExpired, isPremium]);

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

  const analyzeInvestment = async () => {
    if (!investmentCategory) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma categoria",
        variant: "destructive",
      });
      return;
    }

    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido",
        variant: "destructive",
      });
      return;
    }

    if (!investmentDetails.trim() || investmentDetails.trim().length < 10) {
      toast({
        title: "Erro",
        description: "Por favor, forneça mais informações para análise (mínimo 10 caracteres)",
        variant: "destructive",
      });
      return;
    }

    setInvestmentLoading(true);
    setInvestmentAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-investment', {
        body: {
          category: investmentCategory,
          amount: parseFloat(investmentAmount),
          name: investmentName.trim() || undefined,
          details: investmentDetails.trim()
        }
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

      setInvestmentAnalysis(data);
      toast({
        title: "Análise concluída",
        description: "Análise do investimento gerada com sucesso",
      });
    } catch (error) {
      console.error('Error analyzing investment:', error);
      toast({
        title: "Erro",
        description: "Erro ao analisar investimento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setInvestmentLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'baixo':
      case 'baixa':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'médio':
      case 'média':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'alto':
      case 'alta':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted';
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
              <div className="p-2 bg-gradient-warm-subtle rounded-lg">
                <TrendingUp className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Análises</h1>
                <p className="text-sm text-muted-foreground">Análise inteligente de ações e investimentos com IA</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="stocks" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="stocks">Ações</TabsTrigger>
            <TabsTrigger value="investments">Investimentos</TabsTrigger>
          </TabsList>

          {/* Stocks Tab */}
          <TabsContent value="stocks" className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-hero rounded-2xl p-8 text-white shadow-warm-lg">
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
              Insira o código da ação brasileira (ex: PETR4.SA, VALE3.SA) ou americana (ex: AAPL, TSLA)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Ex: PETR4.SA ou AAPL"
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
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-hero rounded-2xl p-8 text-white shadow-warm-lg">
              <div className="flex items-center gap-4 mb-4">
                <PieChart className="h-8 w-8" />
                <div>
                  <h2 className="text-3xl font-bold">Análise de Investimentos com IA</h2>
                  <p className="text-white/90 text-lg mt-2">
                    Obtenha análise profissional sobre qualidade, risco e oportunidades
                  </p>
                </div>
              </div>
            </div>

            {/* Investment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Investimento</CardTitle>
                <CardDescription>
                  Preencha os dados abaixo para receber uma análise detalhada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={investmentCategory} onValueChange={setInvestmentCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDB">CDB</SelectItem>
                      <SelectItem value="Renda Fixa">Renda Fixa</SelectItem>
                      <SelectItem value="Crypto">Crypto</SelectItem>
                      <SelectItem value="Fundos">Fundos</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor que pretende investir (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Ex: 10000"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do investimento (opcional)</Label>
                  <Input
                    id="name"
                    placeholder="Ex: CDB Banco XYZ"
                    value={investmentName}
                    onChange={(e) => setInvestmentName(e.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Informações para análise *</Label>
                  <Textarea
                    id="details"
                    placeholder="Descreva detalhes sobre o investimento: rentabilidade, prazo, garantias, características específicas, etc."
                    value={investmentDetails}
                    onChange={(e) => setInvestmentDetails(e.target.value)}
                    rows={5}
                    maxLength={2000}
                  />
                  <p className="text-sm text-muted-foreground">
                    {investmentDetails.length}/2000 caracteres (mínimo 10)
                  </p>
                </div>

                <Button 
                  onClick={analyzeInvestment}
                  disabled={investmentLoading}
                  className="w-full"
                  size="lg"
                >
                  {investmentLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analisar Investimento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Investment Analysis Results */}
            {investmentAnalysis && (
              <div className="space-y-6">
                {/* Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{investmentAnalysis.investment_title}</span>
                      <span className="text-lg font-normal text-muted-foreground">
                        {investmentAnalysis.category}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Valor: R$ {investmentAnalysis.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      {investmentAnalysis.name && ` • ${investmentAnalysis.name}`}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Quality Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Qualidade do Investimento</span>
                      <span className="text-2xl font-bold text-primary">
                        {investmentAnalysis.quality_score.toFixed(1)}/10
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {investmentAnalysis.quality_analysis}
                    </p>
                  </CardContent>
                </Card>

                {/* Risk and Volatility */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className={`border-2 ${getLevelColor(investmentAnalysis.volatility_level)}`}>
                    <CardHeader>
                      <CardTitle>Volatilidade</CardTitle>
                      <CardDescription className="font-semibold capitalize">
                        Nível: {investmentAnalysis.volatility_level}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground leading-relaxed">
                        {investmentAnalysis.volatility_analysis}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className={`border-2 ${getLevelColor(investmentAnalysis.risk_level)}`}>
                    <CardHeader>
                      <CardTitle>Risco</CardTitle>
                      <CardDescription className="font-semibold capitalize">
                        Nível: {investmentAnalysis.risk_level}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground leading-relaxed">
                        {investmentAnalysis.risk_analysis}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Opportunity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Oportunidade</span>
                      <span className="text-2xl font-bold text-primary">
                        {investmentAnalysis.opportunity_score.toFixed(1)}/10
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {investmentAnalysis.opportunity_analysis}
                    </p>
                  </CardContent>
                </Card>

                {/* Future Prediction */}
                <Card>
                  <CardHeader>
                    <CardTitle>Previsões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {investmentAnalysis.future_prediction}
                    </p>
                  </CardContent>
                </Card>

                {/* Recommendation */}
                <Card className={`border-2 ${getRecommendationColor(investmentAnalysis.recommendation.action)}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Recomendação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold">
                        {getRecommendationIcon(investmentAnalysis.recommendation.action)}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold capitalize">
                          {investmentAnalysis.recommendation.action === 'investir' ? 'Investir' : 
                           investmentAnalysis.recommendation.action === 'evitar' ? 'Evitar' : 'Cautela'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="font-semibold mb-2">Análise da Recomendação</p>
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {investmentAnalysis.recommendation.reasoning}
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
            {!investmentAnalysis && !investmentLoading && (
              <Card className="text-center py-12">
                <CardContent>
                  <PieChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Analise seu investimento
                  </h3>
                  <p className="text-muted-foreground">
                    Preencha o formulário acima para receber uma análise completa com IA
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
    </div>
  );
};

export default Stocks;