'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CallLog {
  id: string;
  caller_name: string | null;
  phone_number: string;
  call_type: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  timestamp: string;
}

interface CallLogsTableProps {
  deviceId: string;
}

export function CallLogsTable({ deviceId }: CallLogsTableProps) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<CallLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCallLogs();
  }, [deviceId]);

  useEffect(() => {
    const filtered = callLogs.filter(
      (log) =>
        (log.caller_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        log.phone_number.includes(searchTerm)
    );
    setFilteredLogs(filtered);
  }, [searchTerm, callLogs]);

  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sync-call-logs?deviceId=${deviceId}&limit=200`);
      if (!response.ok) throw new Error('Failed to fetch call logs');
      const data = await response.json();
      setCallLogs(data.callLogs || []);
      setError('');
    } catch (err) {
      setError('Failed to load call logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return '↓';
      case 'outgoing':
        return '↑';
      case 'missed':
        return '✕';
      default:
        return '•';
    }
  };

  const getCallIconColor = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'text-green-600';
      case 'outgoing':
        return 'text-blue-600';
      case 'missed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or phone number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading call logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {searchTerm ? 'No call logs found matching your search.' : 'No call logs synced yet.'}
        </p>
      ) : (
        <ScrollArea className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className={`font-bold ${getCallIconColor(log.call_type)}`}>
                      {getCallIcon(log.call_type)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.caller_name || 'Unknown'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.phone_number}</TableCell>
                  <TableCell className="text-sm">
                    {log.call_type === 'missed' ? '—' : formatDuration(log.duration)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleDateString()} {' '}
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      <p className="text-xs text-muted-foreground">
        Total: {filteredLogs.length} call{filteredLogs.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
