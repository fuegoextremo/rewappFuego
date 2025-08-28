"use client";

import { useState } from "react";
import { Tables } from "@/types/database";
import { Button } from "@/components/ui/button";
import PrizesTable from "@/components/admin/PrizesTable";
import PrizeForm from "@/components/admin/PrizeForm";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { createPrize, updatePrize, deletePrize, CreatePrizeData } from "./actions";

export default function PrizesClient({ prizes: initialPrizes }: { prizes: Tables<"prizes">[] }) {
  const [prizes, setPrizes] = useState<Tables<"prizes">[]>(initialPrizes);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Tables<"prizes"> | undefined>();
  const { toast } = useToast();

  const handleCreate = async (data: Partial<Tables<"prizes">>) => {
    try {
      // Validar que los campos requeridos estén presentes
      if (!data.name || !data.type) {
        throw new Error("Nombre y tipo son campos requeridos");
      }
      
      const newPrize = await createPrize(data as CreatePrizeData);
      setPrizes([newPrize, ...prizes]);
      toast({
        title: "Éxito",
        description: "Premio creado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el premio",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (data: Partial<Tables<"prizes">>) => {
    if (!selectedPrize) return;
    try {
      const updatedPrize = await updatePrize(selectedPrize.id, data);
      setPrizes(prizes.map((p) => (p.id === updatedPrize.id ? updatedPrize : p)));
      toast({
        title: "Éxito",
        description: "Premio actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el premio",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (prizeId: string) => {
    try {
      await deletePrize(prizeId);
      setPrizes(prizes.filter((p) => p.id !== prizeId));
      toast({
        title: "Éxito",
        description: "Premio eliminado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el premio",
        variant: "destructive",
      });
    }
  };

  const openCreateForm = () => {
    setSelectedPrize(undefined);
    setFormOpen(true);
  };

  const openEditForm = (prize: Tables<"prizes">) => {
    setSelectedPrize(prize);
    setFormOpen(true);
  };

  const openDeleteDialog = (prize: Tables<"prizes">) => {
    setSelectedPrize(prize);
    setDeleteDialogOpen(true);
  };

  const breadcrumbItems = [
    { label: "Admin", href: "/admin/dashboard" },
    { label: "Premios", href: "/admin/prizes", current: true }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Premios</h1>
        <p className="text-gray-600">
          Administra los premios de la ruleta y los premios por racha de la aplicación
        </p>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={openCreateForm}>Nuevo Premio</Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roulette" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roulette" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Premios de Ruleta
          </TabsTrigger>
          <TabsTrigger value="streak" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Premios por Racha
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="roulette" className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Premios de Ruleta</h2>
            <p className="text-sm text-gray-600">
              Premios disponibles en la ruleta con sus probabilidades y peso
            </p>
          </div>
          <PrizesTable
            prizes={prizes.filter(p => p.type === "roulette")}
            onEdit={openEditForm}
            onDelete={(id) => {
              const prize = prizes.find((p) => p.id === id);
              if (prize) openDeleteDialog(prize);
            }}
            showFields={["weight", "inventory_count"]}
            hideFields={["streak_threshold"]}
          />
        </TabsContent>
        
        <TabsContent value="streak" className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Premios por Racha</h2>
            <p className="text-sm text-gray-600">
              Premios obtenibles por racha de check-ins consecutivos
            </p>
          </div>
          <PrizesTable
            prizes={prizes.filter(p => p.type === "streak")}
            onEdit={openEditForm}
            onDelete={(id) => {
              const prize = prizes.find((p) => p.id === id);
              if (prize) openDeleteDialog(prize);
            }}
            showFields={["streak_threshold"]}
            hideFields={["weight", "inventory_count"]}
          />
        </TabsContent>
      </Tabs>

      <PrizeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={selectedPrize ? handleUpdate : handleCreate}
        prize={selectedPrize}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El premio se marcará como inactivo y no estará
              disponible para futuras operaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPrize) {
                  handleDelete(selectedPrize.id);
                  setDeleteDialogOpen(false);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
