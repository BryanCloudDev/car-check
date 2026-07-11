import type { ReactNode } from 'react';

const features = [
  {
    title: 'Historial global por VIN',
    description:
      'Cada vehículo se identifica por su VIN. Consulta todo su historial de servicios sin importar cuándo o dónde pasó por el taller.',
    icon: (
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
    ),
  },
  {
    title: 'Órdenes de trabajo',
    description:
      'Crea órdenes, asigna estados (recibido, en proceso, listo) y calcula el costo total automáticamente a partir de los ítems.',
    icon: (
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" />
    ),
  },
  {
    title: 'Gestión de clientes',
    description:
      'Mantén los datos de tus clientes vinculados a sus vehículos y órdenes. Todo privado y ordenado por taller.',
    icon: (
      <path d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m6-5.13a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm6 2a3 3 0 1 0-2-5.24" />
    ),
  },
  {
    title: 'Fotos del servicio',
    description:
      'Adjunta evidencia fotográfica a cada orden. Documenta el estado del vehículo antes y después de cada trabajo.',
    icon: (
      <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zm9 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    ),
  },
  {
    title: 'Multi-taller y roles',
    description:
      'Cada taller gestiona sus propios datos con usuarios administradores y mecánicos, cada uno con su nivel de acceso.',
    icon: (
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
    ),
  },
  {
    title: 'Comprobantes al instante',
    description:
      'Genera comprobantes de cada orden de trabajo listos para compartir o entregar a tu cliente.',
    icon: (
      <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
    ),
  },
];

const steps = [
  {
    step: '01',
    title: 'Registra el vehículo',
    description: 'Ingresa el VIN y los datos básicos. Si ya existe, recuperas su historial completo al instante.',
  },
  {
    step: '02',
    title: 'Crea la orden de trabajo',
    description: 'Asocia el cliente, describe los servicios y adjunta fotos. El costo se calcula solo.',
  },
  {
    step: '03',
    title: 'Entrega y documenta',
    description: 'Actualiza el estado, genera el comprobante y deja todo registrado en el historial del vehículo.',
  },
];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      {children}
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Icon>
                <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13m-14 0h14m-14 0v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1m10 1v-1m0 0a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4M7.5 15.5h.01m8.99 0h.01" />
              </Icon>
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900">Car Check</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="transition-colors hover:text-gray-900">Características</a>
            <a href="#how" className="transition-colors hover:text-gray-900">Cómo funciona</a>
            <a href="#cta" className="transition-colors hover:text-gray-900">Empezar</a>
          </nav>
          <a
            href="#cta"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Solicitar demo
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50 to-white" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-1.5 text-sm font-medium text-brand-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              La plataforma para talleres mecánicos modernos
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Todo el historial de cada vehículo,{' '}
              <span className="text-brand-600">en un solo lugar</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Car Check organiza tu taller de principio a fin: vehículos identificados por VIN,
              órdenes de trabajo, clientes y fotos del servicio. Menos papeleo, más autos atendidos.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#cta"
                className="w-full rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:w-auto"
              >
                Empieza gratis
              </a>
              <a
                href="#features"
                className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
              >
                Ver características
              </a>
            </div>

            {/* Mock preview */}
            <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="flex items-center gap-1.5 pb-4">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Vehículos activos', value: '128' },
                    { label: 'Órdenes en proceso', value: '17' },
                    { label: 'Clientes registrados', value: '94' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-4 text-left">
                      <p className="text-sm text-gray-500">{s.label}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    ['VIN 1HGCM82633A004352', 'Toyota Corolla', 'En proceso'],
                    ['VIN 3FA6P0H74HR12345', 'Honda Civic', 'Recibido'],
                    ['VIN JN8AS5MT9FW00001', 'Nissan Rogue', 'Listo'],
                  ].map(([vin, car, status]) => (
                    <div
                      key={vin}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm"
                    >
                      <span className="font-mono text-xs text-gray-500">{vin}</span>
                      <span className="font-medium text-gray-800">{car}</span>
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Todo lo que tu taller necesita
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Diseñado alrededor de cómo trabajan los talleres de verdad, no de lo que es fácil de programar.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon>{f.icon}</Icon>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-gray-50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Tres pasos, cero papeleo
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Desde que el auto entra hasta que el cliente se lo lleva.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.step} className="relative rounded-2xl bg-white p-8 shadow-sm">
                  <span className="text-4xl font-extrabold text-brand-100">{s.step}</span>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="mx-auto max-w-6xl px-6 py-24">
          <div className="overflow-hidden rounded-3xl bg-brand-600 px-8 py-16 text-center shadow-lg sm:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Lleva tu taller al siguiente nivel
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
              Empieza a registrar vehículos y órdenes hoy mismo. Sin instalaciones, funciona en cualquier navegador.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#"
                className="w-full rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand-700 transition-colors hover:bg-brand-50 sm:w-auto"
              >
                Crear cuenta
              </a>
              <a
                href="#"
                className="w-full rounded-lg border border-brand-400 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-700 sm:w-auto"
              >
                Hablar con ventas
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Icon>
                <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13m-14 0h14m-14 0v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1m10 1v-1" />
              </Icon>
            </span>
            <span className="font-semibold text-gray-900">Car Check</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Car Check. Gestión para talleres mecánicos.
          </p>
        </div>
      </footer>
    </div>
  );
}
