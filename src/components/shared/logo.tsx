import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
    className?: string
    imageClassName?: string
    textClassName?: string
    showText?: boolean
}

export function Logo({ className, imageClassName, textClassName, showText = true }: LogoProps) {
    return (
        <Link href="/" className={cn("flex items-center gap-2 group", className)}>
            <div className={cn("relative h-10 w-10 overflow-hidden rounded-lg", imageClassName)}>
                <Image
                    src="/logo.jpg"
                    alt="Dentora Logo"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    priority
                />
            </div>
            {showText && (
                <span className={cn("text-xl font-bold text-gray-900 tracking-tight", textClassName)}>
                    Dent<span className="text-primary-500">ora</span>
                </span>
            )}
        </Link>
    )
}
