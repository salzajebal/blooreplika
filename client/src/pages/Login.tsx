import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("memberToken", data.token);
        localStorage.setItem("memberId", data.member.id);
        localStorage.setItem("memberName", data.member.name);
        localStorage.setItem("memberUsername", data.member.username);
        toast({
          title: "로그인 성공",
          description: `${data.member.name}님, 환영합니다!`,
        });
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect");
        setLocation(redirectPath ? decodeURIComponent(redirectPath) : "/");
      } else {
        toast({
          title: "로그인 실패",
          description: data.error || "아이디 또는 비밀번호를 확인해주세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "로그인 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-xl border-gray-200">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">로그인</CardTitle>
            <CardDescription className="text-gray-600">
              velour 회원 로그인
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">아이디</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="h-11"
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-11"
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold"
                disabled={loading}
                data-testid="button-login"
              >
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                아직 회원이 아니신가요?{" "}
                <Link href={`/signup${window.location.search}`} className="text-primary hover:underline font-medium">
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
