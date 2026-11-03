import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  UserCheck,
  UserX,
  Share2,
  Calendar,
  Camera,
  ChevronLeft,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Check,
  Copy,
  Sparkles,
  Link2
} from 'lucide-react';
import { RelationshipData } from '../../types';
import { formatDateShort } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { StatusBadge } from '../ui/StatusBadge';
import { hapticSuccess, hapticLight } from '../../utils/haptics';

interface RelationshipSettingsViewProps {
  user: any;
  relationshipData?: RelationshipData;
  onBack: () => void;
  onUpdatePartner: (partnerData: Partial<RelationshipData>) => Promise<void>;
  onDisconnectPartner: () => Promise<void>;
  onOpenInviteModal: () => void;
  onUpdateProfileAvatar: (avatarUrl: string) => Promise<void>;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
];

export default function RelationshipSettingsView({
  user,
  relationshipData,
  onBack,
  onUpdatePartner,
  onDisconnectPartner,
  onOpenInviteModal,
  onUpdateProfileAvatar,
}: RelationshipSettingsViewProps) {
  const [isDisconnectConfirmOpen, setIsDisconnectConfirmOpen] = useState(false);
  const [disconnectConfirmationText, setDisconnectConfirmationText] = useState('');
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const isConnected = Boolean(relationshipData?.partnerEmail || relationshipData?.partnerUid);
  const partnerName = relationshipData?.partnerName || 'Your Partner';
  const partnerEmail = relationshipData?.partnerEmail || 'Partner connected';

  const handleCopyInviteCode = () => {
    const code = user?.uid ? user.uid.slice(0, 8).toUpperCase() : 'DATE2026';
    navigator.clipboard.writeText(code);
    hapticSuccess();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSelectAvatar = async (url: string) => {
    await onUpdateProfileAvatar(url);
    hapticSuccess();
    setIsAvatarPickerOpen(false);
  };

  const handleConfirmDisconnect = async () => {
    if (disconnectConfirmationText.trim().toLowerCase() !== 'disconnect') return;
    setIsDisconnecting(true);
    try {
      await onDisconnectPartner();
      hapticSuccess();
      setIsDisconnectConfirmOpen(false);
      setDisconnectConfirmationText('');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors text-outline hover:text-on-surface"
            aria-label="Back to dashboard"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-on-surface">Relationship & Profile</h1>
            <p className="text-xs text-outline/80 mt-0.5">
              Manage your couple pairing, shared visibility, and partner settings
            </p>
          </div>
        </div>
      </div>

      {/* Your Profile Card */}
      <Card variant="high" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-on-surface">Your Profile</h2>
          <Button
            variant="outline"
            size="sm"
            icon={<Camera className="w-3.5 h-3.5" />}
            onClick={() => setIsAvatarPickerOpen(true)}
          >
            Change Photo
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/40 shadow-sm shrink-0">
            <img
              src={user?.photoURL || AVATAR_OPTIONS[0]}
              alt={user?.displayName || 'Your Profile'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-bold text-on-surface truncate">
              {user?.displayName || 'DateFund Member'}
            </h3>
            <p className="text-xs text-outline truncate">{user?.email || 'Authenticated user'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Private & Encrypted
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Partner Connection Status */}
      <Card variant="high" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-on-surface">Partner Connection</h2>
            <p className="text-xs text-outline mt-0.5">Your shared DateFund link</p>
          </div>
          {isConnected ? (
            <StatusBadge variant="success" pulse>
              Connected
            </StatusBadge>
          ) : (
            <StatusBadge variant="neutral">
              Not Connected
            </StatusBadge>
          )}
        </div>

        {isConnected ? (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container border border-outline-variant/15">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-secondary/40 shrink-0">
                <img
                  src={relationshipData?.partnerPhoto || AVATAR_OPTIONS[1]}
                  alt={partnerName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg font-bold text-on-surface truncate">{partnerName}</p>
                <p className="text-xs text-outline truncate">{partnerEmail}</p>
                <p className="text-[11px] text-secondary mt-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Shared dreams & contributions active
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 text-xs text-outline space-y-2">
              <span className="font-semibold text-on-surface block">Shared with your partner:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>Savings goals and total fund balance</li>
                <li>Individual contributions and deposit history</li>
                <li>Planned dates and couple calendar</li>
                <li>Completed memories in the Couple Scrapbook</li>
                <li>Date Wishlist entries</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:bg-rose-500/10 border-rose-500/20"
                icon={<UserX className="w-3.5 h-3.5" />}
                onClick={() => setIsDisconnectConfirmOpen(true)}
              >
                Disconnect Partner
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/15 text-center space-y-3">
              <Heart className="w-10 h-10 text-primary/40 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-on-surface">Connect with Your Partner</h3>
              <p className="text-xs text-outline max-w-md mx-auto leading-relaxed">
                Connect DateFund with your significant other to save together for dreams, synchronize date night schedules, and keep score of whose turn it is to treat.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Share2 className="w-4 h-4" />}
                  onClick={onOpenInviteModal}
                >
                  Send Partner Invitation
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  icon={copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  onClick={handleCopyInviteCode}
                >
                  {copiedLink ? 'Code Copied!' : 'Copy Partner Code'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Disconnect Partner Confirmation Modal */}
      <Modal
        isOpen={isDisconnectConfirmOpen}
        onClose={() => {
          setIsDisconnectConfirmOpen(false);
          setDisconnectConfirmationText('');
        }}
        title="Disconnect Partner?"
        description="Please read this important notice before disconnecting"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>What happens upon disconnection:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your partner will no longer see updates to your private goals or balance.</li>
              <li>Shared date calendar invites will be unlinked.</li>
              <li>Your previous personal contribution records are preserved in your ledger.</li>
              <li>You can reconnect or invite a partner anytime with a new code.</li>
            </ul>
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="disconnect-confirm-input" className="block text-xs font-semibold uppercase tracking-wider text-outline">
              Type <strong className="text-on-surface font-bold">disconnect</strong> to confirm:
            </label>
            <input
              id="disconnect-confirm-input"
              type="text"
              placeholder="disconnect"
              value={disconnectConfirmationText}
              onChange={e => setDisconnectConfirmationText(e.target.value)}
              className="w-full min-h-[44px] bg-surface-container border border-outline-variant/30 rounded-xl px-3.5 py-2 text-sm text-on-surface outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setIsDisconnectConfirmOpen(false);
                setDisconnectConfirmationText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={disconnectConfirmationText.trim().toLowerCase() !== 'disconnect'}
              isLoading={isDisconnecting}
              onClick={handleConfirmDisconnect}
            >
              Disconnect Partner
            </Button>
          </div>
        </div>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        title="Select Profile Photo"
        description="Choose a preset avatar or paste an image address"
      >
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            {AVATAR_OPTIONS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectAvatar(url)}
                className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-outline-variant/20 hover:border-primary transition-all cursor-pointer hover:scale-105"
              >
                <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-outline-variant/10 space-y-2">
            <Input
              label="Or Custom Image URL"
              placeholder="https://..."
              value={customAvatarUrl}
              onChange={e => setCustomAvatarUrl(e.target.value)}
            />
            {customAvatarUrl.trim() && (
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => handleSelectAvatar(customAvatarUrl.trim())}
              >
                Apply Custom Photo
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
