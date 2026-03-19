
import { getTeamStats } from "@/lib/actions/team"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Edit, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function TeamPage() {
    const team = await getTeamStats()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Équipe</h2>
                <Link href="/admin/team/new">
                    <Button className="gap-2">
                        <UserPlus size={16} /> Ajouter Employé
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Vue d'ensemble des Employés</CardTitle>
                        <CardDescription>
                            Suivi des performances et de la paie estimée pour la période en cours.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employé</TableHead>
                                    <TableHead>Jobs Effectués</TableHead>
                                    <TableHead>Heures (Est.)</TableHead>
                                    <TableHead>Taux Horaire</TableHead>
                                    <TableHead className="text-right">Paie (Est.)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {team.map((member: any) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div>{member.name}</div>
                                                <div className="text-xs text-muted-foreground">{member.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{member.jobsCount}</TableCell>
                                        <TableCell>{member.hours} h</TableCell>
                                        <TableCell>${member.hourlyRate}/h</TableCell>
                                        <TableCell className="text-right font-bold">
                                            ${member.payPeriod.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Link href={`/admin/schedule?employeeId=${member.employeeProfileId}`}>
                                                    <Button size="icon" variant="outline" title="Voir l'horaire">
                                                        <CalendarIcon size={16} />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/team/${member.id}`}>
                                                    <Button size="icon" variant="ghost">
                                                        <Edit size={16} />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
