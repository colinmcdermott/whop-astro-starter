import { useRef, useState, useEffect } from "react";
import {
  WhopCheckoutEmbed,
  useCheckoutEmbedControls,
} from "@whop/checkout/react";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:border-[var(--accent)]";

const inputErrorClass =
  "w-full rounded-lg border border-red-400 dark:border-red-500 bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:border-red-400";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CheckoutFormProps {
  planName: string;
  planKey: string;
  planFeatures: string[];
  whopPlanId: string;
  interval: string;
  price: number;
  userEmail: string | null;
  userName: string | null;
}

export function CheckoutForm({
  planName,
  planKey,
  planFeatures,
  whopPlanId,
  interval,
  price,
  userEmail,
  userName,
}: CheckoutFormProps) {
  const checkoutControlsRef = useCheckoutEmbedControls();
  const paymentRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!userEmail;
  const isFree = price === 0;

  const [email, setEmail] = useState(userEmail ?? "");
  const [name, setName] = useState(userName ?? "");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [showPayment, setShowPayment] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Detect theme from document
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  // Auto-submit free plans
  useEffect(() => {
    if (isFree && showPayment && checkoutReady && !isProcessing) {
      handleSubmitPayment();
    }
  }, [isFree, showPayment, checkoutReady]);

  // Pre-set email/address on embed when ready
  useEffect(() => {
    if (!showPayment || !checkoutReady || isFree) return;
    const presetEmbed = async () => {
      try {
        await checkoutControlsRef.current?.setEmail(email);
        await checkoutControlsRef.current?.setAddress({
          name,
          line1: address,
          line2: apartment || undefined,
          city,
          state: state || "",
          postalCode,
          country,
        });
      } catch {}
    };
    presetEmbed();
  }, [showPayment, checkoutReady]);

  function clearFieldError(field: string) {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
    if (!isFree) {
      if (!name.trim()) errors.name = "Name is required";
      if (!address.trim()) errors.address = "Address is required";
      if (!city.trim()) errors.city = "City is required";
      if (!postalCode.trim()) errors.postalCode = "Postal code is required";
      if (!country) errors.country = "Country is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleContinueToPayment() {
    if (!validateForm()) return;
    setShowPayment(true);
    if (!isFree) {
      setTimeout(() => {
        paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }

  async function handleSubmitPayment() {
    setIsProcessing(true);
    setPaymentError(null);
    setFormErrors({});
    try {
      await checkoutControlsRef.current?.setEmail(email);
      if (!isFree) {
        await checkoutControlsRef.current?.setAddress({
          name,
          line1: address,
          line2: apartment || undefined,
          city,
          state: state || "",
          postalCode,
          country,
        });
        await new Promise((r) => setTimeout(r, 100));
      }
      await checkoutControlsRef.current?.submit();
    } catch (err) {
      console.error("Payment submission failed:", err);
      setPaymentError(isFree ? "Something went wrong. Please try again." : "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  }

  function handleComplete(_planId: string, receiptId?: string) {
    window.location.href = `/checkout/success?plan=${planKey}&receipt=${receiptId ?? ""}`;
  }

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-10">
      <div className="w-full max-w-[960px] flex flex-col lg:flex-row lg:gap-12">
        {/* Left column: Form + Payment */}
        <div className="flex-1 max-w-lg mx-auto lg:mx-0 order-2 lg:order-1">
          <div className="space-y-6">
            {/* Contact */}
            <div>
              <h2 className="text-sm font-semibold mb-3">Contact</h2>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                placeholder="Email address"
                aria-label="Email address"
                disabled={isLoggedIn}
                autoComplete="email"
                className={`${formErrors.email ? inputErrorClass : inputClass} ${isLoggedIn ? "opacity-70 cursor-not-allowed" : ""}`}
              />
              {formErrors.email && <p className="mt-1.5 text-xs text-red-500">{formErrors.email}</p>}
              {isLoggedIn && <p className="mt-1.5 text-[11px] text-[var(--muted)]">Signed in as {userName ?? email}</p>}
            </div>

            {/* Billing address (paid plans only) */}
            {!isFree && (
              <div>
                <h2 className="text-sm font-semibold mb-3">Billing address</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                    placeholder="Full name"
                    autoComplete="name"
                    className={formErrors.name ? inputErrorClass : inputClass}
                  />
                  {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); clearFieldError("address"); }}
                    placeholder="Address"
                    autoComplete="address-line1"
                    className={formErrors.address ? inputErrorClass : inputClass}
                  />
                  {formErrors.address && <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>}
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Apartment, suite, etc. (optional)"
                    autoComplete="address-line2"
                    className={inputClass}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input type="text" value={city} onChange={(e) => { setCity(e.target.value); clearFieldError("city"); }} placeholder="City" autoComplete="address-level2" className={formErrors.city ? inputErrorClass : inputClass} />
                      {formErrors.city && <p className="mt-1 text-xs text-red-500">{formErrors.city}</p>}
                    </div>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" autoComplete="address-level1" className={inputClass} />
                    <div>
                      <input type="text" value={postalCode} onChange={(e) => { setPostalCode(e.target.value); clearFieldError("postalCode"); }} placeholder="Postal code" autoComplete="postal-code" className={formErrors.postalCode ? inputErrorClass : inputClass} />
                      {formErrors.postalCode && <p className="mt-1 text-xs text-red-500">{formErrors.postalCode}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment section */}
            <div ref={paymentRef}>
              {!isFree && <h2 className="text-sm font-semibold mb-3">Payment</h2>}
              {!showPayment ? (
                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  className="w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80"
                >
                  {isFree ? "Get Started Free" : "Continue to Payment"}
                </button>
              ) : (
                <>
                  <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
                    <WhopCheckoutEmbed
                      ref={checkoutControlsRef}
                      planId={whopPlanId}
                      hideEmail
                      hideAddressForm
                      hideSubmitButton
                      hidePrice
                      skipRedirect
                      onStateChange={(s) => setCheckoutReady(s === "ready")}
                      onComplete={handleComplete}
                      onAddressValidationError={(error) => {
                        const msg = error.error_message?.toLowerCase() ?? "";
                        if (msg.includes("name")) setFormErrors((p) => ({ ...p, name: error.error_message }));
                        else if (msg.includes("address") || msg.includes("line")) setFormErrors((p) => ({ ...p, address: error.error_message }));
                        else if (msg.includes("city")) setFormErrors((p) => ({ ...p, city: error.error_message }));
                        else if (msg.includes("postal") || msg.includes("zip")) setFormErrors((p) => ({ ...p, postalCode: error.error_message }));
                        else setPaymentError(error.error_message);
                        setIsProcessing(false);
                      }}
                      prefill={{ email }}
                      theme={theme}
                      fallback={
                        <div className="flex h-32 items-center justify-center">
                          <p className="text-xs text-[var(--muted)]">Loading payment form…</p>
                        </div>
                      }
                    />
                  </div>
                  {paymentError && <p className="mt-3 text-xs text-red-500">{paymentError}</p>}
                  {!isFree && (
                    <button
                      type="button"
                      onClick={handleSubmitPayment}
                      disabled={isProcessing || !checkoutReady}
                      className="mt-4 w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? "Processing…" : `Pay $${price}`}
                    </button>
                  )}
                  {isFree && isProcessing && !paymentError && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                      <p className="text-xs text-[var(--muted)]">Setting up your account…</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Order summary */}
        <div className="hidden lg:block lg:w-[320px] lg:shrink-0 order-3 lg:order-2">
          <div className="sticky top-10">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h2 className="text-sm font-semibold mb-4">Order summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Plan</span>
                  <span className="font-medium">{planName}</span>
                </div>
                {!isFree && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Billing</span>
                    <span className="font-medium capitalize">{interval}</span>
                  </div>
                )}
                <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-semibold">
                    {isFree ? "Free" : `$${price}/${interval === "yearly" ? "yr" : "mo"}`}
                  </span>
                </div>
              </div>
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <p className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider mb-2">What's included</p>
                <ul className="space-y-1.5">
                  {planFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                      <svg className="h-3.5 w-3.5 text-[var(--foreground)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile order summary */}
        <div className="mb-6 lg:hidden order-1">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">{planName} Plan</h2>
                <p className="text-xs text-[var(--muted)] capitalize">{isFree ? "No credit card required" : `${interval} billing`}</p>
              </div>
              <span className="text-lg font-semibold">{isFree ? "Free" : `$${price}`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
