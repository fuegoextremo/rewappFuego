'use client'

interface ParticleExplosionProps {
  color?: string
  particleCount?: number
}

export function ParticleExplosion({ 
  color = "#ffffff", 
  particleCount = 60 
}: ParticleExplosionProps) {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Generar partículas */}
        {Array.from({ length: particleCount }, (_, i) => {
          // Calcular ángulo para distribución circular
          const angle = (i / particleCount) * 360 + Math.random() * 60;
          const distance = Math.random() * 300 + 150; // 150-450px desde el centro
          const x = Math.cos(angle * Math.PI / 180) * distance;
          const y = Math.sin(angle * Math.PI / 180) * distance;
          
          return (
            <div
              key={i}
              className="particle"
              style={{
                '--start-x': '50%',
                '--start-y': '60%',
                '--end-x': `calc(50% + ${x}px)`,
                '--end-y': `calc(50% + ${y}px)`,
                '--size': `${Math.random() * 16 + 12}px`,
                '--duration': `${(Math.random() * 1.5 + 2.5)}s`,
                '--delay': `${Math.random() * -2}s`,
              } as React.CSSProperties}
            />
          )
        })}
      </div>

      <style jsx>{`
        .particle {
          position: absolute;
          background: ${color};
          width: var(--size);
          height: var(--size);
          /* Estrella de 5 picos - Estrella clásica */
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          animation: shoot var(--duration) ease-out infinite, 
                     fade var(--duration) ease-out infinite;
          animation-delay: var(--delay);
          left: var(--start-x);
          top: var(--start-y);
          transform: translate(-50%, -50%);
        }

        @keyframes shoot {
          0% { 
            left: var(--start-x);
            top: var(--start-y);
            opacity: 1;
          }
          100% { 
            left: var(--end-x);
            top: var(--end-y);
            opacity: 0;
          }
        }

        @keyframes fade {
          0% { opacity: 1; }
          40% { opacity: 0.8; }  /* Empiezan a desvanecerse antes */
          60% { opacity: 0.1; } 
          70% { opacity: 0; }   /* Desaparecen completamente más rápido */
        }
      `}</style>
    </>
  )
}