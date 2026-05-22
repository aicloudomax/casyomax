import React from 'react';
import { Pill, Bot, Heart, ArrowRight, Activity, ShieldCheck } from 'lucide-react';

const Home = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Hero Section */}
            <section className="flex flex-col md:flex-row items-center justify-between gap-12 py-16">
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-5xl md:text-6xl font-bold text-primary mb-4 leading-tight">
                        Casyomax
                    </h1>
                    <p className="text-2xl font-semibold text-gray-800 mb-4">
                        Your AI-Powered Health Companion
                    </p>
                    <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
                        Seamlessly bridging the gap between patients and caregivers.
                        Track medications, get AI health insights, and stay connected.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-semibold shadow-lg hover:bg-blue-600 transition-transform transform hover:-translate-y-1">
                            Get Started <ArrowRight size={20} />
                        </button>
                        <button className="px-8 py-3 rounded-full border-2 border-primary text-primary font-semibold hover:bg-blue-50 transition-transform transform hover:-translate-y-1">
                            Learn More
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex justify-center w-full">
                    {/* Placeholder for App Screenshot */}
                    <div className="w-full max-w-md h-96 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-primary relative overflow-hidden border border-blue-200">
                        <Activity size={64} className="mb-4 text-primary opacity-80" />
                        <span className="text-xl font-bold">Live Health Tracking</span>

                        {/* Decorative circles */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full opacity-50 blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-200 rounded-full opacity-50 blur-2xl"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Casyomax?</h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-16">
                    Advanced technology meets compassionate care. Here is how we help you stay healthy.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Feature Card 1 */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                        <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary transition-colors duration-300">
                            <Pill className="text-primary group-hover:text-white transition-colors duration-300" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Reminders</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Never miss a dose using our intelligent, context-aware scheduling system that adapts to your routine.
                        </p>
                    </div>

                    {/* Feature Card 2 */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                        <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-600 transition-colors duration-300">
                            <Bot className="text-purple-600 group-hover:text-white transition-colors duration-300" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">AI Assistant</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Chat with our advanced AI to query health data, check drug interactions, or get instant wellness advice.
                        </p>
                    </div>

                    {/* Feature Card 3 */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                        <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-rose-500 transition-colors duration-300">
                            <Heart className="text-rose-500 group-hover:text-white transition-colors duration-300" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Caregiver Connect</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Keep your loved ones in the loop with real-time adherence updates and peace-of-mind notifications.
                        </p>
                    </div>

                </div>
            </section>

            {/* Trust Badge Section */}
            <section className="py-12 border-t border-gray-100 mt-8">
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-gray-500 opacity-70">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={24} />
                        <span className="font-semibold">HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity size={24} />
                        <span className="font-semibold">Real-time Monitoring</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
