import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Truck, Shield, Clock, MapPin } from "lucide-react";

const HeroSection = () => {
    const [trackingNumber, setTrackingNumber] = useState("");

    const features = [
        { icon: Clock, text: "24/7 Support" },
        { icon: Shield, text: "Secure Delivery" },
        { icon: MapPin, text: "Nationwide Coverage" },
    ];

    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent via-background to-background" />
            <div className="absolute top-20 right-0 w-1/2 h-1/2 bg-gradient-hero opacity-5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-secondary opacity-10 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 text-sm font-medium text-primary">
                            <Truck className="w-4 h-4" />
                            Kenya's #1 Shipping Platform
                        </div>

                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                            Ship Anywhere in{" "}
                            <span className="text-gradient-primary">Kenya</span>
                            <br />
                            Fast & Reliable
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-lg">
                            From Nairobi to Mombasa, Kisumu to Nakuru — we deliver your packages
                            with speed, security, and real-time tracking across all 47 counties.
                        </p>

                        {/* Tracking Input */}
                        <div className="flex flex-col sm:flex-row gap-3 max-w-lg" id="track">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Enter tracking number..."
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    className="pl-12 h-14 text-base bg-card border-border shadow-card"
                                />
                            </div>
                            <Button
                                size="lg"
                                className="h-14 px-8 bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow font-semibold"
                            >
                                Track <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-4 pt-4">
                            {features.map((feature) => (
                                <div
                                    key={feature.text}
                                    className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                    <feature.icon className="w-4 h-4 text-primary" />
                                    {feature.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content - Stats Card */}
                    <div className="relative lg:pl-8">
                        <div className="relative bg-card rounded-3xl p-8 shadow-elevated border border-border">
                            {/* Floating Badge */}
                            <div className="absolute -top-4 -right-4 bg-gradient-gold text-secondary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                                Live Stats
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <StatCard number="50K+" label="Shipments Monthly" delay={0} />
                                <StatCard number="47" label="Counties Covered" delay={100} />
                                <StatCard number="99.8%" label="On-Time Delivery" delay={200} />
                                <StatCard number="24/7" label="Customer Support" delay={300} />
                            </div>

                            {/* Trust Indicators */}
                            <div className="mt-8 pt-6 border-t border-border">
                                <p className="text-sm text-muted-foreground mb-4">Trusted by leading businesses</p>
                                <div className="flex items-center gap-6 opacity-60">
                                    <div className="font-display font-bold text-lg">Safaricom</div>
                                    <div className="font-display font-bold text-lg">Jumia</div>
                                    <div className="font-display font-bold text-lg">Equity</div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Element */}
                        <div className="absolute -z-10 top-8 left-0 w-full h-full bg-gradient-hero rounded-3xl opacity-20 blur-xl" />
                    </div>
                </div>
            </div>
        </section>
    );
};

const StatCard = ({ number, label, delay }: { number: string; label: string; delay: number }) => (
    <div
        className={`text-center p-4 rounded-2xl bg-accent/50 animate-fade-in delay-${delay}`}
    >
        <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
            {number}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
    </div>
);

export default HeroSection;
