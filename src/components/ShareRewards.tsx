import { useState, useEffect } from "react";
import { Share2, Copy, Check, Gift, Key, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ShareRewardsProps {
  userId: string;
}

const SHARE_URL = window.location.origin;
const SHARE_TEXT = "🌟 منصة الأستاذ إسماعيل أحمد عبادة - أفضل منصة لتعليم العلوم الشرعية لطلاب الأزهر الشريف! سجّل الآن:";

export const ShareRewards = ({ userId }: ShareRewardsProps) => {
  const [claimedToday, setClaimedToday] = useState(false);
  const [totalShares, setTotalShares] = useState(0);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from("share_rewards")
        .select("id, share_date")
        .eq("user_id", userId);

      if (data) {
        setTotalShares(data.length);
        const today = new Date().toISOString().split("T")[0];
        setClaimedToday(data.some((r: any) => r.share_date === today));
      }
    };
    check();
  }, [userId]);

  const claimReward = async (platform: string) => {
    if (claimedToday || claiming) return;
    setClaiming(true);

    const { data, error } = await supabase.rpc("claim_share_reward", {
      p_user_id: userId,
      p_platform: platform,
    });

    setClaiming(false);

    const result = data as any;
    if (error || !result?.success) {
      if (result?.message === "already_claimed") {
        setClaimedToday(true);
        toast({ title: "تم المطالبة مسبقاً", description: "يمكنك المشاركة مرة واحدة يومياً" });
      }
      return;
    }

    setClaimedToday(true);
    setTotalShares((p) => p + 1);
    toast({
      title: "🎉 مبروك!",
      description: "حصلت على 10 نقاط + مفتاح مسابقة!",
    });
  };

  const shareOnWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + " " + SHARE_URL)}`, "_blank");
    claimReward("whatsapp");
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`, "_blank");
    claimReward("facebook");
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`, "_blank");
    claimReward("twitter");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(SHARE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    claimReward("link");
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/20 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold font-amiri text-foreground">شارك المنصة واكسب جوائز! 🎁</h3>
          <p className="text-xs text-muted-foreground">شارك يومياً واحصل على 10 نقاط + مفتاح مسابقة</p>
        </div>
      </div>

      {/* Rewards info */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-background/60 rounded-xl p-3 text-center border border-border/50">
          <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">+10</p>
          <p className="text-[10px] text-muted-foreground">نقاط</p>
        </div>
        <div className="flex-1 bg-background/60 rounded-xl p-3 text-center border border-border/50">
          <Key className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">+1</p>
          <p className="text-[10px] text-muted-foreground">مفتاح مسابقة</p>
        </div>
        <div className="flex-1 bg-background/60 rounded-xl p-3 text-center border border-border/50">
          <Share2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalShares}</p>
          <p className="text-[10px] text-muted-foreground">مشاركاتك</p>
        </div>
      </div>

      {claimedToday ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
          <Check className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-green-600 dark:text-green-400">تم الحصول على مكافأة اليوم ✅</p>
          <p className="text-xs text-muted-foreground">عد غداً لمكافأة جديدة!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center mb-2">اختر طريقة المشاركة:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={shareOnWhatsApp}
              disabled={claiming}
              className="h-11 rounded-xl gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              <MessageCircle className="w-4 h-4" />
              واتساب
            </Button>
            <Button
              onClick={shareOnFacebook}
              disabled={claiming}
              className="h-11 rounded-xl gap-2 bg-[#1877F2] hover:bg-[#1565D8] text-white"
            >
              <Share2 className="w-4 h-4" />
              فيسبوك
            </Button>
            <Button
              onClick={shareOnTwitter}
              disabled={claiming}
              className="h-11 rounded-xl gap-2 bg-[#1DA1F2] hover:bg-[#1A91DA] text-white"
            >
              <Share2 className="w-4 h-4" />
              تويتر
            </Button>
            <Button
              onClick={copyLink}
              disabled={claiming}
              variant="outline"
              className="h-11 rounded-xl gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "تم النسخ!" : "نسخ الرابط"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
