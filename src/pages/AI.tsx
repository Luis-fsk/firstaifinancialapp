import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, ArrowLeft, TrendingUp, PieChart, BarChart3, Send, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const formatMessage = (text: string): string => {
  // Replace bold text (**text**)
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace headings (### text for h3, ## text for h2)
  formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-2 mb-1">$1</h3>');
  formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-3 mb-2">$1</h2>');
  
  // Replace tables (lines with |)
  // Match lines that start and end with |
  formatted = formatted.replace(/(\|[^\n]+\|\n?)+/g, (match) => {
    const rows = match.trim().split('\n').filter(row => row.trim() && row.includes('|'));
    if (rows.length === 0) return match;
    
    let html = '<div class="overflow-x-auto my-2"><table class="border-collapse w-full min-w-full"><tbody>';
    
    rows.forEach((row, index) => {
      // Skip separator rows (those with just |---|---|)
      if (row.match(/^\|[\s:-]+\|$/)) return;
      
      const cells = row.split('|').filter(cell => cell.trim());
      html += '<tr>';
      cells.forEach(cell => {
        const trimmedCell = cell.trim();
        // First row as header
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


const AI = () => {
  const navigate = useNavigate();
  
  // Carregar mensagens do localStorage ao iniciar
  const loadMessagesFromStorage = (): Message[] => {
    try {
      const stored = localStorage.getItem('ai_chat_messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
    return [
      {
        id: "1",
        text: `Olá! 👋 Como posso te ajudar hoje? Sugestão, pergunte sobre: Renda Fixa, Perfis de Investimento ou Cryptomoedas.`,
        isUser: false,
        timestamp: new Date()
      }
    ];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessagesFromStorage());
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string; content: string}>>([]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Salvar apenas as últimas 6 mensagens no localStorage
  useEffect(() => {
    const last6Messages = messages.slice(-6);
    try {
      localStorage.setItem('ai_chat_messages', JSON.stringify(last6Messages));
    } catch (error) {
      console.error('Erro ao salvar mensagens:', error);
    }
  }, [messages]);

  async function perguntarIA(pergunta: string) {
    try {
      // Add user message to conversation history
      const newHistory = [...conversationHistory, { role: 'user', content: pergunta }];

      console.log('Enviando para OpenAI via edge function:', newHistory);

      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: { messages: newHistory }
      });

      if (error) {
        console.error('Erro ao chamar edge function:', error);
        throw error;
      }
      
      console.log('Resposta recebida do OpenAI:', data);
      
      const assistantResponse = data.message || "Desculpe, não consegui processar sua pergunta.";
      
      // Update conversation history with assistant response
      setConversationHistory([...newHistory, { role: 'assistant', content: assistantResponse }]);
      
      return assistantResponse;
    } catch (error) {
      console.error("Erro ao consultar IA:", error);
      return "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.";
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await perguntarIA(userMessage.text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, ocorreu um erro. Tente novamente.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await perguntarIA(question);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, ocorreu um erro. Tente novamente.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
            <Card className="h-[calc(100vh-16rem)] max-h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Chat com IA
                </CardTitle>
                <CardDescription>
                  Digite sua pergunta sobre finanças e receba análises personalizadas
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Messages Area */}
                <ScrollArea className="flex-1 mb-4 pr-4 h-full">
                  <div className="space-y-4 pb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!message.isUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-warm flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-3 rounded-lg break-words overflow-hidden ${
                            message.isUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <div 
                            className="text-sm prose prose-sm max-w-none dark:prose-invert overflow-x-auto [&_table]:text-xs [&_table]:my-2 [&_td]:px-2 [&_td]:py-1 [&_td]:border [&_td]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:border [&_th]:border-border [&_strong]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1"
                            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                            dangerouslySetInnerHTML={{ 
                              __html: formatMessage(message.text)
                            }}
                          />
                          <span className="text-xs opacity-70 mt-1 block">
                            {message.timestamp.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        {message.isUser && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-warm flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-muted text-muted-foreground p-3 rounded-lg">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Digite sua pergunta sobre finanças..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    className="bg-gradient-warm hover:bg-gradient-warm/90"
                  >
                    <Send className="h-4 w-4" />
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
                      onClick={() => handleQuickAction(`Me fale sobre ${action.title.toLowerCase()}`)}
                      disabled={isLoading}
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