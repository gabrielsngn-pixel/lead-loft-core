import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContratoData, DADOS_LOFT } from "./types";
import { formatCurrency, formatPercent } from "@/lib/simulador";

interface ContratoPreviewProps {
  data: ContratoData;
  forPrint?: boolean;
}

export function ContratoPreview({ data, forPrint = false }: ContratoPreviewProps) {
  const { dadosIncorporadora, dadosProjeto, dataAprovacao, numeroContrato } = data;
  
  const dataFormatada = format(new Date(dataAprovacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const enderecoIncorporadora = `${dadosIncorporadora.endereco}, ${dadosIncorporadora.cidade} - ${dadosIncorporadora.estado}${dadosIncorporadora.cep ? `, CEP ${dadosIncorporadora.cep}` : ""}`;

  return (
    <div className={`bg-white text-foreground ${forPrint ? "p-0" : "p-8 rounded-lg border shadow-sm"}`}>
      {/* Cabeçalho */}
      <div className="text-center mb-8 pb-6 border-b-2 border-primary">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg gradient-loft flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div className="text-left">
            <p className="font-display text-xl font-bold text-secondary">LOFT</p>
            <p className="text-xs text-primary font-medium tracking-wider">MAIS NEGÓCIO</p>
          </div>
        </div>
        <h1 className="font-display text-xl font-bold text-secondary mt-4">
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS
        </h1>
        <h2 className="text-sm text-muted-foreground mt-1">
          Crédito Imobiliário, Repasse e Registro
        </h2>
        <p className="text-xs text-muted-foreground mt-2">
          Contrato nº {numeroContrato} • {dataFormatada}
        </p>
      </div>

      {/* Corpo do Contrato */}
      <div className="space-y-6 text-sm leading-relaxed">
        {/* Preâmbulo */}
        <p className="text-justify">
          Pelo presente instrumento particular, de um lado:
        </p>

        <div className="bg-secondary/5 p-4 rounded-lg border border-secondary/20">
          <p className="font-semibold text-secondary">{DADOS_LOFT.razaoSocial}</p>
          <p className="text-muted-foreground">
            Pessoa jurídica de direito privado, inscrita no CNPJ sob nº {DADOS_LOFT.cnpj}, 
            com sede em {DADOS_LOFT.endereco}, doravante denominada simplesmente <strong>"LOFT"</strong>;
          </p>
        </div>

        <p className="text-justify">E, de outro lado:</p>

        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <p className="font-semibold text-primary">{dadosIncorporadora.razaoSocial || "[RAZÃO SOCIAL]"}</p>
          <p className="text-muted-foreground">
            Pessoa jurídica de direito privado, inscrita no CNPJ sob nº {dadosIncorporadora.cnpj || "[CNPJ]"}, 
            com sede em {enderecoIncorporadora || "[ENDEREÇO]"}, neste ato representada por{" "}
            <strong>{dadosIncorporadora.representanteLegal || "[REPRESENTANTE]"}</strong>, 
            portador do CPF nº {dadosIncorporadora.cpfRepresentante || "[CPF]"}, 
            doravante denominada simplesmente <strong>"INCORPORADORA"</strong>;
          </p>
        </div>

        <p className="text-justify">
          Resolvem celebrar o presente Contrato de Prestação de Serviços, mediante as cláusulas e condições a seguir estabelecidas.
        </p>

        {/* Cláusula 1 - Objeto */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-secondary border-b border-secondary/20 pb-2">
            CLÁUSULA 1 – DO OBJETO
          </h3>
          <p className="text-justify">
            <strong>1.1.</strong> O presente contrato tem como objeto a prestação, pela LOFT, dos seguintes serviços:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Originação e acompanhamento de crédito imobiliário;</li>
            <li>Assessoria no repasse bancário junto às instituições financeiras;</li>
            <li>Assessoria para registro dos contratos de financiamento;</li>
            <li>Monitoramento da jornada do comprador até a liberação dos recursos.</li>
          </ul>
          <p className="text-justify">
            <strong>1.2.</strong> Todos os serviços previstos neste contrato serão prestados sob responsabilidade 
            exclusiva da LOFT, que responderá integralmente perante a INCORPORADORA pela sua execução.
          </p>
        </div>

        {/* Cláusula 2 - Escopo */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-secondary border-b border-secondary/20 pb-2">
            CLÁUSULA 2 – DO ESCOPO OPERACIONAL
          </h3>
          <p className="text-justify">
            <strong>2.1.</strong> Os serviços incluem, entre outras atividades:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Pré-qualificação multibanco dos compradores;</li>
            <li>Interface com instituições financeiras para análise e aprovação de crédito;</li>
            <li>Gestão documental e acompanhamento das análises;</li>
            <li>Apoio à assinatura dos contratos de financiamento;</li>
            <li>Assessoria para registro e liberação dos recursos.</li>
          </ul>
          <p className="text-justify">
            <strong>2.2.</strong> A operação poderá ocorrer de forma digital, sem necessidade de assinatura física 
            de documentos, conforme regras das instituições financeiras envolvidas.
          </p>
        </div>

        {/* Cláusula 3 - Condições Comerciais */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-secondary border-b border-secondary/20 pb-2">
            CLÁUSULA 3 – DAS CONDIÇÕES COMERCIAIS
          </h3>
          <p className="text-justify">
            <strong>3.1.</strong> As condições comerciais acordadas para o empreendimento são:
          </p>
          
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">VGV Total</p>
                <p className="font-semibold text-primary">{formatCurrency(dadosProjeto.vgvTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Unidades Contratadas</p>
                <p className="font-semibold">{dadosProjeto.unidades}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Ticket Médio</p>
                <p className="font-semibold">{formatCurrency(dadosProjeto.ticketMedio)}</p>
              </div>
              {dadosProjeto.comissaoIncorporador > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Comissão Incorporadora</p>
                  <p className="font-semibold">{formatPercent(dadosProjeto.comissaoIncorporador)}</p>
                </div>
              )}
            </div>
            {dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 && (
              <div className="pt-2 border-t border-border mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Valor Registro por Unidade</p>
                    <p className="font-semibold">{formatCurrency(dadosProjeto.valorRegistroPorUnidade)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Receita de Registro Total</p>
                    <p className="font-semibold text-primary">{formatCurrency(dadosProjeto.receitaRegistroTotal)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-justify">
            <strong>3.2.</strong> A remuneração da LOFT será proveniente das comissões bancárias obtidas junto 
            às instituições financeiras, conforme percentuais praticados no mercado, não cabendo à 
            INCORPORADORA qualquer obrigação de pagamento direto à LOFT a título de comissão bancária.
          </p>
        </div>

        {/* Cláusula de Registro (condicional) */}
        {dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-secondary border-b border-secondary/20 pb-2">
              CLÁUSULA 4 – DA COBRANÇA E DO REPASSE DOS VALORES DE REGISTRO
            </h3>
            <p className="text-justify">
              <strong>4.1.</strong> A cobrança dos valores referentes aos serviços de registro dos contratos 
              de financiamento imobiliário será realizada diretamente pela INCORPORADORA junto ao cliente 
              final, conforme as condições comerciais acordadas entre as partes.
            </p>
            <p className="text-justify">
              <strong>4.2.</strong> A responsabilidade pela cobrança, recebimento e repasse dos valores de 
              registro à LOFT será exclusivamente da INCORPORADORA, não cabendo à LOFT qualquer obrigação 
              de cobrança direta ao cliente final.
            </p>
            <p className="text-justify">
              <strong>4.3.</strong> A INCORPORADORA obriga-se a repassar à LOFT os valores correspondentes 
              à receita de registro a cada processo de financiamento repassado, independentemente do 
              efetivo recebimento do valor junto ao cliente final.
            </p>
            <p className="text-justify">
              <strong>4.4.</strong> A eventual inadimplência do cliente final não exime a INCORPORADORA 
              da obrigação de pagamento à LOFT.
            </p>
            <p className="text-justify">
              <strong>4.5.</strong> As partes reconhecem que os valores de registro, quando previstos neste 
              contrato, constituem receita da operação e são parte integrante do equilíbrio econômico-financeiro 
              da presente contratação.
            </p>
            <p className="text-justify">
              <strong>4.6.</strong> O não repasse dos valores de registro nos termos deste contrato 
              caracterizará inadimplemento contratual, sujeitando a INCORPORADORA às penalidades 
              previstas neste instrumento e na legislação aplicável.
            </p>
          </div>
        )}

        {/* Cláusula de Responsabilidade */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-secondary border-b border-secondary/20 pb-2">
            CLÁUSULA {dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "5" : "4"} – DA RESPONSABILIDADE
          </h3>
          <p className="text-justify">
            <strong>{dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "5.1" : "4.1"}.</strong> A LOFT 
            é a única responsável pela coordenação, gestão e entrega dos serviços contratados, não mantendo 
            a INCORPORADORA qualquer vínculo contratual com terceiros eventualmente envolvidos na execução operacional.
          </p>
        </div>

        {/* Cláusula de Prazo */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-secondary border-b border-secondary/20 pb-2">
            CLÁUSULA {dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "6" : "5"} – DO PRAZO
          </h3>
          <p className="text-justify">
            <strong>{dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "6.1" : "5.1"}.</strong> O presente 
            contrato vigorará pelo prazo necessário à conclusão dos serviços relacionados às unidades 
            contratadas, podendo ser encerrado mediante comum acordo entre as partes, mediante notificação 
            prévia de 30 (trinta) dias.
          </p>
        </div>

        {/* Cláusula de Confidencialidade */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-secondary border-b border-secondary/20 pb-2">
            CLÁUSULA {dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "7" : "6"} – DA CONFIDENCIALIDADE
          </h3>
          <p className="text-justify">
            <strong>{dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "7.1" : "6.1"}.</strong> As partes 
            comprometem-se a manter sigilo sobre todas as informações confidenciais trocadas em razão 
            deste contrato, incluindo dados de clientes, condições comerciais e demais informações 
            estratégicas, pelo prazo de 5 (cinco) anos após o término da relação contratual.
          </p>
        </div>

        {/* Disposições Gerais */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-secondary border-b border-secondary/20 pb-2">
            CLÁUSULA {dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "8" : "7"} – DAS DISPOSIÇÕES GERAIS
          </h3>
          <p className="text-justify">
            <strong>{dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "8.1" : "7.1"}.</strong> Este 
            contrato reflete as condições comerciais aprovadas na simulação realizada entre as partes.
          </p>
          <p className="text-justify">
            <strong>{dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "8.2" : "7.2"}.</strong> Eventuais 
            ajustes ou alterações nas condições aqui pactuadas deverão ser formalizados por escrito, 
            mediante termo aditivo assinado por ambas as partes.
          </p>
          <p className="text-justify">
            <strong>{dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0 ? "8.3" : "7.3"}.</strong> As partes 
            elegem o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias oriundas 
            deste instrumento, renunciando a qualquer outro, por mais privilegiado que seja.
          </p>
        </div>

        {/* Data e Local */}
        <p className="text-center mt-8 text-muted-foreground">
          São Paulo, {dataFormatada}.
        </p>

        {/* Assinaturas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-border">
          {/* Assinatura Loft */}
          <div className="text-center">
            <div className="border-b border-foreground w-48 mx-auto mb-2"></div>
            <p className="font-semibold text-secondary">{DADOS_LOFT.razaoSocial}</p>
            <p className="text-sm text-muted-foreground">CNPJ: {DADOS_LOFT.cnpj}</p>
            <div className="mt-4 space-y-1">
              <p className="text-sm">Nome: _______________________</p>
              <p className="text-sm">Cargo: _______________________</p>
            </div>
          </div>

          {/* Assinatura Incorporadora */}
          <div className="text-center">
            <div className="border-b border-foreground w-48 mx-auto mb-2"></div>
            <p className="font-semibold text-primary">{dadosIncorporadora.razaoSocial || "[RAZÃO SOCIAL]"}</p>
            <p className="text-sm text-muted-foreground">CNPJ: {dadosIncorporadora.cnpj || "[CNPJ]"}</p>
            <div className="mt-4 space-y-1">
              <p className="text-sm">Nome: {dadosIncorporadora.representanteLegal || "_______________________"}</p>
              <p className="text-sm">CPF: {dadosIncorporadora.cpfRepresentante || "_______________________"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
