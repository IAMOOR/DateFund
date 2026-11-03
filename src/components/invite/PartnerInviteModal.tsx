import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { Share2, Copy, Check, QrCode, Link as LinkIcon, X, UserPlus, HeartHandshake } from 'lucide-react';
import { hapticSuccess, hapticLight } from '../../utils/haptics';

interface PartnerInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  userName?: string;
  onConnectPartner: (partnerUid: string) => Promise<void>;
}

export default function PartnerInviteModal({
  isOpen,
  onClose,
  userUid,
  userName = 'Your Partner',
  onConnectPartner,
}: PartnerInviteModalProps) {
  const [tab, setTab] = useState<'share' | 'join'>('share');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [partnerInput, setPartnerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?partner=${userUid}`
    : `https://datefund.app?partner=${userUid}`;

  useEffect(() => {
    if (!isOpen || !userUid) return;
    QRCode.toDataURL(inviteUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR code', err));
  }, [isOpen, inviteUrl, userUid]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    hapticSuccess();
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    hapticLight();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on DateFund!',
          text: `Join me on DateFund to build our dream date fund together!`,
          url: inviteUrl,
        });
        return;
      } catch {}
    }
    handleCopyLink();
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUid = partnerInput.trim();
    // If user pasted full url like ?partner=...
    if (targetUid.includes('partner=')) {
      try {
        const u = new URL(targetUid);
        targetUid = u.searchParams.get('partner') || targetUid;
      } catch {
        const match = targetUid.match(/partner=([^&]+)/);
        if (match) targetUid = match[1];
      }
    }

    if (!targetUid) return;
    setIsSubmitting(true);
    try {
      await onConnectPartner(targetUid);
      hapticSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/85 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-surface-container rounded-[2.5rem] border border-outline-variant/15 shadow-2xl p-6 sm:p-8 z-10 text-center overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-primary">
            <HeartHandshake className="w-5 h-5" />
            <h3 className="text-xl font-serif text-on-surface">Connect Partner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-outline"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-surface-container-high rounded-2xl mb-6">
          <button
            onClick={() => { hapticLight(); setTab('share'); }}
            className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              tab === 'share'
                ? 'bg-primary text-on-primary-fixed shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Share QR & Link
          </button>
          <button
            onClick={() => { hapticLight(); setTab('join'); }}
            className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              tab === 'join'
                ? 'bg-primary text-on-primary-fixed shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Enter Link / Code
          </button>
        </div>

        {tab === 'share' ? (
          <div className="space-y-6">
            <p className="text-xs text-outline leading-relaxed">
              Have your partner scan this QR code or send them your unique invite link to sync your DateFund ledger instantly.
            </p>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-3xl shadow-lg border border-outline-variant/15 inline-block mx-auto">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Partner Invite QR Code"
                  className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-xl"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-outline text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Invite URL box */}
            <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/15 flex items-center justify-between gap-3 text-left">
              <div className="truncate">
                <span className="text-[9px] uppercase tracking-widest font-bold text-outline block">Invite Link</span>
                <span className="font-mono text-xs text-on-surface truncate block">{inviteUrl}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors text-primary shrink-0"
                title="Copy Link"
              >
                {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleShare}
              className="w-full bg-primary text-on-primary-fixed py-3.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Invite Link
            </button>
          </div>
        ) : (
          <form onSubmit={handleManualConnect} className="space-y-6 text-left">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-outline block mb-2">
                Partner's Code or Invite Link
              </label>
              <input
                type="text"
                placeholder="Paste invite link or user ID..."
                value={partnerInput}
                onChange={e => setPartnerInput(e.target.value)}
                className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-2xl p-4 text-sm font-mono outline-none focus:border-primary text-on-surface shadow-inner"
              />
              <p className="text-[11px] text-outline mt-2 leading-relaxed">
                Paste the invite link your partner shared with you (e.g. datefund.app?partner=abc123xyz) to link your accounts together.
              </p>
            </div>

            <button
              type="submit"
              disabled={!partnerInput.trim() || isSubmitting}
              className="w-full bg-primary text-on-primary-fixed py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Linking Accounts...' : 'Connect With Partner'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
