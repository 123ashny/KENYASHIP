import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Package } from "lucide-react";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { label: "Track Shipment", href: "#track" },
        { label: "Services", href: "#services" },
        { label: "Pricing", href: "#pricing" },
        { label: "About", href: "#about" },
        { label: "Contact", href: "#contact" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <a href="#" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
                            <Package className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-display text-xl font-bold text-foreground">
                            Kenya<span className="text-primary">Ship</span>
                        </span>
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" size="sm">
                            Login
                        </Button>
                        <Button size="sm" className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow">
                            Get Started
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-foreground"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden py-4 border-t border-border animate-fade-in">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="flex flex-col gap-2 pt-4 border-t border-border">
                                <Button variant="ghost" size="sm" className="justify-start">
                                    Login
                                </Button>
                                <Button size="sm" className="bg-gradient-hero">
                                    Get Started
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
