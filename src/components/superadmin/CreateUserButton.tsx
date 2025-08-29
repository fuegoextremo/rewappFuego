"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import UserForm from "./UserForm";

interface Branch {
  id: string;
  name: string;
  is_active: boolean | null;
}

interface CreateUserButtonProps {
  branches: Branch[];
}

export default function CreateUserButton({ branches }: CreateUserButtonProps) {
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
        branches={branches}
      />
    </>
  );
}
