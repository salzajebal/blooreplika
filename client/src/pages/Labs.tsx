import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useQuery } from "@tanstack/react-query";

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
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {heroBlock ? (
          <HeroBlock block={heroBlock} />
        ) : blocks.length === 0 ? (
          <DefaultHero />
        ) : null}

        {contentBlocks.map((block: any) => (
          <ContentBlock key={block.id} block={block} />
        ))}

        {blocks.length === 0 && <DefaultContent />}
      </main>
      <Footer />
    </div>
  );
}

function DefaultHero() {
  return (
    <div className="relative w-full" style={{ minHeight: "70vh" }}>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black" />
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4" style={{ minHeight: "70vh" }}>
        <h1
          className="text-3xl md:text-5xl font-bold text-white tracking-widest mb-6"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          LIKE IT
        </h1>
        <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-md">
          믿을 수 있는 레플거래의 시작,
          <br />
          중요한 것은 '신뢰'입니다.
        </p>
      </div>
    </div>
  );
}

function HeroBlock({ block }: { block: any }) {
  return (
    <div className="relative w-full" style={{ minHeight: "70vh" }} data-testid={`labs-hero-${block.id}`}>
      {block.imageUrl ? (
        <img
          src={block.imageUrl}
          alt={block.overlayTitle || "LIKE IT LABS"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: block.bgColor || "#000000" }}
        />
      )}
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative z-10 flex flex-col items-center justify-center px-4"
        style={{
          minHeight: "70vh",
          textAlign: (block.textAlign as any) || "center",
          color: block.textColor || "#ffffff",
        }}
      >
        {block.overlayTitle && (
          <h1
            className="text-3xl md:text-5xl font-bold tracking-widest mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {block.overlayTitle}
          </h1>
        )}
        {block.overlaySubtitle && (
          <p className="text-sm md:text-base leading-relaxed max-w-md opacity-90 whitespace-pre-line">
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
          />
        )}
        {(block.overlayTitle || block.overlaySubtitle) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 px-4 text-center">
            {block.overlayTitle && (
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                {block.overlayTitle}
              </h2>
            )}
            {block.overlaySubtitle && (
              <p className="text-white/80 text-sm md:text-base max-w-lg whitespace-pre-line">{block.overlaySubtitle}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (block.blockType === "image_text") {
    return (
      <div data-testid={`labs-block-${block.id}`}>
        <div className="max-w-[900px] mx-auto px-4 py-12 md:py-20">
          {block.title && (
            <div className="mb-6">
              {block.subtitle && (
                <p className="text-sm text-gray-400 mb-2">{block.subtitle}</p>
              )}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {block.title.split("\n").map((line: string, i: number) => (
                  <span key={i}>
                    {line.startsWith("**") && line.endsWith("**") ? (
                      <span className="text-blue-600">{line.slice(2, -2)}</span>
                    ) : (
                      line
                    )}
                    {i < block.title.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </h2>
            </div>
          )}
          {block.content && (
            <p className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">
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
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="py-12 md:py-20"
      style={{
        backgroundColor: block.bgColor || "#ffffff",
        color: block.textColor || "#000000",
      }}
      data-testid={`labs-block-${block.id}`}
    >
      <div className="max-w-[900px] mx-auto px-4">
        {block.subtitle && (
          <p className="text-sm opacity-60 mb-2">{block.subtitle}</p>
        )}
        {block.title && (
          <h2 className="text-xl md:text-2xl font-bold leading-tight mb-6">
            {block.title.split("\n").map((line: string, i: number) => (
              <span key={i}>
                {line.startsWith("**") && line.endsWith("**") ? (
                  <span className="text-blue-600">{line.slice(2, -2)}</span>
                ) : (
                  line
                )}
                {i < block.title.split("\n").length - 1 && <br />}
              </span>
            ))}
          </h2>
        )}
        {block.content && (
          <p className="text-sm md:text-base opacity-80 leading-relaxed whitespace-pre-line">
            {block.content}
          </p>
        )}
        {block.imageUrl && (
          <div className="mt-8 rounded-xl overflow-hidden">
            <img
              src={block.imageUrl}
              alt={block.title || ""}
              className="w-full h-auto object-cover"
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
      <div className="max-w-[900px] mx-auto px-4 py-12 md:py-20">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          모든 시작은
          <br />
          <span className="text-blue-600">LIKE IT LABS</span>에서
        </h2>
        <p className="text-sm md:text-base text-gray-600 leading-relaxed mt-4">
          라이크잇에서 거래되는 모든 상품은 LIKE IT LABS를 거쳐갑니다.
          <br /><br />
          최근 업계에서는 상품 사진과 다른 상품들을 보내는 업체들이 많아졌습니다.
          LIKE IT LABS의 구성원들은 500개 이상의 공장 핸들링 및 검수센터를 운영하며
          업계에서 오랜 시간 경력을 쌓아온 국내 최고의 전문가입니다.
        </p>
      </div>
    </>
  );
}
