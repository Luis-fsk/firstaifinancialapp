import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
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
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Termos de Uso</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Termos de Uso do Growing</CardTitle>
            <CardDescription>Última atualização: {new Date().toLocaleDateString('pt-BR')}</CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e usar o Growing, você aceita e concorda em ficar vinculado aos termos e condições deste acordo. 
                Se você não concordar com qualquer parte destes termos, não deverá usar nosso aplicativo.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground">
                O Growing é uma plataforma de gestão financeira pessoal que oferece:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2">
                <li>Assistente de IA para análise financeira</li>
                <li>Gerenciamento de gastos e investimentos</li>
                <li>Notícias e análises do mercado financeiro</li>
                <li>Análise de ações e investimentos</li>
                <li>Comunidade de usuários</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">3. Cadastro e Conta</h2>
              <p className="text-muted-foreground">
                Para usar nossos serviços, você deve:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2">
                <li>Fornecer informações precisas e completas</li>
                <li>Manter a segurança de sua senha</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">4. Uso Aceitável</h2>
              <p className="text-muted-foreground">
                Você concorda em não usar o Growing para:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2">
                <li>Violar quaisquer leis ou regulamentos</li>
                <li>Transmitir conteúdo ofensivo, difamatório ou ilegal</li>
                <li>Interferir com a segurança do aplicativo</li>
                <li>Tentar obter acesso não autorizado</li>
                <li>Usar o serviço para spam ou fraude</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">5. Dados Financeiros</h2>
              <p className="text-muted-foreground">
                O Growing não é um serviço de consultoria financeira. As análises e recomendações fornecidas são apenas para fins informativos. 
                Você é responsável por suas próprias decisões financeiras.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">6. Propriedade Intelectual</h2>
              <p className="text-muted-foreground">
                Todo o conteúdo, recursos e funcionalidades do Growing são de propriedade exclusiva e protegidos por leis de direitos autorais.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">7. Exclusão de Conta</h2>
              <p className="text-muted-foreground">
                Você pode excluir sua conta a qualquer momento através das configurações do perfil. 
                A exclusão da conta resultará na remoção permanente de todos os seus dados.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">8. Modificações</h2>
              <p className="text-muted-foreground">
                Reservamos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre mudanças significativas.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">9. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground">
                O Growing é fornecido "como está" sem garantias de qualquer tipo. Não nos responsabilizamos por perdas financeiras 
                decorrentes do uso de nossas análises ou recomendações.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">10. Contato</h2>
              <p className="text-muted-foreground">
                Para questões sobre estes termos, entre em contato através do chat da IA no aplicativo.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;
