import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Medal, Award } from 'lucide-react';
import { TopClient } from '@/app/admin/dashboard/actions';

interface TopClientsProps {
  periodClients: TopClient[];
  allTimeClients: TopClient[];
  periodLabel: string;
}

export default function TopClients({ periodClients, allTimeClients, periodLabel }: TopClientsProps) {
  const renderClientList = (clients: TopClient[], title: string, icon: React.ReactNode, emptyMessage: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>Ranking por check-ins y cupones ganados</CardDescription>
      </CardHeader>
      <CardContent>
        {clients.length > 0 ? (
          <div className="space-y-3">
            {clients.map((client, index) => {
              const isTopThree = index < 3;
              const rankIcons = [
                <Trophy className="h-4 w-4 text-yellow-500" key="1" />,
                <Medal className="h-4 w-4 text-gray-400" key="2" />,
                <Award className="h-4 w-4 text-amber-600" key="3" />
              ];

              return (
                <div
                  key={client.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isTopThree 
                      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      {isTopThree ? (
                        rankIcons[index]
                      ) : (
                        <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${isTopThree ? 'text-amber-900' : ''}`}>
                        {client.name}
                      </p>
                      <p className={`text-sm ${isTopThree ? 'text-amber-700' : 'text-muted-foreground'}`}>
                        {client.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className={`font-bold ${isTopThree ? 'text-green-700' : 'text-green-600'}`}>
                        {client.checkins}
                      </p>
                      <p className={`text-xs ${isTopThree ? 'text-amber-700' : 'text-muted-foreground'}`}>
                        Check-ins
                      </p>
                    </div>
                    <div className="text-center">
                      <p className={`font-bold ${isTopThree ? 'text-purple-700' : 'text-purple-600'}`}>
                        {client.coupons}
                      </p>
                      <p className={`text-xs ${isTopThree ? 'text-amber-700' : 'text-muted-foreground'}`}>
                        Cupones
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {renderClientList(
        periodClients,
        `Top 10 Clientes (${periodLabel})`,
        <Users className="h-5 w-5 text-purple-600" />,
        `No hay datos de clientes para ${periodLabel.toLowerCase()}`
      )}
      
      {renderClientList(
        allTimeClients,
        "Top 10 Clientes (Todos los tiempos)",
        <Trophy className="h-5 w-5 text-yellow-600" />,
        "No hay datos de clientes disponibles"
      )}
    </div>
  );
}
