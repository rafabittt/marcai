import Link from 'next/link'

// Página de "não achei" no estilo do Grafite: estado vazio com uma pergunta,
// uma promessa e um botão.
export default function NaoEncontrado() {
  return (
    <main className="min-h-dvh grid place-items-center px-6">
      <div className="card max-w-sm w-full empty">
        <img src="/logo.png" alt="Marcaí" style={{ height: 22 }} className="mb-4" />
        <h1 className="t-section">Essa página não existe</h1>
        <p className="t-cap mb-4">O link pode ter mudado ou estar incompleto.</p>
        <Link href="/" className="btn btn-primary">Ir para o início</Link>
      </div>
    </main>
  )
}
