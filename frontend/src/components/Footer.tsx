import {
  Home,
  Bell,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function Footer() {
  const NAV = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/alerts", icon: Bell, label: "Alerts" },
    { to: "/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/cart", icon: ShoppingCart, label: "Cart" },
    { to: "/profile", icon: User, label: "Me" },
  ];

  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-around rounded-[24px] border border-white/20 bg-background/80 px-2 py-3 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors tap-highlight-transparent"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative flex flex-col items-center gap-1 z-10"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-primary fill-primary/20" : "text-muted-foreground"
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] transition-colors ${
                    active ? "font-bold text-primary" : "font-medium text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}