import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SITE_CONFIG, FOOTER_LINKS } from "@/lib/constants"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 mb-8">
          <div>
            <h3 className="font-semibold mb-4">상품</h3>
            <nav className="flex flex-col gap-3">
              {FOOTER_LINKS.product.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4">회사</h3>
            <nav className="flex flex-col gap-3">
              {FOOTER_LINKS.company.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <Separator />

        <div className="mt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {SITE_CONFIG.name}. 모든 권리는 저작권자에게 귀속됩니다.
          </p>
          <Link href="/" className="text-sm font-medium hover:text-foreground">
            {SITE_CONFIG.name}
          </Link>
        </div>
      </div>
    </footer>
  )
}
