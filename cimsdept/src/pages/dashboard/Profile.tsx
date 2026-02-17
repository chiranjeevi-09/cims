import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building2, MapPin, Edit2, Save, X, LogOut } from 'lucide-react';
import { profileApi } from '@/db/api';

const departmentNames: Record<string, string> = {
  municipal: 'Municipal Department',
  panchayat: 'Panchayat',
  town_panchayat: 'Town Panchayat',
  corporation: 'Corporation',
  water: 'Water Department',
  energy: 'Energy Department',
  pwd: 'Public Works Department',
};

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState(profile?.full_name || '');
  const [editedLocation, setEditedLocation] = useState(profile?.location || '');

  const handleEdit = () => {
    setEditedName(profile?.full_name || '');
    setEditedLocation(profile?.location || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedName(profile?.full_name || '');
    setEditedLocation(profile?.location || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsSaving(true);
    try {
      const success = await profileApi.updateProfile(profile.id, {
        full_name: editedName.trim() || null,
        location: editedLocation.trim() || null,
      });

      if (success) {
        await refreshProfile();
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
        setIsEditing(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-2">View and manage your account information</p>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="gap-2"
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Full Name</span>
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-lg font-medium text-foreground">
                  {profile?.full_name || 'N/A'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </Label>
              <p className="text-lg font-medium text-foreground">
                {profile?.email || 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Department</span>
              </Label>
              <p className="text-lg font-medium text-foreground">
                {profile?.department ? departmentNames[profile.department] || profile.department : 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={editedLocation}
                  onChange={(e) => setEditedLocation(e.target.value)}
                  placeholder="Enter your location"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-lg font-medium text-foreground">
                  {profile?.location || 'N/A'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
