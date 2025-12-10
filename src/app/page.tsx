import Link from "next/link";
import { Car, Shield, Clock, CreditCard, MapPin, Star, ArrowRight, Smartphone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen animated-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">RideFlow</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How it Works</a>
              <a href="#safety" className="text-gray-400 hover:text-white transition-colors">Safety</a>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-sm text-violet-300">Available in your city</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Your Ride,{" "}
                <span className="gradient-text">Your Way</span>
              </h1>

              <p className="text-xl text-gray-400 max-w-lg">
                Experience premium ride-hailing with real-time tracking, professional drivers, and seamless payments. Get where you need to go, safely and comfortably.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
                >
                  Request a Ride
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/driver-register"
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-700 text-gray-200 font-semibold rounded-xl hover:bg-gray-800 transition-all"
                >
                  <Car className="w-5 h-5" />
                  Become a Driver
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8 border-t border-gray-800">
                <div>
                  <p className="text-3xl font-bold text-white">50K+</p>
                  <p className="text-gray-500">Active Riders</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">10K+</p>
                  <p className="text-gray-500">Drivers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">4.9</p>
                  <p className="text-gray-500">App Rating</p>
                </div>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative glass rounded-3xl p-8 glow-violet">
                <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center overflow-hidden">
                  {/* Map Preview Mockup */}
                  <div className="relative w-full h-full p-6">
                    <div className="absolute inset-0 opacity-30">
                      <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                        <path d="M0 200 Q100 100 200 200 T400 200" stroke="#6366f1" strokeWidth="2" fill="none" />
                        <path d="M0 150 Q100 50 200 150 T400 150" stroke="#8b5cf6" strokeWidth="1" fill="none" strokeDasharray="5 5" />
                        <path d="M0 250 Q100 150 200 250 T400 250" stroke="#8b5cf6" strokeWidth="1" fill="none" strokeDasharray="5 5" />
                        <circle cx="80" cy="180" r="30" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1" />
                        <circle cx="320" cy="220" r="30" fill="#10b98120" stroke="#10b981" strokeWidth="1" />
                      </svg>
                    </div>

                    {/* Pickup marker */}
                    <div className="absolute top-1/4 left-1/4 animate-float">
                      <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-600/50">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div className="mt-2 px-3 py-1 bg-gray-900/90 rounded-lg text-xs text-white whitespace-nowrap">
                        Pickup Location
                      </div>
                    </div>

                    {/* Destination marker */}
                    <div className="absolute bottom-1/4 right-1/4 animate-float" style={{ animationDelay: '1s' }}>
                      <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div className="mt-2 px-3 py-1 bg-gray-900/90 rounded-lg text-xs text-white whitespace-nowrap">
                        Destination
                      </div>
                    </div>

                    {/* Car icon */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="driver-marker">
                        <div className="driver-marker-inner">
                          <Car className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ride Details Card */}
                <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        JD
                      </div>
                      <div>
                        <p className="font-semibold text-white">John Driver</p>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs">4.9</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">$12.50</p>
                      <p className="text-xs text-gray-400">Est. 15 min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose RideFlow</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We're redefining urban transportation with cutting-edge technology and premium service
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Quick Pickup",
                description: "Average pickup time under 5 minutes in most areas",
                color: "from-violet-600 to-indigo-600",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Safe Rides",
                description: "All drivers verified with background checks and training",
                color: "from-emerald-600 to-teal-600",
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "Easy Payments",
                description: "Pay with card, digital wallet, or cash - your choice",
                color: "from-amber-600 to-orange-600",
              },
              {
                icon: <MapPin className="w-8 h-8" />,
                title: "Live Tracking",
                description: "Track your ride in real-time from request to destination",
                color: "from-cyan-600 to-blue-600",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-violet-500/50 transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Get a ride in just a few simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Set Your Location",
                description: "Enter your pickup location and destination. Get instant fare estimates.",
              },
              {
                step: "02",
                title: "Request & Match",
                description: "Request a ride and get matched with a nearby driver in seconds.",
              },
              {
                step: "03",
                title: "Ride & Pay",
                description: "Track your driver, enjoy the ride, and pay seamlessly when you arrive.",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-8xl font-bold text-gray-800/50 absolute -top-4 -left-4">
                  {item.step}
                </div>
                <div className="relative pt-12 pl-8">
                  <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-12 text-center">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
            <div className="relative">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Ride?</h2>
              <p className="text-violet-100 mb-8 max-w-xl mx-auto">
                Join thousands of riders who trust RideFlow for their daily commute and adventures.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-violet-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                >
                  Sign Up Now
                </Link>
                <Link
                  href="/driver-register"
                  className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  Drive with Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">RideFlow</span>
              </div>
              <p className="text-gray-400 text-sm">
                Premium ride-hailing for the modern world. Safe, fast, and reliable.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} RideFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
