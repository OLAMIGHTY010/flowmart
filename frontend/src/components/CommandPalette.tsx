import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Command, ShoppingBag, Package, User, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
    setSearch("");
  };

  const menuItems = [
    { icon: ShoppingBag, label: "View all Products", path: "/" },
    { icon: Package, label: "Track my Orders", path: "/orders" },
    { icon: User, label: "My Profile", path: "/profile" },
    { icon: MapPin, label: "Saved Addresses", path: "/profile/addresses" },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Trigger Button (Desktop) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 rounded-md hover:bg-secondary border border-border/40 transition-colors"
      >
        <Search size={16} />
        <span>Search anything...</span>
        <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 bg-primary text-white p-3 rounded-full shadow-lg"
      >
        <Search size={20} />
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-xl bg-background rounded-2xl shadow-2xl overflow-hidden border border-border pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Search Input */}
                <div className="flex items-center border-b px-4 border-border">
                  <Search className="mr-3 h-5 w-5 text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    placeholder="Search for products, orders, settings..."
                    className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <kbd className="hidden sm:inline-flex ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                    ESC
                  </kbd>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {filteredItems.length === 0 ? (
                    <div className="py-14 px-6 text-center text-sm text-muted-foreground">
                      <Command className="mx-auto h-8 w-8 opacity-20 mb-3" />
                      No results found for "{search}".
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Quick Links
                      </div>
                      {filteredItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelect(item.path)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground transition-colors hover:bg-secondary/60 hover:text-primary active:bg-secondary"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background shadow-sm border border-border/50">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
