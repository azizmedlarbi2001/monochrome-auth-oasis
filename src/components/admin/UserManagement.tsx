
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  roles: string[];
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (profileError) {
        throw profileError;
      }

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      const usersWithRoles = profiles.map(profile => ({
        ...profile,
        roles: roles
          .filter(role => role.user_id === profile.id)
          .map(role => role.role)
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `User ${isCurrentlyAdmin ? 'removed from' : 'granted'} admin role.`,
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-2xl font-bold text-black">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-black">User Management</h2>
      
      <div className="bg-white border-2 border-black">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-4 font-bold text-black">Name</th>
                  <th className="text-left p-4 font-bold text-black">Email</th>
                  <th className="text-left p-4 font-bold text-black">Roles</th>
                  <th className="text-left p-4 font-bold text-black">Joined</th>
                  <th className="text-left p-4 font-bold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isAdmin = user.roles.includes('admin');
                  return (
                    <tr key={user.id} className="border-b border-gray-300">
                      <td className="p-4 text-black">{user.full_name || 'N/A'}</td>
                      <td className="p-4 text-black">{user.email}</td>
                      <td className="p-4 text-black">
                        <span className={`px-2 py-1 text-xs font-bold ${
                          isAdmin 
                            ? 'bg-black text-white' 
                            : 'bg-gray-200 text-black'
                        }`}>
                          {user.roles.join(', ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-black">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Button
                          onClick={() => toggleAdminRole(user.id, isAdmin)}
                          variant={isAdmin ? "destructive" : "default"}
                          className={`text-xs px-3 py-1 ${
                            isAdmin 
                              ? 'bg-white text-black border-2 border-black hover:bg-gray-100' 
                              : 'bg-black text-white border-2 border-black hover:bg-gray-800'
                          }`}
                        >
                          {isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
