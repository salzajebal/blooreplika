import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f0f0f]">
      <Card className="w-full max-w-md mx-4 bg-[#161616] border-[#2a2a2a]">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <h1 className="text-2xl font-bold text-[#f0f0f0]">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-[#888888]">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
