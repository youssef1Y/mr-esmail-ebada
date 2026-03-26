import { useEffect, useRef } from "react";

interface AdBannerProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "horizontal";
  className?: string;
}

// Set your AdSense Publisher ID here
const ADSENSE_PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdBanner = ({ adSlot, adFormat = "auto", className = "" }: AdBannerProps) => {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  // Don't render if publisher ID not set
  if (ADSENSE_PUBLISHER_ID === "ca-pub-XXXXXXXXXXXXXXXX") {
    return null;
  }

  return (
    <div ref={adRef} className={`ad-container text-center overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat === "auto" ? "auto" : adFormat === "rectangle" ? "rectangle" : "horizontal"}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
