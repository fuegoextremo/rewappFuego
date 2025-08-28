"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import UserForm from "./UserForm";

export default function CreateUserButton() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setFormOpen(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <UserPlusIcon className="w-4 h-4 mr-2" />
        Nuevo Usuario
      </Button>

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="create"
      />
    </>
  );
}
