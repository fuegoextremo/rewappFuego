// src/app/admin/users/[id]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import EditUserForm from "@/components/admin/EditUserForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckinHistoryClient } from "@/components/admin/CheckinHistoryClient";
import { CouponHistoryClient } from "@/components/admin/CouponHistoryClient";
import GrantSpinsModal from "@/components/admin/GrantSpinsModal";
import GrantCouponModal from "@/components/admin/GrantCouponModal";
import DeleteUserDialog from "@/components/admin/DeleteUserDialog";
import Breadcrumbs from '@/components/shared/Breadcrumbs';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export const revalidate = 0;

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = params;
  const supabase = createAdminClient();

  // Fetch all data in parallel - check-ins y coupons con paginación (primera página)
  const initialPageSize = 20;
  const [profileResult, authUserResult, checkinsResult, couponsResult, prizesResult, branchesResult] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", id).single(),
      supabase.auth.admin.getUserById(id),
      supabase
        .from("check_ins")
        .select(
          `*,
           branches ( name ),
           user_profiles!check_ins_verified_by_fkey ( first_name, last_name )`,
          { count: 'exact' }
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .range(0, initialPageSize - 1),
      supabase
        .from("coupons")
        .select(
          `*, prizes ( name, description )`,
          { count: 'exact' }
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .range(0, initialPageSize - 1),
      supabase.from("prizes").select("*").eq("is_active", true),
      supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    ]);

  const { data: profile, error: profileError } = profileResult;
  const {
    data: { user: authUser },
    error: authError,
  } = authUserResult;
  const { data: checkins, error: checkinsError, count: checkinsCount } = checkinsResult;
  const { data: coupons, error: couponsError, count: couponsCount } = couponsResult;
  const { data: prizes, error: prizesError } = prizesResult;
  const { data: branches } = branchesResult;

  if (profileError || authError || !profile || !authUser) {
    return notFound();
  }

  const breadcrumbItems = [
    { label: 'Admin', href: '/admin/dashboard' },
    { label: 'Usuarios', href: '/admin/users' },
    { label: `${profile.first_name} ${profile.last_name}` || 'Usuario', current: true }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuario</h1>
          <p className="text-gray-600">
            Editando el perfil de {profile.first_name} {profile.last_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Perfil</CardTitle>
              <CardDescription>
                Modifica la información básica del usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditUserForm 
                profile={profile} 
                authUser={authUser} 
                branches={branches || []}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <GrantSpinsModal userId={id} />
              {prizesError ? (
                <p className="text-sm text-red-500">
                  No se pudieron cargar los premios.
                </p>
              ) : (
                <GrantCouponModal userId={id} prizes={prizes || []} />
              )}
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
              <CardDescription>
                Acciones irreversibles que afectan al usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteUserDialog
                userId={id}
                userName={`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Visitas</CardTitle>
          <CardDescription>
            Lista de todos los check-ins registrados para este usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkinsError ? (
            <p className="text-red-500">Error al cargar el historial de visitas.</p>
          ) : (
            <CheckinHistoryClient 
              userId={id}
              initialCheckins={checkins || []} 
              initialTotal={checkinsCount || 0}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Cupones</CardTitle>
          <CardDescription>
            Lista de todos los cupones que ha ganado este usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {couponsError ? (
            <p className="text-red-500">Error al cargar el historial de cupones.</p>
          ) : (
            <CouponHistoryClient 
              userId={id}
              initialCoupons={coupons || []} 
              initialTotal={couponsCount || 0}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}