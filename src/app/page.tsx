import Link from "next/link";
import { Car, Shield, Clock, CreditCard, MapPin, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">YABONSE</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">How it Works</a>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-slate-700 hover:text-slate-900 transition-colors font-medium"
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

      {/* Main Content */}
      <main className="flex-grow pt-20">

        {/* Hero Section */}
        <div className="w-full px-6 py-20 lg:py-32 bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 border border-violet-200 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-sm text-violet-700 font-medium">Available in your city</span>
                </div>

                <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-slate-900">
                  Your Ride, <br />
                  <span className="gradient-text">Your Way</span>
                </h1>

                <p className="text-xl text-slate-600 max-w-lg">
                  Experience premium ride-hailing with real-time tracking, professional drivers, and seamless payments.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
                  >
                    Request a Ride
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/driver-register"
                    className="flex items-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-all"
                  >
                    <Car className="w-5 h-5" />
                    Become a Driver
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex gap-8 pt-8 border-t border-slate-200">
                  <div>
                    <p className="text-3xl font-bold text-slate-900">50K+</p>
                    <p className="text-slate-500">Active Riders</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">10K+</p>
                    <p className="text-slate-500">Drivers</p>
                  </div>
                </div>
              </div>

              {/* Hero Image Block */}
              <div className="relative hidden lg:block h-[500px] w-full bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
                {/* Map Mockup Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-indigo-100 opacity-50"></div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-violet-200 rounded-full animate-ping absolute"></div>
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-violet-500/50">
                      <Car className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                {/* Simulated Driver Card */}
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-white rounded-xl border border-slate-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                        JD
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">John Driver</p>
                        <p className="text-sm text-slate-500">2 min away • ★ 4.9</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">Arriving</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="w-full px-6 py-24 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Why Choose YABONSE</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                Premium service, safety first, and transparent pricing.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Clock, title: "Fast Pickup", desc: "Drivers in under 5 mins", color: "violet" },
                { icon: Shield, title: "Safe Rides", desc: "Verified drivers only", color: "emerald" },
                { icon: CreditCard, title: "Cashless", desc: "Secure in-app payments", color: "blue" },
                { icon: MapPin, title: "Tracking", desc: "Real-time ride updates", color: "amber" }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all group">
                  <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="w-full px-6 py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">How It Works</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                { step: "1", title: "Book", desc: "Set your pickup and drop-off" },
                { step: "2", title: "Match", desc: "We'll find the nearest driver" },
                { step: "3", title: "Ride", desc: "Hop in and enjoy your trip" }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-6 shadow-lg shadow-violet-500/25">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-lg">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full px-6 py-24 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-12 text-center shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to get moving?</h2>
            <p className="text-violet-100 mb-10 text-lg max-w-2xl mx-auto">
              Download the app or sign up online to start riding today.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register" className="px-8 py-4 bg-white text-violet-600 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg">
                Sign Up Now
              </Link>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">YABONSE</span>
          </div>
          <p className="text-slate-400">&copy; {new Date().getFullYear()} YABONSE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
