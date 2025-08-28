
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { grantSpins } from "@/app/admin/users/[id]/actions";
import { useToast } from "@/hooks/use-toast";

interface GrantSpinsModalProps {
  userId: string;
}

export default function GrantSpinsModal({ userId }: GrantSpinsModalProps) {
  const [open, setOpen] = useState(false);
  const [spinCount, setSpinCount] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await grantSpins(userId, spinCount);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: result.message,
        });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Regalar Giros</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Otorgar Giros de Cortesía</DialogTitle>
          <DialogDescription>
            Selecciona cuántos giros de ruleta quieres regalar a este usuario.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="spin-count" className="text-right">
              Cantidad
            </Label>
            <Input
              id="spin-count"
              type="number"
              value={spinCount}
              onChange={(e) => setSpinCount(Number(e.target.value))}
              className="col-span-3"
              min="1"
              max="100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Otorgando..." : "Otorgar Giros"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
