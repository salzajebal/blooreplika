import { Header } from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function renderFormattedTitle(text: string, accentColor: string = "#C8A97E") {
  return text.split("\n").map((line: string, i: number, arr: string[]) => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      parts.push(
        <span key={`accent-${i}-${match.index}`} style={{ color: accentColor }}>
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <span key={i}>
        {parts.length > 0 ? parts : line}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

export default function Labs() {
  const { data: blocks = [] } = useQuery({
    queryKey: ["/api/labs-blocks"],
    queryFn: async () => {
      const res = await fetch("/api/labs-blocks");
      const data = await res.json();
      return data.success ? data.data : [];
    },
  });

  const heroBlock = blocks.find((b: any) => b.blockType === "hero");
  const contentBlocks = blocks.filter((b: any) => b.blockType !== "hero");

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      <main>
        {heroBlock ? (
          <HeroBlock block={heroBlock} />
        ) : blocks.length === 0 ? (
          <DefaultHero />
        ) : null}

        {contentBlocks.length > 0 ? (
          contentBlocks.map((block: any, index: number) => (
            <ScrollReveal key={block.id} delay={index === 0 ? 100 : 0}>
              <ContentBlock block={block} />
            </ScrollReveal>
          ))
        ) : blocks.length === 0 ? (
          <ScrollReveal>
            <DefaultContent />
          </ScrollReveal>
        ) : null}
      </main>

    </div>
  );
}

function DefaultHero() {
  return (
    <div className="relative w-full" style={{ minHeight: "60vh" }}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#111111] via-[#222222] to-[#333333]" />
      <div className="relative z-10 flex flex-col items-center justify-end text-center px-4 pb-16" style={{ minHeight: "60vh" }}>
        <h1
          className="text-[28px] md:text-[44px] font-bold text-white tracking-[0.2em] mb-5"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          data-testid="labs-hero-title"
        >
          velour
        </h1>
        <p className="text-white/70 text-[13px] md:text-[15px] leading-[1.8]">
          믿을 수 있는 거래의 시작,
          <br />
          중요한 것은 '신뢰'입니다.
        </p>
      </div>
    </div>
  );
}

function HeroBlock({ block }: { block: any }) {
  return (
    <div className="relative w-full" style={{ minHeight: "80vh" }} data-testid={`labs-hero-${block.id}`}>
      {block.imageUrl ? (
        <img
          src={block.imageUrl}
          alt={block.overlayTitle || "velour LABS"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: block.bgColor || "#000000" }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      <div
        className="relative z-10 flex flex-col items-center justify-end px-4 pb-16"
        style={{
          minHeight: "80vh",
          textAlign: (block.textAlign as any) || "center",
          color: block.textColor || "#ffffff",
        }}
      >
        {block.overlayTitle && (
          <h1
            className="text-[28px] md:text-[44px] font-bold tracking-[0.2em] mb-5"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            {block.overlayTitle}
          </h1>
        )}
        {block.overlaySubtitle && (
          <p className="text-[13px] md:text-[15px] leading-[1.8] opacity-70 whitespace-pre-line max-w-md">
            {block.overlaySubtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function ContentBlock({ block }: { block: any }) {
  if (block.blockType === "image") {
    return (
      <div className="relative w-full" data-testid={`labs-block-${block.id}`}>
        {block.imageUrl && (
          <img
            src={block.imageUrl}
            alt={block.title || ""}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        )}
        {(block.overlayTitle || block.overlaySubtitle) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 px-6 text-center">
            {block.overlayTitle && (
              <h2
                className="text-[22px] md:text-[36px] font-bold text-white mb-3 tracking-wide"
                style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
              >
                {block.overlayTitle}
              </h2>
            )}
            {block.overlaySubtitle && (
              <p className="text-white/70 text-[12px] md:text-[14px] leading-[1.8] max-w-lg whitespace-pre-line">
                {block.overlaySubtitle}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (block.blockType === "image_text") {
    const isDark = block.bgColor && block.bgColor !== "#ffffff" && block.bgColor !== "#FFFFFF";
    const txtColor = block.textColor || (isDark ? "#ffffff" : "#111111");
    const subColor = isDark ? "rgba(255,255,255,0.5)" : "#999999";
    const bodyColor = isDark ? "rgba(255,255,255,0.75)" : "#555555";

    return (
      <div
        data-testid={`labs-block-${block.id}`}
        style={{ backgroundColor: block.bgColor || "#ffffff" }}
      >
        <div className="max-w-[640px] mx-auto px-5 pt-14 pb-10 md:pt-20 md:pb-14">
          {block.title && (
            <div className="mb-5">
              {block.subtitle && (
                <p className="text-[11px] md:text-[12px] font-medium tracking-wider uppercase mb-3" style={{ color: subColor }}>
                  {block.subtitle}
                </p>
              )}
              <h2 className="text-[20px] md:text-[24px] font-bold leading-[1.4] tracking-tight" style={{ color: txtColor }}>
                {renderFormattedTitle(block.title)}
              </h2>
            </div>
          )}
          {block.content && (
            <p className="text-[13px] md:text-[14px] leading-[1.9] whitespace-pre-line" style={{ color: bodyColor }}>
              {block.content}
            </p>
          )}
        </div>
        {block.imageUrl && (
          <div className="w-full">
            <img
              src={block.imageUrl}
              alt={block.title || ""}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    );
  }

  const isDark = block.bgColor && block.bgColor !== "#ffffff" && block.bgColor !== "#FFFFFF";
  const txtColor = block.textColor || (isDark ? "#ffffff" : "#111111");
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "#999999";
  const bodyColor = isDark ? "rgba(255,255,255,0.75)" : "#555555";

  return (
    <div
      className="py-14 md:py-20"
      style={{
        backgroundColor: block.bgColor || "#ffffff",
        color: txtColor,
      }}
      data-testid={`labs-block-${block.id}`}
    >
      <div className="max-w-[640px] mx-auto px-5">
        {block.subtitle && (
          <p className="text-[11px] md:text-[12px] font-medium tracking-wider uppercase mb-3" style={{ color: subColor }}>
            {block.subtitle}
          </p>
        )}
        {block.title && (
          <h2 className="text-[20px] md:text-[24px] font-bold leading-[1.4] tracking-tight mb-5">
            {renderFormattedTitle(block.title)}
          </h2>
        )}
        {block.content && (
          <p className="text-[13px] md:text-[14px] leading-[1.9] whitespace-pre-line" style={{ color: bodyColor }}>
            {block.content}
          </p>
        )}
        {block.imageUrl && (
          <div className="mt-10 rounded-lg overflow-hidden">
            <img
              src={block.imageUrl}
              alt={block.title || ""}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultContent() {
  return (
    <>
      <div className="max-w-[640px] mx-auto px-5 py-14 md:py-20">
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#f0f0f0] leading-[1.4] tracking-tight mb-1.5">
          모든 시작은
          <br />
          <span style={{ color: "#C8A97E" }}>velour LABS</span>에서
        </h2>
        <p className="text-[13px] md:text-[14px] text-[#888888] leading-[1.9] mt-5">
          velour에서 거래되는 모든 상품은 velour LABS를 거쳐갑니다.
          <br /><br />
          최근 업계에서는 상품 사진과 다른 상품들을 보내는 업체들이 많아졌습니다.
          velour LABS의 구성원들은 500개 이상의 공장 핸들링 및 검수센터를 운영하며
          업계에서 오랜 시간 경력을 쌓아온 국내 최고의 전문가입니다.
        </p>
      </div>
    </>
  );
}
