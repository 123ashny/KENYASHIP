import Navbar from './components/navbar'
import HeroSection from './components/herosection'
import ServicesSection from './components/servicessection'
import PricingSection from './components/pricingsection'
import CTASection from './components/CTAsection'
import Footer from './components/footer'

function App() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <main>
                <HeroSection />
                <ServicesSection />
                <PricingSection />
                <CTASection />
            </main>
            <Footer />
        </div>
    )
}

export default App
