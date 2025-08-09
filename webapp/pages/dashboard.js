import Image from "next/image";
import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Modal, ModalTrigger, ModalBody, ModalContent, ModalFooter } from "@/components/ui/animated-modal";
import { motion } from "motion/react";
import { 
  Shield, 
  Key, 
  Plus, 
  Search, 
  Bell, 
  Settings, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  TrendingUp,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  MoreHorizontal,
  User,
  Globe,
  Smartphone,
  Laptop,
  Scan,
  Moon,
  Sun,
  X
} from "lucide-react";
import { useState, useEffect } from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: 'swap',
});

const interTight = Inter({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: 'swap',
});

export default function Dashboard() {
  const [showPasswords, setShowPasswords] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Form state for Add Password modal
  const [formData, setFormData] = useState({
    siteName: "",
    websiteUrl: "",
    emailUsername: "",
    password: ""
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Enable dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Mock data for demonstration
  const securityScore = 85;
  const totalPasswords = 47;
  const weakPasswords = 3;
  const breachedPasswords = 1;
  const reusedPasswords = 5;

  const recentPasswords = [
    { id: 1, name: "GitHub", username: "marcus@example.com", url: "github.com", password: "•••••••••••••", strength: "Strong", lastUsed: "2 hours ago", device: "laptop" },
    { id: 2, name: "Gmail", username: "marcus.dev@gmail.com", url: "gmail.com", password: "•••••••••••••", strength: "Strong", lastUsed: "5 hours ago", device: "smartphone" },
    { id: 3, name: "Discord", username: "marcus_dev", url: "discord.com", password: "•••••••••••••", strength: "Weak", lastUsed: "1 day ago", device: "laptop" },
    { id: 4, name: "Netflix", username: "marcus@example.com", url: "netflix.com", password: "•••••••••••••", strength: "Medium", lastUsed: "3 days ago", device: "smartphone" },
  ];

  const recentActivity = [
    { id: 1, action: "Password generated", item: "LinkedIn", time: "2 hours ago", type: "success" },
    { id: 2, action: "Security scan completed", item: "All accounts", time: "6 hours ago", type: "info" },
    { id: 3, action: "Weak password detected", item: "Discord", time: "1 day ago", type: "warning" },
    { id: 4, action: "Breach detected", item: "Adobe", time: "2 days ago", type: "danger" },
  ];

  const securityInsights = [
    { title: "Update weak passwords", description: "3 passwords need strengthening", action: "Fix now", type: "warning" },
    { title: "Breach detected", description: "Adobe account may be compromised", action: "Review", type: "danger" },
    { title: "Enable 2FA", description: "5 accounts without two-factor authentication", action: "Secure", type: "info" },
  ];

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'laptop': return <Laptop className="h-4 w-4" />;
      case 'smartphone': return <Smartphone className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'Strong': return 'success';
      case 'Medium': return 'warning';
      case 'Weak': return 'danger';
      default: return 'secondary';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'danger': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  // Form handling functions
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    
    // Reset form
    setFormData({
      siteName: "",
      websiteUrl: "",
      emailUsername: "",
      password: ""
    });
    setShowNewPassword(false);
    
    // Close modal (this would be handled by the modal context)
    alert('Password added successfully!');
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  return (
    <Modal>
      <div className={`${inter.variable} ${interTight.variable} font-sans min-h-screen bg-background`}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
          {/* Logo and brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Grand Warden Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl brand-text text-foreground">Grand Warden</span>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Dashboard
            </Badge>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search passwords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder-avatar.svg" alt="User" />
              <AvatarFallback>MD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-3xl md:text-4xl heading-modern text-foreground mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
          >
            Welcome back, Marcus
          </motion.h1>
          <motion.p 
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          >
            Your security dashboard is ready. Here's your password vault overview.
          </motion.p>
        </motion.div>

        {/* Security overview cards */}
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-foreground">{securityScore}%</div>
                <Badge variant={securityScore > 80 ? 'success' : securityScore > 60 ? 'warning' : 'danger'}>
                  {securityScore > 80 ? 'Good' : securityScore > 60 ? 'Fair' : 'Poor'}
                </Badge>
              </div>
              <Progress value={securityScore} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalPasswords}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{weakPasswords}</div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compromised</CardTitle>
              <Scan className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{breachedPasswords}</div>
              <p className="text-xs text-muted-foreground">
                Found in data breaches
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          className="grid gap-6 lg:grid-cols-3"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        >
          {/* Password vault */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="heading-bold">Password Vault</CardTitle>
                    <CardDescription>Manage your stored passwords and credentials</CardDescription>
                  </div>
                  <ModalTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Password
                  </ModalTrigger>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPasswords.map((password) => (
                    <div key={password.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{password.name}</h4>
                            <Badge variant={getStrengthColor(password.strength)} className="text-xs">
                              {password.strength}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{password.username}</span>
                            <span>•</span>
                            <span>{password.url}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {getDeviceIcon(password.device)}
                              <span>{password.lastUsed}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePasswordVisibility(password.id)}
                        >
                          {showPasswords[password.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    View All Passwords ({totalPasswords})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="heading-bold">Quick Actions</CardTitle>
                <CardDescription>Common password management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ModalTrigger className="w-full justify-start inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Password
                </ModalTrigger>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Scan className="h-4 w-4 mr-2" />
                  Security Scan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            {/* Security insights */}
            <Card>
              <CardHeader>
                <CardTitle className="heading-bold">Security Insights</CardTitle>
                <CardDescription>Recommendations to improve your security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {securityInsights.map((insight, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                      </div>
                      <Badge variant={insight.type === 'danger' ? 'destructive' : insight.type === 'warning' ? 'warning' : 'secondary'}>
                        {insight.action}
                      </Badge>
                    </div>
                    {index < securityInsights.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader>
                <CardTitle className="heading-bold">Recent Activity</CardTitle>
                <CardDescription>Your latest password management actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.item}</span>
                        <span>•</span>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
      
      {/* Add Password Modal */}
      <ModalBody>
        <ModalContent>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Add New Password</h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  placeholder="e.g., GitHub, Gmail, Netflix"
                  value={formData.siteName}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailUsername">Email/Username</Label>
                <Input
                  id="emailUsername"
                  placeholder="your.email@example.com or username"
                  value={formData.emailUsername}
                  onChange={(e) => handleInputChange('emailUsername', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter a secure password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleNewPasswordVisibility}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </ModalContent>
        
        <ModalFooter>
          <div className="flex gap-3 w-full justify-end">
            <Button type="submit" onClick={handleFormSubmit}>
              <Key className="h-4 w-4 mr-2" />
              Add Password
            </Button>
          </div>
        </ModalFooter>
      </ModalBody>
    </div>
    </Modal>
  );
}
