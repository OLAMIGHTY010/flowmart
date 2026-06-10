import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import React from "react";

function Homepage() {
  return (
    <>
      <div className="border-b border-border bg-background px-4 py-3 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3 py-2.5">
            <Search className="h-4 w-4 "/>
            <Input
              type="text"
              placeholder="Search products..."
              className="w-full bg-transparent cz <<<"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Homepage;