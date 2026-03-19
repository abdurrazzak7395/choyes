import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OtpPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [otpMethod, setOtpMethod] = useState("email");
  const [otpAttempt, setOtpAttempt] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLogin(sessionStorage.getItem("tmp_login") || "");
    setPassword(sessionStorage.getItem("tmp_password") || "");
    setOtpMethod(sessionStorage.getItem("tmp_otpMethod") || "email");
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Verifying OTP...");
    setSubmitting(true);
    try {
      const res = await api<{ accessToken: string }>("/api/auth/otp-verify", {
        method: "POST",
        body: { login, password, otpAttempt, otpMethod },
      });
      authLogin(res.accessToken, { login });
      sessionStorage.removeItem("tmp_login");
      sessionStorage.removeItem("tmp_password");
      sessionStorage.removeItem("tmp_otpMethod");
      setMsg("Login successful. Redirecting...");
      navigate("/dashboard");
    } catch (err: any) {
      setMsg(JSON.stringify(err.data || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">OTP Verification</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the OTP sent to your selected method and complete sign in.
          </p>
        </div>

        {/* Account info */}
        <div className="mb-6 grid grid-cols-[90px_1fr] gap-2 rounded-lg border border-border bg-card p-4 text-sm">
          <span className="text-muted-foreground font-semibold">Account</span>
          <strong className="text-foreground">{login}</strong>
          <span className="text-muted-foreground font-semibold">Verify by</span>
          <strong className="text-foreground uppercase">{otpMethod}</strong>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div>
            <Label>OTP Code</Label>
            <Input
              value={otpAttempt}
              onChange={(e) => setOtpAttempt(e.target.value)}
              placeholder="Enter OTP code"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Verifying..." : "Verify OTP"}
          </Button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </form>

        <button
          onClick={() => navigate("/auth/login")}
          className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to login
        </button>
      </div>
    </div>
  );
}
