"use client";

import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { 
  User, 
  Mail, 
  Wallet, 
  Bell, 
  Shield, 
  Trash2,
  Save,
  Eye,
  EyeOff
} from "lucide-react";

// Mock current user
const currentUser = {
  id: "current-user",
  username: "degenuser",
  email: "user@example.com",
  walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  isVerified: true,
};

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    username: currentUser.username,
    email: currentUser.email,
    bio: "Crypto enthusiast and DeFi degen. Building the future of finance on Solana 🚀",
    notifications: {
      likes: true,
      comments: true,
      reposts: true,
      tips: true,
      mentions: true,
    },
    privacy: {
      showWallet: true,
      showPortfolio: false,
      allowMessages: true,
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Settings saved:", formData);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));
  };

  return (
    <Layout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Profile Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="input w-full max-w-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="input w-full max-w-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="input w-full max-w-md min-h-[100px] resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative max-w-md">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Wallet className="h-5 w-5 mr-2" />
            Wallet
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium">Connected Wallet</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {currentUser.walletAddress}
                </div>
              </div>
              <Button variant="outline" size="sm">
                Disconnect
              </Button>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.privacy.showWallet}
                  onChange={(e) => handlePrivacyChange("showWallet", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show wallet address on profile</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.privacy.showPortfolio}
                  onChange={(e) => handlePrivacyChange("showPortfolio", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show portfolio value</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </h2>
          
          <div className="space-y-3">
            {Object.entries(formData.notifications).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  className="rounded"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Privacy
          </h2>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Allow direct messages</span>
              <input
                type="checkbox"
                checked={formData.privacy.allowMessages}
                onChange={(e) => handlePrivacyChange("allowMessages", e.target.checked)}
                className="rounded"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-500/20">
          <h2 className="text-xl font-semibold mb-4 text-red-500 flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            Danger Zone
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

