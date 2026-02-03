import { useState } from "react";
import { Pencil, Check, X, Lock, History, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

interface EditableFieldProps {
  fieldName: string;
  label: string;
  value: string | number | undefined | null;
  onSave: (value: string) => void;
  type?: "text" | "select" | "textarea" | "date" | "number";
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayFormatter?: (value: string | number | undefined | null) => string;
  onHistoryClick?: () => void;
}

export function EditableField({
  fieldName,
  label,
  value,
  onSave,
  type = "text",
  options = [],
  placeholder,
  className,
  displayFormatter,
  onHistoryClick,
}: EditableFieldProps) {
  const { canEditField, getFieldPermission } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ""));
  
  const canEdit = canEditField(fieldName);
  const permission = getFieldPermission(fieldName);
  const isProtected = permission?.isProtected && !canEdit;

  const displayValue = displayFormatter 
    ? displayFormatter(value) 
    : (value ?? "—");

  const handleSave = () => {
    if (editValue !== String(value ?? "")) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value ?? ""));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleClear = () => {
    onSave("");
    setEditValue("");
    setIsEditing(false);
  };

  // Check if it's a clearable field (date fields that have a value)
  const isClearable = type === "date" && value;

  if (isEditing) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground uppercase">
            {label}
          </label>
          <div className="flex gap-1">
            {isClearable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-orange-500 hover:text-orange-600 hover:bg-orange-100"
                      onClick={handleClear}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Limpar data</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-success hover:text-success hover:bg-success/10"
              onClick={handleSave}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {type === "select" ? (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] text-sm"
            autoFocus
          />
        ) : (
          <Input
            type={type === "number" ? "number" : type === "date" ? "date" : "text"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-9"
            autoFocus
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1 group", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase">
          {label}
        </label>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onHistoryClick && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onHistoryClick}
                  >
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver histórico</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isProtected ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center h-6 w-6">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Campo protegido - apenas gestores podem editar
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : canEdit ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setEditValue(String(value ?? ""));
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </div>
      <p className={cn(
        "text-sm leading-relaxed",
        !value && "text-muted-foreground italic"
      )}>
        {displayValue}
      </p>
    </div>
  );
}
