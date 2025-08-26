import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your admin key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(adminKey.trim());
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Successfully logged in!",
        });
        setAdminKey("");
        onOpenChange(false);
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid admin key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="login-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Admin Login
          </DialogTitle>
          <DialogDescription>
            Enter your admin key to access the bonus hunting platform
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminKey">Admin Key</Label>
            <Input
              id="adminKey"
              type="password"
              placeholder="Enter your admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              disabled={isLoading}
              data-testid="input-admin-key"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
        

      </DialogContent>
    </Dialog>
  );
}