import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScrollText } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 pb-24 md:max-w-none md:p-0">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 pt-4 md:static md:bg-transparent md:pt-0">
        <button
          onClick={() => navigate(-1)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <ScrollText size={16} />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 md:text-2xl">Terms of Service</h1>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-sm prose-green max-w-none text-gray-600">
        <p className="text-sm font-medium text-gray-500 mb-8">
          Last updated: January 1, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introduction</h2>
          <p className="mb-4">
            Welcome to FlowMart. By accessing or using our website, mobile application,
            and services (collectively, the "Services"), you agree to be bound by these
            Terms of Service. Please read them carefully before using FlowMart.
          </p>
          <p>
            If you do not agree to these terms, you may not access or use our Services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. User Accounts</h2>
          <p className="mb-4">
            To use certain features of the Services, you must register for an account.
            You are responsible for maintaining the confidentiality of your account password
            and for all activities that occur under your account.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>You must be at least 18 years old to create an account.</li>
            <li>You agree to provide accurate, current, and complete information.</li>
            <li>We reserve the right to suspend or terminate accounts that violate our policies.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Orders and Payments</h2>
          <p className="mb-4">
            All prices are listed in Nigerian Naira (₦) unless otherwise stated. FlowMart
            reserves the right to adjust prices and product availability at any time without
            prior notice.
          </p>
          <p>
            We offer multiple payment methods, including Bank Transfer and Pay on Delivery.
            For Bank Transfers, your order will only be processed once payment is confirmed.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Delivery Policy</h2>
          <p className="mb-4">
            FlowMart aims to deliver orders within the estimated delivery times. However,
            delays may occur due to unforeseen circumstances (e.g., weather, traffic).
          </p>
          <p>
            Delivery fees are calculated based on your selected delivery zone. It is your
            responsibility to ensure someone is available at the address to receive the
            package.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Returns and Refunds</h2>
          <p className="mb-4">
            If you receive a damaged, defective, or incorrect item, please report the issue
            via the Alerts tab within 24 hours of delivery. Our support team will assist
            you with a replacement or refund according to our Return Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Privacy Policy</h2>
          <p className="mb-4">
            Your privacy is important to us. Our use of your personal information is governed
            by our Privacy Policy, which is incorporated into these Terms by reference.
          </p>
        </section>

        <section className="mb-8 border-t border-gray-100 pt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us via the Help &
            Support center.
          </p>
        </section>
      </div>
    </div>
  );
}
