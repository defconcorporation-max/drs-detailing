import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, User, Wrench } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Admin Card */}
        <Link href="/admin">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="text-center">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-primary" />
              <CardTitle>Administration</CardTitle>
              <CardDescription>Gérer clients, jobs, et inventaire</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Employee Card */}
        <Link href="/employee">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="text-center">
              <Wrench className="w-12 h-12 mx-auto mb-2 text-blue-500" />
              <CardTitle>Espace Employé</CardTitle>
              <CardDescription>Voir horaire, disponibilités et tâches</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Client Card */}
        <Link href="/client">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="text-center">
              <User className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <CardTitle>Espace Client</CardTitle>
              <CardDescription>Vos suivis, fidélité et prise de RDV</CardDescription>
            </CardHeader>
          </Card>
        </Link>

      </div>
    </div>
  );
}
