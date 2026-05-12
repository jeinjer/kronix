export const getPlans = async () => {
  // Simulación de respuesta desde la BD
  return {
    data: [
      {
        id: "emprendedor",
        name: "Emprendedor",
        price: 10000,
        currency: "ARS",
        isPopular: false,
        features: [
          "1 Organización",
          "Turnos ilimitados",
          "Métricas solo de turnos",
          "7 días de prueba"
        ],
        missing: [
          "Bot interactivo (Kronia)",
          "Dashboards avanzados",
          "Múltiples sucursales"
        ]
      },
      {
        id: "negocio",
        name: "Negocio",
        price: 15000,
        currency: "ARS",
        isPopular: true,
        features: [
          "Múltiples sucursales",
          "Manejo de staff y horarios",
          "Dashboards visuales",
          "Bot interactivo Kronia",
          "Destacado en Portal de Clientes",
          "7 días de prueba"
        ],
        missing: [
          "Locales ilimitados"
        ]
      },
      {
        id: "franquicias",
        name: "Franquicias",
        price: 40000,
        currency: "ARS",
        isPopular: false,
        features: [
          "Negocios propios ilimitados",
          "Todos los beneficios de Negocio",
          "Dashboards avanzados/corporativos",
          "Soporte prioritario 24/7",
          "7 días de prueba"
        ],
        missing: []
      }
    ],
    error: null
  };
};
