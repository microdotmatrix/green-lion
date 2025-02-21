import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pricingData } from "@/lib/pricing";
import { useState } from "react";

type PricingProps = {
  sku: string;
  quantity: number;
  name: string;
  description: string;
  price: number;
  totalPrice: number;
  image: string;
};

const PricingTool = () => {
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("");
  const [email, setEmail] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [selectedProduct, setSelectedProduct] = useState<PricingProps | null>(
    null,
  );
  const [showThankYou, setShowThankYou] = useState(false);

  const clearAlert = () => {
    setAlert({ show: false, message: "", type: "info" });
  };

  const validateSku = (sku: string) => {
    const skuString = sku.toString();
    return skuString.length === 9;
  };

  const validateQuantity = (qty: string) => {
    const num = parseInt(qty);
    return !isNaN(num) && num > 0;
  };

  const getPrice = (
    quantity: string,
    pricingTiers: { [x: string]: string },
  ) => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return null;

    const prices = {
      "10,000-24,999": parseFloat(pricingTiers["10,000-24,999"]),
      "25,000-49,999": parseFloat(pricingTiers["25,000-49,999"]),
      "50,000-99,999": parseFloat(pricingTiers["50,000-99,999"]),
      "100,000-199,999": parseFloat(pricingTiers["100,000-199,999"]),
      "200,000+": parseFloat(pricingTiers["200,000+"]),
    };

    if (qty >= 200000) return prices["200,000+"];
    if (qty >= 100000) return prices["100,000-199,999"];
    if (qty >= 50000) return prices["50,000-99,999"];
    if (qty >= 25000) return prices["25,000-49,999"];
    return prices["10,000-24,999"];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    clearAlert();

    if (!sku || !quantity) {
      setAlert({
        show: true,
        message: "Please enter both SKU and quantity",
        type: "error",
      });
      return;
    }

    if (!validateSku(sku)) {
      setAlert({
        show: true,
        message:
          "Please enter a valid SKU - must be 9 characters (e.g. GLIC-1001)",
        type: "error",
      });
      return;
    }

    if (!validateQuantity(quantity)) {
      setAlert({
        show: true,
        message: "Please enter a valid quantity (greater than 0)",
        type: "error",
      });
      return;
    }

    const searchSku = sku.toString();
    const product = pricingData[searchSku];

    if (!product) {
      setAlert({
        show: true,
        message:
          "SKU not found - please verify correct format (e.g. GLIC-1001)",
        type: "error",
      });
      return;
    }

    const price = getPrice(quantity, product.pricing);
    if (price === null) {
      setAlert({
        show: true,
        message: "Invalid quantity",
        type: "error",
      });
      return;
    }

    const totalPrice = price * parseInt(quantity);
    setSelectedProduct({
      sku: searchSku,
      name: product.name,
      description: product.description || "",
      image: product.image,
      quantity: parseInt(quantity),
      price,
      totalPrice,
    });

    const searchRecord = {
      timestamp: new Date().toISOString(),
      sku: searchSku,
      quantity,
      unitPrice: price,
      totalPrice,
      email: email || "Not provided",
    };
    setSearchHistory([searchRecord, ...searchHistory]);

    if (!showContactForm) {
      setShowContactForm(true);
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email) {
      const payload = {
        timestamp: new Date().toISOString(),
        sku: selectedProduct?.sku,
        name: selectedProduct?.name,
        description: selectedProduct?.description,
        quantity: selectedProduct?.quantity,
        unit_price: selectedProduct?.price,
        total_price: selectedProduct?.totalPrice,
        email: email,
      };

      try {
        await fetch("/api/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Email submission failed:", error);
      }
      setShowThankYou(true);
    }
  };

  if (showThankYou) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center space-y-6">
        <Card className="bg-secondary/50 w-full">
          <CardContent className="pt-6 text-center">
            <p className="~text-xl/3xl mb-8">
              Thanks for your inquiry; we'll reach out soon.
            </p>
            <Button
              onClick={() => {
                setSku("");
                setQuantity("");
                setEmail("");
                setShowContactForm(false);
                setSelectedProduct(null);
                setShowThankYou(false);
                clearAlert();
              }}
              className="bg-primary hover:bg-primary/80 text-white ~text-base/2xl ~py-4/6 ~px-8/12 font-serif uppercase"
            >
              Request Another Quote
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto p-6 space-y-6">
      <Card className="bg-secondary/50">
        <CardHeader className="border-b border-border mb-4">
          <CardTitle className="text-foreground font-serif">
            SKU and Quantity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Enter SKU"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  clearAlert();
                }}
                className="bg-accent border-border focus:border-primary"
                maxLength={9}
              />
              <Input
                placeholder="Enter Quantity"
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  clearAlert();
                }}
                className="bg-accent border-border focus:border-primary"
                min="1"
              />
            </div>
            <div className="w-full mx-auto mr-0 flex flex-row gap-4">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 font-serif uppercase text-white ~text-base/2xl ~py-4/6"
              >
                Get Price
              </Button>
              <Button
                type="reset"
                className="w-80 bg-secondary hover:bg-secondary/90 font-serif uppercase text-white ~text-base/2xl ~py-4/6"
                onClick={() => {
                  setSku("");
                  setQuantity("");
                  setSelectedProduct(null);
                  setShowContactForm(false);
                  clearAlert();
                }}
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {alert.show && (
        <Alert
          className={
            alert.type === "error" ? "bg-destructive" : "bg-primary/50"
          }
        >
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {selectedProduct && (
        <Card className="bg-secondary/50">
          <CardHeader className="border-b border-border mb-4">
            <CardTitle className="text-foreground font-serif">
              Price Quote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {selectedProduct.image && (
                <ProductImage selectedProduct={selectedProduct} />
              )}
              <div className="space-y-8 flex-1">
                <div className="space-y-2 [&>p]:~text-lg/2xl">
                  <p>
                    <strong>SKU:</strong> {selectedProduct.sku}
                  </p>
                  <p>
                    <strong>Name:</strong> {selectedProduct.name}
                  </p>
                  <p>
                    <strong>Quantity:</strong>{" "}
                    {selectedProduct.quantity.toLocaleString()}
                  </p>
                  <p>
                    <strong>Unit Price:</strong> $
                    {selectedProduct.price.toLocaleString()}
                  </p>
                  <p className="text-primary">
                    <strong>Total Price:</strong> $
                    {selectedProduct.totalPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                {selectedProduct.description && (
                  <p className="~text-sm/lg">
                    <strong>Description:</strong> {selectedProduct.description}
                  </p>
                )}
                <div className="~text-xs/sm text-muted-foreground border-t mt-8 py-4 w-fit">
                  Price quotes are estimates and may vary with order specifics.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showContactForm && (
        <Card className="bg-secondary/50">
          <CardHeader className="border-b border-border mb-4">
            <CardTitle className="font-serif">Contact Green Lion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              To place an order or if you're interested in customizations,
              volume discounts, and more, please provide your email address and
              we'll reach out to you!
            </p>
            <form onSubmit={(e) => submitForm(e)} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-accent border-border focus:border-primary"
                required
              />
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 font-serif uppercase text-white ~text-lg/2xl ~py-4/6"
              >
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ProductImage = ({
  selectedProduct,
}: {
  selectedProduct: PricingProps;
}) => {
  return (
    <figure className="overflow-clip text-center w-full md:w-80 p-4 bg-accent">
      <img
        src={selectedProduct.image}
        alt={selectedProduct.name || ""}
        width={420}
        height={420}
        className="object-cover w-full sm:w-2/3 md:w-full mx-auto h-80 text-muted-foreground content-center text-xs"
      />
    </figure>
  );
};

export default PricingTool;
