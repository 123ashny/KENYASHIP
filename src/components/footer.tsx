import { Package, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
    const footerLinks = {
        company: [
            { label: "About Us", href: "#about" },
            { label: "Careers", href: "#careers" },
            { label: "Press", href: "#press" },
            { label: "Blog", href: "#blog" },
        ],
        services: [
            { label: "Express Delivery", href: "#services" },
            { label: "Standard Shipping", href: "#services" },
            { label: "Cargo & Freight", href: "#services" },
            { label: "International", href: "#services" },
        ],
        support: [
            { label: "Help Center", href: "#help" },
            { label: "Track Package", href: "#track" },
            { label: "Shipping Rates", href: "#pricing" },
            { label: "Contact Us", href: "#contact" },
        ],
        legal: [
            { label: "Privacy Policy", href: "#privacy" },
            { label: "Terms of Service", href: "#terms" },
            { label: "Cookie Policy", href: "#cookies" },
            { label: "Refund Policy", href: "#refunds" },
        ],
    };

    return (
        <footer className="bg-muted/30 border-t border-border">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
                                <Package className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="font-display text-xl font-bold text-foreground">
                                Kenya<span className="text-primary">Ship</span>
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                            Fast, reliable shipping across all 47 counties of Kenya. Your trusted partner for deliveries.
                        </p>
                        <div className="flex gap-3">
                            <SocialLink icon={Facebook} href="#" label="Facebook" />
                            <SocialLink icon={Twitter} href="#" label="Twitter" />
                            <SocialLink icon={Linkedin} href="#" label="LinkedIn" />
                            <SocialLink icon={Instagram} href="#" label="Instagram" />
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Company</h3>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Services</h3>
                        <ul className="space-y-2">
                            {footerLinks.services.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Support</h3>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="border-t border-border pt-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ContactItem
                            icon={Phone}
                            label="Call Us"
                            value="+254 700 123 456"
                        />
                        <ContactItem
                            icon={Mail}
                            label="Email"
                            value="support@kenyaship.co.ke"
                        />
                        <ContactItem
                            icon={MapPin}
                            label="Head Office"
                            value="Westlands, Nairobi, Kenya"
                        />
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-border pt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} KenyaShip. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

const SocialLink = ({ icon: Icon, href, label }: { icon: typeof Facebook; href: string; label: string }) => (
    <a
        href={href}
        aria-label={label}
        className="w-9 h-9 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
    >
        <Icon className="w-4 h-4" />
    </a>
);

const ContactItem = ({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">{value}</p>
        </div>
    </div>
);

export default Footer;
