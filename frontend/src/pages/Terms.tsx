import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScrollText, ShieldAlert, Balance, Truck, Store, AlertCircle } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 pb-24 md:p-8 font-body bg-white rounded-3xl shadow-sm border border-gray-100 mt-4 md:mt-8">
      {/* Header */}
      <div className="mb-10 flex items-center gap-4 border-b border-gray-100 pb-6 bg-white/80 backdrop-blur-md sticky top-0 z-10 pt-4 md:static md:bg-transparent md:pt-0">
        <button
          onClick={() => navigate(-1)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ScrollText size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-headings font-extrabold text-gray-900 md:text-3xl">Terms of Service</h1>
            <p className="text-xs text-gray-500 mt-1">Effective Date: October 2026</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-sm prose-green max-w-none text-gray-700 leading-relaxed space-y-8">
        
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 text-sm text-emerald-900 mb-8 flex gap-3">
          <AlertCircle size={20} className="shrink-0 text-emerald-600 mt-0.5" />
          <p className="m-0 leading-relaxed">
            <strong>IMPORTANT NOTICE:</strong> These Terms of Service constitute a legally binding agreement between you (User, Vendor, or Logistics Partner) and FlowMart. By accessing or using the FlowMart platform, applications, and services, you expressly acknowledge that you have read, understood, and agreed to be bound by these Terms, including the mandatory arbitration provision and class action waiver detailed in Section 12.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4 flex items-center gap-2">
            1. Introduction and Scope
          </h2>
          <p>
            Welcome to FlowMart. These Terms of Service ("Terms") govern your use of the FlowMart website, mobile applications, APIs, and related services (collectively, the "Platform" or "Services"), operated by FlowMart Ltd. ("FlowMart", "we", "us", or "our"). 
          </p>
          <p>
            FlowMart acts as a digital marketplace intermediary connecting three primary parties:
          </p>
          <ul className="list-none space-y-3 mt-4">
            <li className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-600 shrink-0"><Store size={18} /></div>
              <div><strong>Vendors:</strong> Independent third-party businesses or individuals offering goods for sale.</div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-600 shrink-0"><Truck size={18} /></div>
              <div><strong>Logistics Partners (Riders):</strong> Independent contractors providing delivery and logistics services.</div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-600 shrink-0"><ScrollText size={18} /></div>
              <div><strong>Consumers (Users):</strong> Individuals or entities purchasing goods from Vendors and requesting delivery.</div>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4">
            2. Account Registration and Security
          </h2>
          <p>
            To utilize the Platform, you must register for an account. By registering, you warrant that:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>You are at least 18 years of age and possess the legal authority to form a binding contract under Nigerian law.</li>
            <li>All information provided during the Know Your Customer (KYC) onboarding and registration process is accurate, truthful, and up-to-date.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials. FlowMart is not liable for any unauthorized access resulting from your failure to secure your credentials.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Store size={22} className="text-primary" /> 3. Vendor-Specific Terms
          </h2>
          <p>
            Vendors operating on FlowMart agree to the following conditions:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Product Listings:</strong> Vendors are solely responsible for the accuracy of product descriptions, pricing, availability, and images. The sale of illicit, counterfeit, or prohibited items under the laws of the Federal Republic of Nigeria is strictly forbidden.</li>
            <li><strong>Order Fulfillment:</strong> Vendors must prepare orders promptly within the Service Level Agreement (SLA) specified on their dashboard upon receiving an order notification.</li>
            <li><strong>Commissions and Fees:</strong> FlowMart deducts a standard platform commission (as outlined in the Vendor portal) from the total order value before remitting the balance to the Vendor’s wallet.</li>
            <li><strong>Returns:</strong> Vendors must adhere to FlowMart's 48-hour return policy for defective or non-compliant goods.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={22} className="text-primary" /> 4. Logistics Partner (Rider) Terms
          </h2>
          <p>
            Riders operating on the FlowMart logistics network agree to the following:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Independent Contractor Status:</strong> Riders act as independent contractors, not employees of FlowMart. FlowMart serves solely as a dispatch intermediary.</li>
            <li><strong>Compliance:</strong> Riders must maintain valid driver’s licenses, vehicle registration, road-worthiness certificates, and insurance as mandated by Nigerian traffic and transport laws.</li>
            <li><strong>Remittance:</strong> For "Pay on Delivery" cash orders, Riders are fiduciarily obligated to remit the exact cash amount collected to FlowMart within 24 hours. Failure to remit constitutes a material breach and may result in legal action and account termination.</li>
            <li><strong>Goods in Transit:</strong> Riders assume liability for goods from the point of pickup from the Vendor until successful handover to the Consumer.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4">
            5. Consumer Rights and Purchasing
          </h2>
          <p>
            Consumers agree that FlowMart is a marketplace. The sales contract is formed directly between the Consumer and the Vendor. 
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Payment:</strong> All prices are displayed in Nigerian Naira (₦). Payments processed through the platform are secured via accredited third-party payment gateways (e.g., Paystack).</li>
            <li><strong>Disputes:</strong> Consumers have 24 hours from the time of delivery to file a dispute regarding defective or missing items. After this window, the transaction is considered finalized and funds are released to the Vendor.</li>
            <li><strong>Cancellations:</strong> Orders may only be canceled prior to the Vendor accepting and processing the order. Once processing begins, cancellation is subject to the Vendor's discretion.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldAlert size={22} className="text-primary" /> 6. Acceptable Use Policy
          </h2>
          <p>You agree not to use the FlowMart Platform to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Violate any federal, state, or local laws of Nigeria.</li>
            <li>Engage in fraudulent activities, money laundering, or the fencing of stolen goods.</li>
            <li>Interfere with or disrupt the security, stability, or performance of the Platform.</li>
            <li>Harass, abuse, or harm FlowMart staff, Riders, Vendors, or Consumers.</li>
          </ul>
          <p className="mt-2 text-sm text-gray-500">FlowMart reserves the right to terminate your account immediately without notice for violations of this policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4">
            7. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, FlowMart shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your use of the Services. 
          </p>
          <p>
            FlowMart explicitly disclaims liability for any acts, omissions, or negligence of third-party Vendors or Logistics Partners. FlowMart's total aggregate liability arising out of or related to these Terms shall not exceed the amount paid by you to FlowMart in the three (3) months preceding the event giving rise to the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4">
            8. Intellectual Property
          </h2>
          <p>
            All content, logos, designs, algorithms, and software utilized on the Platform are the exclusive property of FlowMart Ltd. and are protected by Nigerian and international copyright and trademark laws. You are granted a limited, non-exclusive license to use the Platform strictly in accordance with these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Balance size={22} className="text-primary" /> 9. Governing Law and Dispute Resolution
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. 
          </p>
          <p>
            <strong>Arbitration Clause:</strong> Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach thereof, shall be settled by arbitration in Lagos, Nigeria, in accordance with the Arbitration and Conciliation Act (Cap A18, Laws of the Federation of Nigeria 2004). The proceedings shall be conducted in English by a single arbitrator appointed by mutual agreement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-headings font-bold text-gray-900 mb-4">
            10. Modifications to the Terms
          </h2>
          <p>
            FlowMart reserves the right to update or modify these Terms at any time. We will notify you of material changes via email or an in-app notification. Continued use of the Platform following such modifications constitutes your acceptance of the revised Terms.
          </p>
        </section>

      </div>
      
      {/* Footer */}
      <div className="mt-12 border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500 text-center md:text-left">
          For legal inquiries, contact: <a href="mailto:legal@flowmart.com.ng" className="text-primary font-semibold hover:underline">legal@flowmart.com.ng</a>
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2.5 rounded-xl font-bold text-sm transition"
        >
          Acknowledge & Return
        </button>
      </div>
    </div>
  );
}
