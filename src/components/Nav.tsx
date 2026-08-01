import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Compass, Sparkles, Glasses, Map, Dna, LogOut, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { IS_STATIC_DEMO } from "@/lib/staticDemo";

export function AtlasLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-atlas-aurora opacity-90" />
        <span className="absolute inset-[3px] rounded-full bg-white/85 backdrop-blur" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-[hsl(226,30%,12%)]" />
        <span className="animate-orbit absolute inset-[1px] rounded-full border border-dashed border-[hsl(226,30%,12%)]/30" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">Atlas</span>
    </span>
  );
}

const LINKS = [
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/planner", label: "AI Planner", icon: Map },
  { to: "/glasses", label: "Glasses", icon: Glasses },
  { to: "/dna", label: "Travel DNA", icon: Dna },
];

export default function Nav() {
  return IS_STATIC_DEMO ? <StaticNav /> : <LiveNav />;
}

function StaticNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pl-5 pr-2">
        <Link to="/" aria-label="Atlas home">
          <AtlasLogo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold text-foreground/60 transition-colors hover:bg-white/70 hover:text-foreground",
                  isActive && "bg-white/80 text-foreground shadow-sm",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/create"
            className="hidden items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background transition-transform hover:scale-[1.03] sm:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Create with AI
          </Link>
          <Link
            to="/login"
            className="chip border border-foreground/10 bg-white/70 text-foreground/65 backdrop-blur transition-colors hover:bg-white"
          >
            Read-only demo
          </Link>
        </div>
      </nav>
    </header>
  );
}

function LiveNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pl-5 pr-2">
        <Link to="/" aria-label="Atlas home">
          <AtlasLogo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold text-foreground/60 transition-colors hover:bg-white/70 hover:text-foreground",
                  isActive && "bg-white/80 text-foreground shadow-sm",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/create"
            className="hidden items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background transition-transform hover:scale-[1.03] sm:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Create with AI
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-atlas-aurora text-xs font-bold text-white">
                    {(user.name || "E").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong w-52 rounded-2xl border-white/60 p-2">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-bold">{user.name || "Explorer"}</p>
                  <p className="text-xs text-muted-foreground">{user.email || "Atlas explorer"}</p>
                </div>
                <DropdownMenuSeparator className="bg-foreground/5" />
                <DropdownMenuItem className="rounded-xl" onClick={() => navigate("/dna")}>
                  <Dna className="mr-2 h-4 w-4" /> My Travel DNA
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl" onClick={() => navigate("/planner")}>
                  <Map className="mr-2 h-4 w-4" /> My Trips
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl" onClick={() => navigate("/create")}>
                  <Plus className="mr-2 h-4 w-4" /> New Journey
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-foreground/5" />
                <DropdownMenuItem className="rounded-xl text-destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to={LOGIN_PATH}
              className="rounded-full border border-foreground/10 bg-white/70 px-4 py-2 text-sm font-bold backdrop-blur transition-colors hover:bg-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
