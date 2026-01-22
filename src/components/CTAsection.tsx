import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Mail, MapPin } from "lucide-react";

const CTASection = () => {
    return (
        <section id="contact" className="py-24 bg-gradient-dark text-primary-foreground relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-6">
                        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
                            Ready to Ship?{" "}
                            <span className="text-gradient-gold">Let's Get Started</span>
                        </h2>
                        <p className="text-lg opacity-80 max-w-lg">
                            Join thousands of businesses and individuals who trust KenyaShip
                            for their delivery needs. Start shipping today!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                size="lg"
                                className="bg-gradient-gold text-secondary-foreground hover:opacity-90 transition-opacity font-semibold"
                            >
                                Create Account <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                            >
                                Request a Demo
                            </Button>
                        </div>
                    </div>

                    {/* Right Content - Contact Info */}
                    <div className="bg-card/10 backdrop-blur-sm rounded-3xl p-8 border border-primary-foreground/10">
                        <h3 className="font-display text-xl font-bold mb-6">Get in Touch</h3>
                        <div className="space-y-4">
                            <ContactItem
                                icon={Phone}
                                label="Call Us"
                                value="+254 708 758 522"
                                href="tel:+254708758522"
                            />
                            <ContactItem
                                icon={Mail}
                                label="Email"
                                value="support@kenyaship.co.ke"
                                href="mailto:support@kenyaship.co.ke"
                            />
                            <ContactItem
                                icon={MapPin}
                                label="Head Office"
                                value="Westlands, Nairobi, Kenya"
                            />
                        </div>

                        <div className="mt-8 pt-6 border-t border-primary-foreground/10">
                            <p className="text-sm opacity-60 mb-4">Follow us on social media</p>
                            <div className="flex gap-4">
                                {["Twitter", "Facebook", "LinkedIn"].map((social) => (
                                    <a
                                        key={social}
                                        href="#"
                                        className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                                    >
                                        {social}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ContactItem = ({
    icon: Icon,
    label,
    value,
    href
}: {
    icon: typeof Phone;
    label: string;
    value: string;
    href?: string;
}) => {
    const content = (
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm opacity-60">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );

    if (href) {
        return (
            <a href={href} className="block hover:opacity-80 transition-opacity">
                {content}
            </a>
        );
    }

    return content;
};

export default CTASection;
