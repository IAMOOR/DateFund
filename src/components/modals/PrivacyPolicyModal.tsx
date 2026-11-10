import React from 'react';
import { ShieldCheck, Lock, Eye, Trash2, Heart, ExternalLink } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy & Terms"
      description="How DateFund protects and respects your couple data"
    >
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs text-outline leading-relaxed text-left">
        {/* Summary Card */}
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-on-surface space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-primary">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Our Commitment to Privacy</span>
          </div>
          <p className="text-[11px] text-outline">
            DateFund is built for intimate relationships. We never sell your personal data or couple financial ledger records to third parties or advertisers.
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-1.5">
          <h4 className="font-serif font-bold text-sm text-on-surface flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-primary" /> 1. Data We Collect
          </h4>
          <p>
            When you use DateFund, we collect only the information necessary to provide our service:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Details:</strong> Email address and display name for authentication.</li>
            <li><strong>Couple Ledger & Goals:</strong> Savings goal targets, deadlines, and deposit logs (e.g. &ldquo;Me&rdquo; vs &ldquo;Them&rdquo; treats).</li>
            <li><strong>Date Planner & Memories:</strong> Scheduled date itineraries, mood tags, star ratings, and optional scrapbook photo references.</li>
            <li><strong>Location Data (Optional):</strong> With your permission, your device GPS coordinates are used solely to find romantic venues and calculate driving distance in your South African province. We never track your ongoing location in the background.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="space-y-1.5">
          <h4 className="font-serif font-bold text-sm text-on-surface flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-secondary" /> 2. Security & AI Processing
          </h4>
          <p>
            All network communication is strictly encrypted via HTTPS/TLS. Shared savings records and date events are safeguarded by granular Cloud Firestore Security Rules, ensuring only you and your explicitly connected partner can read your shared ledger.
          </p>
          <p>
            When date suggestions or romantic communication exercises are requested, prompts are processed securely using Google Gemini API without retaining your private identity for public AI training models.
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-1.5">
          <h4 className="font-serif font-bold text-sm text-on-surface flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5 text-rose-500" /> 3. Data Deletion & Control (Apple & Google Mandate)
          </h4>
          <p>
            You retain absolute ownership of your data. You may disconnect a partner at any time. Under <strong>Settings &rarr; Danger Zone</strong>, you can permanently delete your DateFund account. Deleting your account immediately wipes your user credentials, purges personal wishlist notes, and unlinks shared bonds permanently.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-1.5">
          <h4 className="font-serif font-bold text-sm text-on-surface flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-outline" /> 4. Contact & Inquiries
          </h4>
          <p>
            If you have questions regarding this Privacy Policy or require data export assistance, please contact us at <strong className="text-on-surface">support@datefund.app</strong>.
          </p>
          <p className="text-[10px] text-outline/60 pt-1">
            Last updated: November 2026. Compliant with Apple App Store Review Guideline 5.1.1 and Google Play User Data Policy.
          </p>
        </div>

        <div className="pt-2 border-t border-outline-variant/10 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Understood
          </Button>
        </div>
      </div>
    </Modal>
  );
}
