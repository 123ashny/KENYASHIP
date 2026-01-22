import { Package, Truck, Plane, Ship, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
    {
        icon: Truck,
        title: "Express Delivery",
        description: "Same-day and next-day delivery across major cities. Your urgent packages delivered on time.",
        features: ["Same-day delivery", "Real-time tracking", "Insurance included"],
        accent: "bg-primary",
    },
    {
        icon: Package,
        title: "Standard Shipping",
        description: "Cost-effective nationwide delivery for non-urgent shipments with full tracking capabilities.",
        features: ["2-5 day delivery", "Affordable rates", "Full coverage"],
        accent: "bg-secondary",
    },
    {
        icon: Ship,
        title: "Cargo & Freight",
        description: "Heavy cargo and bulk shipments handled with care. Ideal for businesses and large items.",
        features: ["Bulk shipping", "Warehousing", "Custom solutions"],
        accent: "bg-kenya-green",
    },
    {
        icon: Plane,
        title: "International",
        description: "Connect Kenya to the world. Air freight and sea cargo to destinations across the globe.",
        features: ["Global network", "Customs clearance", "Door-to-door"],
        accent: "bg-kenya-gold",
    },
];

const ServicesSection = () => {
    return (
        <section id="services" className="py-24 bg-muted/30">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 text-sm font-medium text-primary mb-6">
                        <Package className="w-4 h-4" />
                        Our Services
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                        Shipping Solutions for{" "}
                        <span className="text-gradient-primary">Every Need</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        From express deliveries to international freight, we've got you covered
                        with reliable and affordable shipping options.
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service, index) => (
                        <Card
                            key={service.title}
                            className="group relative overflow-hidden bg-card border-border hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <CardHeader className="pb-4">
                                <div className={`w-14 h-14 rounded-2xl ${service.accent} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <service.icon className="w-7 h-7 text-primary-foreground" />
                                </div>
                                <CardTitle className="font-display text-xl">{service.title}</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    {service.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {service.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            {/* Hover Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </Card>
                    ))}
                </div>

                {/* Trust Badges */}
                <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16">
                    <TrustBadge icon={Clock} text="On-Time Guarantee" />
                    <TrustBadge icon={Shield} text="Secure Handling" />
                    <TrustBadge icon={Package} text="Package Insurance" />
                </div>
            </div>
        </section>
    );
};

const TrustBadge = ({ icon: Icon, text }: { icon: typeof Clock; text: string }) => (
    <div className="flex items-center gap-3 text-muted-foreground">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="font-medium">{text}</span>
    </div>
);

export default ServicesSection;