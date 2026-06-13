import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, Plus, Minus, X, ChevronRight, CheckCircle2,
  Coffee, Search, Loader2, ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
const logoDarkImg = "/fuji-logo.png";

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  price: number;
  image?: string;
  category?: string;
  description?: string;
  variants?: any[];
  isAvailable?: boolean;
  isActive?: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  variant?: any;
  notes: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
}

export default function Kiosk() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [idleTimer, setIdleTimer] = useState(0);

  // Idle reset (3 min)
  useEffect(() => {
    const reset = () => setIdleTimer(0);
    const events = ["click", "touchstart", "mousemove", "keydown"];
    events.forEach(e => document.addEventListener(e, reset));
    const interval = setInterval(() => {
      setIdleTimer(prev => {
        if (prev >= 180) {
          setCart([]); setShowCart(false); setShowCheckout(false);
          setCustomerName(""); setTableNumber(""); setSearch("");
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => { events.forEach(e => document.removeEventListener(e, reset)); clearInterval(interval); };
  }, []);

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const activeProducts = (products as Product[]).filter(p => p.isActive !== false && p.isAvailable !== false);
  const filtered = activeProducts.filter(p => {
    if (selectedCat !== "all" && p.category !== selectedCat) return false;
    const name = p.nameAr || p.name || "";
    if (search && !name.includes(search)) return false;
    return true;
  });

  const cartTotal = cart.reduce((s, item) => s + item.price * item.quantity, 0);
  const cartCount = cart.reduce((s, item) => s + item.quantity, 0);

  function addToCart(product: Product, variant?: any) {
    const price = variant?.price || product.price || 0;
    setCart(prev => {
      const key = product.id + (variant?.id || "");
      const existing = prev.find(i => i.product.id + (i.variant?.id || "") === key);
      if (existing) return prev.map(i => i.product.id + (i.variant?.id || "") === key ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, variant, notes: "", price }];
    });
    setSelectedProduct(null);
    toast({ title: `✅ تمت الإضافة — ${product.nameAr || product.name}`, });
  }

  function updateQty(idx: number, delta: number) {
    setCart(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + delta };
      return updated.filter(i => i.quantity > 0);
    });
  }

  function removeItem(idx: number) { setCart(prev => prev.filter((_, i) => i !== idx)); }

  async function placeOrder() {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const orderData = {
        items: cart.map(i => ({
          productId: i.product.id,
          title: i.product.nameAr || i.product.name,
          quantity: i.quantity,
          price: i.price,
          variant: i.variant || null,
          notes: i.notes,
        })),
        total: cartTotal.toFixed(2),
        subtotal: cartTotal.toFixed(2),
        shippingCost: "0",
        paymentMethod,
        shippingMethod: "dine_in",
        orderType: "dine_in",
        customerName: customerName || "زبون كشك",
        tableNumber: tableNumber || "",
        notes: `طلب كشك — طاولة ${tableNumber || "غير محددة"}`,
        status: "new",
        paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
      };

      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (r.ok) {
        setOrderPlaced(true);
        setCart([]);
        setTimeout(() => {
          setOrderPlaced(false); setShowCheckout(false);
          setCustomerName(""); setTableNumber("");
        }, 5000);
      } else {
        toast({ title: "خطأ في إرسال الطلب", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    }
    setIsPlacing(false);
  }

  const catName = (id: string) => {
    const cat = (categories as Category[]).find(c => c.id === id);
    return cat?.nameAr || cat?.name || id;
  };

  return (
    <div className="min-h-screen bg-[#1a1108] text-white overflow-hidden select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#6B3F2A] shadow-lg">
        <div className="flex items-center gap-3">
          <img src={logoDarkImg} alt="فوجي كافيه" className="w-10 h-10 rounded-xl object-cover" onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%236B3F2A'/%3E%3C/svg%3E" }} />
          <div>
            <p className="font-black text-xl text-white">فوجي كافيه</p>
            <p className="text-white/60 text-xs">اطلب بنفسك</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white text-xs"><ArrowRight className="w-3 h-3 ml-1" /> لوحة التحكم</Button></Link>
          <button onClick={() => setShowCart(true)} className="relative bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-all" data-testid="button-cart">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-[#E8637A] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-0 h-[calc(100vh-72px)]">
        {/* Category sidebar */}
        <div className="w-28 bg-[#251508] flex flex-col overflow-y-auto no-scrollbar py-3">
          <button
            onClick={() => setSelectedCat("all")}
            className={`py-4 px-2 text-center text-xs font-bold transition-all border-r-4 ${selectedCat === "all" ? "text-[#E8637A] border-[#E8637A] bg-[#E8637A]/10" : "text-white/50 border-transparent hover:text-white/80"}`}
            data-testid="cat-all"
          >
            <Coffee className="w-5 h-5 mx-auto mb-1" />
            الكل
          </button>
          {(categories as Category[]).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`py-4 px-2 text-center text-xs font-bold transition-all border-r-4 ${selectedCat === cat.id ? "text-[#E8637A] border-[#E8637A] bg-[#E8637A]/10" : "text-white/50 border-transparent hover:text-white/80"}`}
              data-testid={`cat-${cat.id}`}
            >
              {cat.nameAr || cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl pr-9 p-3 text-sm border border-white/10 focus:outline-none focus:border-[#E8637A]/50"
              data-testid="input-search"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => {
              const name = product.nameAr || product.name;
              const inCart = cart.find(i => i.product.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => product.variants && product.variants.length > 0 ? setSelectedProduct(product) : addToCart(product)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#E8637A]/40 rounded-2xl overflow-hidden transition-all text-right group active:scale-95"
                  data-testid={`product-${product.id}`}
                >
                  <div className="aspect-square bg-white/5 relative overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Coffee className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                    {inCart && (
                      <div className="absolute top-2 left-2 bg-[#E8637A] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {inCart.quantity}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-white mb-1 leading-tight">{name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[#E8637A] font-black text-sm">{product.price} ر.س</p>
                      <div className="w-6 h-6 rounded-full bg-[#E8637A] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <Coffee className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p>لا توجد منتجات</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart overlay */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex" dir="rtl">
          <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="w-full max-w-sm bg-[#1a1108] flex flex-col shadow-2xl border-r border-white/10">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> السلة ({cartCount})
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCart(false)} className="text-white/60"><X className="w-5 h-5" /></Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-white/40 py-12">السلة فارغة</p>
              ) : cart.map((item, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-3 flex items-center gap-3" data-testid={`cart-item-${idx}`}>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{item.product.nameAr || item.product.name}</p>
                    {item.variant && <p className="text-xs text-white/50">{item.variant.nameAr || item.variant.name}</p>}
                    <p className="text-[#E8637A] text-sm font-bold mt-0.5">{(item.price * item.quantity).toFixed(2)} ر.س</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(idx, -1)} className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 text-white" data-testid={`button-decrease-${idx}`}><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-5 text-center text-sm font-bold text-white">{item.quantity}</span>
                    <button onClick={() => updateQty(idx, 1)} className="w-7 h-7 bg-[#E8637A] rounded-full flex items-center justify-center hover:bg-[#E8637A]/80 text-white" data-testid={`button-increase-${idx}`}><Plus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => removeItem(idx)} className="w-7 h-7 bg-red-500/20 rounded-full flex items-center justify-center hover:bg-red-500/40 text-red-400" data-testid={`button-remove-${idx}`}><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center text-white">
                  <span className="font-bold">الإجمالي</span>
                  <span className="text-2xl font-black text-[#E8637A]">{cartTotal.toFixed(2)} ر.س</span>
                </div>
                <Button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="w-full h-12 bg-[#E8637A] hover:bg-[#E8637A]/90 text-white font-bold rounded-xl" data-testid="button-checkout">
                  إتمام الطلب <ChevronRight className="w-4 h-4 mr-1" />
                </Button>
                <Button onClick={() => setCart([])} variant="ghost" className="w-full text-white/50 hover:text-white/80 text-xs">مسح السلة</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent dir="rtl" className="max-w-sm bg-[#1a1108] text-white border border-white/10">
          {orderPlaced ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">تم استلام طلبك!</h2>
              <p className="text-white/60 text-sm">سيتم تجهيز طلبك قريباً</p>
              {tableNumber && <p className="text-[#E8637A] font-bold mt-3">طاولة رقم {tableNumber}</p>}
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-4">تأكيد الطلب</h2>
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-white/70">اسمك (اختياري)</Label>
                  <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="أدخل اسمك" className="bg-white/10 border-white/20 text-white placeholder-white/30 mt-1" data-testid="input-customer-name" />
                </div>
                <div>
                  <Label className="text-white/70">رقم الطاولة</Label>
                  <Input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="مثال: 5" className="bg-white/10 border-white/20 text-white placeholder-white/30 mt-1" data-testid="input-table-number" />
                </div>
                <div>
                  <Label className="text-white/70">طريقة الدفع</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[{ k: "cash", l: "نقداً" }, { k: "card", l: "بطاقة" }].map(m => (
                      <button key={m.k} onClick={() => setPaymentMethod(m.k)}
                        className={`p-3 rounded-xl text-sm font-bold transition-all ${paymentMethod === m.k ? "bg-[#E8637A] text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                        data-testid={`payment-${m.k}`}>
                        {m.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-1.5">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white/70">{item.product.nameAr || item.product.name} × {item.quantity}</span>
                    <span className="text-white font-bold">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold border-t border-white/10 pt-2 mt-2">
                  <span className="text-white">الإجمالي</span>
                  <span className="text-[#E8637A] text-lg">{cartTotal.toFixed(2)} ر.س</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 text-white/60" onClick={() => setShowCheckout(false)}>رجوع</Button>
                <Button onClick={placeOrder} disabled={isPlacing} className="flex-1 bg-[#E8637A] hover:bg-[#E8637A]/90 text-white font-bold" data-testid="button-place-order">
                  {isPlacing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  أرسل الطلب
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Variant picker */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent dir="rtl" className="max-w-sm bg-[#1a1108] text-white border border-white/10">
          {selectedProduct && (
            <>
              <h2 className="text-lg font-bold text-white">{selectedProduct.nameAr || selectedProduct.name}</h2>
              <p className="text-white/50 text-sm mb-3">اختر المقاس أو الخيار</p>
              <div className="space-y-2">
                {(selectedProduct.variants || []).map((v: any) => (
                  <button key={v.id || v._id} onClick={() => addToCart(selectedProduct, v)}
                    className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 border border-white/10 hover:border-[#E8637A]/40 rounded-xl p-3 transition-all"
                    data-testid={`variant-${v.id || v._id}`}>
                    <span className="font-bold text-white">{v.nameAr || v.name || v.size || v.label}</span>
                    <span className="text-[#E8637A] font-bold">{v.price} ر.س</span>
                  </button>
                ))}
                <button onClick={() => addToCart(selectedProduct)}
                  className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all"
                  data-testid="variant-default">
                  <span className="text-white/70">الحجم الافتراضي</span>
                  <span className="text-[#E8637A] font-bold">{selectedProduct.price} ر.س</span>
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
