"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import BranchForm from "./BranchForm";

export function CreateBranchButton() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setFormOpen(true)}
        className="bg-purple-600 hover:bg-purple-700"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Nueva Sucursal
      </Button>

      <BranchForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="create"
      />
    </>
  );
}
