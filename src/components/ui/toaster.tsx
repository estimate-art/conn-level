"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isDestructive = props.variant === 'destructive'

        return (
          <Toast key={id} {...props}>
            <div className="grid w-full gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description &&
                (isDestructive && typeof description === "string" ? (
                  <div className="mt-2 w-full pr-6">
                    <p className="mb-2 text-sm text-destructive-foreground/80">
                      Деталі помилки:
                    </p>
                    <ScrollArea className="h-24 w-full rounded-md border border-destructive-foreground/20 bg-black/20 p-2">
                      <pre className="whitespace-pre-wrap text-xs font-mono">
                        {description}
                      </pre>
                    </ScrollArea>
                  </div>
                ) : (
                  <ToastDescription>{description}</ToastDescription>
                ))}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
