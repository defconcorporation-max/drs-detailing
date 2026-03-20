import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export type Option = {
    label: string
    value: string
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Sélectionner..."
}: {
    options: Option[]
    selected: string[]
    onChange: (values: string[]) => void
    placeholder?: string
}) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const handleUnselect = (item: string) => {
        onChange(selected.filter((i) => i !== item))
    }

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-auto min-h-10 w-full min-w-0 max-w-full justify-between gap-2 overflow-hidden hover:bg-background"
                >
                    <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden">
                        {selected.length === 0 && (
                            <span className="truncate text-left font-normal text-muted-foreground">{placeholder}</span>
                        )}
                        {selected.map((item) => {
                            const option = options.find((o) => o.value === item)
                            if (!option) return null
                            return (
                                <Badge
                                    variant="secondary"
                                    key={item}
                                    className="w-auto min-w-0 max-w-[min(100%,12rem)] shrink overflow-hidden pr-0.5"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleUnselect(item)
                                    }}
                                >
                                    <span className="min-w-0 flex-1 truncate text-left">{option.label}</span>
                                    <span className="inline-flex shrink-0 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
                                        <X className="h-3 w-3" />
                                    </span>
                                </Badge>
                            )
                        })}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <div className="p-2 border-b">
                    <Input
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 border-none focus-visible:ring-0 px-2"
                    />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                    {filteredOptions.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Aucun résultat.
                        </div>
                    )}
                    {filteredOptions.map((option) => (
                        <div
                            key={option.value}
                            className={cn(
                                "flex items-center rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                selected.includes(option.value) && "bg-accent"
                            )}
                            onClick={() => {
                                if (selected.includes(option.value)) {
                                    onChange(selected.filter((i) => i !== option.value))
                                } else {
                                    onChange([...selected, option.value])
                                }
                            }}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    selected.includes(option.value)
                                        ? "opacity-100"
                                        : "opacity-0"
                                )}
                            />
                            {option.label}
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
