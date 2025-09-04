"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cleanupOrphanedProfiles } from "@/app/superadmin/users/actions";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function CleanupOrphanedProfilesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCleanup = async () => {
    if (!confirm("¿Estás seguro de que quieres limpiar perfiles huérfanos? Esta acción eliminará perfiles de BD que no tienen usuario de Auth asociado.")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await cleanupOrphanedProfiles();
      
      if (result.success) {
        const deletedCount = result.cleanedUp?.filter(r => r.status === 'deleted').length || 0;
        toast({
          title: "Limpieza de perfiles completada",
          description: `Se limpiaron ${deletedCount} perfiles huérfanos`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al limpiar perfiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCleanup}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="text-orange-600 border-orange-200 hover:bg-orange-50"
    >
      <TrashIcon className="h-4 w-4 mr-2" />
      {isLoading ? "Limpiando..." : "Limpiar Perfiles Huérfanos"}
    </Button>
  );
}
