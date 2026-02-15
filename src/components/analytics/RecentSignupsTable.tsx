import React from "react";
import { FingerPrintIcon } from "@heroicons/react/24/outline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { format } from "date-fns";
import type { RecentSignup } from "@/lib/api/hooks/use-analytics";

interface RecentSignupsTableProps {
  data?: RecentSignup[];
  isLoading?: boolean;
}

export const RecentSignupsTable: React.FC<RecentSignupsTableProps> = ({
  data,
  isLoading = false,
}) => {
  return (
    <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
      <TableHead>
        <TableRow>
          <TableHeader>Name</TableHeader>
          <TableHeader>Email</TableHeader>
          <TableHeader>Method</TableHeader>
          <TableHeader>Date</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8">
              Loading...
            </TableCell>
          </TableRow>
        ) : data?.length ? (
          data.map((user, index) => (
            <TableRow key={`${user.email}-${index}`}>
              <TableCell>
                <span>{user.name || "Anonymous"}</span>
              </TableCell>
              <TableCell>{user.email || "N/A"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FingerPrintIcon className="size-4" />
                  <span>{user.method || "Email"}</span>
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(user.date), "EEE MMM dd, HH:mm")}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
              No recent signups found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
