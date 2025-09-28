import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowLeft, MessageCircle, Heart, Share2, TrendingUp, Award, Clock, Plus, Image, Send, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  author: string;
  initials: string;
  content: string;
  image?: string;
  category: string;
  likes: number;
  replies: Reply[];
  time: string;
  liked: boolean;
}

interface Reply {
  id: string;
  author: string;
  initials: string;
  content: string;
  image?: string;
  time: string;
  likes: number;
  liked: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  type: 'sent' | 'received';
}

interface Connection {
  id: string;
  name: string;
  initials: string;
  status: 'pending' | 'connected';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

const Community = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: 'Marina Lopez',
      initials: 'ML',
      content: 'Qual a melhor estratégia para diversificar carteira em 2024? Estou pensando em dividir entre ações brasileiras, internacionais e renda fixa.',
      category: 'Investimentos',
      likes: 45,
      replies: [],
      time: '2 horas atrás',
      liked: false
    }
  ]);
  
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: '1',
      name: 'Carlos Silva',
      initials: 'CS',
      status: 'connected',
      lastMessage: 'Ótima análise sobre as ações!',
      lastMessageTime: '1h',
      unreadCount: 2
    },
    {
      id: '2',
      name: 'Ana Costa',
      initials: 'AC',
      status: 'pending'
    }
  ]);
  
  const [chatMessages, setChatMessages] = useState<{ [key: string]: ChatMessage[] }>({
    '1': [
      {
        id: '1',
        sender: 'Carlos Silva',
        content: 'Oi! Vi seu post sobre diversificação. Muito interessante!',
        time: '2h',
        type: 'received'
      },
      {
        id: '2',
        sender: 'Você',
        content: 'Obrigado! O que você acha da estratégia?',
        time: '1h',
        type: 'sent'
      }
    ]
  });
  
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Geral');
  const [newPostImage, setNewPostImage] = useState<string>('');
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string>('');
  const [replyContent, setReplyContent] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Funções
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPostImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createPost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Erro",
        description: "O conteúdo do post não pode estar vazio",
        variant: "destructive"
      });
      return;
    }

    const newPost: Post = {
      id: Date.now().toString(),
      author: 'Você',
      initials: 'VC',
      content: newPostContent,
      image: newPostImage || undefined,
      category: newPostCategory,
      likes: 0,
      replies: [],
      time: 'agora',
      liked: false
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostImage('');
    setShowNewPost(false);
    
    toast({
      title: "Sucesso!",
      description: "Post criado com sucesso"
    });
  };

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const addReply = (postId: string) => {
    if (!replyContent.trim()) return;

    const newReply: Reply = {
      id: Date.now().toString(),
      author: 'Você',
      initials: 'VC',
      content: replyContent,
      time: 'agora',
      likes: 0,
      liked: false
    };

    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, replies: [...post.replies, newReply] }
        : post
    ));
    
    setReplyContent('');
    setReplyingTo('');
    
    toast({
      title: "Resposta adicionada!",
      description: "Sua resposta foi postada com sucesso"
    });
  };

  const sendConnectionRequest = (userId: string) => {
    setConnections(connections.map(conn => 
      conn.id === userId ? { ...conn, status: 'pending' as const } : conn
    ));
    
    toast({
      title: "Solicitação enviada!",
      description: "Solicitação de conexão enviada com sucesso"
    });
  };

  const acceptConnection = (userId: string) => {
    setConnections(connections.map(conn => 
      conn.id === userId ? { ...conn, status: 'connected' as const } : conn
    ));
    
    toast({
      title: "Conexão aceita!",
      description: "Agora vocês estão conectados"
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConnection) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Você',
      content: newMessage,
      time: 'agora',
      type: 'sent'
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedConnection]: [...(prev[selectedConnection] || []), message]
    }));
    
    setNewMessage('');
    
    toast({
      title: "Mensagem enviada!",
      description: "Sua mensagem foi enviada"
    });
  };

  const topContributors = [
    {
      name: "Carlos Silva",
      expertise: "Renda Variável",
      posts: 124,
      likes: 890,
      initials: "CS",
      color: "bg-primary",
    },
    {
      name: "Ana Costa",
      expertise: "Criptomoedas",
      posts: 89,
      likes: 654,
      initials: "AC",
      color: "bg-secondary",
    },
    {
      name: "Pedro Santos",
      expertise: "Renda Fixa",
      posts: 76,
      likes: 432,
      initials: "PS",
      color: "bg-warm",
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Investimentos": "bg-primary/20 text-primary",
      "FIIs": "bg-secondary/20 text-secondary",
      "Iniciantes": "bg-warm/20 text-warm",
      "Ações": "bg-accent text-accent-foreground",
      "Cripto": "bg-primary text-primary-foreground",
      "Geral": "bg-muted text-muted-foreground",
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
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Comunidade</h1>
                <p className="text-sm text-muted-foreground">Conecte-se com investidores</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white mb-8 shadow-warm-lg">
          <div className="flex items-center gap-4 mb-4">
            <Users className="h-8 w-8" />
            <div>
              <h2 className="text-3xl font-bold">Comunidade de Investidores</h2>
              <p className="text-white/90 text-lg mt-2">
                Compartilhe conhecimento, tire dúvidas e conecte-se com outros investidores
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span>1.2k membros ativos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span>500+ discussões</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span>50+ especialistas</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Categoria</label>
                      <select 
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="Geral">Geral</option>
                        <option value="Investimentos">Investimentos</option>
                        <option value="FIIs">FIIs</option>
                        <option value="Iniciantes">Iniciantes</option>
                        <option value="Ações">Ações</option>
                        <option value="Cripto">Cripto</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Conteúdo</label>
                      <Textarea
                        placeholder="Compartilhe seus pensamentos sobre investimentos..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                    {newPostImage && (
                      <div className="relative">
                        <img src={newPostImage} alt="Preview" className="max-h-40 rounded-md" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 bg-background/80"
                          onClick={() => setNewPostImage('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Adicionar Imagem
                      </Button>
                      <Button onClick={createPost} className="ml-auto">
                        Publicar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showConnections} onOpenChange={setShowConnections}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Conexões
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Minhas Conexões</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {connections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{connection.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{connection.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {connection.status === 'connected' ? 'Conectado' : 'Pendente'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {connection.status === 'pending' ? (
                            <Button size="sm" onClick={() => acceptConnection(connection.id)}>
                              Aceitar
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedConnection(connection.id);
                                setShowChat(true);
                                setShowConnections(false);
                              }}
                            >
                              Chat
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              {selectedConnection && (
                <Dialog open={showChat} onOpenChange={setShowChat}>
                  <DialogContent className="max-w-md h-[500px] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>
                        Chat com {connections.find(c => c.id === selectedConnection)?.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-3 p-4">
                      {(chatMessages[selectedConnection] || []).map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            message.type === 'sent' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <div className="text-sm">{message.content}</div>
                            <div className="text-xs opacity-70 mt-1">{message.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 p-4 border-t">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Posts */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Posts da Comunidade</h3>
              
              {posts.map((post) => (
                <Card key={post.id} className="group hover:shadow-warm transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                          {post.initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-semibold text-foreground">{post.author}</span>
                          <Badge className={getCategoryColor(post.category)}>
                            {post.category}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{post.time}</span>
                        </div>
                        
                        <p className="text-foreground mb-3">{post.content}</p>
                        
                        {post.image && (
                          <img 
                            src={post.image} 
                            alt="Post image" 
                            className="max-h-64 rounded-lg mb-3 object-cover"
                          />
                        )}
                        
                        <div className="flex items-center gap-4 mb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLike(post.id)}
                            className={post.liked ? 'text-red-500' : ''}
                          >
                            <Heart className={`h-4 w-4 mr-1 ${post.liked ? 'fill-current' : ''}`} />
                            {post.likes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(replyingTo === post.id ? '' : post.id)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {post.replies.length}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendConnectionRequest('new-user')}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Conectar
                          </Button>
                        </div>
                        
                        {/* Respostas */}
                        {post.replies.length > 0 && (
                          <div className="space-y-3 border-l-2 border-muted pl-4 ml-4">
                            {post.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                    {reply.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{reply.author}</span>
                                    <span className="text-xs text-muted-foreground">{reply.time}</span>
                                  </div>
                                  <p className="text-sm text-foreground mb-2">{reply.content}</p>
                                  {reply.image && (
                                    <img 
                                      src={reply.image} 
                                      alt="Reply image" 
                                      className="max-h-32 rounded-md mb-2 object-cover"
                                    />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs"
                                  >
                                    <Heart className="h-3 w-3 mr-1" />
                                    {reply.likes}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Formulário de resposta */}
                        {replyingTo === post.id && (
                          <div className="mt-4 space-y-3 border-l-2 border-primary pl-4 ml-4">
                            <Textarea
                              placeholder="Escreva sua resposta..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Image className="h-4 w-4 mr-1" />
                                Imagem
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => addReply(post.id)}
                              >
                                Responder
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyingTo('')}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" className="px-8">
                Ver mais discussões
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Top Contribuidores
                </CardTitle>
                <CardDescription>
                  Membros mais ativos da comunidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className={`h-10 w-10 ${contributor.color}`}>
                      <AvatarFallback className="text-white font-medium">
                        {contributor.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{contributor.name}</div>
                      <div className="text-sm text-muted-foreground">{contributor.expertise}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium text-foreground">{contributor.posts}</div>
                      <div className="text-muted-foreground">posts</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membros</span>
                  <span className="font-medium text-foreground">1.234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discussões</span>
                  <span className="font-medium text-foreground">567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Respostas</span>
                  <span className="font-medium text-foreground">2.890</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Online agora</span>
                  <span className="font-medium text-primary">89</span>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Ações", "FIIs", "Cripto", "Renda Fixa", "Iniciantes", "Análise", "Dúvidas", "ETFs"].map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;