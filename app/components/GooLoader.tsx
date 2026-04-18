export default function GooLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <style>{`
        .loader-orbit {
          width: 80px;
          height: 80px;
          position: relative;
        }
        .loader-orbit .orbit {
          position: absolute;
          inset: 0;
          animation: orbitSpin 2.6s cubic-bezier(.65,.02,.35,1) infinite;
        }
        .loader-orbit .orbit:nth-child(2) { animation-delay: -0.17s; transform: rotate(120deg); }
        .loader-orbit .orbit:nth-child(3) { animation-delay: -0.34s; transform: rotate(240deg); }
        .loader-orbit .drop {
          position: absolute;
          top: 50%; left: 50%;
          width: 18px; height: 18px;
          margin: -9px 0 0 -9px;
          background: #25D366;
          border-radius: 50%;
          transform: translateY(-28px);
          animation: pulseDrop 2.6s cubic-bezier(.65,.02,.35,1) infinite;
        }
        .loader-orbit .core {
          position: absolute;
          top: 50%; left: 50%;
          width: 14px; height: 14px;
          margin: -7px 0 0 -7px;
          background: #25D366;
          border-radius: 50%;
          animation: pulseCore 2.6s ease-in-out infinite;
        }
        .loader-orbit .wrap {
          position: absolute;
          inset: 0;
          filter: url(#goo-orbit);
        }
        @keyframes orbitSpin { to { transform: rotate(360deg); } }
        @keyframes orbitSpin2 { to { transform: rotate(480deg); } }
        @keyframes orbitSpin3 { to { transform: rotate(600deg); } }
        @keyframes pulseDrop {
          0%, 100% { transform: translateY(-28px) scale(1); }
          50%       { transform: translateY(-16px) scale(0.65); }
        }
        @keyframes pulseCore {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.6); }
        }
      `}</style>

      <div className="loader-orbit" aria-label="Carregando">
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="goo-orbit">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>
        <div className="wrap">
          <div className="core" />
          <div className="orbit"><div className="drop" /></div>
          <div className="orbit"><div className="drop" /></div>
          <div className="orbit"><div className="drop" /></div>
        </div>
      </div>

      <span className="text-sm text-gray-400">Carregando...</span>
    </div>
  )
}
