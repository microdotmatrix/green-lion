import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initialPricingData } from "@/lib/pricing";
import { useEffect, useState } from "react";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const PricingTool = () => {
  const [pricingData, setPricingData] = useState(initialPricingData);
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const clearAlert = () => {
    setAlert({ show: false, message: "", type: "info" });
  };

  // Remove loadPricingData since we're using initial data
  useEffect(() => {
    console.log("Available SKUs:", Object.keys(pricingData));
  }, [pricingData]);

  const validateSku = (sku: string) => {
    const skuString = sku.toString();
    return skuString.length === 6 && !isNaN(skuString);
  };

  const validateQuantity = (qty: string) => {
    const num = parseInt(qty);
    return !isNaN(num) && num > 0;
  };

  const getPrice = (
    quantity: string,
    pricingTiers: { [x: string]: string }
  ) => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return null;

    const prices = {
      "1-99": parseFloat(pricingTiers["1-99"]),
      "100-999": parseFloat(pricingTiers["100-999"]),
      "1000-9999": parseFloat(pricingTiers["1000-9999"]),
      "10000+": parseFloat(pricingTiers["10000+"]),
    };

    if (qty >= 10000) return prices["10000+"];
    if (qty >= 1000) return prices["1000-9999"];
    if (qty >= 100) return prices["100-999"];
    return prices["1-99"];
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
        message: "Please enter a valid 6-digit SKU",
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
        message: "SKU not found",
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
      description: product.description,
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

  const submitForm = async (e: SubmitEvent) => {
    e.preventDefault();
    if (email) {
      const payload = {
        timestamp: new Date().toISOString(),
        sku: selectedProduct.sku,
        description: selectedProduct.description,
        quantity: selectedProduct.quantity,
        unit_price: selectedProduct.price,
        total_price: selectedProduct.totalPrice,
        email: email,
      };

      try {
        await fetch('/api/email', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Failed to submit to Zapier:", error);
      }

      // console.log("Submitting to Zapier:", payload);

      // try {
      //   await fetch(import.meta.env.PUBLIC_ZAPIER_WEBHOOK_URL, {
      //     method: "POST",
      //     body: JSON.stringify(payload),
      //   });

      //   console.log("Webhook submission attempted");
      // } catch (error) {
      //   console.error("Submission error:", error);
      // }


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
                maxLength={6}
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
        <Alert className={alert.type === "error" ? "bg-destructive" : "bg-primary/50"}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {selectedProduct && (
        <Card className="bg-secondary/50">
          <CardHeader className="border-b border-border mb-4">
            <CardTitle className="text-foreground font-serif">Price Quote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <figure className="overflow-clip text-center w-full md:w-80">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.description}
                  width={420}
                  height={420}
                  className="object-contain w-full sm:w-2/3 md:w-full mx-auto h-80 bg-accent text-muted text-xs"
                />
              </figure>
              <div className="space-y-2 flex-1 [&>p]:~text-lg/2xl">
                <p>
                  <strong>SKU:</strong> {selectedProduct.sku}
                </p>
                <p>
                  <strong>Description:</strong> {selectedProduct.description}
                </p>
                <p>
                  <strong>Quantity:</strong>{" "}
                  {selectedProduct.quantity.toLocaleString()}
                </p>
                <p>
                  <strong>Unit Price:</strong> ${selectedProduct.price.toFixed(2)}
                </p>
                <p className="text-primary">
                  <strong>Total Price:</strong> $
                  {selectedProduct.totalPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="pt-6" style={{ lineHeight: "0.75rem" }}>
                  <span className="text-xs">
                    Price quotes are estimates and may vary with order specifics.
                  </span>
                </p>
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

export default PricingTool;
