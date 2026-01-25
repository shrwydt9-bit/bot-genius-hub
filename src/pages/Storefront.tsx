 import { useState, useEffect } from "react";
 import { motion } from "framer-motion";
 import { Navbar } from "@/components/Navbar";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
 import { Loader2, ShoppingCart, Package } from "lucide-react";
 import { useNavigate } from "react-router-dom";
 import { storefrontApiRequest, PRODUCTS_QUERY, type ShopifyProduct } from "@/lib/shopify";
 import { useCartStore } from "@/stores/cartStore";
 import { toast } from "@/hooks/use-toast";
 
 const Storefront = () => {
   const [products, setProducts] = useState<ShopifyProduct[]>([]);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();
   const { addItem, isLoading: cartLoading } = useCartStore();
 
   useEffect(() => {
     const fetchProducts = async () => {
       try {
         const data = await storefrontApiRequest(PRODUCTS_QUERY, { first: 50 });
         if (data?.data?.products?.edges) {
           setProducts(data.data.products.edges);
         }
       } catch (error) {
         console.error('Failed to fetch products:', error);
         toast({
           title: "Error",
           description: "Failed to load products. Please try again.",
           variant: "destructive",
         });
       } finally {
         setLoading(false);
       }
     };
 
     fetchProducts();
   }, []);
 
   const handleAddToCart = async (product: ShopifyProduct) => {
     const selectedVariant = product.node.variants.edges[0]?.node;
     if (!selectedVariant) return;
 
     await addItem({
       product,
       variantId: selectedVariant.id,
       variantTitle: selectedVariant.title,
       price: selectedVariant.price,
       quantity: 1,
       selectedOptions: selectedVariant.selectedOptions || []
     });
 
     toast({
       title: "Added to cart",
       description: `${product.node.title} has been added to your cart.`,
     });
   };
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       <div className="pt-24 pb-16 px-4">
         <div className="container">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
             <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gradient">Our Store</h1>
             <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
               Discover our amazing products powered by AI
             </p>
           </motion.div>
 
           {loading ? (
             <div className="flex items-center justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
           ) : products.length === 0 ? (
             <div className="text-center py-20">
               <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-2xl font-semibold mb-2">No products found</h3>
               <p className="text-muted-foreground">Check back soon for new products!</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {products.map((product, i) => {
                 const firstImage = product.node.images.edges[0]?.node;
                 const minPrice = parseFloat(product.node.priceRange.minVariantPrice.amount);
                 const currency = product.node.priceRange.minVariantPrice.currencyCode;
 
                 return (
                   <motion.div
                     key={product.node.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.05 }}
                   >
                     <Card className="h-full flex flex-col border-primary/20 hover:border-primary/50 transition-all cursor-pointer group">
                       <div onClick={() => navigate(`/product/${product.node.handle}`)}>
                         <CardHeader className="p-0">
                           <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                             {firstImage ? (
                               <img
                                 src={firstImage.url}
                                 alt={firstImage.altText || product.node.title}
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                               />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center">
                                 <Package className="w-16 h-16 text-muted-foreground" />
                               </div>
                             )}
                           </div>
                         </CardHeader>
                         <CardContent className="p-4 flex-1">
                           <CardTitle className="text-lg mb-2">{product.node.title}</CardTitle>
                           <CardDescription className="line-clamp-2">
                             {product.node.description || "No description available"}
                           </CardDescription>
                           <p className="text-xl font-bold mt-4 text-primary">
                             {currency} {minPrice.toFixed(2)}
                           </p>
                         </CardContent>
                       </div>
                       <CardFooter className="p-4 pt-0">
                         <Button
                           className="w-full gradient-primary"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleAddToCart(product);
                           }}
                           disabled={cartLoading || !product.node.variants.edges[0]?.node.availableForSale}
                         >
                           {cartLoading ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                           ) : (
                             <>
                               <ShoppingCart className="w-4 h-4 mr-2" />
                               Add to Cart
                             </>
                           )}
                         </Button>
                       </CardFooter>
                     </Card>
                   </motion.div>
                 );
               })}
             </div>
           )}
         </div>
       </div>
     </div>
   );
 };
 
 export default Storefront;