import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '@/db/api';
import type { Profile } from '@/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, User, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Admin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard/recent');
      return;
    }

    const loadProfiles = async () => {
      setLoading(true);
      const data = await profileApi.getAllProfiles();
      setProfiles(data);
      setLoading(false);
    };

    loadProfiles();
  }, [profile, navigate]);

  const handleRoleChange = async (userId: string, newRole: 'official' | 'admin') => {
    const success = await profileApi.updateProfile(userId, { role: newRole });

    if (success) {
      toast({
        title: 'Role Updated',
        description: 'User role has been updated successfully.',
      });
      const data = await profileApi.getAllProfiles();
      setProfiles(data);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64 bg-muted" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48 bg-muted" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-32 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard/recent')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all department officials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profiles.map((userProfile) => (
                <div
                  key={userProfile.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {userProfile.role === 'admin' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {userProfile.full_name || 'Unnamed User'}
                      </p>
                      <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {userProfile.department.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={userProfile.role}
                      onValueChange={(value) => handleRoleChange(userProfile.id, value as 'official' | 'admin')}
                      disabled={userProfile.id === profile?.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="official">Official</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
