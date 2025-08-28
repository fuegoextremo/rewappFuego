"use client";

import { Tables } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

// Helper functions for rarity display
const getRarityFromWeight = (weight: number): { label: string; color: string; emoji: string } => {
  if (weight >= 16) return { label: 'Común', color: 'bg-green-100 text-green-800', emoji: '🟢' };
  if (weight >= 10) return { label: 'Normal', color: 'bg-yellow-100 text-yellow-800', emoji: '🟡' };
  if (weight >= 5) return { label: 'Raro', color: 'bg-orange-100 text-orange-800', emoji: '🟠' };
  if (weight >= 2) return { label: 'Épico', color: 'bg-red-100 text-red-800', emoji: '🔴' };
  return { label: 'Legendario', color: 'bg-purple-100 text-purple-800', emoji: '🟣' };
};

interface PrizesTableProps {
  prizes: Tables<"prizes">[];
  onEdit: (prize: Tables<"prizes">) => void;
  onDelete: (prizeId: string) => void;
  showFields?: Array<keyof Tables<"prizes">>;
  hideFields?: Array<keyof Tables<"prizes">>;
}

export default function PrizesTable({ 
  prizes, 
  onEdit, 
  onDelete,
  showFields = [],
  hideFields = []
}: PrizesTableProps) {
  // Helper function to check if a field should be shown
  const shouldShowField = (field: keyof Tables<"prizes">) => {
    if (showFields.length > 0) return showFields.includes(field);
    if (hideFields.length > 0) return !hideFields.includes(field);
    return true;
  };

  if (prizes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay premios registrados para esta categoría.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold">Nombre</TableHead>
            <TableHead className="font-semibold">Descripción</TableHead>
            {shouldShowField("inventory_count") && <TableHead className="font-semibold">Inventario</TableHead>}
            {shouldShowField("validity_days") && <TableHead className="font-semibold">Validez (días)</TableHead>}
            {shouldShowField("weight") && <TableHead className="font-semibold">Frecuencia</TableHead>}
            {shouldShowField("streak_threshold") && <TableHead className="font-semibold">Racha Requerida</TableHead>}
            <TableHead className="font-semibold">Estado</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prizes.map((prize) => (
            <TableRow key={prize.id} className="hover:bg-gray-50/50 transition-colors">
              <TableCell className="font-medium text-gray-900">{prize.name}</TableCell>
              <TableCell className="text-gray-600 max-w-xs truncate">
                {prize.description || "Sin descripción"}
              </TableCell>
              {shouldShowField("inventory_count") && 
                <TableCell className="text-gray-700">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {prize.inventory_count ?? "∞"}
                  </span>
                </TableCell>
              }
              {shouldShowField("validity_days") && 
                <TableCell className="text-gray-700">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    {prize.validity_days ?? "∞"}
                  </span>
                </TableCell>
              }
              {shouldShowField("weight") && 
                <TableCell className="text-gray-700">
                  {(() => {
                    const rarity = getRarityFromWeight(prize.weight || 1);
                    return (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${rarity.color}`}>
                          {rarity.emoji} {rarity.label}
                        </span>
                        <span className="text-xs text-gray-400">({prize.weight})</span>
                      </div>
                    );
                  })()}
                </TableCell>
              }
              {shouldShowField("streak_threshold") && 
                <TableCell className="text-gray-700">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                    {prize.streak_threshold}
                  </span>
                </TableCell>
              }
              <TableCell>
                <Badge 
                  variant={prize.is_active ? "default" : "destructive"}
                  className="font-medium"
                >
                  {prize.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(prize)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(prize.id)}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
