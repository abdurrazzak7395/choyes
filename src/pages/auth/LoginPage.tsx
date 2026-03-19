import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [otpMethod, setOtpMethod] = useState("email");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [tokenLogin, setTokenLogin] = useState("");
  const [svpToken, setSvpToken] = useState("");
  const [tokenMsg, setTokenMsg] = useState("");
  const [tokenSubmitting, setTokenSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login: authLogin, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const portalLogin = sessionStorage.getItem("portal_login") || "";
    const portalPassword = sessionStorage.getItem("portal_password") || "";
    setLogin(portalLogin);
    setPassword(portalPassword);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Sending OTP...");
    setSubmitting(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: { login, password, otpMethod },
      });
      sessionStorage.setItem("tmp_login", login);
      sessionStorage.setItem("tmp_password", password);
      sessionStorage.setItem("tmp_otpMethod", otpMethod);
      setMsg("OTP sent. Check your email or SMS.");
      navigate("/auth/otp");
    } catch (err: any) {
      setMsg(JSON.stringify(err.data || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTokenMsg("Verifying bearer token...");
    setTokenSubmitting(true);
    try {
      const res = await api<{ accessToken: string }>("/api/auth/token-login", {
        method: "POST",
        body: { login: tokenLogin, token: svpToken },
      });
      authLogin(res.accessToken, { login: tokenLogin });
      setTokenMsg("Login successful. Redirecting...");
      navigate("/dashboard");
    } catch (err: any) {
      setTokenMsg(JSON.stringify(err.data || err.message));
    } finally {
      setTokenSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-16 items-center justify-center rounded-br-2xl rounded-tl-2xl rounded-tr-2xl bg-gradient-to-br from-primary to-accent" />
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your SVP account and request OTP verification.
          </p>
        </div>

        {/* OTP Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div>
            <Label>Email</Label>
            <Input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Enter your email"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>OTP Verify Option</Label>
            <select
              value={otpMethod}
              onChange={(e) => setOtpMethod(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Token Login */}
        <form onSubmit={handleTokenSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-2 text-center">
            <h2 className="text-lg font-semibold text-foreground">Direct Token Login</h2>
            <p className="text-xs text-muted-foreground">
              Paste your SVP bearer token and login instantly.
            </p>
          </div>
          <div>
            <Label>Account login (email)</Label>
            <Input
              value={tokenLogin}
              onChange={(e) => setTokenLogin(e.target.value)}
              placeholder="Enter your email or login"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>SVP Bearer Token</Label>
            <textarea
              value={svpToken}
              onChange={(e) => setSvpToken(e.target.value)}
              placeholder="Paste bearer token from official SVP session"
              rows={3}
              required
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" className="w-full" variant="secondary" disabled={tokenSubmitting}>
            {tokenSubmitting ? "Verifying..." : "Login with token"}
          </Button>
          {tokenMsg && <p className="text-sm text-muted-foreground">{tokenMsg}</p>}
        </form>
      </div>
    </div>
  );
}
