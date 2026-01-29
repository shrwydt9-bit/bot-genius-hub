import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageShell containerClassName="container max-w-xl">
      <div className="glass-panel glow-border rounded-2xl p-10 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight">404</h1>
        <p className="mt-3 text-muted-foreground">That route doesn’t exist: {location.pathname}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button className="gradient-primary" onClick={() => navigate("/")}>Home</Button>
          <Button variant="outline" onClick={() => navigate("/create")}>Orion Studio</Button>
        </div>
      </div>
    </PageShell>
  );
};

export default NotFound;
