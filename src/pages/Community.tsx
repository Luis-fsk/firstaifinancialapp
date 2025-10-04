import React, { useState, useRef, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserSearch } from "@/components/UserSearch";

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  author_initials: string;
  content: string;
  image_url?: string;
  category: string;
  likes_count: number;
  created_at: string;
  liked?: boolean;
  replies?: Reply[];
}

interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_initials: string;
  content: string;
  image_url?: string;
  likes_count: number;
  created_at: string;
  liked?: boolean;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'connected';
  created_at: string;
  profiles?: {
    display_name: string;
    username: string;
  };
}

const Community = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [chatMessages, setChatMessages] = useState<{ [key: string]: ChatMessage[] }>({});
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

  // Load user profile
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setUserProfile(data);
    }
  };

  // Load posts
  useEffect(() => {
    loadPosts();
    loadConnections();
  }, []);

  const loadPosts = async () => {
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading posts:', error);
      return;
    }

    // Load replies for each post
    if (postsData) {
      const postsWithReplies = await Promise.all(
        postsData.map(async (post) => {
          const { data: repliesData } = await supabase
            .from('replies')
            .select('*')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          // Check if user liked the post
          let liked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();
            liked = !!likeData;
          }

          return {
            ...post,
            replies: repliesData || [],
            liked
          };
        })
      );

      setPosts(postsWithReplies);
    }
  };

  const loadConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

    if (error) {
      console.error('Error loading connections:', error);
      return;
    }

    setConnections(data as Connection[] || []);
  };

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

  const createPost = async () => {
    if (!newPostContent.trim() || !user || !userProfile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar posts",
        variant: "destructive"
      });
      return;
    }

    const initials = userProfile.display_name
      ? userProfile.display_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
      : 'VC';

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        author_name: userProfile.display_name || userProfile.username || 'Usuário',
        author_initials: initials,
        content: newPostContent,
        image_url: newPostImage || null,
        category: newPostCategory
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar post",
        variant: "destructive"
      });
      return;
    }

    setNewPostContent('');
    setNewPostImage('');
    setShowNewPost(false);
    loadPosts();
    
    toast({
      title: "Sucesso!",
      description: "Post criado com sucesso"
    });
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para curtir posts",
        variant: "destructive"
      });
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.liked) {
      // Remove like
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      await supabase
        .from('posts')
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq('id', postId);
    } else {
      // Add like
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });

      await supabase
        .from('posts')
        .update({ likes_count: post.likes_count + 1 })
        .eq('id', postId);
    }

    loadPosts();
  };

  const addReply = async (postId: string) => {
    if (!replyContent.trim() || !user || !userProfile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para responder",
        variant: "destructive"
      });
      return;
    }

    const initials = userProfile.display_name
      ? userProfile.display_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
      : 'VC';

    const { error } = await supabase
      .from('replies')
      .insert({
        post_id: postId,
        user_id: user.id,
        author_name: userProfile.display_name || userProfile.username || 'Usuário',
        author_initials: initials,
        content: replyContent
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar resposta",
        variant: "destructive"
      });
      return;
    }

    setReplyContent('');
    setReplyingTo('');
    loadPosts();
    
    toast({
      title: "Resposta adicionada!",
      description: "Sua resposta foi postada com sucesso"
    });
  };

  const viewUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        setSelectedUserProfile(profile);
        setShowUserProfile(true);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil do usuário",
        variant: "destructive"
      });
    }
  };

  const connectWithUser = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          connected_user_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Solicitação de conexão enviada"
      });

      loadConnections();
      setShowUserProfile(false);
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação de conexão",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConnection || !user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedConnection,
        content: newMessage
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
      return;
    }

    setNewMessage('');
    loadMessages(selectedConnection);
    
    toast({
      title: "Mensagem enviada!",
      description: "Sua mensagem foi enviada"
    });
  };

  const loadMessages = async (connectionId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${connectionId}),and(sender_id.eq.${connectionId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setChatMessages(prev => ({
      ...prev,
      [connectionId]: data || []
    }));
  };

  useEffect(() => {
    if (selectedConnection) {
      loadMessages(selectedConnection);
    }
  }, [selectedConnection]);

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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
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
                    Conexões ({connections.length})
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
                            <AvatarFallback>US</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">Usuário</div>
                            <div className="text-sm text-muted-foreground">
                              {connection.status === 'connected' ? 'Conectado' : 'Pendente'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {connection.status === 'connected' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedConnection(connection.connected_user_id);
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
                        Chat
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-3 p-4">
                      {(chatMessages[selectedConnection] || []).map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <div className="text-sm">{message.content}</div>
                            <div className="text-xs opacity-70 mt-1">{formatTime(message.created_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 p-4 border-t">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button onClick={sendMessage} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Posts Feed */}
          <div className="space-y-6">
            {/* User Search */}
            <UserSearch 
              currentUserId={user?.id} 
              onConnectionCreated={loadConnections}
            />

            {/* Create Post Dialog */}
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar 
                        className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => viewUserProfile(post.user_id)}
                      >
                        <AvatarFallback className="bg-gradient-warm text-white">
                          {post.author_initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="font-semibold cursor-pointer hover:text-primary transition-colors"
                            onClick={() => viewUserProfile(post.user_id)}
                          >
                            {post.author_name}
                          </span>
                          <span className="text-sm text-muted-foreground">• {formatTime(post.created_at)}</span>
                        </div>
                        <Badge className={getCategoryColor(post.category)} variant="secondary">
                          {post.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground">{post.content}</p>
                    {post.image_url && (
                      <img src={post.image_url} alt="Post" className="rounded-lg max-h-96 w-full object-cover" />
                    )}
                    
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleLike(post.id)}
                        className={post.liked ? 'text-red-500' : ''}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.liked ? 'fill-current' : ''}`} />
                        {post.likes_count}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setReplyingTo(post.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.replies?.length || 0}
                      </Button>
                    </div>

                    {/* Replies */}
                    {post.replies && post.replies.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2 border-muted">
                        {post.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{reply.author_initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{reply.author_name}</span>
                                <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
                              </div>
                              <p className="text-sm">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input */}
                    {replyingTo === post.id && (
                      <div className="flex gap-2 pl-4">
                        <Input
                          placeholder="Escreva uma resposta..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              addReply(post.id);
                            }
                          }}
                        />
                        <Button onClick={() => addReply(post.id)} size="sm">
                          Responder
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* User Profile Dialog */}
            {selectedUserProfile && (
              <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Perfil do Usuário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-primary text-white text-xl">
                          {selectedUserProfile.display_name
                            ? selectedUserProfile.display_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                            : 'US'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedUserProfile.display_name || selectedUserProfile.username}</h3>
                        <p className="text-sm text-muted-foreground">@{selectedUserProfile.username}</p>
                      </div>
                    </div>
                    
                    {selectedUserProfile.bio && (
                      <div>
                        <h4 className="font-medium mb-1">Bio</h4>
                        <p className="text-sm text-muted-foreground">{selectedUserProfile.bio}</p>
                      </div>
                    )}

                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="font-bold">{selectedUserProfile.posts_count || 0}</span>
                        <span className="text-muted-foreground ml-1">Posts</span>
                      </div>
                      <div>
                        <span className="font-bold">{selectedUserProfile.connections_count || 0}</span>
                        <span className="text-muted-foreground ml-1">Conexões</span>
                      </div>
                    </div>

                    {user && user.id !== selectedUserProfile.user_id && (
                      <Button 
                        className="w-full"
                        onClick={() => connectWithUser(selectedUserProfile.user_id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Conectar
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
                <CardDescription>Membros mais ativos esta semana</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className={contributor.color}>
                        {contributor.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{contributor.name}</div>
                      <div className="text-sm text-muted-foreground">{contributor.expertise}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{contributor.posts}</div>
                      <div className="text-xs text-muted-foreground">posts</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categorias Populares</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {['Investimentos', 'FIIs', 'Iniciantes', 'Ações', 'Cripto', 'Geral'].map((category) => (
                  <Button
                    key={category}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setNewPostCategory(category)}
                  >
                    <Badge className={getCategoryColor(category)} variant="secondary">
                      {category}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;
