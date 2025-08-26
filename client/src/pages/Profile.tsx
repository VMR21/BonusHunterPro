import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Calendar, Mail } from "lucide-react";
import { LoginButton } from "@/components/LoginButton";
import type { User as UserType } from "@shared/schema";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold text-white mb-4">Profile</h1>
          <p className="text-white/60 mb-8">Please sign in to view your profile</p>
          <LoginButton className="w-full" />
        </div>
      </div>
    );
  }

  const userTyped = user as UserType;
  const initials = userTyped.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Profile</h1>
          <p className="text-white/80">Manage your account information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details from Google authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userTyped.profileImage || ""} alt={userTyped.name || ""} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{userTyped.name}</h2>
                <p className="text-muted-foreground">{userTyped.email}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Mail className="w-5 h-5 text-white/70" />
                <div>
                  <p className="font-medium">Email Address</p>
                  <p className="text-sm text-white/70">{userTyped.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Calendar className="w-5 h-5 text-white/70" />
                <div>
                  <p className="font-medium">Member Since</p>
                  <p className="text-sm text-white/70">
                    {userTyped.createdAt ? new Date(userTyped.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-white/60 mb-4">
                Account information is managed through Google. To update your name or profile picture, 
                please update your Google account settings.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open("https://myaccount.google.com", "_blank")}
              >
                Manage Google Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}