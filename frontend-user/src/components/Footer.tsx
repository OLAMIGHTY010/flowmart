import {
  Home,
  Bell,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
// import { useStore } from "@/store/useCart";

export default function Footer() {
  const NAV = [
    {
      to: "/",
      icon: Home,
      label: "Home",
    },
    {
      to: "/alerts",
      icon: Bell,
      label: "Alerts",
    },
    {
      to: "/orders",
      icon: ShoppingBag,
      label: "Orders",
    },
    {
      to: "/cart",
      icon: ShoppingCart,
      label: "Cart",
    },
    {
      to: "/profile",
      icon: User,
      label: "Me",
    },
  ];

  const { pathname } = useLocation();

  // const { alerts = [], cart = [] } = useSta();

  // const unread = alerts.filter((alert) => !alert.read).length;

  // const cartCount = cart.reduce(
  //   (total, item) => total + item.qty,
  //   0
  // );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background px-2 py-3 shadow-sm md:hidden">
      {NAV.map(({ to, icon: Icon, label }) => {
        const active =
          to === "/"
            ? pathname === "/"
            : pathname.startsWith(to);

        // const badge =
        //   label === "Alerts"
        //     ? unread
        //     : label === "Cart"
        //     ? cartCount
        //     : 0;

        return (
          <Link
            key={to}
            to={to}
            className="relative flex flex-col items-center gap-1"
          >
            <Icon
              className={`h-[22px] w-[22px] ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            />

            {/* {badge > 0 && (
              <span className="absolute -top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {badge > 99 ? "99+" : badge}
              </span>
            )} */}

            <span
              className={`text-xs ${
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}