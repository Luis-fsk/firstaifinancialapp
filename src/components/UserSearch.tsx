import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SAFE_PROFILE_FIELDS } from "@/lib/profileQueries";

interface UserSearchProps {
  currentUserId?: string;
  onConnectionCreated?: () => void;
}

interface SearchResult {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  connectionStatus?: 'none' | 'pending' | 'connected';
}

export const UserSearch = ({ currentUserId, onConnectionCreated }: UserSearchProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const searchUsers = async () => {
    if (!searchQuery.trim() || !currentUserId) return;

    setSearching(true);

    try {
      // Buscar usuários por username, display_name ou ID (somente campos seguros)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(SAFE_PROFILE_FIELDS)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,user_id.eq.${searchQuery}`)
        .neq('user_id', currentUserId)
        .limit(10);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Nenhum usuário encontrado"
        });
        setSearchResults([]);
        setSearching(false);
        return;
      }

      // Verificar status de conexão para cada perfil
      const resultsWithStatus = await Promise.all(
        profiles.map(async (profile) => {
          const { data: connection } = await supabase
            .from('connections')
            .select('status')
            .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${profile.user_id}),and(user_id.eq.${profile.user_id},connected_user_id.eq.${currentUserId})`)
            .single();

          return {
            id: profile.id,
            user_id: profile.user_id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            connectionStatus: (connection?.status || 'none') as 'none' | 'pending' | 'connected'
          };
        })
      );

      setSearchResults(resultsWithStatus);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar usuários",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const sendConnectionRequest = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: currentUserId,
          connected_user_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Solicitação de conexão enviada"
      });

      // Atualizar o status local
      setSearchResults(prev =>
        prev.map(result =>
          result.user_id === targetUserId
            ? { ...result, connectionStatus: 'pending' as const }
            : result
        )
      );

      onConnectionCreated?.();
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação de conexão",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Buscar Usuários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por nome, username ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
          />
          <Button onClick={searchUsers} disabled={searching}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(result.display_name || result.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{result.display_name || result.username}</p>
                    <p className="text-sm text-muted-foreground">@{result.username}</p>
                  </div>
                </div>

                {result.connectionStatus === 'connected' ? (
                  <Button variant="outline" size="sm" disabled>
                    <Check className="h-4 w-4 mr-1" />
                    Conectado
                  </Button>
                ) : result.connectionStatus === 'pending' ? (
                  <Button variant="outline" size="sm" disabled>
                    Pendente
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => sendConnectionRequest(result.user_id)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Conectar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
