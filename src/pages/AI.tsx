import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, ArrowLeft, Send, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AI = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setIsAnalyzing(true);
    // Simular processamento da IA
    setTimeout(() => {
      setIsAnalyzing(false);
      setMessage("");
    }, 2000);
  };

  const quickActions = [
    {
      title: "Análise de Gastos",
      description: "Analise seus padrões de gastos do último mês",
      icon: PieChart,
    },
    {
      title: "Projeção de Renda",
      description: "Veja projeções baseadas em seu histórico",
      icon: TrendingUp,
    },
    {
      title: "Otimização de Investimentos",
      description: "Receba sugestões para diversificar sua carteira",
      icon: BarChart3,
    },
  ];

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
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Assistente IA</h1>
                <p className="text-sm text-muted-foreground">Análise financeira inteligente</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white mb-8 shadow-warm-lg">
          <h2 className="text-3xl font-bold mb-4">
            IA Financeira Personalizada
          </h2>
          <p className="text-white/90 text-lg">
            Obtenha insights inteligentes sobre suas finanças, análises personalizadas 
            e recomendações baseadas em seus dados financeiros.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Chat com IA
                </CardTitle>
                <CardDescription>
                  Digite sua pergunta sobre finanças e receba análises personalizadas
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Chat Messages Area */}
                <div className="flex-1 mb-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p>Olá! Sou sua assistente financeira IA.</p>
                    <p className="text-sm mt-2">
                      Faça perguntas sobre investimentos, gastos, ou use as ações rápidas ao lado.
                    </p>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite sua pergunta sobre finanças..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isAnalyzing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4"
                  >
                    {isAnalyzing ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                <CardDescription>
                  Clique para obter análises específicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full h-auto p-4 flex flex-col items-start text-left hover:bg-muted"
                      onClick={() => setMessage(action.title)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{action.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {action.description}
                      </span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recursos da IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Análise de padrões de gastos
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  Recomendações de investimento
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-warm rounded-full" />
                  Projeções financeiras
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  Alertas personalizados
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AI;