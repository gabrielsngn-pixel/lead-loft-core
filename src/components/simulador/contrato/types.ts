// Tipos para o fluxo de contrato

export interface DadosIncorporadora {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  representanteLegal: string;
  cpfRepresentante: string;
  cargoRepresentante: string;
  email: string;
  telefone: string;
}

export interface DadosProjeto {
  vgvTotal: number;
  unidades: number;
  ticketMedio: number;
  comissaoIncorporador: number;
  valorRegistroPorUnidade: number;
  receitaRegistroTotal: number;
  hasRegistro: boolean;
}

export interface ContratoData {
  dadosIncorporadora: DadosIncorporadora;
  dadosProjeto: DadosProjeto;
  dataAprovacao: string;
  numeroContrato: string;
}

export type ContratoFluxoStep = "dados" | "revisao" | "assinatura" | "concluido";

export const DADOS_LOFT = {
  razaoSocial: "LOFT INTERMEDIADORA LTDA",
  cnpj: "04.113.052/0001-25",
  endereco: "Alameda Campinas, 579, 7º andar – Jardim Paulista, São Paulo – SP",
} as const;

export const defaultDadosIncorporadora: DadosIncorporadora = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  representanteLegal: "",
  cpfRepresentante: "",
  cargoRepresentante: "Diretor",
  email: "",
  telefone: "",
};
