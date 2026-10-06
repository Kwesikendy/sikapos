import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  FileText,
  RotateCcw,
  Cookie,
  Trash2,
  Lock,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Cpu,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { DotPattern } from '../components/visuals/DotPattern';

type LegalTab = 'privacy' | 'terms' | 'refund' | 'cookies' | 'data-deletion' | 'sdk-audit';

export const LegalPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const activeTab: LegalTab = (
    tab === 'terms' || tab === 'refund' || tab === 'cookies' || tab === 'data-deletion' || tab === 'sdk-audit'
      ? tab
      : 'privacy'
  ) as LegalTab;

  // Deletion Request Form State
  const [deletionEmail, setDeletionEmail] = useState('');
  const [deletionPhone, setDeletionPhone] = useState('');
  const [deletionStoreName, setDeletionStoreName] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionSubmitted, setDeletionSubmitted] = useState(false);

  const handleTabChange = (newTab: LegalTab) => {
    navigate(`/legal/${newTab}`);
  };

  const handleDeletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeletionSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 relative">
      <DotPattern variant="emerald" size="md" opacity={0.5} />
      
      {/* Top Header */}
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Navigation Breadcrumb / Back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0D5C3A] transition-colors bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to SikaPOS</span>
          </Link>

          <span className="text-[11px] font-bold text-[#0D5C3A] bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Ghana Data Protection Act (Act 843) Aligned
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Trust, Legal & Compliance Center
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Transparent policies, commercial SaaS terms, data protection disclosures, and user rights under the laws of the Republic of Ghana.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-8 border-b border-slate-200/80 scrollbar-hide">
          {[
            { id: 'privacy', label: 'Privacy Policy', icon: Shield },
            { id: 'terms', label: 'Terms of Service', icon: FileText },
            { id: 'refund', label: 'Refund Policy', icon: RotateCcw },
            { id: 'cookies', label: 'Cookie & Storage Policy', icon: Cookie },
            { id: 'data-deletion', label: 'Data Deletion Request', icon: Trash2 },
            { id: 'sdk-audit', label: 'Third-Party SDK Audit', icon: Cpu },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as LegalTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                    : 'bg-white/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-500')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
          {/* ========================================================= */}
          {/* TAB 1: PRIVACY POLICY                                      */}
          {/* ========================================================= */}
          {activeTab === 'privacy' && (
            <article className="prose prose-slate max-w-none space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D5C3A]">
                  Statutory Privacy Disclosure
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  SikaPOS Privacy Policy
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Effective Date: October 6, 2026 • Governing Law: Data Protection Act, 2012 (Act 843) of Ghana
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">1. Data Controller and Entity Information</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  This Privacy Policy describes how <strong>Mastermade Solutions</strong> ("we", "us", "our"), trading as <strong>SikaPOS</strong> (part of Akoma Commerce Cloud), collects, stores, processes, and protects your personal and business data.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-700 space-y-1">
                  <p><strong>Registered Business Name:</strong> Mastermade Solutions</p>
                  <p><strong>Operating Region:</strong> Greater Accra, Republic of Ghana</p>
                  <p><strong>Data Protection Authority:</strong> Data Protection Commission (DPC) of Ghana</p>
                  <p><strong>Primary Legal Inquiries:</strong> <code>legal@mastermadesolutions.com</code></p>
                  <p><strong>Data Protection Officer Contact:</strong> <code>privacy@mastermadesolutions.com</code></p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">2. Data We Collect and Minimization Standard</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Under the principle of data minimization, SikaPOS collects strictly what is necessary to operate our point-of-sale software:
                </p>
                <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1.5">
                  <li><strong>Merchant Profile:</strong> Full name, telephone number (for Ghanaian OTP verification), email address, store trade name.</li>
                  <li><strong>Store Location:</strong> Business physical address, region in Ghana, GhanaPost GPS digital address (e.g. GA-183-9024) for regulatory compliance.</li>
                  <li><strong>Tax Records:</strong> Ghana Revenue Authority (GRA) Taxpayer Identification Number (TIN) or Ghana Card PIN for statutory tax invoice computation.</li>
                  <li><strong>Staff Till Credentials:</strong> Cashier name, phone number, and a salted cryptographic hash of their 4-digit till PIN. Plain PINs are never stored.</li>
                  <li><strong>Transaction Records:</strong> Sale timestamp, items sold, unit prices, Ghanaian Cedi (GH₵) subtotals, tax breakdown (VAT, NHIL, GETFund), and payment method tag (Cash, MTN MoMo, Telecel Cash). <em>We never record or view customer Mobile Money secret PINs or banking credentials.</em></li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">3. Lawful Basis for Processing (Ghana Act 843, Section 20)</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Our processing operations are justified by:
                </p>
                <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1.5">
                  <li><strong>Consent:</strong> Explicit consent given by the store owner during merchant registration.</li>
                  <li><strong>Contract Performance:</strong> Essential to render point-of-sale terminal functionality and receipt printing.</li>
                  <li><strong>Legal Obligation:</strong> Compliance with Ghana Revenue Authority (GRA) bookkeeping and tax audit regulations.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">4. Age Restriction & Child Data Protection</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  In compliance with Section 37 of Act 843, SikaPOS is strictly a commercial business software intended solely for adults aged <strong>18 years and above</strong>. We do not knowingly solicit, collect, or process any personal data relating to children or minors under the age of 18. If we discover an account registered by a minor, it will be terminated immediately and all associated data purged.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">5. Communications & Unsubscribe Rights</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  We send strictly transactional SMS and email notifications (e.g., login OTP codes, shift closeout receipts, security alerts). If we ever dispatch product updates or announcements, every email contains an automatic one-click <strong>Unsubscribe</strong> link. You may also opt out at any time by emailing <code>privacy@mastermadesolutions.com</code>.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">6. Data Subject Rights Under Act 843</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Every user possesses the statutory right to:
                </p>
                <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1.5">
                  <li><strong>Access:</strong> Request an export of all personal and store data maintained in our systems.</li>
                  <li><strong>Rectification:</strong> Correct outdated business or cashier information directly through the settings interface.</li>
                  <li><strong>Erasure (Data Deletion):</strong> Request the permanent deletion of your store profile and staff accounts within 30 days via our <button onClick={() => handleTabChange('data-deletion')} className="font-bold text-[#0D5C3A] underline cursor-pointer">Data Deletion Form</button>.</li>
                </ul>
              </section>
            </article>
          )}

          {/* ========================================================= */}
          {/* TAB 2: TERMS OF SERVICE                                    */}
          {/* ========================================================= */}
          {activeTab === 'terms' && (
            <article className="prose prose-slate max-w-none space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D5C3A]">
                  Commercial Platform Terms
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  SikaPOS Terms of Service
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Last Revised: October 6, 2026 • Mastermade Solutions
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  By registering an account, accessing, or using the SikaPOS software or mobile terminal application, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a business, company, or partnership, you warrant that you are at least 18 years old and hold legal authority to bind that entity.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">2. Transparent Pricing & Zero Hidden Fees</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  We believe in ethical, clear business pricing. SikaPOS subscriptions are billed in Ghanaian Cedis (GH₵) at the published tier rate. <strong>There are zero hidden activation fees, zero surprise gateway maintenance levies, and zero forced auto-enrollments.</strong> All tax rates displayed on your receipts reflect statutory GRA levies configured by you.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">3. Prohibited Uses & Removal of Dark Patterns</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  You agree not to use SikaPOS for:
                </p>
                <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1.5">
                  <li>Sales of illegal substances, counterfeit goods, or contraband under Ghanaian law.</li>
                  <li>Falsifying transaction records or conducting tax evasion schemes.</li>
                  <li>Reverse engineering, scraping, or launching denial-of-service attacks against our cloud infrastructure.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">4. Service Uptime & Data Ownership</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Your store inventory, transaction logs, and customer records belong exclusively to your business. We do not sell or monetize your store data. SikaPOS provides offline resilience so your cashiers can continue recording sales during cellular internet interruptions; transactions sync automatically once network connectivity resumes.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">5. Limitation of Liability</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  To the maximum extent permitted by Ghanaian law, Mastermade Solutions shall not be liable for indirect, incidental, or consequential damages resulting from hardware terminal failure, third-party network outages (e.g., cellular telco SMS delays), or user input error.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">6. Governing Law & Dispute Resolution</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  These Terms of Service are governed by and construed in accordance with the laws of the Republic of Ghana. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the Courts of Ghana in Accra.
                </p>
              </section>
            </article>
          )}

          {/* ========================================================= */}
          {/* TAB 3: REFUND & CANCELLATION POLICY                        */}
          {/* ========================================================= */}
          {activeTab === 'refund' && (
            <article className="prose prose-slate max-w-none space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D5C3A]">
                  Fair Billing Standard
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  SikaPOS Refund & Cancellation Policy
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Guaranteed 14-Day Money-Back Period • Simple Cancellations
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">1. 14-Day Money-Back Guarantee</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  We want you to be completely satisfied with your SikaPOS installation. If within <strong>14 calendar days</strong> of subscribing to any paid plan you determine that SikaPOS does not satisfy your store requirements, you are entitled to a full 100% refund of your initial subscription fee with no questions asked.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">2. How to Request a Refund</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  To initiate a refund, simply send an email to <code>support@sikapos.com</code> or <code>legal@mastermadesolutions.com</code> with your registered store name, owner phone number, and transaction receipt. Approved refunds will be credited back via your original payment channel (MTN Mobile Money, Telecel Cash, or bank transfer) within 3 to 5 business days.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">3. Transparent Cancellation (Zero Penalties)</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  You may cancel your monthly or annual subscription at any time directly through your Store Settings. There are no cancellation penalties or hidden termination charges. Upon cancellation, your account will remain active until the end of the paid billing cycle, after which you may export all sales history and product catalog data.
                </p>
              </section>
            </article>
          )}

          {/* ========================================================= */}
          {/* TAB 4: COOKIE & STORAGE POLICY                            */}
          {/* ========================================================= */}
          {activeTab === 'cookies' && (
            <article className="prose prose-slate max-w-none space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D5C3A]">
                  Storage & Tracking Transparency
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  SikaPOS Cookie & Local Storage Policy
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  No Third-Party Ad Trackers • Strictly Necessary Client Storage
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">1. What We Store and Why</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  SikaPOS operates primarily as a progressive web application (PWA) with offline countertop support. We utilize local browser storage (HTML5 <code>localStorage</code>) and essential session cookies strictly for application functionality:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th className="p-3 border-b">Key / Cookie Name</th>
                        <th className="p-3 border-b">Type</th>
                        <th className="p-3 border-b">Purpose</th>
                        <th className="p-3 border-b">Retention</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="p-3 font-mono font-semibold">token</td>
                        <td className="p-3">localStorage</td>
                        <td className="p-3">Encrypted JWT authorization session token for API calls</td>
                        <td className="p-3">Session / 24 hours</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold">user</td>
                        <td className="p-3">localStorage</td>
                        <td className="p-3">Cached cashier profile details for quick UI rendering</td>
                        <td className="p-3">Cleared upon logout</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold">sikapos_cookie_consent</td>
                        <td className="p-3">localStorage</td>
                        <td className="p-3">Remembers your cookie banner consent choice</td>
                        <td className="p-3">1 year</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold">sikapos_pwa_install_dismissed</td>
                        <td className="p-3">localStorage</td>
                        <td className="p-3">Prevents repeated PWA installation popups if dismissed</td>
                        <td className="p-3">14 days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">2. Strictly Zero Advertising Trackers</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  We do not use Facebook Meta Pixels, Google Ads remarketing pixels, or data broker beacons. Your storefront activities and retail basket records are never sold or shared with third-party advertisers.
                </p>
              </section>
            </article>
          )}

          {/* ========================================================= */}
          {/* TAB 5: DATA DELETION & RIGHTS REQUEST                      */}
          {/* ========================================================= */}
          {activeTab === 'data-deletion' && (
            <article className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D5C3A]">
                  Statutory Right to Erasure
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Data Deletion & Rights Request Form
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Under Section 39 of the Ghana Data Protection Act, 2012 (Act 843)
                </p>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                As a registered store owner or cashier, you have the right to request the complete deletion of your account, commercial metadata, and stored staff PINs. Once verified, our engineering team will purge all personal data within <strong>30 calendar days</strong>, retaining only non-personal statutory tax summaries mandated by Ghana Revenue Authority guidelines.
              </p>

              {deletionSubmitted ? (
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Deletion Request Received</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    We have recorded your deletion request for <strong>{deletionEmail || deletionPhone}</strong>. Our Data Protection Officer will verify your store ownership and confirm final account purging within 30 days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDeletionSubmit} className="space-y-4 max-w-xl bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div>
                    <label htmlFor="del-email" className="block text-xs font-bold text-slate-700 mb-1">
                      Store Owner Email Address *
                    </label>
                    <input
                      id="del-email"
                      type="email"
                      required
                      value={deletionEmail}
                      onChange={(e) => setDeletionEmail(e.target.value)}
                      placeholder="owner@yourstore.com"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                    />
                  </div>

                  <div>
                    <label htmlFor="del-phone" className="block text-xs font-bold text-slate-700 mb-1">
                      Ghana Registered Phone Number *
                    </label>
                    <input
                      id="del-phone"
                      type="tel"
                      required
                      value={deletionPhone}
                      onChange={(e) => setDeletionPhone(e.target.value)}
                      placeholder="024 123 4567"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                    />
                  </div>

                  <div>
                    <label htmlFor="del-store" className="block text-xs font-bold text-slate-700 mb-1">
                      Business or Store Name
                    </label>
                    <input
                      id="del-store"
                      type="text"
                      value={deletionStoreName}
                      onChange={(e) => setDeletionStoreName(e.target.value)}
                      placeholder="e.g. Teshie Provision Mart"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                    />
                  </div>

                  <div>
                    <label htmlFor="del-reason" className="block text-xs font-bold text-slate-700 mb-1">
                      Reason for Request (Optional)
                    </label>
                    <textarea
                      id="del-reason"
                      rows={3}
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      placeholder="Store closure, migrating to another software, etc."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                    >
                      Submit Data Deletion Request
                    </button>
                    <p className="text-[11px] text-slate-500 mt-2 text-center">
                      Alternatively, email <code>privacy@mastermadesolutions.com</code> directly from your store email.
                    </p>
                  </div>
                </form>
              )}
            </article>
          )}

          {/* ========================================================= */}
          {/* TAB 6: THIRD-PARTY SDK AUDIT                               */}
          {/* ========================================================= */}
          {activeTab === 'sdk-audit' && (
            <article className="prose prose-slate max-w-none space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D5C3A]">
                  Security & Architecture Disclosures
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Third-Party SDK & Sub-processor Audit
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Verified Codebase Audit • SikaPOS Architecture Stack
                </p>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                To maintain high integrity, we conduct regular technical audits of all external services and libraries integrated into SikaPOS:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-900">Firebase Authentication & Cloud Storage</h4>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Security Compliant</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Provider: Google LLC. Role: Identity management, secure password storage with PBKDF2/scrypt, token generation, and audit telemetry. Data is encrypted in transit (TLS 1.3) and at rest (AES-256).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-900">Moolre Telecommunications Gateway</h4>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">NCA Licensed</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Provider: Moolre Limited (Ghana). Role: Dispatching secure 6-digit OTP verification codes to Ghanaian telephone networks (MTN Ghana, Telecel Ghana, AT Ghana). Only the destination phone number and OTP payload are transmitted.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-900">SQLite Embedded Ledger Engine</h4>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Zero External Transit</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Provider: Better-SQLite3. Role: High-speed local database engine hosting tenant isolation partitions. Operates directly on the secure backend server with zero external data sharing.
                  </p>
                </div>
              </div>
            </article>
          )}
        </div>

        {/* Legal Contact Card */}
        <div className="mt-8 p-6 bg-slate-100/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Have a compliance or legal question?</h4>
            <p className="mt-0.5">Reach out to our Data Protection Officer or customer support team.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="mailto:legal@mastermadesolutions.com"
              className="px-4 py-2 bg-white text-slate-800 font-bold rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Email Legal Team
            </a>
            <Link
              to="/login"
              className="px-4 py-2 bg-[#0D5C3A] text-white font-bold rounded-xl hover:bg-[#09432A] transition-colors shadow-2xs"
            >
              Back to POS
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPage;
