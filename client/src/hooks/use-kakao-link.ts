import { useState, useEffect } from "react";

const DEFAULT_KAKAO_LINK = "https://open.kakao.com/o/samplelink";

export function useKakaoLink() {
  const [kakaoLink, setKakaoLink] = useState(DEFAULT_KAKAO_LINK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKakaoLink = async () => {
      try {
        const res = await fetch("/api/settings/kakaoTalkLink");
        const data = await res.json();
        if (data.success && data.data?.value) {
          setKakaoLink(data.data.value);
        }
      } catch (error) {
        console.log("Using default KakaoTalk link");
      } finally {
        setLoading(false);
      }
    };

    fetchKakaoLink();
  }, []);

  const openKakaoChat = () => {
    window.open(kakaoLink, "_blank");
  };

  return { kakaoLink, loading, openKakaoChat };
}
