"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updatePrizeLimits } from "@/app/admin/settings/actions";

interface PrizeLimitsFormProps {
  initialLimits: {
    max_roulette_prizes: number;
    max_streak_prizes: number;
  };
  userRole: string;
}

export default function PrizeLimitsForm({ initialLimits, userRole }: PrizeLimitsFormProps) {
  const [maxRoulette, setMaxRoulette] = useState(initialLimits.max_roulette_prizes);
  const [maxStreak, setMaxStreak] = useState(initialLimits.max_streak_prizes);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isSuperAdmin = userRole === 'superadmin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast({
        title: "Error",
        description: "Solo superadmins pueden modificar estos límites",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updatePrizeLimits(maxRoulette, maxStreak);
      toast({
        title: "Éxito",
        description: "Límites actualizados correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar límites",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Límites de Premios</CardTitle>
        <CardDescription>
          Configura el número máximo de premios que pueden estar activos simultáneamente.
          Solo superadmins pueden modificar estos valores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxRoulette">Máximo Premios de Ruleta</Label>
              <Input
                id="maxRoulette"
                type="number"
                min="1"
                value={maxRoulette}
                onChange={(e) => setMaxRoulette(parseInt(e.target.value) || 1)}
                disabled={!isSuperAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStreak">Máximo Premios de Racha</Label>
              <Input
                id="maxStreak"
                type="number"
                min="1"
                value={maxStreak}
                onChange={(e) => setMaxStreak(parseInt(e.target.value) || 1)}
                disabled={!isSuperAdmin}
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading || !isSuperAdmin}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
