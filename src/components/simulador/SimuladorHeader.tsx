import { Building2 } from "lucide-react";

export function SimuladorHeader() {
  return (
    <div className="text-center space-y-4">
      {/* Logo Loft + Mais Negócio */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-3xl font-bold text-secondary tracking-tight font-display">
          L<span className="text-primary">o</span>ft
        </span>
        <div className="h-8 w-px bg-border mx-2" />
        <div className="text-left">
          <p className="text-sm font-medium text-primary leading-tight">Mais</p>
          <p className="text-sm font-medium text-primary leading-tight">Negócio</p>
        </div>
      </div>

      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">
          Simulador de Viabilidade
        </h1>
        <p className="text-muted-foreground mt-2">
          Avalie a viabilidade econômica de projetos de incorporação considerando mix bancário, comissões e custos operacionais.
        </p>
      </div>
    </div>
  );
}
