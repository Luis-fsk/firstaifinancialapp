import { useState, useEffect } from "react";
import { User, Settings, HelpCircle, FileText, LogOut, Camera, Edit, Trash2, Sparkles, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'fixed' | 'variable' | 'investment';
  target: number;
  progress: number;
  isCompleted: boolean;
}

export function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const { toast } = useToast();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [financialGoals, setFinancialGoals] = useState<Goal[]>([]);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  
  const [profileData, setProfileData] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || "",
  });

  // Load financial goals
  useEffect(() => {
    const loadFinancialGoals = () => {
      const savedGoals = localStorage.getItem('financeGoals');
      if (savedGoals) {
        setFinancialGoals(JSON.parse(savedGoals));
      }
    };

    loadFinancialGoals();

    // Update when localStorage changes
    const interval = setInterval(loadFinancialGoals, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate AI tips when goals are loaded or dialog opens
  const generateAiTips = async () => {
    if (financialGoals.length === 0 || loadingTips) return;
    
    setLoadingTips(true);
    try {
      const { data, error } = await supabase.functions.invoke('financial-tips', {
        body: { goals: financialGoals }
      });

      if (error) {
        console.error('Error generating tips:', error);
        toast({
          title: "Erro ao gerar dicas",
          description: "Não foi possível gerar dicas da IA no momento.",
          variant: "destructive",
        });
        return;
      }

      if (data?.tips) {
        setAiTips(data.tips);
      }
    } catch (error) {
      console.error('Error generating tips:', error);
    } finally {
      setLoadingTips(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      setShowProfileDialog(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        toast({
          title: "Erro no upload",
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfileData({ ...profileData, avatar_url: data.publicUrl });
      
      toast({
        title: "Foto carregada",
        description: "Sua foto de perfil foi carregada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar a foto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        toast({
          title: "Erro",
          description: "Sessão inválida",
          variant: "destructive",
        });
        setIsDeleting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) {
        toast({
          title: "Erro ao deletar conta",
          description: error.message,
          variant: "destructive",
        });
        setIsDeleting(false);
        return;
      }

      if (data?.error) {
        toast({
          title: "Erro ao deletar conta",
          description: data.error,
          variant: "destructive",
        });
        setIsDeleting(false);
        return;
      }

      toast({
        title: "Conta deletada",
        description: "Sua conta foi deletada com sucesso.",
      });
      
      setShowDeleteDialog(false);
      await signOut();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.username} />
                <AvatarFallback>
                  {(profile.display_name || profile.username || user.email)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isPremium && (
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full p-1">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile.display_name || profile.username}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {profile.connections_count || 0} conexões • {profile.posts_count || 0} posts
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Ver e editar perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowHelpDialog(true)}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Ajuda</span>
          </DropdownMenuItem>
          
          {!isPremium && (
            <DropdownMenuItem onClick={() => window.location.href = '/premium'}>
              <Crown className="mr-2 h-4 w-4 text-amber-500" />
              <span className="text-amber-600 font-semibold">Assinar Premium</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={() => {
            setShowReportDialog(true);
            // Generate tips when opening the dialog
            if (financialGoals.length > 0 && aiTips.length === 0) {
              generateAiTips();
            }
          }}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Relatório Financeiro</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.open('/terms', '_blank')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Termos de Uso</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open('/privacy', '_blank')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Política de Privacidade</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Deletar conta</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair da conta</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData.avatar_url} alt="Profile" />
                  <AvatarFallback>
                    {(profileData.display_name || profile.username)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="display_name">Nome de Exibição</Label>
              <Input
                id="display_name"
                value={profileData.display_name}
                onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Conte um pouco sobre você"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Estatísticas</Label>
              <div className="text-sm text-muted-foreground">
                <p>{profile.connections_count || 0} conexões</p>
                <p>{profile.posts_count || 0} postagens</p>
                <p>Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajuda</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Como usar o Growing</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  O Growing oferece controle inteligente das suas finanças com IA integrada.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">Funcionalidades principais</h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Assistente de IA para finanças</li>
                  <li>• Dashboard interativo</li>
                  <li>• Relatórios automáticos</li>
                  <li>• Notícias financeiras</li>
                  <li>• Comunidade de usuários</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Suporte</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Para dúvidas ou problemas, entre em contato através do chat da IA.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Financial Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relatório Financeiro Mensal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {financialGoals.length > 0 ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-warm text-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Gastos Fixos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        R$ {financialGoals.find(g => g.category === 'fixed')?.progress.toFixed(2) || '0,00'}
                      </p>
                      <p className="text-sm text-white/80 mt-1">
                        Meta: R$ {financialGoals.find(g => g.category === 'fixed')?.target.toFixed(2) || '0,00'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary text-primary-foreground">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Gastos Variáveis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        R$ {financialGoals.find(g => g.category === 'variable')?.progress.toFixed(2) || '0,00'}
                      </p>
                      <p className="text-sm opacity-80 mt-1">
                        Meta: R$ {financialGoals.find(g => g.category === 'variable')?.target.toFixed(2) || '0,00'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="col-span-2 bg-secondary text-secondary-foreground">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Investimentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        R$ {financialGoals.find(g => g.category === 'investment')?.progress.toFixed(2) || '0,00'}
                      </p>
                      <p className="text-sm opacity-80 mt-1">
                        Meta: R$ {financialGoals.find(g => g.category === 'investment')?.target.toFixed(2) || '0,00'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Goals Progress */}
                <div>
                  <h4 className="font-medium mb-3">Progresso das Metas</h4>
                  <div className="space-y-4">
                    {financialGoals.map((goal) => {
                      const percentage = Math.min((goal.progress / goal.target) * 100, 100);
                      const isOverBudget = goal.category !== 'investment' && goal.progress > goal.target;
                      
                      return (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{goal.title}</p>
                              <p className="text-xs text-muted-foreground">{goal.description}</p>
                            </div>
                            <span className={`text-sm font-medium ${
                              goal.isCompleted ? 'text-green-500' : 
                              isOverBudget ? 'text-red-500' : 
                              'text-muted-foreground'
                            }`}>
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Resumo do Mês</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>✅ {financialGoals.filter(g => g.isCompleted).length} de {financialGoals.length} metas concluídas</p>
                    <p>💰 Total investido: R$ {financialGoals.find(g => g.category === 'investment')?.progress.toFixed(2) || '0,00'}</p>
                    <p>📊 Total de gastos: R$ {(
                      (financialGoals.find(g => g.category === 'fixed')?.progress || 0) +
                      (financialGoals.find(g => g.category === 'variable')?.progress || 0)
                    ).toFixed(2)}</p>
                  </div>
                </div>

                {/* AI Tips */}
                <div className="p-4 bg-gradient-warm text-white rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Recomendações da IA
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateAiTips}
                      disabled={loadingTips}
                      className="text-white hover:bg-white/20 h-7 px-2"
                    >
                      {loadingTips ? "Gerando..." : "Atualizar"}
                    </Button>
                  </div>
                  {loadingTips ? (
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Gerando dicas personalizadas...
                    </div>
                  ) : aiTips.length > 0 ? (
                    <ul className="text-sm text-white/90 space-y-2">
                      {aiTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-white/80">
                      Clique em "Atualizar" para gerar dicas personalizadas com base em suas finanças.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum dado financeiro encontrado. Adicione gastos na página de Finanças Pessoais para ver seu relatório.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Deletar Conta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja deletar sua conta? Esta ação é irreversível e todos os seus dados serão permanentemente removidos.
              </p>
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">⚠️ Atenção:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Todos os seus dados financeiros serão apagados</li>
                  <li>• Seu histórico de conversas com IA será perdido</li>
                  <li>• Suas postagens na comunidade serão removidas</li>
                  <li>• Esta ação não pode ser desfeita</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
            >
              {isDeleting ? "Deletando..." : "Deletar Conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deletar Conta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja deletar sua conta? Esta ação é permanente e não pode ser desfeita.
              </p>
              <p className="text-sm font-medium text-destructive">
                Todos os seus dados serão removidos permanentemente.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
            >
              {isDeleting ? "Deletando..." : "Deletar Conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}