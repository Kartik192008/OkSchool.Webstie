import { Link } from "wouter";
import { Menu, Search, User, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        setIsAdmin(session.user.email === "kartik1911k@gmail.com");
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        setIsAdmin(session.user.email === "kartik1911k@gmail.com");
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-medium hover:text-primary transition-colors">Home</Link>
                <Link href="/mock-tests" className="text-lg font-medium hover:text-primary transition-colors">Mock Tests</Link>
                <Link href="/amazon-store" className="text-lg font-medium hover:text-primary transition-colors">Amazon Store</Link>
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

          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <img src="favicon.png" alt="OkSchool" className="h-9 w-9" />
            <span className="font-serif font-bold text-xl tracking-tight text-foreground">OkSchool</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/mock-tests" className="hover:text-primary transition-colors">Mock Tests</Link>
            <Link href="/amazon-store" className="hover:text-primary transition-colors">Amazon Store</Link>
            {isAdmin && <Link href="/admin" className="hover:text-primary transition-colors">Admin Panel</Link>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <form action="/search" method="GET" className="relative hidden sm:block w-64" data-testid="form-search">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Search notes, tests..."
              className="pl-9 bg-card"
            />
          </form>
          <div className="hidden sm:flex items-center gap-4">
            {!isAuthenticated ? (
              <Link href="/login">
                <Button variant="outline" size="sm" data-testid="button-login">Login</Button>
              </Link>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{userEmail}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
