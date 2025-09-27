import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, ArrowLeft, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "@n8n/chat/style.css";

const AI = () => {
  const navigate = useNavigate();
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChat = async () => {
      if (chatRef.current) {
        try {
          // Importar dinamicamente o createChat do n8n
          const { createChat } = await import('@n8n/chat');
          
          createChat({
            webhookUrl: 'https://eleefe.app.n8n.cloud/webhook/b2969f0e-74e6-4d26-b97b-c84b6286604c/chat',
            target: chatRef.current,
            mode: 'fullscreen',
            webhookConfig: {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            },
            chatInputKey: 'message',
            defaultLanguage: 'en',
            showWelcomeScreen: false,
            loadPreviousSession: true,
            initialMessages: [
              'Olá! 👋',
              'Como posso te ajudar hoje?',
              'Sugestão, pergunte sobre: Renda Fixa, Perfis de Investimento ou Cryptomoedas.'
            ]
          });
        } catch (error) {
          console.error('Erro ao carregar o chat N8N:', error);
          // Fallback - mostrar uma mensagem simples
          if (chatRef.current) {
            chatRef.current.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center;">
                <p style="margin-bottom: 1rem;">Chat indisponível no momento</p>
                <p style="font-size: 0.875rem; color: #666;">Tente recarregar a página</p>
              </div>
            `;
          }
        }
      }
    };

    loadChat();
  }, []);

  const quickActions = [
    {
      title: "Renda Fixa",
      description: "Pergunte sobre investimentos em renda fixa",
      icon: PieChart,
    },
    {
      title: "Perfis de Investimento", 
      description: "Saiba mais sobre diferentes perfis de investidor",
      icon: TrendingUp,
    },
    {
      title: "Cryptomoedas",
      description: "Entenda sobre investimentos em cryptomoedas",
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
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* N8N Chat Container */}
                <div 
                  ref={chatRef} 
                  className="flex-1 w-full"
                  style={{ height: '100%' }}
                />
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
                      onClick={() => {}}
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