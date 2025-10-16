import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Política de Privacidade</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Política de Privacidade do Growing</CardTitle>
            <CardDescription>Última atualização: {new Date().toLocaleDateString('pt-BR')}</CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">1. Informações que Coletamos</h2>
              <p className="text-muted-foreground mb-2">
                Coletamos as seguintes informações quando você usa o Growing:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li><strong>Informações de Conta:</strong> Nome, e-mail, username e foto de perfil</li>
                <li><strong>Dados Financeiros:</strong> Gastos, investimentos e metas financeiras que você registra</li>
                <li><strong>Conteúdo:</strong> Posts, comentários e mensagens na comunidade</li>
                <li><strong>Dados de Uso:</strong> Como você interage com o aplicativo</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">2. Como Usamos suas Informações</h2>
              <p className="text-muted-foreground mb-2">
                Usamos suas informações para:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Personalizar sua experiência com análises de IA</li>
                <li>Gerar relatórios e insights financeiros</li>
                <li>Facilitar interações na comunidade</li>
                <li>Enviar notificações importantes sobre o serviço</li>
                <li>Prevenir fraudes e garantir segurança</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">3. Compartilhamento de Informações</h2>
              <p className="text-muted-foreground mb-2">
                Não vendemos suas informações pessoais. Compartilhamos dados apenas:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li>Com seu consentimento explícito</li>
                <li>Na comunidade, conforme suas configurações de privacidade</li>
                <li>Com provedores de serviços que nos ajudam a operar o aplicativo</li>
                <li>Quando exigido por lei</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">4. Segurança de Dados</h2>
              <p className="text-muted-foreground">
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Autenticação segura</li>
                <li>Controles de acesso rigorosos</li>
                <li>Monitoramento contínuo de segurança</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">5. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground mb-2">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li><strong>Acesso:</strong> Confirmar se processamos seus dados</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
                <li><strong>Exclusão:</strong> Solicitar a exclusão de seus dados pessoais</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Para exercer esses direitos, acesse as configurações do seu perfil ou entre em contato conosco.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">6. Exclusão de Dados</h2>
              <p className="text-muted-foreground">
                Você pode excluir sua conta e todos os dados associados a qualquer momento através do menu de perfil. 
                Esta ação é irreversível e resultará na remoção permanente de:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2">
                <li>Informações de perfil</li>
                <li>Dados financeiros registrados</li>
                <li>Posts e comentários na comunidade</li>
                <li>Mensagens e conexões</li>
                <li>Histórico de uso</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">7. Retenção de Dados</h2>
              <p className="text-muted-foreground">
                Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, 
                os dados são removidos permanentemente em até 30 dias, exceto quando a retenção for exigida por lei.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">8. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground">
                Usamos cookies e tecnologias similares para melhorar sua experiência, incluindo:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2">
                <li>Manter você conectado</li>
                <li>Lembrar suas preferências</li>
                <li>Analisar o uso do aplicativo</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">9. Privacidade de Menores</h2>
              <p className="text-muted-foreground">
                O Growing não é destinado a menores de 18 anos. Não coletamos intencionalmente dados de menores.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">10. Alterações nesta Política</h2>
              <p className="text-muted-foreground">
                Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas através do aplicativo.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">11. Contato</h2>
              <p className="text-muted-foreground">
                Para questões sobre privacidade ou para exercer seus direitos sob a LGPD, 
                entre em contato através do chat da IA no aplicativo ou pelo menu de perfil.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">12. Inteligência Artificial</h2>
              <p className="text-muted-foreground">
                Usamos IA para analisar dados financeiros e fornecer recomendações. Os dados usados para análise são:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2">
                <li>Processados de forma segura</li>
                <li>Não compartilhados com terceiros sem consentimento</li>
                <li>Usados apenas para melhorar sua experiência</li>
                <li>Anônimos quando possível</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Privacy;
