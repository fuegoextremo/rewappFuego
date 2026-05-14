"use client";

import { Tables } from "@/types/database";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getPrizeStats } from "@/app/admin/prizes/actions";
import { ImageUploader } from "@/components/shared/ImageUploader";

// Helper functions for rarity system
const getWeightFromRarity = (rarity: string): number => {
  const rarityMap: Record<string, number> = {
    legendary: 1,    // ~2% (más raro)
    epic: 2,        // ~5%
    rare: 5,        // ~12%
    normal: 10,     // ~25%
    common: 16,     // ~40% (más común)
  };
  return rarityMap[rarity] || 1;
};

const getRarityFromWeight = (weight: number): string => {
  if (weight >= 16) return 'common';
  if (weight >= 10) return 'normal';
  if (weight >= 5) return 'rare';
  if (weight >= 2) return 'epic';
  return 'legendary';
};

// Valor por defecto para inventario de premios de ruleta
const DEFAULT_ROULETTE_INVENTORY = 100;

type PrizeStats = {
  roulette: {
    active: number;
    limit: number;
    canCreate: boolean;
  };
  streak: {
    active: number;
    limit: number;
    canCreate: boolean;
  };
};

interface PrizeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Tables<"prizes">>) => Promise<void>;
  prize?: Tables<"prizes">;
}

export default function PrizeForm({ open, onOpenChange, onSubmit, prize }: PrizeFormProps) {
  const [formData, setFormData] = useState<Partial<Tables<"prizes">>>({
    name: "",
    description: "",
    type: "roulette",
    inventory_count: 0,
    validity_days: 30,
    weight: 1,
    streak_threshold: 0,
    image_url: "",
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [prizeStats, setPrizeStats] = useState<PrizeStats>({
    roulette: { active: 0, limit: 10, canCreate: true },
    streak: { active: 0, limit: 5, canCreate: true }
  });
  const { toast } = useToast();

  // Cargar estadísticas de premios al abrir el modal
  useEffect(() => {
    if (open) {
      loadPrizeStats();
      setFormData({
        name: prize?.name ?? "",
        description: prize?.description ?? "",
        type: prize?.type ?? "roulette",
        inventory_count: prize?.inventory_count ?? (prize?.type === "streak" ? 0 : DEFAULT_ROULETTE_INVENTORY),
        validity_days: prize?.validity_days ?? 30,
        weight: prize?.weight ?? 1,
        streak_threshold: prize?.streak_threshold ?? 0,
        image_url: prize?.image_url ?? "",
        is_active: prize?.is_active ?? true,
      });
    }
  }, [prize, open]);

  const loadPrizeStats = async () => {
    try {
      const stats = await getPrizeStats();
      setPrizeStats(stats);
    } catch (error) {
      console.error('Error loading prize stats:', error);
    }
  };

  // Función para verificar si se puede crear el tipo de premio seleccionado
  const canCreatePrizeType = (type: "roulette" | "streak") => {
    // Si estamos editando un premio existente, siempre permitir
    if (prize) return true;
    
    return type === "roulette" ? prizeStats.roulette.canCreate : prizeStats.streak.canCreate;
  };

  // Función para verificar si se puede cambiar a un tipo específico (incluyendo edición)
  const canChangeToType = (type: "roulette" | "streak") => {
    // Si es creación nueva, usar la lógica normal
    if (!prize) return canCreatePrizeType(type);
    
    // Si es edición y no está cambiando el tipo, siempre permitir
    if (prize.type === type) return true;
    
    // Si está cambiando el tipo, verificar límites
    return type === "roulette" ? prizeStats.roulette.canCreate : prizeStats.streak.canCreate;
  };

  // Actualizar campos automáticamente cuando cambia el tipo
  const handleTypeChange = (newType: "roulette" | "streak") => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      // Para premios de racha, resetear campos no aplicables
      inventory_count: newType === "streak" ? 0 : (prev.inventory_count || DEFAULT_ROULETTE_INVENTORY),
      weight: newType === "streak" ? 1 : prev.weight,
      streak_threshold: newType === "roulette" ? 0 : (prev.streak_threshold || 5),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      toast({
        title: "Éxito",
        description: `Premio ${prize ? "actualizado" : "creado"} correctamente`,
      });
    } catch (error) {
      console.error('Error saving prize:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al guardar el premio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {prize ? "Editar premio" : "Crear nuevo premio"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {prize ? "Modifica los detalles del premio existente" : "Completa la información para crear un nuevo premio"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description ?? ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "roulette" | "streak") => handleTypeChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roulette">
                    <div className="flex items-center justify-between w-full">
                      <span>🎰 Premios de Ruleta</span>
                      <Badge variant={prizeStats.roulette.canCreate ? "secondary" : "destructive"} className="ml-2 text-xs">
                        {prizeStats.roulette.active}/{prizeStats.roulette.limit}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="streak">
                    <div className="flex items-center justify-between w-full">
                      <span>🔥 Premios de Racha</span>
                      <Badge variant={prizeStats.streak.canCreate ? "secondary" : "destructive"} className="ml-2 text-xs">
                        {prizeStats.streak.active}/{prizeStats.streak.limit}
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Información contextual según el tipo seleccionado */}
                            {formData.type === "roulette" && (
                <div className="text-xs p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-medium text-blue-800">🎰 Ruleta:</span>
                  <span className="text-blue-700"> Se otorgan al azar, requieren inventario y tienen probabilidades.</span>
                  {!canChangeToType("roulette") && (
                    <div className="mt-1 text-red-700 font-medium">
                      ⚠️ Límite de premios de ruleta alcanzado ({prizeStats.roulette.active}/{prizeStats.roulette.limit})
                    </div>
                  )}
                </div>
              )}
              
              {formData.type === "streak" && (
                <div className="text-xs p-2 bg-orange-50 rounded border border-orange-200">
                  <span className="font-medium text-orange-800">🔥 Racha:</span>
                  <span className="text-orange-700"> Se otorgan automáticamente por check-ins consecutivos.</span>
                  {!canChangeToType("streak") && (
                    <div className="mt-1 text-red-700 font-medium">
                      ⚠️ Límite de premios de racha alcanzado ({prizeStats.streak.active}/{prizeStats.streak.limit})
                    </div>
                  )}
                </div>
              )}
              
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Inventario - Solo para premios de ruleta */}
              {formData.type === "roulette" && (
                <div className="space-y-1.5">
                  <Label htmlFor="inventory">Inventario *</Label>
                  <Input
                    id="inventory"
                    type="number"
                    min="0"
                    value={formData.inventory_count ?? DEFAULT_ROULETTE_INVENTORY}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inventory_count: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <div className="text-xs text-gray-500">
                    Cantidad disponible del premio
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="validity">Días de validez *</Label>
                <Input
                  id="validity"
                  type="number"
                  min="1"
                  value={formData.validity_days ?? 30}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validity_days: parseInt(e.target.value) || 30,
                    })
                  }
                />
                <div className="text-xs text-gray-500">
                  Días que el cupón será válido
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Frecuencia del Premio - Solo para premios de ruleta */}
              {formData.type === "roulette" && (
                <div className="space-y-2">
                  <Label htmlFor="rarity">Frecuencia del Premio *</Label>
                  <Select
                    value={getRarityFromWeight(formData.weight ?? 1)}
                    onValueChange={(value) => {
                      const weight = getWeightFromRarity(value);
                      setFormData({
                        ...formData,
                        weight: weight,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legendary">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span>🟣 Legendario</span>
                          <span className="text-xs text-gray-500">(~2% probabilidad)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="epic">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>🔴 Épico</span>
                          <span className="text-xs text-gray-500">(~5% probabilidad)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rare">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span>🟠 Raro</span>
                          <span className="text-xs text-gray-500">(~12% probabilidad)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>🟡 Normal</span>
                          <span className="text-xs text-gray-500">(~25% probabilidad)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="common">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>🟢 Común</span>
                          <span className="text-xs text-gray-500">(~40% probabilidad)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500">
                    Peso técnico: {formData.weight ?? 1}
                  </div>
                </div>
              )}

              {/* Racha requerida - Solo para premios de racha */}
              {formData.type === "streak" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="streak">Racha requerida *</Label>
                    <Input
                      id="streak"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.streak_threshold ?? 5}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          streak_threshold: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                    <div className="text-xs text-gray-500">
                      Check-ins consecutivos necesarios
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <ImageUploader
                      bucket="prizes"
                      fieldName="prize_image"
                      label="Imagen del premio"
                      description="Sube una imagen desde tu dispositivo o ingresa una URL externa. Formatos: PNG, JPG, WEBP. Máx. 2 MB."
                      value={formData.image_url ?? ""}
                      onChange={(url) =>
                        setFormData({ ...formData, image_url: url })
                      }
                    />
                  </div>
                </div>
              )}
            </div>



            {/* Switch para activar/desactivar premio */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Estado del premio
                </Label>
                <p className="text-xs text-gray-500">
                  {formData.is_active 
                    ? "El premio está activo y disponible en la aplicación" 
                    : "El premio está desactivado y no se mostrará a los usuarios"}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !canChangeToType((formData.type as "roulette" | "streak") || "roulette")}
            >
              {isLoading ? "Guardando..." : prize ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
