import { Building2, User, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DadosIncorporadora } from "./types";

interface DadosIncorporadoraFormProps {
  dados: DadosIncorporadora;
  onChange: (dados: DadosIncorporadora) => void;
  disabled?: boolean;
}

// Formatação de CNPJ
const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 14);
  return numbers
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

// Formatação de CPF
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

// Formatação de telefone
const formatTelefone = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

// Formatação de CEP
const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  return numbers.replace(/^(\d{5})(\d)/, "$1-$2");
};

export function DadosIncorporadoraForm({ dados, onChange, disabled = false }: DadosIncorporadoraFormProps) {
  const handleChange = (field: keyof DadosIncorporadora, value: string) => {
    let formattedValue = value;
    
    switch (field) {
      case "cnpj":
        formattedValue = formatCNPJ(value);
        break;
      case "cpfRepresentante":
        formattedValue = formatCPF(value);
        break;
      case "telefone":
        formattedValue = formatTelefone(value);
        break;
      case "cep":
        formattedValue = formatCEP(value);
        break;
      case "estado":
        formattedValue = value.toUpperCase().slice(0, 2);
        break;
    }
    
    onChange({ ...dados, [field]: formattedValue });
  };

  return (
    <div className="space-y-6">
      {/* Dados da Empresa */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Dados da Incorporadora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Razão Social *</Label>
              <Input
                placeholder="Construtora ABC Ltda"
                value={dados.razaoSocial}
                onChange={(e) => handleChange("razaoSocial", e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input
                placeholder="ABC Construções"
                value={dados.nomeFantasia}
                onChange={(e) => handleChange("nomeFantasia", e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CNPJ *</Label>
              <Input
                placeholder="00.000.000/0001-00"
                value={dados.cnpj}
                onChange={(e) => handleChange("cnpj", e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="(11) 99999-9999"
                  value={dados.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  disabled={disabled}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="contato@incorporadora.com.br"
                value={dados.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={disabled}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Endereço Completo *</Label>
            <Input
              placeholder="Rua, número, complemento, bairro"
              value={dados.endereco}
              onChange={(e) => handleChange("endereco", e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>CEP</Label>
              <Input
                placeholder="00000-000"
                value={dados.cep}
                onChange={(e) => handleChange("cep", e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Cidade *</Label>
              <Input
                placeholder="São Paulo"
                value={dados.cidade}
                onChange={(e) => handleChange("cidade", e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>UF *</Label>
              <Input
                placeholder="SP"
                maxLength={2}
                value={dados.estado}
                onChange={(e) => handleChange("estado", e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Representante Legal */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Representante Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                placeholder="João da Silva"
                value={dados.representanteLegal}
                onChange={(e) => handleChange("representanteLegal", e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>CPF *</Label>
              <Input
                placeholder="000.000.000-00"
                value={dados.cpfRepresentante}
                onChange={(e) => handleChange("cpfRepresentante", e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input
              placeholder="Diretor"
              value={dados.cargoRepresentante}
              onChange={(e) => handleChange("cargoRepresentante", e.target.value)}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
