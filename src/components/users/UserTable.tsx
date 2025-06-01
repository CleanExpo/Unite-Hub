import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function UserTable({ users }: { users: Profile[] }) {
  return (
    <div>
      <h1>Users</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Full Name</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.full_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
