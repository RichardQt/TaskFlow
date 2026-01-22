"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  displayLabel: string
  setDisplayLabel: (label: string) => void
} | null>(null)

const useSelectContext = () => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("Select components must be used within a Select")
  return context
}

const Select = ({ value, onValueChange, children, className }: SelectProps) => {
  const [open, setOpen] = React.useState(false)
  const [displayLabel, setDisplayLabel] = React.useState("")
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, displayLabel, setDisplayLabel }}>
      <div ref={ref} className={cn("relative", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useSelectContext()
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <svg
        className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { displayLabel } = useSelectContext()
  return <span className={!displayLabel ? "text-muted-foreground" : ""}>{displayLabel || placeholder}</span>
}

const SelectContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { open } = useSelectContext()
  if (!open) return null
  return (
    <div
      className={cn(
        "absolute z-50 mt-2 w-full min-w-[8rem] overflow-hidden rounded-xl border border-border/60 bg-popover/95 p-1.5 shadow-xl shadow-black/5 animate-fade-in backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  )
}

const SelectItem = ({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) => {
  const { value: selectedValue, onValueChange, setOpen, setDisplayLabel } = useSelectContext()

  // Set display label when this item is selected
  React.useEffect(() => {
    if (selectedValue === value && typeof children === 'string') {
      setDisplayLabel(children)
    }
  }, [selectedValue, value, children, setDisplayLabel])

  const handleClick = () => {
    onValueChange(value)
    // Extract text content from children for display
    const label = typeof children === 'string' ? children :
      ((children as React.ReactElement)?.props as { children?: React.ReactNode[] })?.children?.[1] || value
    setDisplayLabel(typeof label === 'string' ? label : value)
    setOpen(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 px-3 text-sm outline-none transition-all duration-200 hover:bg-muted/80 mb-1 last:mb-0",
        "font-medium group",
        selectedValue === value && "bg-accent/10 text-accent font-semibold hover:bg-accent/15",
        className
      )}
    >
      {children}
      {selectedValue === value && (
        <span className="absolute right-3 flex h-1.5 w-1.5 rounded-full bg-accent animate-in fade-in zoom-in duration-300" />
      )}
    </button>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
