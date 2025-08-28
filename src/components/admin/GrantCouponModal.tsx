
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { grantCoupon } from "@/app/admin/users/[id]/actions";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/types/database";

interface GrantCouponModalProps {
  userId: string;
  prizes: Tables<"prizes">[];
}

export default function GrantCouponModal({ userId, prizes }: GrantCouponModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<string | undefined>();
  const [validityDays, setValidityDays] = useState<number>(30);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

    const handleSubmit = () => {
  if (!selectedPrize) {
    toast({
      title: "Error",
      description: "Por favor, selecciona un premio.",
      variant: "destructive",
    });
    return;
  }

  startTransition(async () => {
    try {
      console.log('Starting coupon grant process...');
      console.log('Input parameters:', {
        userId,
        selectedPrize,
        validityDays,
        isPending
      });

      const result = await grantCoupon(userId, selectedPrize, validityDays);
      console.log('Server response:', result);
      
      if (result.error) {
        console.error('Error from server:', result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        console.log('Success response:', {
          data: result.data,
          message: result.message
        });
        
        toast({
          title: "Éxito",
          description: result.data?.unique_code
            ? `Cupón otorgado con código: ${result.data.unique_code}`
            : "Cupón otorgado correctamente",
        });
        setOpen(false);
        setSelectedPrize(undefined);
        setValidityDays(30);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al otorgar el cupón",
        variant: "destructive",
      });
    }
  });
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Regalar Cupón</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Otorgar Cupón de Cortesía</DialogTitle>
          <DialogDescription>
            Selecciona un premio de la lista para crear y regalar un cupón.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prize">Premio</Label>
            <Select onValueChange={setSelectedPrize} value={selectedPrize}>
              <SelectTrigger id="prize">
                <SelectValue placeholder="Selecciona un premio..." />
              </SelectTrigger>
              <SelectContent>
                {prizes.map((prize) => (
                  <SelectItem key={prize.id} value={prize.id}>
                    {prize.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="validity">Días de validez</Label>
            <Input
              id="validity"
              type="number"
              min="1"
              max="365"
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Otorgando..." : "Otorgar Cupón"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
