import { supabase } from '../../../supabase';

export const checkCustomUserRole = async (session, setIsAdmin) => {
  if (!session?.user) {
    setIsAdmin(false);
    return;
  }
  try {
    const { data, error } = await supabase
      .from('users_table')
      .select('role')
      .eq('auth_uid', session.user.id)
      .single();
    if (error) throw error;
    setIsAdmin(data?.role === 'admin');
  } catch {
    setIsAdmin(
      session.user.email === 'achrafabbadi08@domain.com' ||
      session.user.email === 'admin@carrent.ma'
    );
  }
};
