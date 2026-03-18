import Link from 'next/link'

export default function LogoLink() {
  return (
    <Link href="/">
      <img src="/logo.png" alt="Marcaí" style={{ height: '28px' }} />
    </Link>
  )
}
