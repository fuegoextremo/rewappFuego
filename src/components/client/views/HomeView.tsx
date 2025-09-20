import { useAppDispatch, useUser, useSettings } from "@/store/hooks";
import { setCurrentView } from "@/store/slices/uiSlice";
import { useBlockedDispatch } from "@/hooks/useBlockedDispatch";
import { StreakSection } from "@/components/client/StreakSection";
import { CTAButton } from "@/components/client/CTAButton";
import { UnauthorizedBanner } from "@/components/shared/UnauthorizedBanner";
import { RecentActivity } from "@/components/client/RecentActivity";
import { StreakPrizesList } from "@/components/client/StreakPrizesList";
import { StreakPrizesProgress } from "@/components/client/StreakPrizesProgress";
import { FloatingHeader } from "@/components/client/FloatingHeader";
import { ParticleExplosion } from "@/components/client/ParticleExplosionFixed";
import { useUserRealtime } from '@/hooks/useUserRealtime'
import { FerrisWheel, Flame } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

export default function HomeView() {
  const dispatch = useAppDispatch();
  const blockedDispatch = useBlockedDispatch();
  const user = useUser();
  const settings = useSettings();

  // Crear dispatch wrapper que respeta el bloqueo
  const safeDispatch = blockedDispatch(dispatch);

  // ✨ Solo obtener el estado de conexión (la conexión es automática)
  const { isConnected } = useUserRealtime()

  // 🔧 OPTIMIZACIÓN: Memoizar props para StreakSection
  const streakProps = useMemo(
    () => ({
      currentCount: user?.current_streak || 0,
      isLoading: false,
    }),
    [user?.current_streak]
  );

  console.log(
    "🔍 HomeView render - user?.current_streak:",
    user?.current_streak,
    "- realtime connected:", isConnected,
    "- timestamp:", new Date().toLocaleTimeString()
  );
  
  // 🔍 LOG ADICIONAL: Estado completo del usuario
  console.log('🟦 REDUX STATE en HomeView:', {
    current_streak: user?.current_streak,
    available_spins: user?.available_spins,
    total_checkins: user?.total_checkins,
    userId: user?.id,
    realtimeConnected: isConnected
  });

  // 🧪 TESTING TEMPORAL: Función para simular datos obsoletos
  if (typeof window !== 'undefined') {
    (window as any).testObsoleteData = () => {
      console.log('🧪 Simulando datos obsoletos...')
      console.log('🔍 Usuario actual antes:', {
        current_streak: user?.current_streak,
        available_spins: user?.available_spins
      })
      
      // ✅ Crear usuario completo con datos modificados
      const modifiedUser = {
        ...user,
        current_streak: 5,
        available_spins: 2
      }
      
      console.log('🔍 Usuario modificado a enviar:', {
        current_streak: modifiedUser.current_streak,
        available_spins: modifiedUser.available_spins
      })
      
      // ✅ Usar dispatch directo en lugar de safeDispatch
      dispatch({
        type: 'auth/setUser',
        payload: modifiedUser
      })
      
      console.log('🧪 Dispatch directo ejecutado con datos obsoletos')
    }
    
    (window as any).testCurrentState = () => {
      console.log('🔍 Estado actual:', {
        current_streak: user?.current_streak,
        available_spins: user?.available_spins
      })
    }
  }

  if (!user) {
    return (
      <>
        {/* Floating Header - Fixed at top */}
        <FloatingHeader />

        <div className="space-y-4 pt-14">
          <UnauthorizedBanner />
          <div className="text-center py-12">
            <p className="text-gray-500">Inicia sesión para ver tu progreso</p>
          </div>
        </div>
      </>
    );
  }

  // Generar saludo personalizado
  const userName = user.first_name ? user.first_name : "Usuario";
  const greeting = `Hola, ${userName}`;
  const companyName = settings.company_name || "Fuego Rewards";
  const primaryColor = settings.company_theme_primary || "#D73527";
  {
    /*const hasStreak = (user.current_streak || 0) > 0*/
  }

  return (
    <>
      {/* Floating Header - Fixed at top */}
      <FloatingHeader />

      {/* Confetti temporalmente deshabilitado */}
      {/* <ConfettiCelebration /> */}

      <div>
        <div 
          className="pb-20 relative"
          style={{ background: `linear-gradient(180deg, ${primaryColor} 0%, #FFF 100%)` }}
        >
          {/* Explosión de partículas desde el centro */}
          <ParticleExplosion color="#ffffff" particleCount={50} />
          
          {/* Header con saludo personalizado */}
          <div className="pt-20 px-4 mb-2 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xl font-bold text-white">{greeting}</p>
              
              {/* ✨ Indicador de conexión realtime */}
              {isConnected && (
                <div className="ml-2 flex items-center gap-1 text-xs text-green-100 bg-green-500/20 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                  En vivo
                </div>
              )}
            </div>
            <p className="text-white text-sm">
              ¡Visita {companyName}! 😄{" "}
              <strong>Registra tus visitas para aumentar tu racha </strong>y
              participa en la ruleta para ganar increíbles premios.
            </p>
          </div>

          {/* Sección de racha - Movida arriba para mayor prominencia */}
          <div className="relative z-10">
            <StreakSection {...streakProps} />
          </div>
        </div>

        {/* Contenedor principal con sombra hacia arriba */}
        <div
          className="mx-4 rounded-[20px] relative -mt-12 bg-white"
          style={{ boxShadow: "0 -20px 25px rgba(0, 0, 0, 0.1)" }}
        >
          <div className="p-3 space-y-6">
            {/* Botón CTA principal */}
            <div
              onClick={() => safeDispatch(setCurrentView("roulette"))}
              className="cursor-pointer"
            >
              <CTAButton>Registra tu visita</CTAButton>
            </div>

            {/* Grid de racha y giros */}
            <div className="flex items-start justify-between">
              {/* Columna 1: Racha más alta */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Flame size={26} style={{ color: primaryColor }} />
                  <span className="text-3xl font-bold text-gray-900">
                    {user.current_streak || 0}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Racha más alta</div>
              </div>

              {/* Divisor vertical */}
              <div className="w-px h-12 bg-gray-200 mx-4"></div>

              {/* Columna 2: Giros de ruleta (clickeable) */}
              <div
                className="flex-1 text-center cursor-pointer"
                onClick={() => safeDispatch(setCurrentView("roulette"))}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FerrisWheel size={26} className="text-gray-700" />
                  <span className="text-3xl font-bold text-gray-900">
                    {user.available_spins || 0}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Giros de ruleta</div>
              </div>
            </div>

            {/* Progreso de premios de racha */}
            <StreakPrizesProgress />
          </div>
        </div>

        {/* Actividad reciente - Componente funcional */}
        <div className="rounded-lg">
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900">
              Actividad reciente
            </h3>
          </div>
          <div className="p-2">
            <RecentActivity userId={user.id} />
          </div>
        </div>

        {/* Streak Prizes List */}
        <div className="px-4">
          <StreakPrizesList showCompleted={true} maxItems={5} />
        </div>

        {/* Logo del establecimiento */}
        {settings.company_logo_url && (
          <div className="text-center py-6">
            <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden bg-gray-100 flex items-center justify-center p-2">
              <Image
                src={settings.company_logo_url}
                alt={companyName}
                width={160}
                height={160}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          </div>
        )}

        {/* Banner inferior - Sin padding para pegarlo al bottom nav */}
        <div className="w-full">
          <Image
            src="/images/banner_inferior.png"
            alt="Banner inferior"
            width={400}
            height={200}
            className="w-full h-auto object-cover"
            priority={false}
          />
        </div>
      </div>
    </>
  );
}
