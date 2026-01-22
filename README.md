🚚 KENYASHIP
A modern, premium shipping and logistics platform for Kenya. Ship packages anywhere across all 47 counties with real-time tracking, secure delivery, and 24/7 customer support.
![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-5.0.8-646cff.svg)
## ✨ Features
- 🎯 **Real-time Package Tracking** - Track your shipments with live updates
- 🛡️ **Secure Delivery** - End-to-end security for all packages
- 🗺️ **Nationwide Coverage** - Delivery across all 47 counties in Kenya
- ⚡ **Fast Shipping** - Express and standard delivery options
- 💬 **24/7 Support** - Round-the-clock customer assistance
- 📱 **Responsive Design** - Seamless experience across all devices
- 🎨 **Modern UI** - Premium design with smooth animations
## 🚀 Quick Start
### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
### Installation
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd KENYASHIP
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start development server**
   ```bash
   npm run dev
   ```
4. **Open your browser**
   Navigate to `http://localhost:5173`
## 📦 Available Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
## 🛠️ Tech Stack
### Core
- **React 18.2** - UI library
- **TypeScript 5.2** - Type-safe JavaScript
- **Vite 5.0** - Lightning-fast build tool
### Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Custom Design System** - Premium color palette and animations
### UI Components
- **Radix UI** - Accessible component primitives
  - `@radix-ui/react-label`
  - `@radix-ui/react-select`
  - `@radix-ui/react-slot`
- **Lucide React** - Beautiful icon library
- **class-variance-authority** - Component variant management
- **clsx** & **tailwind-merge** - Conditional styling utilities
### Routing
- **React Router DOM 6.21** - Client-side routing
### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Autoprefixer** - CSS vendor prefixing
## 📁 Project Structure
```
KENYASHIP/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── select.tsx
│   │   ├── navbar.tsx       # Navigation bar
│   │   ├── herosection.tsx  # Hero section with tracking
│   │   ├── servicessection.tsx
│   │   ├── pricingsection.tsx
│   │   ├── CTAsection.tsx   # Call-to-action & contact
│   │   └── footer.tsx
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles & Tailwind
├── public/                  # Static assets
├── dist/                    # Production build output
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies & scripts
```
## 🎨 Design System
The project uses a custom design system with:
- **Color Palette**: Vibrant greens and golds representing Kenyan heritage
- **Typography**: Modern font stack with display and body fonts
- **Animations**: Smooth transitions and micro-interactions
- **Shadows**: Layered elevation system
- **Gradients**: Premium gradient combinations
## 📱 Sections
1. **Hero Section** - Eye-catching introduction with package tracking
2. **Services Section** - Showcase of shipping services
3. **Pricing Section** - Transparent pricing plans
4. **CTA Section** - Contact information and call-to-action
5. **Footer** - Company information and links
## 🌐 Contact
- **Phone**: +254 708 758 522
- **Email**: info@kenyaship.co.ke
- **Address**: Nairobi, Kenya
## 🔧 Configuration
### Tailwind CSS
Custom configuration includes:
- Extended color palette
- Custom animations
- Font family definitions
- Shadow utilities
- Gradient utilities
### TypeScript
Strict mode enabled with:
- Path aliases (`@/` → `./src/`)
- React JSX support
- ES2020 target
### Vite
Optimized for:
- Fast HMR (Hot Module Replacement)
- Path resolution
- React plugin integration
## 📝 Development Guidelines
1. **Component Naming**: Use PascalCase for component files
2. **Styling**: Use Tailwind utility classes; avoid inline styles
3. **TypeScript**: Always define prop types
4. **Imports**: Use path aliases (`@/components/...`)
5. **Code Quality**: Run `npm run lint` before committing
## 🚀 Deployment
### Build for Production
```bash
npm run build
```
This creates an optimized production build in the `dist/` directory.
### Preview Production Build
```bash
npm run preview
```
## 📄 License
This project is private and proprietary.
## 🤝 Contributing
This is a private project. For internal contributions, please follow the development guidelines and submit pull requests for review.
---
**Built with ❤️ in Kenya**
