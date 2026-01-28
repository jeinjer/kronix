import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Si Tailwind funciona, verás un fondo oscuro y esta card centrada */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition hover:scale-105 duration-300">
        
        <div className="bg-indigo-600 p-6 text-center">
          <div className="inline-block p-3 bg-indigo-500 rounded-full mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
            SaaS Barbería
          </h1>
          <p className="text-indigo-100 text-sm">Proyecto: Carlos Paz Bot</p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
              TAILWIND ACTIVO ✅
            </span>
            <span className="text-gray-400 text-xs font-mono">v3.4+</span>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">
            Si ves el fondo azul oscuro, esta tarjeta con bordes redondeados y el botón brilla al pasar el mouse, 
            entonces <strong>Tailwind CSS</strong> está perfectamente configurado.
          </p>

          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/50 transition-all">
            ¡Todo listo para arrancar!
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400 italic">Testing UI - Villa Carlos Paz 2026</p>
        </div>
      </div>
    </div>
  );
}

export default App;