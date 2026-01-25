 import { useState, useEffect } from "react";
 import { useParams, useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import { Navbar } from "@/components/Navbar";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Loader2, ShoppingCart, ArrowLeft, Package } from "lucide-react";
 import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY } from "@/lib/shopify";
 import { useCartStore } from "@/stores/cartStore";
 import { toast } from "@/hooks/use-toast";
 
 const ProductDetail = () => {
   const { handle } = useParams();
   const navigate = useNavigate();
   const [product, setProduct] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [selectedVariant, setSelectedVariant] = useState<any>(null);
   const [selectedImage, setSelectedImage] = useState(0);
   const { addItem, isLoading: cartLoading } = useCartStore();
 
   useEffect(() => {
     const fetchProduct = async () => {
       try {
         const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
         if (data?.data?.productByHandle) {
           const productData = data.data.productByHandle;
           setProduct(productData);
           setSelectedVariant(productData.variants.edges[0]?.node);
         }
       } catch (error) {
         console.error('Failed to fetch product:', error);
         toast({
           title: "Error",
           description: "Failed to load product. Please try again.",
           variant: "destructive",
         });
       } finally {
         setLoading(false);
       }
     };
 
     fetchProduct();
   }, [handle]);
 
   const handleAddToCart = async () => {
     if (!product || !selectedVariant) return;
 
     await addItem({
       product: { node: product },
       variantId: selectedVariant.id,
       variantTitle: selectedVariant.title,
       price: selectedVariant.price,
       quantity: 1,
       selectedOptions: selectedVariant.selectedOptions || []
     });
 
     toast({
       title: "Added to cart",
       description: `${product.title} has been added to your cart.`,
     });
   };
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <div className="flex items-center justify-center py-40">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
         </div>
       </div>
     );
   }
 
   if (!product) {
     return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <div className="container pt-24 text-center">
           <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
           <h2 className="text-2xl font-bold mb-2">Product not found</h2>
           <Button onClick={() => navigate('/storefront')}>Back to Store</Button>
         </div>
       </div>
     );
   }
 
   const images = product.images.edges.map((edge: any) => edge.node);
   const variants = product.variants.edges.map((edge: any) => edge.node);
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       <div className="container pt-24 pb-16 px-4">
         <Button variant="ghost" onClick={() => navigate('/storefront')} className="mb-6">
           <ArrowLeft className="w-4 h-4 mr-2" />
           Back to Store
         </Button>
 
         <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <Card className="overflow-hidden border-primary/20">
               <div className="aspect-square bg-muted">
                 {images[selectedImage] ? (
                   <img
                     src={images[selectedImage].url}
                     alt={images[selectedImage].altText || product.title}
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center">
                     <Package className="w-24 h-24 text-muted-foreground" />
                   </div>
                 )}
               </div>
             </Card>
             {images.length > 1 && (
               <div className="grid grid-cols-4 gap-2 mt-4">
                 {images.map((image: any, i: number) => (
                   <button
                     key={i}
                     onClick={() => setSelectedImage(i)}
                     className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                       selectedImage === i ? 'border-primary' : 'border-transparent hover:border-primary/50'
                     }`}
                   >
                     <img src={image.url} alt={image.altText || product.title} className="w-full h-full object-cover" />
                   </button>
                 ))}
               </div>
             )}
           </motion.div>
 
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
             <div>
               <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
               <p className="text-3xl font-bold text-primary">
                 {selectedVariant?.price.currencyCode} {parseFloat(selectedVariant?.price.amount || 0).toFixed(2)}
               </p>
             </div>
 
             {product.description && (
               <div>
                 <h3 className="font-semibold mb-2">Description</h3>
                 <p className="text-muted-foreground">{product.description}</p>
               </div>
             )}
 
             {product.options.length > 0 && (
               <div className="space-y-4">
                 {product.options.map((option: any) => (
                   <div key={option.name}>
                     <h3 className="font-semibold mb-2">{option.name}</h3>
                     <div className="flex flex-wrap gap-2">
                       {option.values.map((value: string) => {
                         const variant = variants.find((v: any) =>
                           v.selectedOptions.some((o: any) => o.name === option.name && o.value === value)
                         );
                         const isSelected = selectedVariant?.id === variant?.id;
                         
                         return (
                           <Button
                             key={value}
                             variant={isSelected ? "default" : "outline"}
                             onClick={() => setSelectedVariant(variant)}
                             disabled={!variant?.availableForSale}
                             className={isSelected ? "gradient-primary" : ""}
                           >
                             {value}
                           </Button>
                         );
                       })}
                     </div>
                   </div>
                 ))}
               </div>
             )}
 
             <div className="flex items-center gap-2">
               {selectedVariant?.availableForSale ? (
                 <Badge className="bg-accent">In Stock</Badge>
               ) : (
                 <Badge variant="destructive">Out of Stock</Badge>
               )}
             </div>
 
             <Button
               size="lg"
               className="w-full gradient-primary"
               onClick={handleAddToCart}
               disabled={cartLoading || !selectedVariant?.availableForSale}
             >
               {cartLoading ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
               ) : (
                 <>
                   <ShoppingCart className="w-5 h-5 mr-2" />
                   Add to Cart
                 </>
               )}
             </Button>
           </motion.div>
         </div>
       </div>
     </div>
   );
 };
 
 export default ProductDetail;