import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MapPin, FileText, Clock, CheckCircle, Camera, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/contexts/IssueContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export default function Profile() {
  const {
    user,
    profile,
    logout,
    refreshProfile
  } = useAuth();
  const {
    getUserIssues,
    getIssuesByStatus
  } = useIssues();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [newCity, setNewCity] = useState(profile?.city || '');
  const [isSavingCity, setIsSavingCity] = useState(false);
  const myIssues = getUserIssues(user?.id || '');
  const stats = {
    total: myIssues.length,
    pending: getIssuesByStatus(user?.id || '', 'pending').length,
    progress: getIssuesByStatus(user?.id || '', ['seen', 'progress']).length,
    solved: getIssuesByStatus(user?.id || '', 'completed').length
  };
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true
      });
      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile with new avatar URL
      const {
        error: updateError
      } = await supabase.from('citizen_profiles').upsert({
        id: user.id,
        avatar: publicUrl,
        name: profile?.name || (user?.user_metadata as any)?.name || (user?.user_metadata as any)?.full_name || 'User',
        email: user?.email
      });
      if (updateError) throw updateError;
      await refreshProfile();
      toast.success('Profile picture updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };
  const handleSaveCity = async () => {
    if (!user || !newCity.trim()) return;
    setIsSavingCity(true);
    try {
      const {
        error
      } = await supabase.from('citizen_profiles').upsert({
        id: user.id,
        city: newCity.trim(),
        name: profile?.name || (user?.user_metadata as any)?.name || (user?.user_metadata as any)?.full_name || 'User',
        email: user?.email
      });
      if (error) throw error;
      await refreshProfile();
      setIsEditingCity(false);
      toast.success('City updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update city');
    } finally {
      setIsSavingCity(false);
    }
  };
  return <div className="pb-6">
    {/* Hidden file input */}
    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

    {/* Header */}
    <div className="gradient-primary px-4 pt-4 pb-16">
      <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h1 className="text-xl font-bold text-primary-foreground">My Profile</h1>
    </div>

    <div className="px-4 -mt-10">
      <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3
      }}>
        <Card className="p-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center -mt-16 mb-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                <AvatarImage src={profile?.avatar} alt={profile?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {profile?.name?.charAt(0) || (user?.user_metadata as any)?.name?.charAt(0) || (user?.user_metadata as any)?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full" onClick={handleAvatarClick} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </Button>
            </div>
            <h2 className="text-xl font-bold text-foreground mt-4">{profile?.name || (user?.user_metadata as any)?.name || (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.display_name || 'User'}</h2>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-3 w-3" />
              <span>{profile?.city || (user?.user_metadata as any)?.city || 'Not set'}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="text-center p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 mx-auto mb-1 text-pending" />
              <p className="text-lg font-bold text-foreground">{stats.pending}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
              <p className="text-lg font-bold text-foreground">{stats.progress}</p>
              <p className="text-[10px] text-muted-foreground">Progress</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
              <p className="text-lg font-bold text-foreground">{stats.solved}</p>
              <p className="text-[10px] text-muted-foreground">Solved</p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm text-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">City</p>
                <p className="text-sm text-foreground">{profile?.city || (user?.user_metadata as any)?.city || 'Not set'}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                setNewCity(profile?.city || '');
                setIsEditingCity(true);
              }}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>


          </div>

          <Separator className="my-4" />

          {/* Logout */}
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            Sign Out
          </Button>
        </Card>
      </motion.div>
    </div>

    {/* Edit City Dialog */}
    <Dialog open={isEditingCity} onOpenChange={setIsEditingCity}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update City</DialogTitle>
        </DialogHeader>
        <Input placeholder="Enter your city" value={newCity} onChange={e => setNewCity(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditingCity(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveCity} disabled={isSavingCity || !newCity.trim()}>
            {isSavingCity ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}