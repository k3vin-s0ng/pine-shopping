import * as React from "react"
import { cn } from "@/app/lib/utils"
import {Eye, EyeClosed} from "lucide-react"
function Password({className, type, ...props }: React.ComponentProps<"input">) {
    const [showPassword, setShowPassword] = React.useState(false);
    return(
        <div className="relative w-full">
            <input
            type={showPassword ? "text":"password"}
            data-slot="input"
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                className
            )}
            {...props}
            />
            <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600">
                {showPassword ? <Eye className="h-4 w-4"/> : <EyeClosed className="h-4 w-4"/>}
            </button>
        </div>
    );
}
export {Password}