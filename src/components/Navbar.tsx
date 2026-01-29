import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Globe, Menu } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import brandIcon from "@/assets/orion-atlas-icon-square.png";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const showBack = location.pathname !== "/";

  const handleBack = () => {
    // If the user landed directly on a deep link, history may not contain a previous route.
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Bots + Websites", href: "/#solutions" },
    { label: "E-commerce", href: "/#ecommerce" },
    { label: "Features", href: "/#features" },
    { label: "Platforms", href: "/#platforms" },
    { label: "More", href: "/#more" },
    { label: "AI Chat", href: "/ai-chat" },
    { label: "Bots", href: "/bots" },
    { label: "Integrations", href: "/integrations" },
   { label: "Templates", href: "/templates" },
    { label: "Storefront", href: "/storefront" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="Back"
              className="mr-1"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
          )}

          <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <img
              src={brandIcon}
              alt="Orion Atlas icon"
              className="w-6 h-6 object-contain"
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-gradient">Orion Atlas</span>
            <span className="hidden sm:inline-flex items-center gap-2 text-muted-foreground">
              <Brain className="w-4 h-4" aria-hidden="true" />
              <Globe className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.label} to={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button className="gradient-primary">Get Started</Button>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col gap-6 mt-8">
              {navItems.map((item) => (
                <Link key={item.label} to={item.href} onClick={() => setIsOpen(false)} className="text-lg font-medium">
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};