import { Link } from "wouter";
import { Menu, Search, LogOut, Sun, Moon, User, Settings, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        setIsAdmin(session.user.email === "kartik1911k@gmail.com");
        const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
        setUserName(name);
      }
    };

    checkUser();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        setIsAdmin(session.user.email === "kartik1911k@gmail.com");
        const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
        setUserName(name);
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
        setUserName("");
        setIsAdmin(false);
      }
    });

    return () => data?.subscription?.unsubscribe?.();
  }, []);

  const getInitials = (name: string, email: string) => {
    if (name && name !== "User") {
      const parts = name.split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const SettingsItem = ({ href, children, show = true }: { href: string; children: React.ReactNode; show?: boolean }) => {
    if (!show) return null;
    return (
      <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors">
        <ChevronRight className="h-4 w-4" />
        {children}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden transition-transform active:scale-95" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-medium hover:text-primary transition-colors">Home</Link>
                <Link href="/mock-tests" className="text-lg font-medium hover:text-primary transition-colors">Mock Tests</Link>
                <Link href="/amazon-store" className="text-lg font-medium hover:text-primary transition-colors">Amazon Store</Link>
                {isAuthenticated && (
                  <>
                    <Link href="/mock-test-history" className="text-lg font-medium hover:text-primary transition-colors">Mock Test History</Link>
                    <Link href="/purchase-history" className="text-lg font-medium hover:text-primary transition-colors">Purchase History</Link>
                  </>
                )}
                {isAdmin && <Link href="/admin" className="text-lg font-medium hover:text-primary transition-colors">Admin Panel</Link>}
                {isAuthenticated && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{userEmail}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                )}
                {!isAuthenticated && <Link href="/login" className="text-lg font-medium hover:text-primary transition-colors">Login</Link>}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2.5" data-testid="link-home">
            <img src="favicon.png" alt="OkSchool" className="h-9 w-9" />
            <span className="font-serif font-bold text-xl tracking-tight text-foreground">OkSchool</span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <Link href="/" className="relative hover:text-primary transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">Home</Link>
            <Link href="/mock-tests" className="relative hover:text-primary transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">Mock Tests</Link>
            <Link href="/amazon-store" className="relative hover:text-primary transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">Amazon Store</Link>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 hover:bg-accent/10"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Button>
              {isSettingsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSettingsOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border bg-background shadow-lg z-50">
                    <div className="px-3 py-2 border-b">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Account</p>
                    </div>
                    <div className="py-1.5">
                      {isAuthenticated && (
                        <>
                          <SettingsItem href="/mock-test-history">Mock Test History</SettingsItem>
                          <SettingsItem href="/purchase-history">Purchase History</SettingsItem>
                        </>
                      )}
                      {isAdmin && <SettingsItem href="/admin">Admin Panel</SettingsItem>}
                    </div>
                    <div className="px-3 py-2 border-t">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">About</p>
                    </div>
                    <div className="py-1.5">
                      <SettingsItem href="/about">About Us</SettingsItem>
                      <SettingsItem href="/terms">Terms of Service</SettingsItem>
                      <SettingsItem href="/privacy">Privacy Policy</SettingsItem>
                      <SettingsItem href="/refund">Refund & Cancellation Policy</SettingsItem>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <form action="/search" method="GET" className="relative hidden lg:block w-72" data-testid="form-search">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Search notes, tests..."
              className="pl-10 bg-card transition-all focus:ring-2 focus:ring-primary/20"
            />
          </form>
          {isAuthenticated && (
            <div className="hidden sm:flex relative">
              <Button
                variant="ghost"
                className="flex items-center gap-2.5 h-10 pl-1 pr-2 transition-all hover:bg-accent/10"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                data-testid="button-profile"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary to-accent text-white">
                    {getInitials(userName, userEmail)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {userName}
                </span>
              </Button>
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-background shadow-lg z-50">
                    <div className="px-3 py-2.5 border-b">
                      <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {!isAuthenticated && (
            <div className="hidden sm:block">
              <Link href="/login">
                <Button variant="default" size="sm" className="bg-gradient-to-r from-primary to-accent text-white" data-testid="button-login">Login</Button>
              </Link>
            </div>
          )}
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="transition-transform active:scale-95"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
