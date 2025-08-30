"use client";

import CheckinSettingsCard from "@/components/shared/settings/CheckinSettingsCard";
import { updateSystemSettings, resetSettingsToDefault, type SystemSetting } from "../actions";

interface NotificacionesSectionProps {
  settings: SystemSetting[];
}

export default function NotificacionesSection({ settings }: NotificacionesSectionProps) {
  const handleUpdate = async (updates: Record<string, string>) => {
    return await updateSystemSettings(updates);
  };

  const handleReset = async () => {
    return await resetSettingsToDefault('notifications');
  };

  return (
    <CheckinSettingsCard 
      settings={settings}
      onUpdate={handleUpdate}
      onReset={handleReset}
      isAdminView={false}
    />
  );
}
