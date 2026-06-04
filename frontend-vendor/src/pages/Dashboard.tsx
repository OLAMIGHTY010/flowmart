import React from "react";
import { Bell, AlertTriangle, ArrowUpRight, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-[812px] bg-background text-foreground antialiased selection:bg-primary/10">
      
      {/* Top Navigation Header */}
      <header className="p-4 border-b bg-card flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
            S
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Shomby System</h1>
            <p className="text-xs text-muted-foreground">Admin Workspace</p>
          </div>
        </div>
        
        {/* Quick Action Notification Indicator Badge */}
        <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full">
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive rounded-full border-2 border-background flex items-center justify-center text-[9px] text-destructive-foreground font-bold animate-pulse">
            1
          </span>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </Button>
      </header>

      {/* Main Dashboard Workspace Scroll Body */}
      <main className="flex-1 p-4 flex flex-col gap-4 overflow-x-hidden">
        
        {/* Core Financial KPI Stats Grid overview */}
        <section className="grid grid-cols-2 gap-3">
          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-1 space-y-0.5">
              <CardDescription className="text-xs font-medium">Gross Volume</CardDescription>
              <CardTitle className="text-xl font-bold tracking-tight">₦2,450,000</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold gap-0.5 pointer-events-none">
                <ArrowUpRight className="h-3 w-3" />
                12.4%
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-3 pb-1 space-y-0.5">
              <CardDescription className="text-xs font-medium">Active Bookings</CardDescription>
              <CardTitle className="text-xl font-bold tracking-tight">38 slots</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold gap-1 pointer-events-none">
                <Activity className="h-3 w-3" />
                Stable
              </Badge>
            </CardContent>
          </Card>
        </section>

        {/* Dynamic Warning Notification Alert Bar banner */}
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive dark:text-destructive-foreground">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-xs leading-relaxed">
            <span className="font-bold">Payout Hold:</span> Verify alternative gateway webhook credentials to resume automated routing.
          </AlertDescription>
        </Alert>

        {/* Desktop Tables Style Box Wrap */}
        <Card className="shadow-sm overflow-hidden flex flex-col border">
          <CardHeader className="p-3 bg-muted/30 border-b flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent Transactions
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-medium bg-background px-2 py-0.5 rounded-full text-primary border-primary/20">
              Live view
            </Badge>
          </CardHeader>

          {/* Table Container wrapping proper layout control semantics */}
          {/* <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <SidebarTableHead className="text-[11px]">Reference</SidebarTableHead>
                  <SidebarTableHead className="text-[11px]">Gateway</SidebarTableHead>
                  <SidebarTableHead className="text-[11px] text-right">Amount</SidebarTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="p-3">
                    <div className="font-semibold text-xs">TXN-9021</div>
                    <div className="text-[10px] text-muted-foreground">Shomby Hall Ltd</div>
                  </TableCell>
                  <TableCell className="p-3">
                    <Badge variant="outline" className="font-medium text-[10px] px-1.5 py-0">Paystack</Badge>
                  </TableCell>
                  <TableCell className="p-3 font-bold text-xs text-right">₦180,000</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="p-3">
                    <div className="font-semibold text-xs">TXN-4412</div>
                    <div className="text-[10px] text-muted-foreground">Package Fee Update</div>
                  </TableCell>
                  <TableCell className="p-3">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium text-[10px] px-1.5 py-0">
                      Flutterwave
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3 font-bold text-xs text-right">₦420,000</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="p-3">
                    <div className="font-semibold text-xs">TXN-1109</div>
                    <div className="text-[10px] text-muted-foreground">Gallery Upgrade</div>
                  </TableCell>
                  <TableCell className="p-3">
                    <Badge variant="outline" className="font-medium text-[10px] px-1.5 py-0">Paystack</Badge>
                  </TableCell>
                  <TableCell className="p-3 font-bold text-xs text-right">₦75,000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div> */}
          
          <CardFooter className="p-1.5 bg-muted/10 border-t text-center">
            <Button variant="ghost" size="sm" className="w-full text-xs font-medium text-primary hover:text-primary/90 hover:bg-muted/50">
              View Entire Ledger Table →
            </Button>
          </CardFooter>
        </Card>

        {/* Secondary Workflow Block Panel */}
        <Card className="bg-slate-900 dark:bg-zinc-950 text-slate-50 border-none shadow-md">
          <CardHeader className="p-4 pb-2 space-y-1">
            <CardTitle className="text-sm font-semibold text-white/90">System Simulation Node</CardTitle>
            <CardDescription className="text-xs text-white/60">
              Asset image optimization processing queue is active.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-2">
            <Progress value={75} className="h-1.5 bg-white/10" indicatorClassName="bg-primary" />
          </CardContent>
          <CardFooter className="px-4 pb-4 pt-1 flex justify-between items-center text-[11px] text-white/50">
            <span>75% Synchronized</span>
            <span className="font-mono text-[10px]">Node: Convergent-West</span>
          </CardFooter>
        </Card>

      </main>

      {/* Global Fixed Viewport Canvas Footer Bar */}
      <footer className="mt-auto p-4 bg-muted border-t text-center text-[11px] text-muted-foreground/60 font-medium tracking-wide">
        Fixed Layout Context • 375px Base Canvas Width
      </footer>
    </div>
  );
};

// Quick structural sub-primitive wrapper to ensure uniform styling for shadcn header blocks on tight viewports
const SidebarTableHead = ({ className, ...props }: React.ComponentProps<typeof TableHead>) => (
  <TableHead className={`p-3 h-auto font-bold uppercase text-muted-foreground ${className}`} {...props} />
);


export default Dashboard