import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Eye,
  EyeOff,
  Key,
  Shield,
  Settings,
  LogOut,
  Github,
  Chrome,
  Twitter,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Crown,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  role: 'user' | 'moderator' | 'admin'
  verified: boolean
  createdAt: Date
  lastLogin?: Date
  subscription: 'free' | 'premium' | 'enterprise'
  apiUsage: {
    requests: number
    limit: number
    resetDate: Date
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    notifications: boolean
    language: string
  }
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error?: string
}

export interface AuthProvider {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface AuthenticationProps {
  authState: AuthState
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (username: string, email: string, password: string) => Promise<void>
  onSocialLogin: (provider: string) => Promise<void>
  onLogout: () => void
  onUpdateProfile: (updates: Partial<User>) => Promise<void>
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
  onVerifyEmail: (code: string) => Promise<void>
  onResendVerification: () => Promise<void>
}

const authProviders: AuthProvider[] = [
  { id: 'github', name: 'GitHub', icon: Github, color: 'bg-gray-900' },
  { id: 'google', name: 'Google', icon: Chrome, color: 'bg-red-500' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-500' }
]

export function Authentication({
  authState,
  onLogin,
  onRegister,
  onSocialLogin,
  onLogout,
  onUpdateProfile,
  onChangePassword,
  onVerifyEmail,
  onResendVerification
}: AuthenticationProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    preferences: { theme: 'system' as 'light' | 'dark' | 'system', notifications: true, language: 'en' }
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [verificationCode, setVerificationCode] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onLogin(loginForm.email, loginForm.password)
      setLoginForm({ email: '', password: '' })
    } catch (error) {
      console.error('Login error:', error)
      // Error handled by parent component
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirmPassword) {
      return
    }
    try {
      await onRegister(registerForm.username, registerForm.email, registerForm.password)
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' })
      setActiveTab('login')
    } catch (error) {
      console.error('Registration error:', error)
      // Error handled by parent component
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onUpdateProfile({
        username: profileForm.username,
        email: profileForm.email,
        preferences: profileForm.preferences
      })
      setIsProfileDialogOpen(false)
    } catch (error) {
      console.error('Profile update error:', error)
      // Error handled by parent component
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return
    }
    try {
      await onChangePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsPasswordDialogOpen(false)
    } catch (error) {
      console.error('Password change error:', error)
      // Error handled by parent component
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onVerifyEmail(verificationCode)
      setVerificationCode('')
      setIsVerificationDialogOpen(false)
    } catch (error) {
      console.error('Email verification error:', error)
      // Error handled by parent component
    }
  }

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />
      case 'user':
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getSubscriptionIcon = (subscription: User['subscription']) => {
    switch (subscription) {
      case 'enterprise':
        return <Crown className="w-4 h-4 text-purple-500" />
      case 'premium':
        return <Star className="w-4 h-4 text-yellow-500" />
      case 'free':
        return <Zap className="w-4 h-4 text-gray-500" />
    }
  }

  const getSubscriptionColor = (subscription: User['subscription']) => {
    switch (subscription) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'free':
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString()
  }

  const getApiUsagePercentage = (user: User) => {
    return (user.apiUsage.requests / user.apiUsage.limit) * 100
  }

  if (authState.isAuthenticated && authState.user) {
    const user = authState.user
    const apiUsagePercent = getApiUsagePercentage(user)

    return (
      <div className="space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                Welcome back, {user.username}!
              </CardTitle>
              <div className="flex items-center gap-2">
                {getRoleIcon(user.role)}
                <Badge variant="outline" className={cn("text-xs", getSubscriptionColor(user.subscription))}>
                  {getSubscriptionIcon(user.subscription)}
                  <span className="ml-1">{user.subscription}</span>
                </Badge>
                {user.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Member Since</Label>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Last Login</Label>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">API Usage</Label>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{user.apiUsage.requests.toLocaleString()} / {user.apiUsage.limit.toLocaleString()}</span>
                    <span>{apiUsagePercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        apiUsagePercent > 90 ? "bg-red-500 w-full" :
                        apiUsagePercent > 70 ? "bg-yellow-500 w-3/4" :
                        apiUsagePercent > 50 ? "bg-green-500 w-1/2" :
                        "bg-green-500 w-1/4"
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Resets on {user.apiUsage.resetDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => {
                    setProfileForm({
                      username: user.username,
                      email: user.email,
                      preferences: user.preferences
                    })
                  }}>
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <Label htmlFor="profile-username">Username</Label>
                      <Input
                        id="profile-username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile-email">Email</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile-theme">Theme</Label>
                      <select
                        id="profile-theme"
                        title="Select theme"
                        value={profileForm.preferences.theme}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, theme: e.target.value as 'light' | 'dark' | 'system' }
                        }))}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="profile-notifications"
                        checked={profileForm.preferences.notifications}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, notifications: e.target.checked }
                        }))}
                        className="rounded"
                        title="Enable notifications"
                      />
                      <Label htmlFor="profile-notifications">Enable notifications</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Change Password</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {!user.verified && (
                <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Verify Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Verify Your Email</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleVerifyEmail} className="space-y-4">
                      <div>
                        <Label htmlFor="verification-code">Verification Code</Label>
                        <Input
                          id="verification-code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={onResendVerification}>
                          Resend Code
                        </Button>
                        <Button type="submit">Verify</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Welcome to MCP Ecosystem</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {authState.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {authState.error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={authState.isLoading}>
                  {authState.isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {authProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    variant="outline"
                    onClick={() => onSocialLogin(provider.id)}
                    disabled={authState.isLoading}
                    className="flex items-center gap-2"
                  >
                    <provider.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{provider.name}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                {registerForm.password && registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Passwords do not match
                  </div>
                )}
                {authState.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {authState.error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={authState.isLoading}>
                  {authState.isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {authProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    variant="outline"
                    onClick={() => onSocialLogin(provider.id)}
                    disabled={authState.isLoading}
                    className="flex items-center gap-2"
                  >
                    <provider.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{provider.name}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
