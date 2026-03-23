import { getExpenses, createExpense } from "@/lib/actions/expenses"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Plus, 
    TrendingDown, 
    TrendingUp, 
    Calendar,
    Receipt
} from "lucide-react"
import { ExpensesOCR } from "@/components/admin/ExpensesOCR"
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
import { GiftCardDialog } from "@/components/admin/GiftCardDialog"
import { getGiftCards } from "@/lib/actions/giftcards"

export default async function AccountingPage() {
    const expenses = await getExpenses()
    const giftCards = await getGiftCards()
    const totalExpenses = expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0)
    const giftCardLiability = giftCards.reduce((acc: number, curr: any) => acc + curr.currentAmount, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase font-display">Comptabilité</h1>
                    <p className="text-muted-foreground italic">Vision globale de la rentabilité du shop</p>
                </div>
                <div className="flex gap-2">
                    <GiftCardDialog />
                    <AddExpenseDialog />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Dépenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-destructive">-${totalExpenses.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Encours Cartes Cadeaux</CardTitle>
                        <Receipt className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-primary">${giftCardLiability.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Revenue Brut (Est.)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-green-500">$0.00</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <ExpensesOCR />
                </div>
                
                <div className="lg:col-span-2">
                    <Card className="border-border/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-wide">
                                <Receipt className="text-primary" size={20} /> Journal des Dépenses
                            </CardTitle>
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
                                        <TableRow key={expense.id} className="hover:bg-muted/30">
                                            <TableCell className="text-xs">{new Date(expense.date).toLocaleDateString()}</TableCell>
                                            <TableCell><span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-bold uppercase">{expense.category}</span></TableCell>
                                            <TableCell className="text-sm">{expense.description}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-destructive">
                                                -${expense.amount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {expenses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                                Aucune dépense enregistrée. Importez un ticket pour commencer.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function AddExpenseDialog() {
    const handleSubmit = async (formData: FormData) => {
        "use server"
        const data = {
            amount: parseFloat(formData.get("amount") as string),
            category: formData.get("category") as string,
            description: formData.get("description") as string,
            date: new Date(formData.get("date") as string),
        }
        await createExpense(data)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl group hover:border-destructive hover:text-destructive transition-colors">
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                    Manuelle
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="uppercase tracking-widest font-display">Saisie Manuelle</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Catégorie</Label>
                        <div className="col-span-3">
                            <Select name="category" required defaultValue="SUPPLIES">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUPPLIES">Achat Produits</SelectItem>
                                    <SelectItem value="EQUIPMENT">Équipement</SelectItem>
                                    <SelectItem value="RENT">Loyer/Local</SelectItem>
                                    <SelectItem value="MARKETING">Marketing</SelectItem>
                                    <SelectItem value="SALARY">Salaires</SelectItem>
                                    <SelectItem value="OTHER">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Description</Label>
                        <Input name="description" className="col-span-3" placeholder="Détails de l'achat..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Montant</Label>
                        <Input name="amount" type="number" step="0.01" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date</Label>
                        <Input name="date" type="date" className="col-span-3" required defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" variant="destructive" className="w-full rounded-xl uppercase font-bold tracking-wider">Enregistrer la dépense</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
