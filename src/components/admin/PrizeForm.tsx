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
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData({
        name: prize?.name ?? "",
        description: prize?.description ?? "",
        type: prize?.type ?? "roulette",
        inventory_count: prize?.inventory_count ?? 0,
        validity_days: prize?.validity_days ?? 30,
        weight: prize?.weight ?? 1,
        streak_threshold: prize?.streak_threshold ?? 0,
        is_active: prize?.is_active ?? true,
      });
    }
  }, [prize, open]);

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{prize ? "Editar" : "Crear"} Premio</DialogTitle>
          <DialogDescription>
            Completa los detalles del premio. Todos los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description ?? ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "roulette" | "streak") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roulette">Ruleta</SelectItem>
                  <SelectItem value="streak">Racha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inventory">Inventario</Label>
                <Input
                  id="inventory"
                  type="number"
                  min="0"
                  value={formData.inventory_count ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inventory_count: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validity">Días de validez</Label>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rarity">Frecuencia del Premio</Label>
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

              <div className="space-y-2">
                <Label htmlFor="streak">Racha requerida</Label>
                <Input
                  id="streak"
                  type="number"
                  min="0"
                  value={formData.streak_threshold ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      streak_threshold: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="image">URL de imagen</Label>
              <Input
                id="image"
                type="url"
                value={formData.image_url ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
              />
            </div> */}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : prize ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
