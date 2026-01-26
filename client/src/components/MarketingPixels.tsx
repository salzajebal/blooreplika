import { useEffect, useState } from "react";

interface PixelSettings {
  facebookPixelId: string;
  facebookPixelEnabled: boolean;
  googleAnalyticsId: string;
  googleAnalyticsEnabled: boolean;
  kakaoPixelId: string;
  kakaoPixelEnabled: boolean;
}

export function MarketingPixels() {
  const [settings, setSettings] = useState<PixelSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/site-settings/pixels");
        const data = await res.json();
        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch pixel settings:", error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings) return;

    if (settings.facebookPixelEnabled && settings.facebookPixelId) {
      injectFacebookPixel(settings.facebookPixelId);
    } else {
      removeFacebookPixel();
    }

    if (settings.googleAnalyticsEnabled && settings.googleAnalyticsId) {
      injectGoogleAnalytics(settings.googleAnalyticsId);
    } else {
      removeGoogleAnalytics();
    }

    if (settings.kakaoPixelEnabled && settings.kakaoPixelId) {
      injectKakaoPixel(settings.kakaoPixelId);
    } else {
      removeKakaoPixel();
    }
  }, [settings]);

  return null;
}

function injectFacebookPixel(pixelId: string) {
  if (document.getElementById("fb-pixel-script")) return;

  const script = document.createElement("script");
  script.id = "fb-pixel-script";
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  const noscript = document.createElement("noscript");
  noscript.id = "fb-pixel-noscript";
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);
}

function removeFacebookPixel() {
  const script = document.getElementById("fb-pixel-script");
  const noscript = document.getElementById("fb-pixel-noscript");
  if (script) script.remove();
  if (noscript) noscript.remove();
  if ((window as any).fbq) {
    delete (window as any).fbq;
    delete (window as any)._fbq;
  }
}

function injectGoogleAnalytics(gaId: string) {
  if (document.getElementById("ga-script")) return;

  const gtagScript = document.createElement("script");
  gtagScript.id = "ga-script";
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(gtagScript);

  const inlineScript = document.createElement("script");
  inlineScript.id = "ga-inline-script";
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(inlineScript);
}

function removeGoogleAnalytics() {
  const gtagScript = document.getElementById("ga-script");
  const inlineScript = document.getElementById("ga-inline-script");
  if (gtagScript) gtagScript.remove();
  if (inlineScript) inlineScript.remove();
}

function injectKakaoPixel(pixelId: string) {
  if (document.getElementById("kakao-pixel-script")) return;

  const script = document.createElement("script");
  script.id = "kakao-pixel-script";
  script.innerHTML = `
    !function(c,a,k,e,p){c._caq = c._caq || [];
    if(!a.getElementById(e)){t=a.createElement(k);t.id=e;t.src="//t1.daumcdn.net/kas/static/kp.js";a.head.appendChild(t);}
    c._caq.push(['init','${pixelId}']);c._caq.push(['view']);}(window,document,'script','kakao-pixel');
  `;
  document.head.appendChild(script);
}

function removeKakaoPixel() {
  const script = document.getElementById("kakao-pixel-script");
  if (script) script.remove();
}
