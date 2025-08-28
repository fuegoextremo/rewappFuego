"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { grantSpinsToUser, type UserWithProfile } from "@/app/superadmin/users/actions";

interface GrantSpinsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithProfile | null;
  onSuccess?: (spins: number) => void;
}

export default function SuperAdminGrantSpinsModal({ 
  open, 
  onOpenChange, 
  user, 
  onSuccess 
}: GrantSpinsModalProps) {
  const [spinCount, setSpinCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (spinCount < 1 || spinCount > 100) {
      toast({
        title: "Error",
        description: "La cantidad debe estar entre 1 y 100 giros",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await grantSpinsToUser(user.id, spinCount);
      
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
        });
        setSpinCount(1);
        onOpenChange(false);
        onSuccess?.(spinCount);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al otorgar giros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSpinCount(1);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Otorgar Giros de Cortesía</DialogTitle>
          <DialogDescription>
            Otorga giros de ruleta a{" "}
            <span className="font-medium">
              {user?.first_name && user?.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user?.email
              }
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spinCount">Cantidad de Giros</Label>
            <Input
              id="spinCount"
              type="number"
              value={spinCount}
              onChange={(e) => setSpinCount(Number(e.target.value))}
              placeholder="Número de giros a otorgar"
              required
              min={1}
              max={100}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Cantidad actual: {user?.available_spins || 0} giros disponibles
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || spinCount < 1}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Otorgando..." : `Otorgar ${spinCount} Giros`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
