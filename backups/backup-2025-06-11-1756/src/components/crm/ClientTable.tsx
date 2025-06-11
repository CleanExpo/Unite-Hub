import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, User } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  created_at: string;
  status: string;
}

interface ClientTableProps {
  clients: Client[];
}

export default function ClientTable({ clients }: ClientTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-600/20 text-green-400 border-green-800">Active</Badge>;
      case "inactive":
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-800">Inactive</Badge>;
      case "lead":
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-800">Lead</Badge>;
      default:
        return <Badge className="bg-slate-600/20 text-slate-400 border-slate-800">{status}</Badge>;
    }
  };

  return (
    <Table className="border border-slate-700 rounded-lg">
      <TableHeader className="bg-slate-750">
        <TableRow className="border-slate-700 hover:bg-slate-750">
          <TableHead className="text-slate-300 w-[200px]">Client</TableHead>
          <TableHead className="text-slate-300">Contact</TableHead>
          <TableHead className="text-slate-300">Company</TableHead>
          <TableHead className="text-slate-300">Status</TableHead>
          <TableHead className="text-slate-300">Created</TableHead>
          <TableHead className="text-right text-slate-300">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id} className="border-slate-700 hover:bg-slate-750/50">
            <TableCell className="font-medium text-white">
              <div className="flex items-center">
                <div className="bg-slate-700 rounded-full p-2 mr-3">
                  <User className="h-4 w-4 text-teal-400" />
                </div>
                {client.name}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-slate-300">{client.email}</div>
              <div className="text-slate-500 text-sm">{client.phone}</div>
            </TableCell>
            <TableCell className="text-slate-300">{client.company}</TableCell>
            <TableCell>
              {getStatusBadge(client.status)}
            </TableCell>
            <TableCell className="text-slate-400 text-sm">
              {new Date(client.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
