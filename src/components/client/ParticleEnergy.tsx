'use client'

interface ParticleEnergyProps {
  color?: string
}

export function ParticleEnergy({ color = "#ffffff" }: ParticleEnergyProps) {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* Glow central */}
        {/* <div className="glow-center"></div> */}
        
        {/* Contenedor de partículas */}
        <div className="particles-container">
          <div className="rotate-container">
            {/* Partícula 1 */}
            <div className="angle angle-1">
              <div className="size size-1">
                <div className="position position-1">
                  <div className="pulse pulse-1">
                    <div className="particle particle-1"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Partícula 2 */}
            <div className="angle angle-2">
              <div className="size size-2">
                <div className="position position-2">
                  <div className="pulse pulse-2">
                    <div className="particle particle-2"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Partícula 3 */}
            <div className="angle angle-3">
              <div className="size size-3">
                <div className="position position-3">
                  <div className="pulse pulse-3">
                    <div className="particle particle-3"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Partícula 4 */}
            <div className="angle angle-4">
              <div className="size size-4">
                <div className="position position-4">
                  <div className="pulse pulse-4">
                    <div className="particle particle-4"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Partícula 5 */}
            <div className="angle angle-5">
              <div className="size size-5">
                <div className="position position-5">
                  <div className="pulse pulse-5">
                    <div className="particle particle-5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glow-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          animation: glow 3s linear 0s infinite alternate;
        }

        .particles-container {
          position: absolute;
          top: calc(50% - 100px);
          left: calc(50% - 100px);
          width: 200px;
          height: 200px;
        }

        .rotate-container {
          position: absolute;
          top: calc(50% - 10px);
          left: calc(50% - 10px);
          width: 20px;
          height: 20px;
          animation: rotate 20s linear 0s infinite;
        }

        .angle, .size, .position, .pulse {
          position: absolute;
          top: 0;
          left: 0;
        }

        .particle {
          position: absolute;
          top: calc(50% - 8px);
          left: calc(50% - 8px);
          width: 16px;
          height: 16px;
          /* Rombo simple - cuadrado rotado 45° */
          background: ${color};
          transform: rotate(45deg);
        }

        .pulse {
          animation: pulse 1.5s linear 0s infinite alternate;
        }

        @keyframes glow {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            box-shadow: 0 0 120px 40px ${color}aa, 50px 30px 100px 20px ${color}66, -10px -50px 60px 10px ${color}44;
          }
          100% {
            transform: translate(-50%, -50%) rotate(5deg);
            box-shadow: 0 0 180px 40px ${color}cc, 70px 40px 80px 20px ${color}88, -60px -60px 80px 10px ${color}66;
          }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes angle {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes size {
          0% { transform: scale(0.3); }
          100% { transform: scale(1.2); }
        }

        @keyframes position {
          0% {
            transform: translate3d(0,0,0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate3d(200px,200px,0);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          100% { transform: scale(0.5); }
        }

        @keyframes particle {
          0% {
            box-shadow: 0 0 40px 10px ${color}cc, 0 0 100px 20px ${color}aa, 0 0 160px 30px ${color}66;
          }
          33.33% {
            box-shadow: 0 0 40px 10px ${color}dd, 0 0 260px 20px ${color}bb, 0 0 100px 30px ${color}77;
          }
          66.67% {
            box-shadow: 0 0 40px 10px ${color}ee, 0 0 100px 20px ${color}cc, 0 0 160px 30px ${color}88;
          }
          100% {
            box-shadow: 0 0 40px 10px ${color}ff, 0 0 260px 20px ${color}dd, 0 0 100px 30px ${color}99;
          }
        }

        /* Partícula 1 - Animaciones suaves */
        .angle-1 { animation: angle 10s linear 0s infinite; }
        .size-1 { animation: size 10s ease-in-out 0s infinite; }
        .particle-1 { animation: particle 6s linear infinite alternate; }
        .position-1 { animation: position 2s ease-out 0s infinite; }

        /* Partícula 2 - Suaves */
        .angle-2 { animation: angle 4.95s linear -1.65s infinite; }
        .size-2 { animation: size 4.95s ease-in-out -1.65s infinite; }
        .particle-2 { animation: particle 4.95s linear -3.3s infinite alternate; }
        .position-2 { animation: position 1.65s ease-out 0s infinite; }

        /* Partícula 3 - Suaves */
        .angle-3 { animation: angle 13.76s linear -6.88s infinite; }
        .size-3 { animation: size 6.88s ease-in-out -5.16s infinite; }
        .particle-3 { animation: particle 5.16s linear -1.72s infinite alternate; }
        .position-3 { animation: position 1.72s ease-out 0s infinite; }

        /* Partícula 4 - Suaves */
        .angle-4 { animation: angle 8s linear -2s infinite; }
        .size-4 { animation: size 8s ease-in-out -2s infinite; }
        .particle-4 { animation: particle 4s linear -2s infinite alternate; }
        .position-4 { animation: position 2.2s ease-out 0s infinite; }

        /* Partícula 5 - Suaves */
        .angle-5 { animation: angle 12s linear -4s infinite; }
        .size-5 { animation: size 12s ease-in-out -4s infinite; }
        .particle-5 { animation: particle 3.5s linear -1s infinite alternate; }
        .position-5 { animation: position 2.45s ease-out 0s infinite; }
      `}</style>
    </>
  )
}