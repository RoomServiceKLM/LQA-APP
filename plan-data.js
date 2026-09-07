// Generado a partir de 'Plan_de_Acción_LQA.docx' (Hotel Kimpton Los Monteros Marbella).
const PLAN_DATA = {
  hotel: "Hotel Kimpton Los Monteros Marbella",
  horizonte: "Horizonte de implantación: 6 meses",
  objetivo: "Implementar los estándares LQA (Leading Quality Assurance) en todos los puntos de venta de Food & Beverage, creando una cultura de servicio de lujo consistente, medible y sostenible, con el objetivo de alcanzar una puntuación superior al 85% en una futura auditoría.",
  kpis: {
    formacion: ["100% del equipo formado en LQA.", "100% del equipo evaluado."],
    auditorias: [
      { hito: "Mes 1", meta: 70 },
      { hito: "Mes 3", meta: 80 },
      { hito: "Mes 8", meta: 85 }
    ],
    satisfaccion: [
      "Incremento del índice de satisfacción F&B.",
      "Reducción de comentarios negativos relacionados con el servicio.",
      "Incremento del ticket medio mediante upselling."
    ],
    factoresCriticos: [
      "Formación continua, no puntual.",
      "Auditorías internas constantes.",
      "Feedback inmediato tras los errores.",
      "Reconocimiento frecuente de los comportamientos correctos.",
      "Convertir LQA en una cultura de servicio y no únicamente en una preparación para una auditoría."
    ]
  },
  fases: [
    {
      id: "fase1",
      numero: 1,
      nombre: "Diagnóstico y Concienciación",
      periodo: "Semanas 1-2",
      objetivos: ["Introducir LQA al equipo.", "Identificar brechas entre la operativa actual y los estándares de lujo.", "Crear estructura de trabajo."],
      acciones: [
        "Formación inicial para Managers y Supervisores (qué es LQA, cómo se audita, impacto en reputación y posicionamiento, diferencia entre servicio de lujo y tradicional).",
        "Nombrar un \"LQA Champion\" dentro de F&B.",
        "Revisar el cuestionario LQA aplicable a Desayuno, Restaurantes, Bares, Room Service y Beach Club.",
        "Realizar auditoría interna inicial (\"mock audit\") para fijar el nivel posterior al training.",
        "Identificar 20 puntos rápidos de mejora."
      ],
      entregables: ["Matriz de prioridades", "Calendario de implantación"]
    },
    {
      id: "fase2",
      numero: 2,
      nombre: "Estándares y SOPs",
      periodo: "Semanas 2-4",
      objetivos: ["Estandarizar la experiencia del huésped.", "Eliminar variaciones entre empleados y turnos."],
      acciones: [
        "Definir secuencia de servicio completa por outlet (saludo inicial <30s, presentación personal, acompañamiento a la mesa, presentación de carta, toma de bebida, upselling, seguimiento durante la comida, despedida personalizada).",
        "Crear SOPs: recepción de huéspedes, toma de comandas, servicio de vino, servicio de champagne, manejo de alergias, gestión de quejas, recuperación de servicio, room service, despedida del huésped.",
        "Fichas de conocimiento de producto: menús, vinos, cócteles, ingredientes principales, alérgenos."
      ],
      entregables: ["Manual de Servicio LQA F&B", "SOPs", "Secuencias de servicio visibles en back office"]
    },
    {
      id: "fase3",
      numero: 3,
      nombre: "Formación Operativa",
      periodo: "Semanas 5-10",
      objetivos: ["Convertir los estándares en hábitos."],
      acciones: [
        "Role plays semanales: cliente VIP, cliente recurrente, queja por demora, alergia alimentaria, celebración especial, cliente difícil.",
        "Mystery guest interno: 1 auditoría semanal por outlet."
      ],
      entregables: ["Registro de formación", "Evaluación individual del equipo", "Certificación interna"]
    },
    {
      id: "fase4",
      numero: 4,
      nombre: "Cultura de LQA",
      periodo: "Semanas 5-En adelante",
      objetivos: ["Hacer que LQA forme parte del día a día."],
      acciones: [
        "Briefings diarios incluyendo: estándar LQA del día, producto destacado, comentario de huésped."
      ],
      entregables: ["Estándar LQA del día en cada briefing", "Producto destacado en cada briefing", "Comentario de huésped en cada briefing"]
    },
    {
      id: "fase5",
      numero: 5,
      nombre: "Auditorías Internas",
      periodo: "Semanas 8-12",
      objetivos: ["Preparar al departamento para una auditoría real."],
      acciones: [
        "Auditorías completas: desayuno, restaurante principal, bar, room service.",
        "Revisión semanal de resultados, acciones correctivas y seguimiento de reincidencias."
      ],
      entregables: ["Informe de auditoría", "Plan de corrección"]
    }
  ]
};
