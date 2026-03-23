"use client"

import { useState } from "react"
import { Sparkles, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BeforeAfterReelProps {
    beforeUrl: string
    afterUrl: string
}

export function BeforeAfterReel({ beforeUrl, afterUrl }: BeforeAfterReelProps) {
    const [sliderPos, setSliderPos] = useState(50)

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        const container = e.currentTarget.getBoundingClientRect()
        let x = 0
        if ('touches' in e) {
            x = e.touches[0].clientX - container.left
        } else {
            x = e.clientX - container.left
        }
        const percent = (x / container.width) * 100
        setSliderPos(Math.min(100, Math.max(0, percent)))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                    <Sparkles size={14} /> Transformation DRS
                </div>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <span>Avant</span>
                    <span className="text-white">Après</span>
                </div>
            </div>

            <div 
                className="relative aspect-video rounded-[30px] overflow-hidden cursor-ew-resize group select-none"
                onMouseMove={handleMove}
                onTouchMove={handleMove}
            >
                {/* After Image (Background) */}
                <img 
                    src={afterUrl} 
                    alt="Après" 
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Before Image (Foreground with Clip) */}
                <div 
                    className="absolute inset-0 w-full h-full overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                    <img 
                        src={beforeUrl} 
                        alt="Avant" 
                        className="absolute inset-0 w-full h-full object-cover grayscale-[0.5]"
                    />
                </div>

                {/* Slider Handle */}
                <div 
                    className="absolute top-0 bottom-0 w-1 bg-white/50 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10 pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                        <ArrowLeftRight size={20} />
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-6 left-6 z-20 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                    Glissez pour comparer
                </div>
            </div>
        </div>
    )
}
