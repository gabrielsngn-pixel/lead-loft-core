import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContratoData, DADOS_LOFT } from "./types";
import { formatCurrency, formatPercent } from "@/lib/simulador";
import loftLogo from "@/assets/loft-mais-negocio-logo.jpg";

interface ContratoPreviewProps {
  data: ContratoData;
  forPrint?: boolean;
}

export function ContratoPreview({ data, forPrint = false }: ContratoPreviewProps) {
  const { dadosIncorporadora, dadosProjeto, dataAprovacao } = data;
  
  const dataFormatada = format(new Date(dataAprovacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const enderecoIncorporadora = `${dadosIncorporadora.endereco}, ${dadosIncorporadora.cidade} - ${dadosIncorporadora.estado}${dadosIncorporadora.cep ? `, CEP ${dadosIncorporadora.cep}` : ""}`;

  // Determinar numeração das cláusulas baseado em ter registro ou não
  const hasRegistro = dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0;
  const clausulaObrigacoes = hasRegistro ? 5 : 4;
  const clausulaPrazo = hasRegistro ? 6 : 5;
  const clausulaConfidencialidade = hasRegistro ? 7 : 6;
  const clausulaDisposicoesGerais = hasRegistro ? 8 : 7;
  const clausulaForo = hasRegistro ? 9 : 8;

  return (
    <div className={`bg-white text-black ${forPrint ? "p-0" : "p-8 rounded-lg border shadow-sm"}`} style={{ fontFamily: "'Inter', sans-serif", fontSize: "11pt", lineHeight: "1.6" }}>
      
      {/* Cabeçalho com Logo */}
      <div className="flex justify-between items-start mb-8">
        <img src={loftLogo} alt="Loft Mais Negócio" className="h-12" />
        <p className="text-sm text-gray-600">São Paulo, {dataFormatada}</p>
      </div>

      {/* Título */}
      <h1 className="text-center font-bold text-lg mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERMEDIAÇÃO DE CRÉDITO IMOBILIÁRIO, REPASSE E REGISTRO
      </h1>

      {/* Preâmbulo */}
      <div className="space-y-4 text-justify mb-8">
        <p>Pelo presente instrumento particular e na melhor forma de direito, de um lado:</p>
        
        <p>
          <strong>{DADOS_LOFT.razaoSocial}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº {DADOS_LOFT.cnpj}, 
          com sede na cidade de São Paulo/SP, doravante denominada simplesmente "CONTRATADA" ou "LOFT";
        </p>

        <p>E, de outro lado:</p>

        <p>
          <strong>{dadosIncorporadora.razaoSocial || "[RAZÃO SOCIAL]"}</strong>
          {dadosIncorporadora.nomeFantasia && `, nome fantasia "${dadosIncorporadora.nomeFantasia}"`}, 
          pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº {dadosIncorporadora.cnpj || "[CNPJ]"}, 
          com sede em {enderecoIncorporadora || "[ENDEREÇO]"}, neste ato representada por seu(sua) representante legal, {" "}
          <strong>{dadosIncorporadora.representanteLegal || "[REPRESENTANTE]"}</strong>, 
          portador(a) do CPF nº {dadosIncorporadora.cpfRepresentante || "[CPF]"}, 
          doravante denominada simplesmente "CONTRATANTE" ou "INCORPORADORA";
        </p>

        <p>
          Têm entre si, justo e acordado, celebrar o presente Contrato de Prestação de Serviços de Intermediação de 
          Crédito Imobiliário, Repasse e Registro, que se regerá pelas cláusulas e condições seguintes, bem como 
          pelas disposições legais aplicáveis.
        </p>
      </div>

      {/* CLÁUSULA PRIMEIRA - DO OBJETO */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3">CLÁUSULA PRIMEIRA – DO OBJETO</h2>
        <p className="text-justify mb-2">
          <strong>1.1.</strong> O presente contrato tem como objeto a prestação, pela LOFT INTERMEDIADORA LTDA, dos serviços de:
        </p>
        <ul className="list-disc pl-8 space-y-1 mb-3">
          <li>Originação e acompanhamento de crédito imobiliário;</li>
          <li>Assessoria no repasse bancário;</li>
          <li>Assessoria para registro dos contratos de financiamento;</li>
          <li>Monitoramento da jornada do comprador até a liberação dos recursos.</li>
        </ul>
        <p className="text-justify">
          <strong>1.2.</strong> Todos os serviços previstos neste contrato serão prestados sob responsabilidade exclusiva da LOFT, 
          que responderá integralmente perante a INCORPORADORA pela sua execução.
        </p>
      </div>

      {/* CLÁUSULA SEGUNDA - DO ESCOPO DOS SERVIÇOS */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3">CLÁUSULA SEGUNDA – DO ESCOPO DOS SERVIÇOS</h2>
        <p className="text-justify mb-2">
          <strong>2.1.</strong> <em>Dos Serviços de Crédito:</em> A CONTRATADA executará: contato com clientes; análise de documentação; 
          submissão às instituições financeiras; acompanhamento do processo.
        </p>
        <p className="text-justify mb-2">
          <strong>2.2.</strong> <em>Dos Serviços de Repasse:</em> Emissão de fichas cadastrais; análise jurídica; liberação de minuta; 
          acompanhamento de assinatura.
        </p>
        <p className="text-justify mb-2">
          <strong>2.3.</strong> <em>Dos Serviços de Registro:</em> Providências junto à Prefeitura para ITBI; acompanhamento cartorário; 
          entrega de via registrada.
        </p>
        <p className="text-justify">
          <strong>2.4.</strong> A CONTRATADA poderá operar com modalidade digital de assinatura e registro.
        </p>
      </div>

      {/* CLÁUSULA TERCEIRA - DAS CONDIÇÕES COMERCIAIS */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3">CLÁUSULA TERCEIRA – DAS CONDIÇÕES COMERCIAIS</h2>
        <p className="text-justify mb-3">
          <strong>3.1.</strong> As condições comerciais acordadas para o empreendimento objeto deste contrato são as seguintes:
        </p>
        
        {/* Tabela de Condições Comerciais */}
        <table className="w-full border-collapse mb-4" style={{ border: "1px solid #e5e5e5" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
              <td className="p-3 font-medium" style={{ borderRight: "1px solid #e5e5e5", width: "60%" }}>
                Valor Geral de Vendas (VGV):
              </td>
              <td className="p-3 text-right font-semibold">
                {formatCurrency(dadosProjeto.vgvTotal)}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
              <td className="p-3 font-medium" style={{ borderRight: "1px solid #e5e5e5" }}>
                Número de unidades contratadas:
              </td>
              <td className="p-3 text-right font-semibold">
                {dadosProjeto.unidades} unidades
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
              <td className="p-3 font-medium" style={{ borderRight: "1px solid #e5e5e5" }}>
                Ticket médio por unidade:
              </td>
              <td className="p-3 text-right font-semibold">
                {formatCurrency(dadosProjeto.ticketMedio)}
              </td>
            </tr>
            {dadosProjeto.comissaoIncorporador > 0 && (
              <tr style={{ borderBottom: hasRegistro ? "1px solid #e5e5e5" : "none" }}>
                <td className="p-3 font-medium" style={{ borderRight: "1px solid #e5e5e5" }}>
                  Comissão da incorporadora:
                </td>
                <td className="p-3 text-right font-semibold">
                  {formatPercent(dadosProjeto.comissaoIncorporador)}
                </td>
              </tr>
            )}
            {hasRegistro && (
              <>
                <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <td className="p-3 font-medium" style={{ borderRight: "1px solid #e5e5e5" }}>
                    Valor de registro por unidade:
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {formatCurrency(dadosProjeto.valorRegistroPorUnidade)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium" style={{ borderRight: "1px solid #e5e5e5" }}>
                    Receita de registro total prevista:
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {formatCurrency(dadosProjeto.receitaRegistroTotal)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <p className="text-justify mb-2">
          <strong>3.2.</strong> A remuneração da CONTRATADA será proveniente das comissões bancárias decorrentes da intermediação.
        </p>
        <p className="text-justify">
          <strong>3.3.</strong> A LOFT é a única responsável pela coordenação, gestão e entrega dos serviços contratados, 
          não mantendo a INCORPORADORA qualquer vínculo contratual com terceiros eventualmente envolvidos na execução operacional.
        </p>
      </div>

      {/* CLÁUSULA DA COBRANÇA E REPASSE DE REGISTRO (condicional) */}
      {hasRegistro && (
        <div className="mb-6">
          <h2 className="font-bold text-base mb-3">CLÁUSULA QUARTA – DA COBRANÇA E DO REPASSE DOS VALORES DE REGISTRO</h2>
          <p className="text-justify mb-2">
            <strong>4.1.</strong> A cobrança dos valores referentes aos serviços de registro dos contratos de financiamento 
            imobiliário será realizada diretamente pela INCORPORADORA junto ao cliente final, conforme as condições 
            comerciais acordadas entre as partes.
          </p>
          <p className="text-justify mb-2">
            <strong>4.2.</strong> A responsabilidade pela cobrança, recebimento e repasse dos valores de registro à LOFT 
            INTERMEDIADORA LTDA será exclusivamente da INCORPORADORA, não cabendo à LOFT qualquer obrigação de cobrança 
            direta ao cliente final.
          </p>
          <p className="text-justify mb-2">
            <strong>4.3.</strong> A INCORPORADORA obriga-se a repassar à LOFT os valores correspondentes à receita de 
            registro a cada processo de financiamento repassado, independentemente do efetivo recebimento do valor 
            junto ao cliente final.
          </p>
          <p className="text-justify mb-2">
            <strong>4.4.</strong> A eventual inadimplência do cliente final não exime a INCORPORADORA da obrigação de 
            pagamento à LOFT.
          </p>
          <p className="text-justify mb-2">
            <strong>4.5.</strong> As partes reconhecem que os valores de registro, quando previstos neste contrato, 
            constituem receita da operação e são parte integrante do equilíbrio econômico-financeiro da presente contratação.
          </p>
          <p className="text-justify">
            <strong>4.6.</strong> O não repasse dos valores de registro nos termos deste contrato caracterizará 
            inadimplemento contratual, sujeitando a INCORPORADORA às penalidades previstas neste instrumento e 
            na legislação aplicável.
          </p>
        </div>
      )}

      {/* CLÁUSULA DAS OBRIGAÇÕES DAS PARTES */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3">CLÁUSULA {hasRegistro ? "QUINTA" : "QUARTA"} – DAS OBRIGAÇÕES DAS PARTES</h2>
        <p className="text-justify mb-2">
          <strong>{clausulaObrigacoes}.1.</strong> <em>São obrigações da CONTRATADA:</em> Executar os serviços com diligência; 
          manter a CONTRATANTE informada; zelar pelo sigilo; cumprir normas aplicáveis.
        </p>
        <p className="text-justify">
          <strong>{clausulaObrigacoes}.2.</strong> <em>São obrigações da CONTRATANTE:</em> Fornecer informações e documentos 
          necessários; colaborar com o andamento; efetuar pagamentos; comunicar alterações relevantes.
        </p>
      </div>

      {/* CLÁUSULA DO PRAZO */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3">CLÁUSULA {hasRegistro ? "SEXTA" : "QUINTA"} – DO PRAZO</h2>
        <p className="text-justify mb-2">
          <strong>{clausulaPrazo}.1.</strong> O contrato vigorará pelo prazo necessário à conclusão dos serviços, 
          podendo ser rescindido com 30 dias de antecedência.
        </p>
        <p className="text-justify">
          <strong>{clausulaPrazo}.2.</strong> A rescisão não prejudicará a remuneração por serviços já prestados.
        </p>
      </div>

      {/* CLÁUSULA DA CONFIDENCIALIDADE */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3">CLÁUSULA {hasRegistro ? "SÉTIMA" : "SEXTA"} – DA CONFIDENCIALIDADE</h2>
        <p className="text-justify">
          <strong>{clausulaConfidencialidade}.1.</strong> As partes comprometem-se a manter sigilo sobre informações 
          comerciais, financeiras e estratégicas, pelo prazo de 5 (cinco) anos após o término da relação contratual.
        </p>
      </div>

      {/* CLÁUSULA DAS DISPOSIÇÕES GERAIS */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3">CLÁUSULA {hasRegistro ? "OITAVA" : "SÉTIMA"} – DAS DISPOSIÇÕES GERAIS</h2>
        <p className="text-justify mb-2">
          <strong>{clausulaDisposicoesGerais}.1.</strong> Este contrato reflete as condições comerciais aprovadas na 
          simulação de viabilidade.
        </p>
        <p className="text-justify mb-2">
          <strong>{clausulaDisposicoesGerais}.2.</strong> Alterações somente serão válidas se formalizadas por escrito.
        </p>
        <p className="text-justify mb-2">
          <strong>{clausulaDisposicoesGerais}.3.</strong> A tolerância não implicará novação ou renúncia.
        </p>
        <p className="text-justify">
          <strong>{clausulaDisposicoesGerais}.4.</strong> Este contrato obriga as partes e seus sucessores.
        </p>
      </div>

      {/* CLÁUSULA DO FORO */}
      <div className="mb-8">
        <h2 className="font-bold text-base mb-3">CLÁUSULA {hasRegistro ? "NONA" : "OITAVA"} – DO FORO</h2>
        <p className="text-justify">
          <strong>{clausulaForo}.1.</strong> As partes elegem o foro da Comarca de São Paulo, Estado de São Paulo, 
          para dirimir quaisquer controvérsias.
        </p>
      </div>

      {/* Fechamento */}
      <p className="text-justify mb-8">
        E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de 
        igual teor e forma, na presença de 2 (duas) testemunhas, para que produza seus jurídicos e legais efeitos.
      </p>

      <p className="text-center mb-12">São Paulo, {dataFormatada}.</p>

      {/* ASSINATURAS */}
      <h2 className="font-bold text-base mb-6 text-center">ASSINATURAS</h2>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Assinatura Loft */}
        <div className="text-center">
          <div className="border-b border-black w-full mb-2 h-12"></div>
          <p className="font-bold">{DADOS_LOFT.razaoSocial}</p>
          <p className="text-sm">CNPJ: {DADOS_LOFT.cnpj}</p>
          <p className="text-sm mt-2">Nome: _______________________</p>
          <p className="text-sm">Cargo: _______________________</p>
        </div>

        {/* Assinatura Incorporadora */}
        <div className="text-center">
          <div className="border-b border-black w-full mb-2 h-12"></div>
          <p className="font-bold">{dadosIncorporadora.razaoSocial || "[RAZÃO SOCIAL]"}</p>
          <p className="text-sm">CNPJ: {dadosIncorporadora.cnpj || "[CNPJ]"}</p>
          <p className="text-sm mt-2">Nome: {dadosIncorporadora.representanteLegal || "_______________________"}</p>
          <p className="text-sm">CPF: {dadosIncorporadora.cpfRepresentante || "_______________________"}</p>
        </div>
      </div>

      {/* TESTEMUNHAS */}
      <h2 className="font-bold text-base mb-6 text-center">TESTEMUNHAS:</h2>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-b border-black w-full mb-2 h-8"></div>
          <p className="text-sm">Nome: _______________________</p>
          <p className="text-sm">CPF: _______________________</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black w-full mb-2 h-8"></div>
          <p className="text-sm">Nome: _______________________</p>
          <p className="text-sm">CPF: _______________________</p>
        </div>
      </div>

      {/* Rodapé */}
      <p className="text-center text-xs text-gray-500 mt-8 italic">
        "Ao assinar este documento, as partes concordam integralmente com as condições comerciais aprovadas na simulação de viabilidade."
      </p>
    </div>
  );
}
