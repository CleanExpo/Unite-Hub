'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  ExternalLink,
  Check,
  X,
  Loader2,
} from 'lucide-react';

interface SocialChannel {
  id: string;
  business_key: string;
  platform: string;
  handle: string | null;
  profile_url: string | null;
  connected: boolean;
  last_post_at: string | null;
  created_at: string;
  updated_at: string;
}

const BUSINESS_LABELS: Record<string, string> = {
  dr: 'Disaster Recovery',
  restoreassist: 'RestoreAssist',
  ato: 'ATO Compliance',
  nrpg: 'NRPG',
  'unite-group': 'Unite-Group',
  carsi: 'CARSI',
};

const DEFAULT_PLATFORMS = [
  { name: 'Facebook', emoji: '\uD83D\uDCD8' },
  { name: 'Instagram', emoji: '\uD83D\uDCF7' },
  { name: 'LinkedIn', emoji: '\uD83D\uDCBC' },
  { name: 'Twitter/X', emoji: '\uD83D\uDCAC' },
  { name: 'YouTube', emoji: '\u25B6\uFE0F' },
  { name: 'TikTok', emoji: '\uD83C\uDFB5' },
  { name: 'Google Business', emoji: '\uD83D\uDCCD' },
];

export default function SocialChannelsPage() {
  const params = useParams();
  const businessKey = params.businessKey as string;
  const businessLabel = BUSINESS_LABELS[businessKey] || businessKey;

  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlatform, setNewPlatform] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch(`/api/founder/social-channels?business_key=${encodeURIComponent(businessKey)}`);
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [businessKey]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const addChannel = async (platform: string) => {
    try {
      const res = await fetch('/api/founder/social-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_key: businessKey, platform }),
      });
      if (res.ok) {
        await fetchChannels();
        setShowAddModal(false);
        setNewPlatform('');
      }
    } catch {
      // silently fail
    }
  };

  const updateChannel = async (id: string, updates: Partial<SocialChannel>) => {
    setSaving(id);
    try {
      await fetch(`/api/founder/social-channels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      await fetchChannels();
    } catch {
      // silently fail
    } finally {
      setSaving(null);
    }
  };

  const deleteChannel = async (id: string) => {
    try {
      await fetch(`/api/founder/social-channels/${id}`, { method: 'DELETE' });
      await fetchChannels();
    } catch {
      // silently fail
    }
  };

  // Platforms that already exist
  const existingPlatforms = new Set(channels.map((c) => c.platform));
  const availablePlatforms = DEFAULT_PLATFORMS.filter((p) => !existingPlatforms.has(p.name));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/founder/business-vault/${businessKey}`}
        className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {businessLabel}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {businessLabel} — Social Channels
          </h1>
          <p className="text-sm text-[#888] mt-1">
            Manage social media platforms and connection status
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00F5FF] text-black rounded-sm text-sm font-semibold hover:bg-[#00F5FF]/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Channel
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-[#555] animate-spin" />
        </div>
      )}

      {/* Channel grid */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              saving={saving === channel.id}
              onUpdate={(updates) => updateChannel(channel.id, updates)}
              onDelete={() => deleteChannel(channel.id)}
            />
          ))}

          {channels.length === 0 && (
            <div className="col-span-full rounded-sm border border-dashed border-[#333] p-12 text-center">
              <p className="text-[#555] text-sm">No social channels added yet.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 text-[#00F5FF] text-sm hover:underline"
              >
                Add your first channel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Channel Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101]"
            >
              <div className="bg-[#0d0d0d] border border-[#222] rounded-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Add Channel</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-[#555] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Default platforms */}
                {availablePlatforms.length > 0 && (
                  <div className="space-y-1 mb-4">
                    <p className="text-xs text-[#555] uppercase tracking-wider mb-2">Platforms</p>
                    {availablePlatforms.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => addChannel(p.name)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-[#ccc] hover:bg-[#111] rounded-sm transition-colors"
                      >
                        <span className="text-lg">{p.emoji}</span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom platform */}
                <div className="border-t border-[#222] pt-4">
                  <p className="text-xs text-[#555] uppercase tracking-wider mb-2">Custom Platform</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value)}
                      placeholder="e.g. Pinterest, Threads..."
                      className="flex-1 bg-[#111] border border-[#222] rounded-sm px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#00F5FF]"
                    />
                    <button
                      onClick={() => newPlatform.trim() && addChannel(newPlatform.trim())}
                      disabled={!newPlatform.trim()}
                      className="px-3 py-2 bg-[#222] text-white rounded-sm text-sm hover:bg-[#333] disabled:opacity-40 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChannelCard({
  channel,
  saving,
  onUpdate,
  onDelete,
}: {
  channel: SocialChannel;
  saving: boolean;
  onUpdate: (updates: Partial<SocialChannel>) => void;
  onDelete: () => void;
}) {
  const [handle, setHandle] = useState(channel.handle || '');
  const [profileUrl, setProfileUrl] = useState(channel.profile_url || '');
  const handleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const platformEmoji = DEFAULT_PLATFORMS.find((p) => p.name === channel.platform)?.emoji || '\uD83C\uDF10';

  const saveHandle = (value: string) => {
    if (handleRef.current) clearTimeout(handleRef.current);
    handleRef.current = setTimeout(() => {
      if (value !== (channel.handle || '')) {
        onUpdate({ handle: value || null });
      }
    }, 600);
  };

  const saveUrl = (value: string) => {
    if (urlRef.current) clearTimeout(urlRef.current);
    urlRef.current = setTimeout(() => {
      if (value !== (channel.profile_url || '')) {
        onUpdate({ profile_url: value || null });
      }
    }, 600);
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{platformEmoji}</span>
          <span className="font-medium text-white text-sm">{channel.platform}</span>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-3 w-3 text-[#555] animate-spin" />}
          <button
            onClick={() => onUpdate({ connected: !channel.connected })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-medium transition-colors ${
              channel.connected
                ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                : 'bg-[#222] text-[#555] border border-[#333]'
            }`}
          >
            {channel.connected ? (
              <>
                <Check className="h-3 w-3" />
                Connected
              </>
            ) : (
              'Not connected'
            )}
          </button>
        </div>
      </div>

      {/* Handle */}
      <div>
        <label className="block text-[10px] text-[#555] uppercase tracking-wider mb-1">
          Handle / Username
        </label>
        <input
          type="text"
          value={handle}
          onChange={(e) => {
            setHandle(e.target.value);
            saveHandle(e.target.value);
          }}
          placeholder="@username"
          className="w-full bg-[#111] border border-[#1a1a1a] rounded-sm px-3 py-1.5 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#00F5FF]/50"
        />
      </div>

      {/* Profile URL */}
      <div>
        <label className="block text-[10px] text-[#555] uppercase tracking-wider mb-1">
          Profile URL
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={profileUrl}
            onChange={(e) => {
              setProfileUrl(e.target.value);
              saveUrl(e.target.value);
            }}
            placeholder="https://..."
            className="flex-1 bg-[#111] border border-[#1a1a1a] rounded-sm px-3 py-1.5 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#00F5FF]/50"
          />
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 bg-[#111] border border-[#1a1a1a] rounded-sm text-[#555] hover:text-[#00F5FF] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#1a1a1a]">
        <span className="text-[10px] text-[#444]">
          {channel.last_post_at
            ? `Last post: ${new Date(channel.last_post_at).toLocaleDateString('en-AU')}`
            : 'No post data'}
        </span>
        <button
          onClick={onDelete}
          className="text-[10px] text-[#444] hover:text-[#FF4444] transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
