import { motion } from "framer-motion";
import { CreditCard, ShoppingBag, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomeEcommerce() {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">E-commerce</h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Turn conversations into conversions with storefronts, carts, and checkout-ready experiences.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                Storefront pages
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Product grids and detail pages that look good on mobile and load fast.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                Cart experience
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Smooth add-to-cart, variant selection, and a clear path to purchase.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
                Checkout-ready
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Connect your commerce backend and route orders through a reliable checkout flow.
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button asChild className="gradient-primary">
            <Link to="/storefront">Open storefront</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/integrations">Set up integrations</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/ai-chat">Build an e-commerce bot</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
