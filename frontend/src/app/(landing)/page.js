'use client';

import Link from 'next/link';
import { TrendingUp, PieChart, Lock, Zap, ArrowRight, Shield, BarChart3, Receipt } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Track Expenses',
      description: 'Monitor your spending patterns and identify areas to save money every month.',
    },
    {
      icon: <PieChart className="w-8 h-8" />,
      title: 'Manage Budgets',
      description: 'Set budgets and stay on track with real-time category breakdowns.',
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and never shared with third parties.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Smart Analytics',
      description: 'Get actionable insights and tax estimates from your financial data.',
    },
    {
      icon: <Receipt className="w-8 h-8" />,
      title: 'Bill Reminders',
      description: 'Never miss a payment with automatic recurring bill tracking.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Yearly Reports',
      description: 'Visualise your full year income vs expenses with beautiful charts.',
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                <Shield className="w-4 h-4" /> Trusted by 10,000+ users
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Smart Finance <span className="text-blue-600">Management</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Take control of your finances with FinSmart. Track expenses, manage bills, and get tax estimates — all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 rotate-3">
                  <PieChart className="w-36 h-36 text-white opacity-80" />
                </div>
                <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Savings</p>
                    <p className="font-bold text-gray-900">₹12,400</p>
                  </div>
                </div>
                <div className="absolute -top-4 -right-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Savings Rate</p>
                    <p className="font-bold text-gray-900">34%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose FinSmart?</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Powerful tools designed to help you understand and improve your financial health.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '₹500Cr+', label: 'Tracked Transactions' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-5xl font-bold mb-2">{stat.value}</p>
                <p className="text-blue-200 text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Take Control?</h2>
          <p className="text-xl text-gray-500 mb-8">
            Join thousands of users managing their finances smarter with FinSmart.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            Start for Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
