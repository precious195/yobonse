'use client';

import { useEffect, useState } from 'react';

export function CarAnimation3D() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="relative w-full max-w-md mx-auto h-56 overflow-hidden">
            {/* 3D Scene Container */}
            <div className="relative w-full h-full">

                {/* Sky/Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 rounded-2xl" />

                {/* Sun */}
                <div className="absolute top-4 right-8 w-10 h-10 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg shadow-yellow-400/50 animate-pulse" />

                {/* Clouds */}
                <div className="absolute top-6 left-8 flex gap-1 opacity-60">
                    <div className="w-8 h-4 bg-white rounded-full" />
                    <div className="w-6 h-4 bg-white rounded-full -ml-2" />
                    <div className="w-5 h-3 bg-white rounded-full -ml-1 mt-1" />
                </div>
                <div className="absolute top-10 left-1/3 flex gap-1 opacity-40 animate-cloud">
                    <div className="w-6 h-3 bg-white rounded-full" />
                    <div className="w-5 h-3 bg-white rounded-full -ml-2" />
                </div>

                {/* Mountains/Hills in background */}
                <div className="absolute bottom-20 left-0 right-0">
                    <svg viewBox="0 0 400 60" className="w-full h-12 opacity-30">
                        <path d="M0,60 L40,30 L80,45 L130,15 L180,40 L220,25 L270,45 L320,20 L370,35 L400,60 Z" fill="#6b7280" />
                    </svg>
                </div>

                {/* Road/Tarmac */}
                <div className="absolute bottom-0 left-0 right-0 h-24">
                    {/* Road surface */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-600 to-slate-700 rounded-b-2xl">
                        {/* Road texture */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:8px_8px]" />
                    </div>

                    {/* Road markings - center line */}
                    <div className="absolute top-10 left-0 right-0 flex justify-center overflow-hidden">
                        <div className="flex gap-6 animate-road-move">
                            {[...Array(15)].map((_, i) => (
                                <div key={i} className="w-10 h-1.5 bg-yellow-400 rounded-sm flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Road edges */}
                    <div className="absolute top-2 left-4 right-4 h-0.5 bg-white/40" />
                    <div className="absolute bottom-4 left-4 right-4 h-0.5 bg-white/40" />
                </div>

                {/* Realistic Car SVG */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-car-drive">
                    <svg width="140" height="60" viewBox="0 0 140 60" className="drop-shadow-xl">
                        {/* Car Shadow */}
                        <ellipse cx="70" cy="58" rx="55" ry="4" fill="rgba(0,0,0,0.2)" />

                        {/* Car Body - Lower */}
                        <path
                            d="M15,38 L10,38 Q5,38 5,43 L5,48 Q5,52 10,52 L130,52 Q135,52 135,48 L135,43 Q135,38 130,38 L125,38 L120,32 L30,32 L25,38 Z"
                            fill="url(#carBodyGradient)"
                            stroke="#4c1d95"
                            strokeWidth="0.5"
                        />

                        {/* Car Body - Upper (Cabin) */}
                        <path
                            d="M35,32 L42,15 Q45,10 55,10 L90,10 Q100,10 103,15 L115,32 Z"
                            fill="url(#cabinGradient)"
                            stroke="#4c1d95"
                            strokeWidth="0.5"
                        />

                        {/* Windows */}
                        <path
                            d="M45,30 L50,16 Q52,13 58,13 L72,13 L72,30 Z"
                            fill="url(#windowGradient)"
                            stroke="#6366f1"
                            strokeWidth="0.5"
                        />
                        <path
                            d="M75,30 L75,13 L88,13 Q94,13 96,16 L105,30 Z"
                            fill="url(#windowGradient)"
                            stroke="#6366f1"
                            strokeWidth="0.5"
                        />

                        {/* Window divider */}
                        <rect x="72" y="12" width="3" height="19" fill="#5b21b6" rx="1" />

                        {/* Headlights */}
                        <ellipse cx="12" cy="42" rx="4" ry="3" fill="#fef08a" className="animate-pulse">
                            <animate attributeName="opacity" values="0.8;1;0.8" dur="0.5s" repeatCount="indefinite" />
                        </ellipse>
                        <ellipse cx="12" cy="48" rx="3" ry="2" fill="#fde047" className="animate-pulse" />

                        {/* Tail lights */}
                        <rect x="130" y="40" width="4" height="4" rx="1" fill="#dc2626" />
                        <rect x="130" y="46" width="4" height="4" rx="1" fill="#dc2626" />

                        {/* Front grille */}
                        <rect x="6" y="40" width="6" height="10" rx="1" fill="#1e293b" />
                        <line x1="8" y1="42" x2="8" y2="48" stroke="#475569" strokeWidth="0.5" />
                        <line x1="10" y1="42" x2="10" y2="48" stroke="#475569" strokeWidth="0.5" />

                        {/* Side details */}
                        <path d="M35,38 L110,38" stroke="#7c3aed" strokeWidth="1.5" opacity="0.6" />
                        <path d="M28,45 L118,45" stroke="#a78bfa" strokeWidth="0.5" opacity="0.4" />

                        {/* Door handles */}
                        <rect x="55" y="40" width="5" height="1.5" rx="0.5" fill="#a78bfa" />
                        <rect x="90" y="40" width="5" height="1.5" rx="0.5" fill="#a78bfa" />

                        {/* Side mirrors */}
                        <ellipse cx="38" cy="28" rx="3" ry="2" fill="#7c3aed" />
                        <ellipse cx="112" cy="28" rx="3" ry="2" fill="#7c3aed" />

                        {/* Wheels */}
                        <g className="animate-wheel">
                            <circle cx="35" cy="52" r="10" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                            <circle cx="35" cy="52" r="6" fill="#4b5563" />
                            <circle cx="35" cy="52" r="3" fill="#6b7280" />
                            <circle cx="35" cy="52" r="1.5" fill="#9ca3af" />
                            {/* Wheel spokes */}
                            <line x1="35" y1="46" x2="35" y2="48" stroke="#9ca3af" strokeWidth="1" />
                            <line x1="35" y1="56" x2="35" y2="58" stroke="#9ca3af" strokeWidth="1" />
                            <line x1="29" y1="52" x2="31" y2="52" stroke="#9ca3af" strokeWidth="1" />
                            <line x1="39" y1="52" x2="41" y2="52" stroke="#9ca3af" strokeWidth="1" />
                        </g>
                        <g className="animate-wheel">
                            <circle cx="105" cy="52" r="10" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                            <circle cx="105" cy="52" r="6" fill="#4b5563" />
                            <circle cx="105" cy="52" r="3" fill="#6b7280" />
                            <circle cx="105" cy="52" r="1.5" fill="#9ca3af" />
                            {/* Wheel spokes */}
                            <line x1="105" y1="46" x2="105" y2="48" stroke="#9ca3af" strokeWidth="1" />
                            <line x1="105" y1="56" x2="105" y2="58" stroke="#9ca3af" strokeWidth="1" />
                            <line x1="99" y1="52" x2="101" y2="52" stroke="#9ca3af" strokeWidth="1" />
                            <line x1="109" y1="52" x2="111" y2="52" stroke="#9ca3af" strokeWidth="1" />
                        </g>

                        {/* Gradients */}
                        <defs>
                            <linearGradient id="carBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="50%" stopColor="#7c3aed" />
                                <stop offset="100%" stopColor="#6d28d9" />
                            </linearGradient>
                            <linearGradient id="cabinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                            <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#bfdbfe" />
                                <stop offset="50%" stopColor="#93c5fd" />
                                <stop offset="100%" stopColor="#60a5fa" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Exhaust smoke */}
                <div className="absolute bottom-14 right-1/4 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 bg-slate-400/50 rounded-full animate-exhaust"
                            style={{
                                animationDelay: `${i * 0.2}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Speed lines */}
                <div className="absolute bottom-16 left-1/4 flex flex-col gap-1.5">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="h-0.5 bg-gradient-to-l from-violet-400/70 to-transparent rounded-full animate-speed"
                            style={{
                                width: `${20 + i * 8}px`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>

                {/* Ground reflection */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-violet-500/10 to-transparent rounded-b-2xl" />
            </div>

            <style jsx>{`
                @keyframes carDrive {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    25% { transform: translateX(-50%) translateY(-2px); }
                    75% { transform: translateX(-50%) translateY(1px); }
                }

                @keyframes wheel {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes roadMove {
                    from { transform: translateX(0); }
                    to { transform: translateX(-64px); }
                }

                @keyframes exhaust {
                    0% { opacity: 0.5; transform: translateX(0) scale(1); }
                    100% { opacity: 0; transform: translateX(-25px) scale(1.8); }
                }

                @keyframes speed {
                    0%, 100% { opacity: 0; transform: scaleX(0); transform-origin: right; }
                    50% { opacity: 1; transform: scaleX(1); }
                }

                @keyframes cloud {
                    from { transform: translateX(0); }
                    to { transform: translateX(20px); }
                }

                .animate-car-drive {
                    animation: carDrive 0.6s ease-in-out infinite;
                }

                .animate-wheel {
                    animation: wheel 0.4s linear infinite;
                    transform-origin: center;
                }

                .animate-road-move {
                    animation: roadMove 0.5s linear infinite;
                }

                .animate-exhaust {
                    animation: exhaust 1.2s ease-out infinite;
                }

                .animate-speed {
                    animation: speed 0.8s ease-in-out infinite;
                }

                .animate-cloud {
                    animation: cloud 8s ease-in-out infinite alternate;
                }
            `}</style>
        </div>
    );
}

export default CarAnimation3D;
