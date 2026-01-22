import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ArrowRight, Check } from "lucide-react";

const counties = [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
    "Thika", "Malindi", "Kitale", "Garissa", "Nyeri"
];

const PricingSection = () => {
    const [weight, setWeight] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

    const calculatePrice = () => {
        const basePrice = 200;
        const pricePerKg = 50;
        const distanceMultiplier = from === to ? 0.5 : 1;
        const price = basePrice + (parseFloat(weight) || 0) * pricePerKg * distanceMultiplier;
        setCalculatedPrice(Math.round(price));
    };

    const pricingPlans = [
        {
            name: "Standard",
            price: "KES 200",
            unit: "Starting from",
            description: "Perfect for personal shipments",
            features: [
                "2-5 day delivery",
                "Basic tracking",
                "Up to 5kg packages",
                "Email notifications",
            ],
            popular: false,
        },
        {
            name: "Express",
            price: "KES 500",
            unit: "Starting from",
            description: "Fast delivery for urgent needs",
            features: [
                "Same-day delivery",
                "Real-time tracking",
                "Up to 20kg packages",
                "SMS & Email alerts",
                "Priority handling",
            ],
            popular: true,
        },
        {
            name: "Business",
            price: "Custom",
            unit: "Volume pricing",
            description: "Tailored for business needs",
            features: [
                "Dedicated account manager",
                "API integration",
                "Unlimited weight",
                "Invoice billing",
                "24/7 priority support",
                "Custom SLA",
            ],
            popular: false,
        },
    ];

    return (
        <section id="pricing" className="py-24 bg-background">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 text-sm font-medium text-primary mb-6">
                        <Calculator className="w-4 h-4" />
                        Pricing
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                        Transparent{" "}
                        <span className="text-gradient-primary">Pricing</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        No hidden fees. Calculate your shipping cost instantly or choose a plan
                        that fits your needs.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Price Calculator */}
                    <Card className="bg-card border-border shadow-card">
                        <CardHeader>
                            <CardTitle className="font-display text-2xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                                    <Calculator className="w-5 h-5 text-primary-foreground" />
                                </div>
                                Quick Price Calculator
                            </CardTitle>
                            <CardDescription>
                                Get an instant quote for your shipment
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="from">From</Label>
                                        <Select value={from} onValueChange={setFrom}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select origin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {counties.map((county) => (
                                                    <SelectItem key={county} value={county}>
                                                        {county}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="to">To</Label>
                                        <Select value={to} onValueChange={setTo}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select destination" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {counties.map((county) => (
                                                    <SelectItem key={county} value={county}>
                                                        {county}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="weight">Package Weight (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        placeholder="Enter weight"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={calculatePrice}
                                className="w-full bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow"
                                disabled={!from || !to || !weight}
                            >
                                Calculate Price <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>

                            {calculatedPrice !== null && (
                                <div className="p-6 rounded-2xl bg-accent text-center animate-scale-in">
                                    <p className="text-sm text-muted-foreground mb-2">Estimated Price</p>
                                    <p className="font-display text-4xl font-bold text-primary">
                                        KES {calculatedPrice.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        *Final price may vary based on package dimensions
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pricing Plans */}
                    <div className="space-y-6">
                        {pricingPlans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={`relative overflow-hidden bg-card border-border transition-all duration-300 hover:shadow-elevated ${plan.popular ? "ring-2 ring-primary" : ""
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-gold text-secondary-foreground px-4 py-1 text-xs font-semibold rounded-bl-xl">
                                        Most Popular
                                    </div>
                                )}
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-display text-xl font-bold text-foreground">
                                                {plan.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-display text-2xl font-bold text-foreground">
                                                {plan.price}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{plan.unit}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.features.map((feature) => (
                                            <span
                                                key={feature}
                                                className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
                                            >
                                                <Check className="w-3 h-3 text-primary" />
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;