import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SqlBlockProps {
  query: string;
}

export function SqlBlock({ query }: SqlBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mt-2 mb-4">
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-max print:hidden">
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Terminal className="w-3.5 h-3.5" />
        <span className="font-medium tracking-wide">Show SQL</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 animate-in slide-in-from-top-1">
        <div className="bg-black/5 dark:bg-black/40 rounded-md p-3 overflow-x-auto border border-border/50 shadow-inner">
          <code className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all select-all">
            {query}
          </code>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
