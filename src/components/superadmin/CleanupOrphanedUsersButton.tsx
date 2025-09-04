"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cleanupOrphanedUsers } from "@/app/superadmin/users/actions";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function CleanupOrphanedUsersButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCleanup = async () => {
    if (!confirm("¿Estás seguro de que quieres limpiar usuarios huérfanos? Esta acción eliminará usuarios de Auth que no tienen perfil asociado.")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await cleanupOrphanedUsers();
      
      if (result.success) {
        toast({
          title: "Limpieza completada",
          description: `Se limpiaron ${result.cleanedUp?.length || 0} usuarios huérfanos`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al limpiar usuarios",
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
      className="text-red-600 border-red-200 hover:bg-red-50"
    >
      <TrashIcon className="h-4 w-4 mr-2" />
      {isLoading ? "Limpiando..." : "Limpiar Usuarios Huérfanos"}
    </Button>
  );
}
