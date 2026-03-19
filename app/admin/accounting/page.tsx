import { getExpenses, createExpense } from "@/lib/actions/expenses"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Wallet, TrendingDown } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default async function AccountingPage() {
    const expenses = await getExpenses()
    const totalExpenses = expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Comptabilité & Dépenses</h2>
                <AddExpenseDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">-${totalExpenses.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total à ce jour</p>
                    </CardContent>
                </Card>
                {/* Can add Revenue card here if we sum Jobs */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Journal des Dépenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((expense: any) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{expense.category}</TableCell>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell className="text-right font-medium text-destructive">
                                        -${expense.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {expenses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Aucune dépense enregistrée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function AddExpenseDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                    <Plus size={16} />
                    Nouvelle Dépense
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enregistrer Dépense</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                    "use server"
                    await createExpense(formData)
                }} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Catégorie</Label>
                        <div className="col-span-3">
                            <Select name="category" required defaultValue="Produits">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Produits">Achat Produits</SelectItem>
                                    <SelectItem value="Équipement">Équipement</SelectItem>
                                    <SelectItem value="Loyer">Loyer/Local</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="Salaire">Salaires</SelectItem>
                                    <SelectItem value="Autre">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Description</Label>
                        <Input name="description" className="col-span-3" placeholder="Détails..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Montant</Label>
                        <Input name="amount" type="number" step="0.01" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date</Label>
                        <Input name="date" type="date" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" variant="destructive">Enregistrer</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
