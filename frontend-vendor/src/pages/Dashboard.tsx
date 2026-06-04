import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const Dashboard = () =>{
  return (
    <div className="relative w-[375px] min-h-[812px] bg-background text-foreground font-body antialiased overflow-x-hidden flex flex-col p-4 gap-4">
      
      {/* Sample Layout Card adapting your utility classes */}
      <Card className="border-border bg-background rounded-lg shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Dashboard Card
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Utilizing variable system settings
          </p>
        </CardHeader>
        
        <CardContent className="p-4 pt-2 flex flex-col gap-3">
          <div className="text-sm leading-relaxed">
            This layout respects your custom font scale rules and theme bounds.
          </div>

          {/* Status Indicators utilizing the specific variables provided */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="p-3 rounded bg-secondary text-secondary-foreground text-xs font-medium border border-primary/20 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary block" />
              Success Banner
            </div>
            
            <div className="p-3 rounded bg-muted text-muted-foreground text-xs font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60 block" />
              Muted Field
            </div>
          </div>

          {/* Example alert block mapped from your layer configuration */}
          <div className="p-3 rounded bg-red-100 border border-error text-red-700 text-xs flex items-center gap-2 mt-1">
            <svg 
              className="h-4 w-4 flex-shrink-0 text-error" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            System notification action required.
          </div>
        </CardContent>
      </Card>

      {/* Decorative background element mimicking absolute tokens in your css */}
      <div className="mt-auto pt-6 text-center text-xs text-muted-foreground/60 border-t border-border">
        Fixed viewport footer • 375px canvas
      </div>
    </div>
  );
}

export default Dashboard;