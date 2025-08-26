import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className }: LoginButtonProps) {
  const handleLogin = () => {
    window.location.href = "/auth/google";
  };

  return (
    <Button
      onClick={handleLogin}
      variant="outline"
      className={className}
      data-testid="button-google-login"
    >
      <FcGoogle className="w-5 h-5 mr-2" />
      Sign in with Google
    </Button>
  );
}