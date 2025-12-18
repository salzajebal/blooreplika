import { useState, useEffect, useCallback } from "react";

const DEFAULT_KAKAO_LINK = "https://open.kakao.com/o/samplelink";

export function useKakaoLink() {
  const [kakaoLink, setKakaoLink] = useState(DEFAULT_KAKAO_LINK);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  const openKakaoChat = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const confirmAndOpenKakao = useCallback(() => {
    window.open(kakaoLink, "_blank");
    setShowConfirmDialog(false);
  }, [kakaoLink]);

  const closeConfirmDialog = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return { 
    kakaoLink, 
    loading, 
    openKakaoChat, 
    showConfirmDialog, 
    confirmAndOpenKakao, 
    closeConfirmDialog 
  };
}
