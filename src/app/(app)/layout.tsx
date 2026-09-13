import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { isProtected } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        {!isProtected() && (
          <div className="notice notice-block" style={{ marginBottom: 18 }}>
            <strong>Application non protégée.</strong> La variable <span className="mono">APP_PASSWORD</span> n&apos;est
            pas définie : n&apos;importe qui ayant l&apos;adresse peut lire et modifier tes données.
            Acceptable en local, jamais en ligne — <Link href="/settings">voir les Réglages</Link>.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
