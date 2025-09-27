import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, ArrowLeft, Send, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

const AI = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "Olá! 👋",
      isBot: true,
      timestamp: new Date(),
    },
    {
      id: "2", 
      content: "Como posso te ajudar hoje?",
      isBot: true,
      timestamp: new Date(),
    },
    {
      id: "3",
      content: "Sugestão, pergunte sobre: Renda Fixa, Perfis de Investimento ou Cryptomoedas.",
      isBot: true,
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isBot: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsAnalyzing(true);

    try {
      // Fazer requisição para o webhook da IA
      const response = await fetch("https://eleefe.app.n8n.cloud/webhook/b2969f0e-74e6-4d26-b97b-c84b6286604c/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na comunicação com a IA");
      }

      const aiResponse = await response.text();
      
      // Adicionar resposta da IA
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse || "Desculpe, não consegui processar sua pergunta no momento.",
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
      
      // Adicionar mensagem de erro
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Desculpe, estou com problemas técnicos no momento. Tente novamente mais tarde.",
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const quickActions = [
    {
      title: "Renda Fixa",
      description: "Pergunte sobre investimentos em renda fixa",
      icon: PieChart,
      message: "Me explique sobre investimentos em renda fixa",
    },
    {
      title: "Perfis de Investimento",
      description: "Saiba mais sobre diferentes perfis de investidor",
      icon: TrendingUp,
      message: "Quais são os perfis de investimento?",
    },
    {
      title: "Cryptomoedas",
      description: "Entenda sobre investimentos em cryptomoedas",
      icon: BarChart3,
      message: "Como investir em cryptomoedas?",
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
                <div className="flex-1 mb-4 p-4 bg-muted/30 rounded-lg overflow-y-auto max-h-[450px] space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.isBot
                            ? 'bg-white border border-border'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {msg.isBot && (
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="h-3 w-3" />
                            <span className="text-xs font-medium">Assistente IA</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {isAnalyzing && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-border p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bot className="h-3 w-3" />
                          <span className="text-xs font-medium">Assistente IA</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                          <span className="text-sm text-muted-foreground">Analisando...</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                      onClick={() => setMessage(action.message)}
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