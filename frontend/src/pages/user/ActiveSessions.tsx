import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Smartphone, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userServices } from "@/services/UserServices";

export default function ActiveSessions() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", user?.id],
    queryFn: () => userServices.getSessions(),
    enabled: !!user?.id
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => userServices.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", user?.id] });
    }
  });

  const getIcon = (iconName: string) => {
    return iconName === "Monitor" ? Monitor : Smartphone;
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Active Sessions</h1>
      </div>

      <p className="mb-6 text-sm text-gray-500">
        These are the devices that have logged into your account. Revoke any sessions that you do not recognize.
      </p>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-sm text-gray-500">No active sessions found.</p>
        ) : sessions.map((session: any) => {
          const Icon = getIcon(session.icon);
          return (
            <div key={session.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-600">
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    {session.device}
                    {session.current && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-green-700">This Device</span>
                    )}
                  </h3>
                  <div className="mt-1 flex flex-col gap-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><MapPin size={12}/> {session.location}</span>
                    <span>{session.os} • {session.time}</span>
                  </div>
                </div>
              </div>
              
              {!session.current && (
                <button 
                  onClick={() => revokeSessionMutation.mutate(session.id)}
                  disabled={revokeSessionMutation.isPending}
                  className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {revokeSessionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Revoke Session"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {sessions.length > 1 && (
        <button className="mt-8 w-full rounded-xl py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition cursor-pointer">
          Sign Out of All Other Devices
        </button>
      )}
    </div>
  );
}
