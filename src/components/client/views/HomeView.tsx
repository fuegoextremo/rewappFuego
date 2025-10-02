import { useAppDispatch, useUser, useCurrentStreak, useAvailableSpins, useMaxStreak } from "@/store/hooks";
import { setCurrentView } from "@/store/slices/uiSlice";
import { useBlockedDispatch } from "@/hooks/useBlockedDispatch";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { StreakSection } from "@/components/client/StreakSection";
import { CTAButton } from "@/components/client/CTAButton";
import { UnauthorizedBanner } from "@/components/shared/UnauthorizedBanner";
import { RecentActivity } from "@/components/client/RecentActivity";
import { StreakPrizesList } from "@/components/client/StreakPrizesList";
import { StreakPrizesProgress } from "@/components/client/StreakPrizesProgress";
import { FloatingHeader } from "@/components/client/FloatingHeader";
import { SimpleStreakTest } from "@/components/debug/SimpleStreakTest"; // 🧪 DEBUG
//import { ParticleExplosion } from "@/components/client/ParticleExplosionFixed";
import { useUserRealtime } from '@/hooks/useUserRealtime'
import { FerrisWheel, Flame, History } from "lucide-react";
import Image from "next/image";
import { motion } from 'framer-motion';

export default function HomeView() {
  const dispatch = useAppDispatch();
  const blockedDispatch = useBlockedDispatch();
  const user = useUser(); // Solo para datos estáticos (id, name, email)
  const { data: settings } = useSystemSettings();
  
  // 🎯 MIGRACIÓN: Usar hooks de userData para datos dinámicos
  const currentStreak = useCurrentStreak()
  const availableSpins = useAvailableSpins()
  const maxStreak = useMaxStreak()
  
  // 🔧 Redux settings (para futuro uso)
  // const reduxSettings = useSettings();

  // Crear dispatch wrapper que respeta el bloqueo
  const safeDispatch = blockedDispatch(dispatch);

  // ✨ Solo obtener el estado de conexión (la conexión es automática)
  const { isConnected } = useUserRealtime()

  // ✅ MIGRACIÓN COMPLETADA: sin logs para evitar ruido
  // console.log(
  //   "🔍 HomeView render - currentStreak (userData):",
  //   currentStreak,
  //   "- realtime connected:", isConnected,
  //   "- redux settings loaded:", Object.keys(reduxSettings).length > 0,
  //   "- max_streak:", maxStreak,
  //   "- timestamp:", new Date().toLocaleTimeString()
  // );
  
  // console.log('🟦 MIGRACIÓN HomeView:', {
  //   'currentStreak (userData)': currentStreak,
  //   'availableSpins (userData)': availableSpins,
  //   'user.id': user?.id,
  //   'user.email': user?.email,
  //   total_checkins: user?.total_checkins,
  //   userId: user?.id,
  //   realtimeConnected: isConnected
  // });

  // ❌ ELIMINADO: Testing functions obsoletas
  
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
  const companyName = settings?.company_name || "Fuego Rewards";
  const primaryColor = settings?.company_theme_primary || "#D73527";
  {
    /*const hasStreak = currentStreak > 0*/
  }

  return (
    <>
      {/* 🧪 DEBUG: Test component */}
      <SimpleStreakTest />
      
      {/* Floating Header - Fixed at top */}
      <FloatingHeader />

      <motion.div
        className="space-y-0 relative"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Fondo degradado con tamaño fijo - Se mueve con scroll */}
        <div 
          className="absolute top-0 left-0 w-full h-80"
          style={{ background: `linear-gradient(180deg, ${primaryColor} 0%, #FFF 100%)` }}
        />

        <div className="pb-5 relative">
          {/* Explosión de partículas desde el centro 
          <ParticleExplosion color="#ffffff" particleCount={50} />*/}
          
          {/* Header con saludo personalizado */}
          <motion.div 
            className="pt-20 px-8 mb-2 relative z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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
          </motion.div>

          {/* Sección de racha - Movida arriba para mayor prominencia */}
          <motion.div 
            className="relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StreakSection 
              currentCount={currentStreak} 
              isLoading={false} 
            />
          </motion.div>
        </div>

        {/* Contenedor principal con sombra hacia arriba */}
        <motion.div
          className="mx-4 rounded-[20px] relative -mt-12 bg-white"
          style={{ boxShadow: "0 -20px 25px rgba(0, 0, 0, 0.1)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
                    {maxStreak}
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
                    {availableSpins}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Giros de ruleta</div>
              </div>
            </div>

            {/* Progreso de premios de racha */}
            <StreakPrizesProgress />
          </div>
        </motion.div>

        {/* Actividad reciente - Componente funcional */}
        <motion.div 
          className="rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-4 mt-4">
          <div className="flex items-center gap-2">
             <History size={26} style={{ color: primaryColor }} />
            <h3 className="text-lg font-bold text-gray-900">
              Actividad reciente
            </h3>
          </div>
          <p className="text-sm">Mira tu progreso y las visitas más recientes</p>
          </div>
          <div className="px-4 mb-10">
            <RecentActivity userId={user.id} />
          </div>
          
        </motion.div>

        {/* Streak Prizes List */}
        <motion.div 
          className="px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <StreakPrizesList showCompleted={true} maxItems={5} />
        </motion.div>

        {/* Logo del establecimiento */}
        {settings?.company_logo_url && (
          <div className="text-center py-6">
            <div className="w-60 h-60 mx-auto rounded-3xl overflow-hidden flex items-center justify-center p-2">
              <Image
                src={settings.company_logo_url}
                alt={companyName}
                width={180}
                height={180}
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
      </motion.div>
    </>
  );
}
